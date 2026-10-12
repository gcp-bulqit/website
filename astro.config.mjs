// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.pavlovsdogma.com',
  // The stylesheet is small (~3 KB gzipped): inline it so it doesn't block the first render.
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap()],
});