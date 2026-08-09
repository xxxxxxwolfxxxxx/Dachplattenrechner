// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://dachplattenrechner.de',
  output: 'static',

  build: {
    format: 'directory'   // /tools/trapez/ statt /tools/trapez.html
  },

  // /embed/* sind noindex-Kopien der Tool-Seiten für fremde iframes –
  // sie gehören nicht in die Sitemap und würden sonst mit den echten
  // Tool-Seiten um dieselben Suchanfragen konkurrieren.
  integrations: [
    sitemap({ filter: (page) => !page.includes('/embed/') }),
    react(),
  ]
});