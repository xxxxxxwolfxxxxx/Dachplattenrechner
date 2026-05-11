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

  integrations: [
    sitemap(),
    react(),
  ]
});