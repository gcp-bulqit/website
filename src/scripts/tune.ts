// Live tuning panel for the simulation. Open any page with ?tune to show it.
import {
  defaultParams,
  paperParams,
  randomSpecies,
  MAX_SPECIES,
  type Physarum,
  type Params,
  type NodePattern,
} from './physarum';
import { palettes } from '../data/palettes';

const DEG = Math.PI / 180;

// move: a movement setting; in species mode it edits the species picked in "edit species".
type Slider = {
  key: keyof Params;
  label: string;
  min: number;
  max: number;
  step: number;
  deg?: boolean;
  nodes?: boolean;
  move?: boolean;
};

const sliders: Slider[] = [
  { key: 'sensorAngle', label: 'sensor angle°', min: 0, max: 120, step: 1, deg: true, move: true },
  { key: 'sensorDist', label: 'sensor dist', min: 0, max: 64, step: 0.5, move: true },
  { key: 'turn', label: 'turn°', min: 0, max: 180, step: 1, deg: true, move: true },
  { key: 'step', label: 'step', min: 0.2, max: 4, step: 0.05, move: true },
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
      if (typeof v === 'object') return `  ${k}: ${JSON.stringify(v, (_, x) => (typeof x === 'number' ? round(x) : x))},`;
      return `  ${k}: ${typeof v === 'string' ? `'${v}'` : typeof v === 'number' ? round(v) : v},`;
    })
    .join('\n') +
  `\n};`;

export type Tuner = { open(): void; close(): void; toggle(): void; isOpen(): boolean };

// Builds the tuning window (hidden until opened) inside the persisted simulation layer, so it
// survives client-side navigation. onChange reports open/closed so the Tune button can reflect it.
export function mountTuner(sim: Physarum, onChange: (open: boolean) => void = () => {}): Tuner {
  const p = sim.params;

  const win = document.createElement('section');
  win.className = 'tune';
  win.id = 'tune-panel';
  win.hidden = true;
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-labelledby', 'tune-title');
  win.innerHTML = `<header class="tune-head"><h2 id="tune-title">Tune</h2><button type="button" class="tune-close" aria-label="Close tuning window">×</button></header>`;
  const panel = document.createElement('form');
  panel.className = 'tune-body';
  panel.addEventListener('submit', (e) => e.preventDefault());
  win.append(panel);

  // Keep the simulation's pointer attract/repel from firing while using the window.
  for (const type of ['pointerdown', 'pointermove'] as const) win.addEventListener(type, (e) => e.stopPropagation());

  // Re-sync slider positions after params change underneath them (e.g. the paper preset).
  const syncers: (() => void)[] = [];
  const syncSliders = () => syncers.forEach((f) => f());

  // Which object a slider reads/writes: movement sliders edit one species in species mode.
  let editSpecies = 0;
  const target = (s: Slider): Record<string, number> =>
    (s.move && p.species > 1 ? p.speciesParams[editSpecies] : p) as unknown as Record<string, number>;

  for (const s of sliders) {
    const value = target(s)[s.key] / (s.deg ? DEG : 1);
    const row = document.createElement('label');
    row.innerHTML = `<span>${s.label}</span><input type="range" min="${s.min}" max="${s.max}" step="${s.step}"><output></output>`;
    const input = row.querySelector('input')!;
    const out = row.querySelector('output')!;
    input.value = String(value);
    out.textContent = String(round(value));
    syncers.push(() => {
      const v = target(s)[s.key] / (s.deg ? DEG : 1);
      input.value = String(v);
      out.textContent = String(round(v));
    });
    input.addEventListener('input', () => {
      const v = Number(input.value);
      out.textContent = String(round(v));
      target(s)[s.key] = s.deg ? v * DEG : v;
      if (s.nodes) sim.rebuildNodes();
    });
    panel.append(row);
  }

  // Species (after Fogleman): count, which species the movement sliders edit, and options.
  const species = document.createElement('label');
  species.innerHTML = `<span>species</span><input type="range" min="1" max="${MAX_SPECIES}" step="1"><output></output>`;
  const speciesInput = species.querySelector('input')!;
  const speciesOut = species.querySelector('output')!;
  const edit = document.createElement('label');
  edit.innerHTML = `<span>edit species</span><select></select>`;
  const editSelect = edit.querySelector('select')!;
  const syncSpecies = () => {
    speciesInput.value = String(p.species);
    speciesOut.textContent = String(p.species);
    editSpecies = Math.min(editSpecies, p.species - 1);
    editSelect.innerHTML = Array.from(
      { length: p.species },
      (_, i) => `<option value="${i}"${i === editSpecies ? ' selected' : ''}>${p.species > 1 ? i + 1 : 'all'}</option>`,
    ).join('');
    editSelect.disabled = p.species < 2;
    syncSliders();
  };
  speciesInput.addEventListener('input', () => {
    p.species = Number(speciesInput.value);
    syncSpecies();
    sim.reset();
  });
  editSelect.addEventListener('change', () => {
    editSpecies = Number(editSelect.value);
    syncSliders();
  });
  // One knob for how strongly species push each other away: sets every cross-species entry of
  // the attraction table (own-species attraction stays as is). Low values keep a shared mesh;
  // high values make the species sort into separate bands.
  const repel = document.createElement('label');
  repel.innerHTML = `<span>species repel</span><input type="range" min="0" max="1.5" step="0.05"><output></output>`;
  const repelInput = repel.querySelector('input')!;
  const repelOut = repel.querySelector('output')!;
  const crossValue = () => {
    const vals = p.attraction.filter((_, i) => Math.floor(i / MAX_SPECIES) !== i % MAX_SPECIES);
    return round(-vals.reduce((a, b) => a + b, 0) / vals.length);
  };
  syncers.push(() => {
    repelInput.value = String(crossValue());
    repelOut.textContent = String(crossValue());
  });
  repelInput.addEventListener('input', () => {
    const v = Number(repelInput.value);
    repelOut.textContent = String(v);
    p.attraction = p.attraction.map((x, i) => (Math.floor(i / MAX_SPECIES) === i % MAX_SPECIES ? x : -v));
  });

  const toggle = (label: string, key: 'softBlur' | 'weightedTurn') => {
    const row = document.createElement('label');
    row.innerHTML = `<span>${label}</span><input type="checkbox"${p[key] ? ' checked' : ''}>`;
    row.querySelector('input')!.addEventListener('change', (e) => {
      p[key] = (e.target as HTMLInputElement).checked;
    });
    return row;
  };

  const pattern = document.createElement('label');
  pattern.innerHTML = `<span>node pattern</span><select>${[
    ['hex', 'hex'],
    ['grid', 'grid'],
    ['scatter', 'scatter'],
    ['none', 'none (Jones 2010)'],
  ]
    .map(([v, label]) => `<option value="${v}"${v === p.nodePattern ? ' selected' : ''}>${label}</option>`)
    .join('')}</select>`;
  pattern.querySelector('select')!.addEventListener('change', (e) => {
    const next = (e.target as HTMLSelectElement).value as NodePattern;
    const prev = p.nodePattern;
    p.nodePattern = next;
    // 'none' is the paper's model: load its tuning and reseed with its random start. Leaving it
    // restores the site's tuning for those same settings.
    if (next === 'none' || prev === 'none') {
      const preset = next === 'none' ? paperParams : defaultParams;
      for (const key of Object.keys(paperParams) as (keyof Params)[]) (p[key] as unknown) = preset[key];
      syncSliders();
      sim.reset();
    } else {
      sim.rebuildNodes();
    }
  });

  // Palette picker: switches the whole site's colors live and remembers the choice.
  const palette = document.createElement('label');
  const current = document.documentElement.dataset.palette;
  palette.innerHTML = `<span>palette</span><select>${palettes
    .map((pl) => `<option value="${pl.name}"${pl.name === current ? ' selected' : ''}>${pl.label}</option>`)
    .join('')}</select>`;
  palette.querySelector('select')!.addEventListener('change', (e) => {
    const name = (e.target as HTMLSelectElement).value;
    document.documentElement.dataset.palette = name;
    try {
      localStorage.setItem('palette', name);
    } catch {}
  });

  const seed = document.createElement('label');
  seed.innerHTML = `<span>seed from nodes</span><input type="checkbox"${p.seedFromNodes ? ' checked' : ''}>`;
  seed.querySelector('input')!.addEventListener('change', (e) => {
    p.seedFromNodes = (e.target as HTMLInputElement).checked;
  });

  const actions = document.createElement('div');
  actions.className = 'tune-actions';
  actions.innerHTML = `<button type="button" data-a="random">Randomize</button><button type="button" data-a="reseed">Reseed</button><button type="button" data-a="disturb">Disturb</button><button type="button" data-a="copy">Copy params</button>`;
  actions.addEventListener('click', async (e) => {
    const a = (e.target as HTMLElement).dataset.a;
    if (a === 'reseed') sim.reset();
    if (a === 'random') {
      // Fogleman-style: 2-4 species with random movement and attraction, then reseed.
      Object.assign(p, randomSpecies());
      syncSpecies();
      sim.reset();
    }
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

  panel.prepend(palette, species, edit, repel);
  panel.append(pattern, seed, toggle('soft blur', 'softBlur'), toggle('weighted turn', 'weightedTurn'), actions);
  syncSpecies();
  (document.getElementById('sim-layer') ?? document.body).append(win);

  // Drag the window by its title bar, kept inside the viewport.
  const head = win.querySelector<HTMLElement>('.tune-head')!;
  head.addEventListener('pointerdown', (e) => {
    if ((e.target as Element).closest('button')) return;
    const r = win.getBoundingClientRect();
    const dx = e.clientX - r.left;
    const dy = e.clientY - r.top;
    head.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const x = Math.min(Math.max(0, ev.clientX - dx), window.innerWidth - r.width);
      const y = Math.min(Math.max(0, ev.clientY - dy), window.innerHeight - head.offsetHeight);
      Object.assign(win.style, { left: `${x}px`, top: `${y}px`, right: 'auto', bottom: 'auto' });
    };
    const up = () => {
      head.removeEventListener('pointermove', move);
      head.removeEventListener('pointerup', up);
      head.removeEventListener('pointercancel', up);
    };
    head.addEventListener('pointermove', move);
    head.addEventListener('pointerup', up);
    head.addEventListener('pointercancel', up);
  });

  let isOpen = false;
  const setOpen = (open: boolean) => {
    if (open === isOpen) return;
    isOpen = open;
    win.hidden = !open;
    onChange(open);
    if (open) win.querySelector<HTMLElement>('.tune-close')!.focus();
  };
  win.querySelector('.tune-close')!.addEventListener('click', () => setOpen(false));
  win.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  return {
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!isOpen),
    isOpen: () => isOpen,
  };
}
