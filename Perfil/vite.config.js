import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  oxc: { jsx: { runtime: 'automatic' } },
  build: { target: ['safari16', 'chrome107', 'firefox104'] },
});
