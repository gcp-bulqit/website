// Live tuning panel for the simulation. Open any page with ?tune to show it.
import type { Physarum, Params, NodePattern } from './physarum';

const DEG = Math.PI / 180;

type Slider = { key: keyof Params; label: string; min: number; max: number; step: number; deg?: boolean; nodes?: boolean };

const sliders: Slider[] = [
  { key: 'sensorAngle', label: 'sensor angle°', min: 5, max: 120, step: 1, deg: true },
  { key: 'sensorDist', label: 'sensor dist', min: 2, max: 48, step: 0.5 },
  { key: 'turn', label: 'turn°', min: 2, max: 180, step: 1, deg: true },
  { key: 'step', label: 'step', min: 0.2, max: 4, step: 0.05 },
  { key: 'deposit', label: 'deposit', min: 0, max: 0.5, step: 0.005 },
  { key: 'decay', label: 'decay', min: 0.6, max: 0.995, step: 0.005 },
  { key: 'saturation', label: 'saturation', min: 0, max: 5, step: 0.05 },
  { key: 'gain', label: 'gain', min: 0.2, max: 5, step: 0.05 },
  { key: 'nodeSpacing', label: 'node spacing', min: 40, max: 500, step: 5, nodes: true },
  { key: 'nodeJitter', label: 'node jitter', min: 0, max: 1, step: 0.05, nodes: true },
  { key: 'nodeRadius', label: 'node radius', min: 1, max: 12, step: 0.5, nodes: true },
  { key: 'nodeFood', label: 'node food', min: 0, max: 3, step: 0.05 },
  { key: 'nodeMarkers', label: 'node rings', min: 0, max: 1, step: 0.05 },
  { key: 'navFade', label: 'nav fade', min: 0, max: 1, step: 0.05 },
  { key: 'navScramble', label: 'nav scramble', min: 0, max: 1, step: 0.05 },
  { key: 'navWave', label: 'nav wave', min: 0, max: 1, step: 0.05 },
  { key: 'zoneRepel', label: 'title repel', min: 0, max: 3, step: 0.05 },
  { key: 'zoneFalloff', label: 'repel falloff', min: 0, max: 200, step: 4, nodes: true },
];

const round = (n: number) => Math.round(n * 1000) / 1000;

const toSource = (p: Params) =>
  `export const defaultParams: Params = {\n` +
  Object.entries(p)
    .map(([k, v]) => {
      const s = sliders.find((x) => x.key === k);
      if (s?.deg) return `  ${k}: (${round((v as number) / DEG)} * Math.PI) / 180,`;
      return `  ${k}: ${typeof v === 'string' ? `'${v}'` : typeof v === 'number' ? round(v) : v},`;
    })
    .join('\n') +
  `\n};`;

export function mountTuner(sim: Physarum) {
  const p = sim.params;
  const panel = document.createElement('form');
  panel.className = 'tune';
  panel.setAttribute('aria-label', 'Simulation parameters');
  panel.addEventListener('submit', (e) => e.preventDefault());

  for (const s of sliders) {
    const value = (p[s.key] as number) / (s.deg ? DEG : 1);
    const row = document.createElement('label');
    row.innerHTML = `<span>${s.label}</span><input type="range" min="${s.min}" max="${s.max}" step="${s.step}"><output></output>`;
    const input = row.querySelector('input')!;
    const out = row.querySelector('output')!;
    input.value = String(value);
    out.textContent = String(round(value));
    input.addEventListener('input', () => {
      const v = Number(input.value);
      out.textContent = String(round(v));
      (p[s.key] as number) = s.deg ? v * DEG : v;
      if (s.nodes) sim.rebuildNodes();
    });
    panel.append(row);
  }

  const pattern = document.createElement('label');
  pattern.innerHTML = `<span>node pattern</span><select>${['hex', 'grid', 'scatter', 'none']
    .map((v) => `<option${v === p.nodePattern ? ' selected' : ''}>${v}</option>`)
    .join('')}</select>`;
  pattern.querySelector('select')!.addEventListener('change', (e) => {
    p.nodePattern = (e.target as HTMLSelectElement).value as NodePattern;
    sim.rebuildNodes();
  });

  const seed = document.createElement('label');
  seed.innerHTML = `<span>seed from nodes</span><input type="checkbox"${p.seedFromNodes ? ' checked' : ''}>`;
  seed.querySelector('input')!.addEventListener('change', (e) => {
    p.seedFromNodes = (e.target as HTMLInputElement).checked;
  });

  const actions = document.createElement('div');
  actions.className = 'tune-actions';
  actions.innerHTML = `<button type="button" data-a="reseed">Reseed</button><button type="button" data-a="disturb">Disturb</button><button type="button" data-a="copy">Copy params</button>`;
  actions.addEventListener('click', async (e) => {
    const a = (e.target as HTMLElement).dataset.a;
    if (a === 'reseed') sim.reset();
    if (a === 'disturb') sim.disturb({ nodeSeed: (Math.random() * 2 ** 32) >>> 0 });
    if (a === 'copy') {
      const btn = e.target as HTMLButtonElement;
      try {
        await navigator.clipboard.writeText(toSource(p));
        btn.textContent = 'Copied';
      } catch {
        console.log(toSource(p));
        btn.textContent = 'See console';
      }
      setTimeout(() => (btn.textContent = 'Copy params'), 1500);
    }
  });

  panel.append(pattern, seed, actions);
  // Inside the persisted simulation layer so it survives client-side navigation.
  (document.getElementById('sim-layer') ?? document.body).append(panel);
}
