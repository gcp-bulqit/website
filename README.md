# Developer site

A static developer portfolio built with [Astro](https://astro.build). Behind every page runs a live WebGL2
**Physarum (slime mold) simulation** that reacts to the pointer. The page content sits inside a frame drawn over it.

Moving the pointer attracts the agents. Holding the pointer down repels them. The controls in the
bottom-right corner pause the simulation, reseed it, or hide the page so you can watch.

## Commands

| Command           | Action                               |
| :---------------- | :----------------------------------- |
| `npm install`     | Install dependencies                 |
| `npm run dev`     | Dev server at `localhost:4321`       |
| `npm run build`   | Build the static site into `./dist/` |
| `npm run preview` | Preview the production build         |

## Where things live

- `src/data/site.ts`: **all personal content** (name, links, projects, posts). Start here.
- `src/scripts/physarum.ts`: the simulation (agent, diffuse, deposit and display shader passes). Tune `defaultParams` and `density`.
- **Tuning:** open any page with `?tune` (e.g. `localhost:4321/?tune`) for live sliders. "Copy params" copies a `defaultParams` block you can paste back into `physarum.ts`.
- `src/components/SlimeField.astro`: canvas, frame/HUD and controls. Reads colors from CSS.
- `src/styles/global.css`: design tokens. `--sim-bg`, `--sim-low` and `--sim-high` set the simulation colors per theme.
- `src/layouts/Base.astro`: shared layout (header, nav, footer, theme toggle).
- `src/pages/`: Home, About, Work, Writing, Lab, 404.

## Deploying to Vercel

Vercel detects Astro and needs no configuration. Push to GitHub and import the repo, or run `vercel` from this folder.
Before you deploy, set `site` in `astro.config.mjs` and `url` in `src/data/site.ts` to your domain.

## Credits

The simulation follows Jeff Jones' Physarum model and Sage Jenson's GPU write-up.
