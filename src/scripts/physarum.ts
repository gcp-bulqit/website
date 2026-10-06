// Physarum (slime mold) simulation in WebGL2.
// Based on Jeff Jones' agent model and Sage Jenson's GPU approach:
//   agents (pos, heading) live in an RGBA32F texture and are stepped in a fragment shader;
//   each agent deposits into a trail map, which is blurred and decayed every step.
// The pointer adds "food" that attracts agents. Pressing the pointer repels them.
// An optional lattice of food nodes sits over the field: agents start at the nodes and grow outward,
// and the nodes keep feeding the trail so the network spans between them.

// stops[0] is the background; the rest are the slime ramp, faint to dense (up to 5).
export type Palette = { stops: number[][] };
const MAX_STOPS = 6;

export type NodePattern = 'hex' | 'grid' | 'scatter' | 'none';

export type Params = {
  sensorAngle: number; // radians
  sensorDist: number; // trail pixels
  turn: number; // radians per step
  step: number; // trail pixels per step
  deposit: number;
  decay: number;
  gain: number; // display contrast
  // Trail level agents like best. Above it a trail becomes less attractive, so crowded
  // trunks shed agents into new branches instead of thickening. 0 turns it off.
  saturation: number;
  // Food node array. Changes to these take effect on rebuildNodes() or reset().
  nodePattern: NodePattern;
  nodeSpacing: number; // trail pixels between nodes
  nodeJitter: number; // 0..1 of spacing
  nodeRadius: number; // trail pixels
  nodeFood: number; // trail added at a node centre per step
  nodeMarkers: number; // 0..1 opacity of the ring drawn around each node
  seedFromNodes: boolean; // start agents at the nodes facing outward (else a ring)
  // Navigation disturbance (see disturb()).
  navFade: number; // 0..1 share of the trail wiped out on navigation
  navScramble: number; // 0..1 share of agents given a random heading
  navWave: number; // 0..1 chance an agent on the shockwave ring turns outward
  // Repulsion from exclusion zones when setExclusions(..., { repel: true }) is used.
  zoneRepel: number; // subtracted from sensed trail inside a zone (fades out at the edge)
  zoneFalloff: number; // CSS pixels over which the repulsion fades outside a zone
};

// Node pattern 'none' runs the model as published in Jeff Jones (2010), "Characteristics of
// pattern formation and evolution in approximations of Physarum transport networks": no food
// nodes, agents scattered uniformly at random with random headings, fixed-angle turns, and the
// paper's standard tuning below (SA 22.5°, RA 45°, SO 9, SS 1, decay 0.1). The Tune window
// applies these when 'none' is picked and restores defaultParams when a node pattern is picked.
// (The paper also stops an agent moving into an occupied cell; like most GPU versions, this
// one lets agents overlap.)
export const paperParams: Partial<Params> = {
  sensorAngle: (22.5 * Math.PI) / 180,
  sensorDist: 9,
  turn: (45 * Math.PI) / 180,
  step: 1,
  deposit: 0.1,
  decay: 0.9,
  saturation: 0,
};

export const defaultParams: Params = {
  sensorAngle: (30 * Math.PI) / 180,
  sensorDist: 12,
  turn: (90 * Math.PI) / 180,
  step: 1.2,
  deposit: 0.10,
  decay: 0.9,
  gain: 1.1,
  saturation: 1.2,
  nodePattern: 'hex',
  nodeSpacing: 170,
  nodeJitter: 0.35,
  nodeRadius: 3,
  nodeFood: 0.6,
  nodeMarkers: 0.35,
  seedFromNodes: true,
  navFade: 0.65,
  navScramble: 0.35,
  navWave: 0.6,
  zoneRepel: 0.15,
  zoneFalloff: 48,
};

export type Rect = { left: number; top: number; right: number; bottom: number };

export type Physarum = {
  readonly agentCount: number;
  readonly fps: number;
  params: Params;
  setPalette(p: Palette): void;
  setRunning(on: boolean): void;
  isRunning(): boolean; // the user's Play/Pause choice
  isActive(): boolean; // actually animating: running, and the page is visible and focused
  rebuildNodes(): void;
  // Areas (CSS pixels, viewport coordinates) where no food node may be placed, e.g. a page title.
  // With repel: true the zones also gently push agents away (see zoneRepel / zoneFalloff).
  setExclusions(rects: Rect[], opts?: { repel?: boolean }): void;
  reset(): void;
  // Push the network onto new paths: move the food nodes to the layout for `nodeSeed`,
  // fade the trail, scramble headings, and send a shockwave out from (x, y) in CSS pixels.
  disturb(opts: { nodeSeed: number; x?: number; y?: number }): void;
  destroy(): void;
};

const VS_FULL = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FS_AGENTS = `#version 300 es
precision highp float;
uniform sampler2D uAgents;
uniform sampler2D uTrail;
uniform sampler2D uNodes; // b = exclusion-zone repel mask
uniform float uZoneRepel;
uniform vec2 uTrailSize;
uniform float uSensorAngle, uSensorDist, uTurn, uStep, uSeed, uSaturation, uScramble;
uniform bool uPaperRules; // Jones (2010) steering: fixed turns, random left/right when both sides win
uniform vec4 uWave; // xy centre (0..1), z radius (trail px), w strength
uniform vec3 uPointer;        // xy in 0..1, z = strength (+ attract, - repel)
uniform float uPointerRadius; // trail pixels
out vec4 outAgent;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float sense(vec2 pos, float a) {
  vec2 p = pos + vec2(cos(a), sin(a)) * uSensorDist / uTrailSize;
  float v = texture(uTrail, p).r;
  float zone = texture(uNodes, p).b * uZoneRepel;
  // Response peaks at uSaturation and falls off beyond it.
  if (uSaturation > 0.0) v *= exp(1.0 - v / uSaturation);
  v -= zone;
  vec2 d = (fract(p) - uPointer.xy) * uTrailSize;
  v += uPointer.z * exp(-dot(d, d) / (uPointerRadius * uPointerRadius));
  return v;
}

void main() {
  vec4 a = texelFetch(uAgents, ivec2(gl_FragCoord.xy), 0);
  vec2 pos = a.xy;
  float ang = a.z;
  float f = sense(pos, ang);
  float l = sense(pos, ang + uSensorAngle);
  float r = sense(pos, ang - uSensorAngle);
  float rnd = hash(gl_FragCoord.xy + uSeed);
  if (uPaperRules) {
    if (f > l && f > r) {
      // keep heading
    } else if (f < l && f < r) {
      ang += (rnd < 0.5 ? -1.0 : 1.0) * uTurn;
    } else if (l > r) {
      ang += uTurn;
    } else if (r > l) {
      ang -= uTurn;
    }
  } else if (f > l && f > r) {
    // keep heading
  } else if (f < l && f < r) {
    ang += (rnd - 0.5) * 2.0 * uTurn;
  } else if (l > r) {
    ang += uTurn * (0.5 + 0.5 * rnd);
  } else if (r > l) {
    ang -= uTurn * (0.5 + 0.5 * rnd);
  }
  float rnd2 = hash(gl_FragCoord.yx * 1.7 + uSeed * 3.1);
  // One-shot heading scramble.
  if (rnd2 < uScramble) ang += (rnd - 0.5) * 6.28318530718;
  // Expanding shockwave: agents on the ring turn to face away from its centre.
  if (uWave.w > 0.0) {
    vec2 d = (pos - uWave.xy) * uTrailSize;
    float band = exp(-pow((length(d) - uWave.z) / 14.0, 2.0));
    if (rnd2 < band * uWave.w) ang = atan(d.y, d.x) + (rnd - 0.5) * 0.9;
  }
  pos = fract(pos + vec2(cos(ang), sin(ang)) * uStep / uTrailSize);
  outAgent = vec4(pos, mod(ang, 6.28318530718), a.w);
}`;

const FS_DIFFUSE = `#version 300 es
precision highp float;
uniform sampler2D uTrail;
uniform sampler2D uNodes; // r = food, g = marker ring
uniform vec2 uTrailSize;
uniform float uDecay, uNodeFood;
uniform float uZoneClear; // 0..1: fraction of trail removed inside repel zones this step
uniform vec3 uPointer;
uniform float uPointerRadius;
out vec4 outTrail;
void main() {
  vec2 px = 1.0 / uTrailSize;
  vec2 uv = gl_FragCoord.xy * px;
  float s = 0.0;
  for (int y = -1; y <= 1; y++)
    for (int x = -1; x <= 1; x++)
      s += texture(uTrail, uv + vec2(x, y) * px).r;
  s = s / 9.0 * uDecay;
  s += texture(uNodes, uv).r * uNodeFood;
  s *= 1.0 - uZoneClear * min(texture(uNodes, uv).b, 1.0);
  // A faint glow under the pointer so the attractor is visible.
  vec2 d = (uv - uPointer.xy) * uTrailSize;
  s += max(uPointer.z, 0.0) * 0.02 * exp(-dot(d, d) / (0.25 * uPointerRadius * uPointerRadius));
  outTrail = vec4(s, 0.0, 0.0, 1.0);
}`;

const VS_DEPOSIT = `#version 300 es
uniform sampler2D uAgents;
uniform int uAgentDim;
void main() {
  ivec2 c = ivec2(gl_VertexID % uAgentDim, gl_VertexID / uAgentDim);
  vec2 p = texelFetch(uAgents, c, 0).xy;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}`;

const FS_DEPOSIT = `#version 300 es
precision highp float;
uniform float uDeposit;
out vec4 outColor;
void main() { outColor = vec4(uDeposit, 0.0, 0.0, 0.0); }`;

const FS_DISPLAY = `#version 300 es
precision highp float;
uniform sampler2D uTrail;
uniform sampler2D uNodes;
uniform vec2 uRes;
uniform vec3 uStops[6]; // background, then slime colors faint -> dense
uniform int uStopCount;
uniform float uGain, uMarkers;
out vec4 outColor;
vec3 ramp(float t) {
  float x = clamp(t, 0.0, 1.0) * float(uStopCount - 1);
  int i = min(int(x), uStopCount - 2);
  return mix(uStops[i], uStops[i + 1], smoothstep(0.0, 1.0, x - float(i)));
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float v = texture(uTrail, uv).r;
  float t = 1.0 - exp(-v * uGain);
  vec3 c = ramp(t);
  c = mix(c, uStops[uStopCount - 1], texture(uNodes, uv).g * uMarkers);
  outColor = vec4(c, 1.0);
}`;

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };
type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer };

// Small seeded PRNG so a given node seed always produces the same layout.
const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export function createPhysarum(
  canvas: HTMLCanvasElement,
  palette: Palette,
  // start: false creates the simulation idle, showing only the background colour, so the caller
  // can configure it (e.g. exclusions) and then reset() + setRunning(true) without a visible jump.
  opts: { nodeSeed?: number; start?: boolean } = {},
): Physarum | null {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null;
  gl.getExtension('EXT_float_blend');

  const compile = (vs: string, fs: string): Prog => {
    const p = gl.createProgram()!;
    for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      gl.attachShader(p, s);
    }
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
    const u: Prog['u'] = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i)!.name;
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  };

  let agentsProg: Prog, diffuseProg: Prog, depositProg: Prog, displayProg: Prog;
  try {
    agentsProg = compile(VS_FULL, FS_AGENTS);
    diffuseProg = compile(VS_FULL, FS_DIFFUSE);
    depositProg = compile(VS_DEPOSIT, FS_DEPOSIT);
    displayProg = compile(VS_FULL, FS_DISPLAY);
  } catch (e) {
    console.warn('physarum: shader setup failed', e);
    return null;
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const makeTarget = (w: number, h: number, internal: number, filter: number, wrap: number, data: ArrayBufferView | null = null): Target => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    const type = internal === gl.RGBA32F ? gl.FLOAT : gl.HALF_FLOAT;
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, gl.RGBA, type, data);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo };
  };
  const freeTarget = (t?: Target) => {
    if (!t) return;
    gl.deleteTexture(t.tex);
    gl.deleteFramebuffer(t.fbo);
  };

  const params = { ...defaultParams };
  // A default of 'none' means the paper's model, tuning included.
  if (params.nodePattern === 'none') Object.assign(params, paperParams);
  // Agents per trail cell. Too many saturates the trail and the network turns into a blob.
  const density = 0.3;
  let agentDim = 0;
  let agentCount = 0;

  let trailW = 0;
  let trailH = 0;
  let trail: Target[] = [];
  let agents: Target[] = [];
  let colors = palette;

  // Node array: positions in trail pixels, plus a texture holding food (r) and marker rings (g).
  let nodes: [number, number][] = [];
  let nodeSeed = opts.nodeSeed ?? 1;
  let nodeTex: WebGLTexture | null = null;

  const layoutNodes = (): [number, number][] => {
    const { nodePattern: pattern, nodeSpacing: sp, nodeJitter: jit } = params;
    if (pattern === 'none' || sp <= 0) return [];
    const out: [number, number][] = [];
    const rand = mulberry32(nodeSeed);
    const jitter = () => (rand() - 0.5) * jit * sp;
    if (pattern === 'scatter') {
      // Rejection sampling for an even but irregular spread.
      const target = Math.round((trailW * trailH) / (sp * sp));
      for (let tries = 0; out.length < target && tries < target * 30; tries++) {
        const x = rand() * trailW;
        const y = rand() * trailH;
        if (!excluded(x, y) && out.every(([nx, ny]) => (nx - x) ** 2 + (ny - y) ** 2 > sp * sp * 0.6)) out.push([x, y]);
      }
      return out;
    }
    const dy = pattern === 'hex' ? (sp * Math.sqrt(3)) / 2 : sp;
    const rows = Math.ceil(trailH / dy);
    const cols = Math.ceil(trailW / sp);
    const offY = (trailH - (rows - 1) * dy) / 2;
    const offX = (trailW - (cols - 1) * sp) / 2;
    for (let r = 0; r < rows; r++) {
      const shift = pattern === 'hex' && r % 2 ? sp / 2 : 0;
      for (let c = 0; c < cols; c++) {
        const x = offX + c * sp + shift + jitter();
        const y = offY + r * dy + jitter();
        if (x >= 0 && x < trailW && y >= 0 && y < trailH && !excluded(x, y)) out.push([x, y]);
      }
    }
    return out;
  };

  // Exclusion zones, kept in CSS pixels and tested in trail pixels (y up). The margin keeps
  // a node's glow and marker ring clear of the zone too.
  let exclusions: Rect[] = [];
  const excluded = (x: number, y: number) => {
    if (!exclusions.length) return false;
    const sx = canvas.clientWidth / trailW;
    const sy = canvas.clientHeight / trailH;
    const cx = x * sx;
    const cy = canvas.clientHeight - y * sy;
    // Agents bloom outward from each node, so keep a quarter of the node spacing clear as well.
    const m = Math.max(params.nodeRadius * 4, params.nodeSpacing * 0.25) * sx + 12;
    return exclusions.some((r) => cx > r.left - m && cx < r.right + m && cy > r.top - m && cy < r.bottom + m);
  };

  // Blue channel of the node texture: the repel field. Outside a zone it rises smoothly from 0
  // to 1 over zoneFalloff; inside it keeps rising toward the zone's middle, so agents already
  // inside always sense a way out (a flat value inside would not change their steering).
  let repelZones = false;
  // When repulsion switches on (arriving on the home page from another page), the network may
  // already cover the zone. For ZONE_ARRIVE_STEPS simulation steps (about 3 s at 60 fps; counted
  // in steps so slow devices get the same effect) the trail inside it fades out and the push is
  // stronger, then it eases back to params.zoneRepel.
  const ZONE_ARRIVE_STEPS = 180;
  let zoneArriveLeft = 0;
  const writeRepelMask = (data: Float32Array) => {
    const sx = canvas.clientWidth / trailW;
    const sy = canvas.clientHeight / trailH;
    const fall = Math.max(1, params.zoneFalloff / sx);
    for (const r of exclusions) {
      const x0 = r.left / sx;
      const x1 = r.right / sx;
      const y0 = (canvas.clientHeight - r.bottom) / sy;
      const y1 = (canvas.clientHeight - r.top) / sy;
      const xa = Math.max(0, Math.floor(x0 - fall));
      const xb = Math.min(trailW - 1, Math.ceil(x1 + fall));
      const ya = Math.max(0, Math.floor(y0 - fall));
      const yb = Math.min(trailH - 1, Math.ceil(y1 + fall));
      for (let y = ya; y <= yb; y++) {
        for (let x = xa; x <= xb; x++) {
          const dx = Math.max(x0 - x, 0, x - x1);
          const dy = Math.max(y0 - y, 0, y - y1);
          let v: number;
          if (dx === 0 && dy === 0) {
            const depth = Math.min(x - x0, x1 - x, y - y0, y1 - y); // distance to the nearest edge
            v = 1 + depth / fall;
          } else {
            const t = Math.min(1, Math.hypot(dx, dy) / fall);
            v = 1 - t * t * (3 - 2 * t); // smoothstep falloff
          }
          const i = (y * trailW + x) * 4 + 2;
          data[i] = Math.max(data[i], v);
        }
      }
    }
  };

  const buildNodes = () => {
    nodes = layoutNodes();
    const data = new Float32Array(trailW * trailH * 4);
    const r = Math.max(1, params.nodeRadius);
    const ring = r * 3.5;
    const reach = Math.ceil(ring + 3);
    for (const [nx, ny] of nodes) {
      for (let y = Math.floor(ny - reach); y <= ny + reach; y++) {
        for (let x = Math.floor(nx - reach); x <= nx + reach; x++) {
          const d = Math.hypot(x + 0.5 - nx, y + 0.5 - ny);
          const i = (((y % trailH) + trailH) % trailH) * trailW + (((x % trailW) + trailW) % trailW);
          data[i * 4] += Math.exp(-(d * d) / (r * r));
          data[i * 4 + 1] = Math.max(data[i * 4 + 1], Math.exp(-((d - ring) ** 2) / 0.6));
        }
      }
    }
    if (!nodeTex) nodeTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, nodeTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    if (repelZones) writeRepelMask(data);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, trailW, trailH, 0, gl.RGBA, gl.FLOAT, data);
  };

  const seedAgents = () => {
    agentDim = Math.min(800, Math.ceil(Math.sqrt(trailW * trailH * density)));
    agentCount = agentDim * agentDim;
    const data = new Float32Array(agentCount * 4);
    const aspect = trailW / trailH;
    const fromNodes = params.seedFromNodes && nodes.length > 0;
    for (let i = 0; i < agentCount; i++) {
      if (fromNodes) {
        // Start clustered on a node, facing outward: branches diverge from every node.
        const [nx, ny] = nodes[i % nodes.length];
        const t = Math.random() * Math.PI * 2;
        const r = Math.random() * params.nodeRadius * 4;
        data[i * 4] = (nx + Math.cos(t) * r) / trailW;
        data[i * 4 + 1] = (ny + Math.sin(t) * r) / trailH;
        data[i * 4 + 2] = t;
        data[i * 4 + 3] = 1;
        continue;
      }
      if (params.nodePattern === 'none') {
        // Paper initialisation: uniformly random positions and headings.
        data[i * 4] = Math.random();
        data[i * 4 + 1] = Math.random();
        data[i * 4 + 2] = Math.random() * Math.PI * 2;
        data[i * 4 + 3] = 1;
        continue;
      }
      // Start in a ring facing inward: it collapses into a network in a few seconds.
      const t = Math.random() * Math.PI * 2;
      const r = 0.32 * Math.sqrt(Math.random()) + 0.05;
      const x = 0.5 + (Math.cos(t) * r) / Math.max(aspect, 1);
      const y = 0.5 + Math.sin(t) * r * Math.min(aspect, 1);
      data[i * 4] = x;
      data[i * 4 + 1] = y;
      data[i * 4 + 2] = t + Math.PI + (Math.random() - 0.5) * 0.6;
      data[i * 4 + 3] = 1;
    }
    agents.forEach(freeTarget);
    agents = [0, 1].map((i) => makeTarget(agentDim, agentDim, gl.RGBA32F, gl.NEAREST, gl.CLAMP_TO_EDGE, i === 0 ? data : null));
  };

  const resize = (): boolean => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (w === canvas.width && h === canvas.height) return false;
    canvas.width = w;
    canvas.height = h;
    // One trail cell per CSS pixel, capped so big monitors stay fast.
    const scale = Math.min(1, 1600 / Math.max(canvas.clientWidth, canvas.clientHeight));
    trailW = Math.max(64, Math.round(canvas.clientWidth * scale));
    trailH = Math.max(64, Math.round(canvas.clientHeight * scale));
    trail.forEach(freeTarget);
    trail = [0, 1].map(() => makeTarget(trailW, trailH, gl.RGBA16F, gl.LINEAR, gl.REPEAT));
    for (const t of trail) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    buildNodes();
    return true;
  };

  // Pointer state, in trail UV space (y up).
  const pointer = { x: -10, y: -10, strength: 0, down: false, last: 0 };
  // After a reseed the pointer is ignored for a while so the network can form undisturbed.
  const RESEED_QUIET_MS = 4000;
  let quietUntil = 0;
  const onMove = (e: PointerEvent) => {
    pointer.x = e.clientX / window.innerWidth;
    pointer.y = 1 - e.clientY / window.innerHeight;
    pointer.last = performance.now();
  };
  const onDown = (e: PointerEvent) => {
    onMove(e);
    pointer.down = true;
  };
  const onUp = () => (pointer.down = false);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', onUp, { passive: true });

  // Navigation disturbance state.
  const WAVE_MS = 1400;
  const zoneArrival = () => (zoneArriveLeft > 0 ? zoneArriveLeft-- / ZONE_ARRIVE_STEPS : 0); // 1 -> 0
  const wave = { x: 0.5, y: 0.5, start: -Infinity };
  let pendingFade = 1;
  let pendingScramble = 0;

  let seed = 0;
  const step = () => {
    const now = performance.now();
    const waveT = (now - wave.start) / WAVE_MS;
    const waveOn = waveT >= 0 && waveT < 1;
    const waveRadius = waveT * Math.hypot(trailW, trailH);
    const idle = now - pointer.last;
    const target = now < quietUntil ? 0 : pointer.down ? -6 : idle < 1500 ? 2.5 : 0;
    if (now < quietUntil) pointer.strength = 0;
    pointer.strength += (target - pointer.strength) * 0.15;
    const pr = Math.max(trailW, trailH) * 0.035;

    // 1. Move agents (agents[0] -> agents[1]), sensing trail[0].
    gl.useProgram(agentsProg.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, agents[1].fbo);
    gl.viewport(0, 0, agentDim, agentDim);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, agents[0].tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, trail[0].tex);
    const u = agentsProg.u;
    gl.uniform1i(u.uAgents, 0);
    gl.uniform1i(u.uTrail, 1);
    gl.uniform2f(u.uTrailSize, trailW, trailH);
    gl.uniform1f(u.uSensorAngle, params.sensorAngle);
    gl.uniform1f(u.uSensorDist, params.sensorDist);
    gl.uniform1f(u.uTurn, params.turn);
    gl.uniform1f(u.uStep, params.step);
    gl.uniform1f(u.uSaturation, params.saturation);
    gl.uniform1f(u.uScramble, pendingScramble);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, nodeTex);
    gl.uniform1i(u.uNodes, 2);
    const arrive = repelZones ? zoneArrival() : 0;
    gl.uniform1f(u.uZoneRepel, repelZones ? params.zoneRepel + 1.5 * arrive : 0);
    gl.uniform1i(u.uPaperRules, params.nodePattern === 'none' ? 1 : 0);
    gl.uniform4f(u.uWave, wave.x, wave.y, waveRadius, waveOn ? params.navWave * (1 - waveT) : 0);
    pendingScramble = 0;
    gl.uniform1f(u.uSeed, (seed = (seed + 1.618) % 997));
    gl.uniform3f(u.uPointer, pointer.x, pointer.y, pointer.strength);
    gl.uniform1f(u.uPointerRadius, pr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    agents.reverse();

    // 2. Blur + decay trail (trail[0] -> trail[1]).
    gl.useProgram(diffuseProg.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, trail[1].fbo);
    gl.viewport(0, 0, trailW, trailH);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, trail[0].tex);
    const d = diffuseProg.u;
    gl.uniform1i(d.uTrail, 0);
    gl.uniform2f(d.uTrailSize, trailW, trailH);
    gl.uniform1f(d.uDecay, params.decay * pendingFade);
    pendingFade = 1;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, nodeTex);
    gl.uniform1i(d.uNodes, 1);
    gl.uniform1f(d.uNodeFood, params.nodeFood);
    gl.uniform1f(d.uZoneClear, 0.25 * arrive);
    gl.uniform3f(d.uPointer, pointer.x, pointer.y, pointer.strength);
    gl.uniform1f(d.uPointerRadius, pr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 3. Deposit agents additively onto trail[1].
    gl.useProgram(depositProg.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, agents[0].tex);
    gl.uniform1i(depositProg.u.uAgents, 0);
    gl.uniform1i(depositProg.u.uAgentDim, agentDim);
    gl.uniform1f(depositProg.u.uDeposit, params.deposit);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, agentCount);
    gl.disable(gl.BLEND);
    trail.reverse();
  };

  const draw = () => {
    drewOnce = true;
    gl.useProgram(displayProg.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, trail[0].tex);
    const u = displayProg.u;
    gl.uniform1i(u.uTrail, 0);
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    const stops = colors.stops.slice(0, MAX_STOPS);
    const flat = new Float32Array(MAX_STOPS * 3);
    stops.forEach((s, i) => flat.set(s, i * 3));
    gl.uniform3fv(u['uStops[0]'], flat);
    gl.uniform1i(u.uStopCount, Math.max(2, stops.length));
    gl.uniform1f(u.uGain, params.gain);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, nodeTex);
    gl.uniform1i(u.uNodes, 1);
    gl.uniform1f(u.uMarkers, params.nodeMarkers);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  resize();
  seedAgents();

  let running = true;
  let raf = 0;
  let fps = 0;
  let frames = 0;
  let fpsStart = performance.now();
  const frame = () => {
    raf = requestAnimationFrame(frame);
    frames++;
    const now = performance.now();
    if (now - fpsStart >= 1000) {
      fps = (frames * 1000) / (now - fpsStart);
      frames = 0;
      fpsStart = now;
    }
    if (resize()) seedAgents();
    step();
    draw();
  };
  // Animate only while running (Play) and the page is both visible and focused. A hidden tab or
  // a window in the background pauses the work and resumes it on return; a manual Pause stays.
  const active = () => running && !document.hidden && document.hasFocus();
  let drewOnce = false;
  const setRunning = (on: boolean) => {
    running = on;
    cancelAnimationFrame(raf);
    if (active()) {
      frames = 0;
      fpsStart = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (on && !drewOnce) {
      // Started in a background window: show a settled frame rather than an empty canvas.
      for (let i = 0; i < 120; i++) step();
      draw();
    }
  };
  const onVisibility = () => setRunning(running);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('focus', onVisibility);
  window.addEventListener('blur', onVisibility);
  const onLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
  };
  canvas.addEventListener('webglcontextlost', onLost);

  if (opts.start ?? true) {
    setRunning(true);
  } else {
    setRunning(false);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const [r, g, b] = colors.stops[0];
    gl.clearColor(r, g, b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  return {
    get agentCount() {
      return agentCount;
    },
    get fps() {
      return active() ? fps : 0;
    },
    params,
    setPalette(p) {
      colors = p;
      if (!active()) draw();
    },
    setRunning,
    isRunning: () => running,
    isActive: active,
    setExclusions(rects, opts = {}) {
      exclusions = rects;
      if (opts.repel && !repelZones) zoneArriveLeft = ZONE_ARRIVE_STEPS;
      repelZones = !!opts.repel;
      buildNodes();
      if (!active()) draw();
    },
    rebuildNodes() {
      buildNodes();
      if (!active()) draw();
    },
    disturb({ nodeSeed: next, x, y }) {
      nodeSeed = next;
      buildNodes();
      pendingFade = 1 - params.navFade;
      pendingScramble = params.navScramble;
      wave.x = x === undefined ? 0.5 : x / window.innerWidth;
      wave.y = y === undefined ? 0.5 : 1 - y / window.innerHeight;
      wave.start = performance.now();
      if (!active()) {
        // Paused / reduced motion / background: settle on the new layout without animating.
        for (let i = 0; i < 180; i++) step();
        draw();
      }
    },
    reset() {
      quietUntil = performance.now() + RESEED_QUIET_MS;
      pointer.strength = 0;
      if (!resize()) buildNodes();
      for (const t of trail) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      seedAgents();
      if (!active()) {
        for (let i = 0; i < 240; i++) step();
        draw();
      }
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
      window.removeEventListener('blur', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
    },
  };
}
