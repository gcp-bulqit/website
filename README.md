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
| `npm run check`   | Type-check (`astro check`); CI runs it with the build |

## Where things live

- `src/data/site.ts`: **all personal content** (name, links, projects, posts). Start here.
- `src/scripts/physarum.ts`: the simulation (agent, diffuse, deposit and display shader passes). Tune `defaultParams` and `density`.
- **Tuning:** the **Tune** button (bottom right) opens a window of live sliders, the palette picker and node patterns (`none` runs the Jones 2010 model). `?tune` in the URL opens it on load. "Copy params" copies a `defaultParams` block you can paste back into `physarum.ts`.
- `src/components/SlimeField.astro`: canvas, frame/HUD and controls. Reads colors from CSS.
- `src/data/palettes.ts`: color palettes (light and dark modes, including the slime color ramp). Add one there and it appears in the Tune window; `defaultPalette` picks what visitors see.
- `src/styles/global.css`: layout, type and non-color tokens.
- `src/layouts/Base.astro`: shared layout (header, nav, footer, theme toggle).
- `src/pages/`: Home, About, Work, Writing, Lab, 404.

## Deploying to Vercel

Vercel detects Astro and needs no configuration. Push to GitHub and import the repo, or run `vercel` from this folder.
The live site is https://www.pavlovsdogma.com; if the domain changes, update `site` in `astro.config.mjs` and `url` in `src/data/site.ts`.

## Credits

The simulation follows Jeff Jones' Physarum model and Sage Jenson's GPU write-up. Multi-species mode, random species settings and weighted turning follow Michael Fogleman's [physarum](https://github.com/fogleman/physarum) (MIT).

## License

The code is MIT licensed; see [LICENSE](LICENSE). Personal content (the résumé, the text in `src/data/site.ts` and the profile image) is not covered, and the font keeps its own license.
