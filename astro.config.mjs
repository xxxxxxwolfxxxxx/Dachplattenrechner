// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://dachplattenrechner.de',
  output: 'static',
  build: {
    format: 'directory'   // /tools/trapez/ statt /tools/trapez.html
  }
});
