// Physarum (slime mold) simulation in WebGL2.
// Based on Jeff Jones' agent model and Sage Jenson's GPU approach:
//   agents (pos, heading) live in an RGBA32F texture and are stepped in a fragment shader;
//   each agent deposits into a trail map, which is blurred and decayed every step.
// The pointer adds "food" that attracts agents. Pressing the pointer repels them.
// An optional lattice of food nodes sits over the field: agents start at the nodes and grow outward,
// and the nodes keep feeding the trail so the network spans between them.
// Multi-species (after Michael Fogleman's github.com/fogleman/physarum): up to 4 species, each
// with its own movement settings and its own trail channel (R, G, B, A of the trail texture).
// Agents sense a weighted mix of the channels, attracted to their own and repelled by others.

// stops[0] is the background; the rest are the slime ramp, faint to dense (up to 5).
export type Palette = { stops: number[][] };
const MAX_STOPS = 6;

export type NodePattern = 'hex' | 'grid' | 'scatter' | 'none';

// Per-species movement settings (species mode only; species 1 alone uses the main params).
export type SpeciesParams = { sensorAngle: number; sensorDist: number; turn: number; step: number };
export const MAX_SPECIES = 4;

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
  // Multi-species. species: 1 is the classic single-species model.
  species: number; // 1..4
  speciesParams: SpeciesParams[]; // MAX_SPECIES entries
  attraction: number[]; // MAX_SPECIES x MAX_SPECIES, row = sensing species, col = trail channel
  softBlur: boolean; // 5x5 tent blur (two box passes, as Fogleman uses) instead of 3x3
  weightedTurn: boolean; // turn toward a side with probability by how much it wins
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
  nodePattern: 'grid',
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
  species: 2, // test build: two species, alternating by node
  speciesParams: Array.from({ length: MAX_SPECIES }, () => ({
    sensorAngle: (30 * Math.PI) / 180,
    sensorDist: 12,
    turn: (90 * Math.PI) / 180,
    step: 1.2,
  })),
  // Attracted to your own species' trail, indifferent to the others'. Any cross-species
  // repulsion (tested down to 0.1) makes the species sort into separate territories or bands
  // over a minute or so; at 0 each species keeps its own mesh and the meshes interweave.
  // Randomize (Tune) uses Fogleman's -1 repulsion for the banded/territorial looks.
  attraction: Array.from({ length: MAX_SPECIES * MAX_SPECIES }, (_, i) =>
    Math.floor(i / MAX_SPECIES) === i % MAX_SPECIES ? 1 : 0,
  ),
  softBlur: false,
  weightedTurn: false,
};

// Fogleman's random-config ranges: a quick way to discover new species behaviours.
export const randomSpecies = (count = 2 + Math.floor(Math.random() * 3)) => {
  const u = (a: number, b: number) => a + Math.random() * (b - a);
  const normal = (mean: number, std: number) =>
    mean + std * Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  return {
    species: count,
    speciesParams: Array.from({ length: MAX_SPECIES }, () => ({
      sensorAngle: (u(0, 120) * Math.PI) / 180,
      sensorDist: u(0, 64),
      turn: (u(0, 120) * Math.PI) / 180,
      step: u(0.2, 2),
    })),
    attraction: Array.from({ length: MAX_SPECIES * MAX_SPECIES }, (_, i) =>
      Math.floor(i / MAX_SPECIES) === i % MAX_SPECIES ? normal(1, 0.25) : normal(-1, 0.25),
    ),
  };
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
  // rebuild: false defers rebuilding the node texture to the next reset() (saves a duplicate build).
  setExclusions(rects: Rect[], opts?: { repel?: boolean; rebuild?: boolean }): void;
  reset(): void;
  // Push the network onto new paths: move the food nodes to the layout for `nodeSeed`,
  // fade the trail, scramble headings, and send a shockwave out from (x, y) in CSS pixels.
  // While not animating, the fade and scramble wait for the next step (e.g. pressing Play).
  // rebuild: false leaves building the node texture to the caller (e.g. a setExclusions() that
  // follows anyway). settle: false skips pre-running steps when not animating (default true).
  disturb(opts: { nodeSeed: number; x?: number; y?: number; rebuild?: boolean; settle?: boolean }): void;
  // Pre-run `steps` simulation steps in small batches while not animating (no-op when animating).
  settle(steps: number): void;
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
uniform vec4 uSpSA, uSpSD, uSpTurn, uSpStep; // per-species sensor angle/dist, turn, step
uniform vec4 uAttract[4]; // per species: weight of each trail channel when sensing
uniform float uSeed, uSaturation, uScramble;
uniform bool uPaperRules; // Jones (2010) steering: fixed turns, random left/right when both sides win
uniform bool uWeighted; // Fogleman's weighted turning
uniform vec4 uWave; // xy centre (0..1), z radius (trail px), w strength
uniform vec3 uPointer;        // xy in 0..1, z = strength (+ attract, - repel)
uniform float uPointerRadius; // trail pixels
out vec4 outAgent;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float sense(vec2 pos, float a, float dist, vec4 w) {
  vec2 p = pos + vec2(cos(a), sin(a)) * dist / uTrailSize;
  float v = dot(texture(uTrail, p), w);
  float zone = texture(uNodes, p).b * uZoneRepel;
  // Response peaks at uSaturation and falls off beyond it.
  if (uSaturation > 0.0 && v > 0.0) v *= exp(1.0 - v / uSaturation);
  v -= zone;
  vec2 d = (fract(p) - uPointer.xy) * uTrailSize;
  v += uPointer.z * exp(-dot(d, d) / (uPointerRadius * uPointerRadius));
  return v;
}

void main() {
  vec4 a = texelFetch(uAgents, ivec2(gl_FragCoord.xy), 0);
  vec2 pos = a.xy;
  float ang = a.z;
  int sp = clamp(int(a.w + 0.5), 0, 3);
  float sa = uSpSA[sp], sd = uSpSD[sp], turn = uSpTurn[sp];
  vec4 w = uAttract[sp];
  float f = sense(pos, ang, sd, w);
  float l = sense(pos, ang + sa, sd, w);
  float r = sense(pos, ang - sa, sd, w);
  float rnd = hash(gl_FragCoord.xy + uSeed);
  if (uWeighted) {
    // Sort (forward, left, right) by strength; pick the strongest side, or the middle one with
    // probability proportional to how close it is (Fogleman's weightedDirection).
    float w0 = f, w1 = l, w2 = r, d0 = 0.0, d1 = 1.0, d2 = -1.0, t;
    if (w0 > w1) { t = w0; w0 = w1; w1 = t; t = d0; d0 = d1; d1 = t; }
    if (w0 > w2) { t = w0; w0 = w2; w2 = t; t = d0; d0 = d2; d2 = t; }
    if (w1 > w2) { t = w1; w1 = w2; w2 = t; t = d1; d1 = d2; d2 = t; }
    float lo = w1 - w0, hi = w2 - w1;
    ang += (rnd * (lo + hi) < lo ? d1 : d2) * turn;
  } else if (uPaperRules) {
    if (f > l && f > r) {
      // keep heading
    } else if (f < l && f < r) {
      ang += (rnd < 0.5 ? -1.0 : 1.0) * turn;
    } else if (l > r) {
      ang += turn;
    } else if (r > l) {
      ang -= turn;
    }
  } else if (f > l && f > r) {
    // keep heading
  } else if (f < l && f < r) {
    ang += (rnd - 0.5) * 2.0 * turn;
  } else if (l > r) {
    ang += turn * (0.5 + 0.5 * rnd);
  } else if (r > l) {
    ang -= turn * (0.5 + 0.5 * rnd);
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
  pos = fract(pos + vec2(cos(ang), sin(ang)) * uSpStep[sp] / uTrailSize);
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
uniform vec4 uChannels; // 1 for each species' channel in use
uniform bool uSoftBlur;
uniform bool uNodeSpecies; // species mode: a node feeds only its own species (node texture .a)
out vec4 outTrail;
void main() {
  vec2 px = 1.0 / uTrailSize;
  vec2 uv = gl_FragCoord.xy * px;
  // Each channel of the trail is one species; all are blurred and decayed together.
  vec4 s = vec4(0.0);
  if (uSoftBlur) {
    // 5x5 tent: the same as two 3x3 box passes.
    for (int y = -2; y <= 2; y++)
      for (int x = -2; x <= 2; x++)
        s += texture(uTrail, uv + vec2(x, y) * px) * float((3 - abs(x)) * (3 - abs(y)));
    s /= 81.0;
  } else {
    for (int y = -1; y <= 1; y++)
      for (int x = -1; x <= 1; x++)
        s += texture(uTrail, uv + vec2(x, y) * px);
    s /= 9.0;
  }
  s *= uDecay;
  vec4 node = texture(uNodes, uv);
  vec4 feed = uNodeSpecies ? vec4(equal(vec4(floor(node.a + 0.5)), vec4(0.0, 1.0, 2.0, 3.0))) : uChannels;
  s += node.r * uNodeFood * feed;
  s *= 1.0 - uZoneClear * min(texture(uNodes, uv).b, 1.0);
  // A faint glow under the pointer so the attractor is visible.
  vec2 d = (uv - uPointer.xy) * uTrailSize;
  s += max(uPointer.z, 0.0) * 0.02 * exp(-dot(d, d) / (0.25 * uPointerRadius * uPointerRadius)) * uChannels;
  outTrail = s;
}`;

const VS_DEPOSIT = `#version 300 es
uniform sampler2D uAgents;
uniform int uAgentDim;
flat out float vSpecies;
void main() {
  ivec2 c = ivec2(gl_VertexID % uAgentDim, gl_VertexID / uAgentDim);
  vec4 a = texelFetch(uAgents, c, 0);
  vSpecies = a.w;
  gl_Position = vec4(a.xy * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}`;

const FS_DEPOSIT = `#version 300 es
precision highp float;
uniform float uDeposit;
flat in float vSpecies;
out vec4 outColor;
// Deposit into this agent's own species channel.
void main() { outColor = uDeposit * vec4(equal(vec4(floor(vSpecies + 0.5)), vec4(0.0, 1.0, 2.0, 3.0))); }`;

const FS_DISPLAY = `#version 300 es
precision highp float;
uniform sampler2D uTrail;
uniform sampler2D uNodes;
uniform vec2 uRes;
uniform vec3 uStops[6]; // background, then slime colors faint -> dense
uniform int uStopCount;
uniform float uGain, uMarkers;
uniform int uSpecies;
uniform vec3 uSpColor[4];
out vec4 outColor;
vec3 ramp(float t) {
  float x = clamp(t, 0.0, 1.0) * float(uStopCount - 1);
  int i = min(int(x), uStopCount - 2);
  return mix(uStops[i], uStops[i + 1], smoothstep(0.0, 1.0, x - float(i)));
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec4 trail = texture(uTrail, uv);
  vec4 node = texture(uNodes, uv);
  vec3 c;
  vec3 ring = uStops[uStopCount - 1];
  if (uSpecies > 1) {
    // One palette color per species, blended by each species' strength over the background.
    vec4 t = 1.0 - exp(-max(trail, 0.0) * uGain);
    vec3 sum = vec3(0.0);
    float total = 0.0;
    for (int i = 0; i < 4; i++) {
      if (i >= uSpecies) break;
      sum += uSpColor[i] * t[i];
      total += t[i];
    }
    c = mix(uStops[0], sum / max(total, 1e-4), clamp(total, 0.0, 1.0));
    ring = uSpColor[clamp(int(node.a + 0.5), 0, 3)];
  } else {
    c = ramp(1.0 - exp(-trail.r * uGain));
  }
  c = mix(c, ring, node.g * uMarkers);
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
  // onError: shaders failed to compile/link. Reported later, because compilation is asynchronous.
  opts: { nodeSeed?: number; start?: boolean; onError?: (e: unknown) => void } = {},
): Physarum | null {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null;
  gl.getExtension('EXT_float_blend');

  // Shaders compile in the background: querying compile/link status straight away blocks until
  // the driver finishes, which on Windows (ANGLE -> Direct3D) took over a second. With
  // KHR_parallel_shader_compile the status is polled each frame instead; the simulation doesn't
  // step or draw until every program is ready.
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  type Pending = { p: WebGLProgram; shaders: WebGLShader[] };
  const start = (vs: string, fs: string): Pending => {
    const p = gl.createProgram()!;
    const shaders = ([[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const).map(([type, src]) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      gl.attachShader(p, sh);
      return sh;
    });
    gl.linkProgram(p);
    return { p, shaders };
  };
  const finish = ({ p, shaders }: Pending): Prog => {
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const log = shaders.map((sh) => gl.getShaderInfoLog(sh)).join('\n');
      throw new Error(`${gl.getProgramInfoLog(p) ?? 'link failed'}\n${log}`);
    }
    const u: Prog['u'] = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i)!.name;
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  };

  const pending = [
    start(VS_FULL, FS_AGENTS),
    start(VS_FULL, FS_DIFFUSE),
    start(VS_DEPOSIT, FS_DEPOSIT),
    start(VS_FULL, FS_DISPLAY),
  ];
  let agentsProg: Prog, diffuseProg: Prog, depositProg: Prog, displayProg: Prog;
  let ready = false;
  let failed = false;
  const readyCallbacks: (() => void)[] = [];
  const whenReady = (cb: () => void) => (ready ? cb() : readyCallbacks.push(cb));
  const pollShaders = () => {
    if (failed || ready) return;
    if (parallel && !pending.every(({ p }) => gl.getProgramParameter(p, parallel.COMPLETION_STATUS_KHR))) {
      requestAnimationFrame(pollShaders);
      return;
    }
    try {
      [agentsProg, diffuseProg, depositProg, displayProg] = pending.map(finish);
    } catch (e) {
      failed = true;
      console.warn('physarum: shader setup failed', e);
      opts.onError?.(e);
      return;
    }
    ready = true;
    readyCallbacks.splice(0).forEach((cb) => cb());
  };
  requestAnimationFrame(pollShaders);

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
  type Node = [x: number, y: number, species: number];
  let speciesSeed = (Math.random() * 2 ** 32) >>> 0;
  const reshuffleSpecies = () => (speciesSeed = (Math.random() * 2 ** 32) >>> 0);
  let nodes: Node[] = [];
  // In species mode each node belongs to one species (see layoutNodes).
  const speciesCount = () => Math.max(1, Math.min(MAX_SPECIES, Math.round(params.species)));
  const nodeSpecies = (k: number) => nodes[k]?.[2] ?? 0;
  let nodeSeed = opts.nodeSeed ?? 1;
  let nodeTex: WebGLTexture | null = null;

  // Each node is [x, y, species]. Positions come from the page's nodeSeed; species are a random
  // draw from speciesSeed, reshuffled on every reseed and page change. (Regular patterns line
  // same-species nodes up into rows or columns, and the species then sort into stripes.)
  const layoutNodes = (): Node[] => {
    const { nodePattern: pattern, nodeSpacing: sp, nodeJitter: jit } = params;
    if (pattern === 'none' || sp <= 0) return [];
    const S = speciesCount();
    const pick = mulberry32(speciesSeed ^ nodeSeed);
    const species = () => Math.floor(pick() * S);
    const out: Node[] = [];
    const rand = mulberry32(nodeSeed);
    const jitter = () => (rand() - 0.5) * jit * sp;
    if (pattern === 'scatter') {
      // Rejection sampling for an even but irregular spread.
      const target = Math.round((trailW * trailH) / (sp * sp));
      for (let tries = 0; out.length < target && tries < target * 30; tries++) {
        const x = rand() * trailW;
        const y = rand() * trailH;
        if (!excluded(x, y) && out.every(([nx, ny]) => (nx - x) ** 2 + (ny - y) ** 2 > sp * sp * 0.6))
          out.push([x, y, species()]);
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
        if (x >= 0 && x < trailW && y >= 0 && y < trailH && !excluded(x, y))
          out.push([x, y, species()]);
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
    nodes.forEach(([nx, ny], k) => {
      for (let y = Math.floor(ny - reach); y <= ny + reach; y++) {
        for (let x = Math.floor(nx - reach); x <= nx + reach; x++) {
          const d = Math.hypot(x + 0.5 - nx, y + 0.5 - ny);
          const i = (((y % trailH) + trailH) % trailH) * trailW + (((x % trailW) + trailW) % trailW);
          data[i * 4] += Math.exp(-(d * d) / (r * r));
          data[i * 4 + 1] = Math.max(data[i * 4 + 1], Math.exp(-((d - ring) ** 2) / 0.6));
          data[i * 4 + 3] = nodeSpecies(k); // which species this node feeds and is drawn in
        }
      }
    });
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
        const k = i % nodes.length;
        const [nx, ny] = nodes[k];
        const t = Math.random() * Math.PI * 2;
        const r = Math.random() * params.nodeRadius * 4;
        data[i * 4] = (nx + Math.cos(t) * r) / trailW;
        data[i * 4 + 1] = (ny + Math.sin(t) * r) / trailH;
        data[i * 4 + 2] = t;
        data[i * 4 + 3] = nodeSpecies(k); // agents start on their own species' nodes
        continue;
      }
      if (params.nodePattern === 'none') {
        // Paper initialisation: uniformly random positions and headings.
        data[i * 4] = Math.random();
        data[i * 4 + 1] = Math.random();
        data[i * 4 + 2] = Math.random() * Math.PI * 2;
        data[i * 4 + 3] = i % speciesCount();
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
      data[i * 4 + 3] = i % speciesCount();
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
    if (!ready) return;
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
    // Per-species movement and attraction. One species uses the main params and its own channel.
    const S = speciesCount();
    const sp = (i: number) => (S === 1 ? params : params.speciesParams[i] ?? params);
    const per = (key: keyof SpeciesParams) => [0, 1, 2, 3].map((i) => sp(i)[key]) as [number, number, number, number];
    gl.uniform4f(u.uSpSA, ...per('sensorAngle'));
    gl.uniform4f(u.uSpSD, ...per('sensorDist'));
    gl.uniform4f(u.uSpTurn, ...per('turn'));
    gl.uniform4f(u.uSpStep, ...per('step'));
    const attract = new Float32Array(16);
    for (let row = 0; row < MAX_SPECIES; row++)
      for (let col = 0; col < MAX_SPECIES; col++)
        attract[row * 4 + col] = S === 1 ? (col === 0 ? 1 : 0) : col < S ? (params.attraction[row * MAX_SPECIES + col] ?? 0) : 0;
    gl.uniform4fv(u['uAttract[0]'], attract);
    gl.uniform1i(u.uWeighted, params.weightedTurn ? 1 : 0);
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
    gl.uniform4f(d.uChannels, 1, S > 1 ? 1 : 0, S > 2 ? 1 : 0, S > 3 ? 1 : 0);
    gl.uniform1i(d.uSoftBlur, params.softBlur ? 1 : 0);
    gl.uniform1i(d.uNodeSpecies, S > 1 ? 1 : 0);
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
    if (!ready) return;
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
    // Species colors: spread across the palette's slime colors (densest first) so species
    // contrast, e.g. 2 species in a 4-color palette get the 1st and 3rd.
    const slime = stops.slice(1).reverse();
    const n = speciesCount();
    const spColors = new Float32Array(12);
    for (let i = 0; i < 4; i++) {
      const k = slime.length >= n ? Math.floor((i * slime.length) / n) : i;
      spColors.set(slime[k % slime.length] ?? stops[stops.length - 1], i * 3);
    }
    gl.uniform1i(u.uSpecies, n);
    gl.uniform3fv(u['uSpColor[0]'], spColors);
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
  // While not animating (paused, background window, reduced motion) the network is "settled" by
  // running steps ahead of time. Done in small batches across tasks so it never blocks the main
  // thread for long (one 360-step burst was a 1.1 s long task); a newer settle, or animation
  // starting, cancels an older one.
  const SETTLE_BATCH = 8;
  let settleToken = 0;
  const settle = (steps: number) => {
    const token = ++settleToken;
    let left = steps;
    const run = () => {
      if (token !== settleToken || active()) return;
      if (!ready) return whenReady(run);
      const n = Math.min(SETTLE_BATCH, left);
      for (let i = 0; i < n; i++) step();
      left -= n;
      draw();
      if (left > 0) setTimeout(run, 0);
    };
    run();
  };
  const setRunning = (on: boolean) => {
    running = on;
    cancelAnimationFrame(raf);
    if (active()) {
      frames = 0;
      fpsStart = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (on && !drewOnce) {
      // Started in a background window: show a settled frame rather than an empty canvas.
      settle(120);
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
      if (opts.rebuild === false) return;
      buildNodes();
      if (!active()) draw();
    },
    rebuildNodes() {
      buildNodes();
      if (!active()) draw();
    },
    disturb({ nodeSeed: next, x, y, rebuild = true, settle: doSettle = true }) {
      nodeSeed = next;
      reshuffleSpecies();
      if (rebuild) buildNodes();
      pendingFade = 1 - params.navFade;
      pendingScramble = params.navScramble;
      wave.x = x === undefined ? 0.5 : x / window.innerWidth;
      wave.y = y === undefined ? 0.5 : 1 - y / window.innerHeight;
      wave.start = performance.now();
      if (!active() && doSettle) {
        // Reduced motion / background: settle on the new layout without animating.
        settle(180);
      }
    },
    settle,
    reset() {
      reshuffleSpecies();
      quietUntil = performance.now() + RESEED_QUIET_MS;
      pointer.strength = 0;
      if (!resize()) buildNodes();
      for (const t of trail) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      seedAgents();
      if (!active()) settle(240);
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
