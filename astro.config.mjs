// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://dachplattenrechner.de',
  output: 'static',

  build: {
    format: 'directory'   // /tools/trapez/ statt /tools/trapez.html
  },

  // /embed/* sind noindex-Kopien der Tool-Seiten fuer fremde iframes -
  // sie gehoeren nicht in die Sitemap und wuerden sonst mit den echten
  // Tool-Seiten um dieselben Suchanfragen konkurrieren.
  integrations: [sitemap({ filter: (page) => !page.includes('/embed/') })]
});