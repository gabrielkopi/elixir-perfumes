import { fileURLToPath } from 'node:url';
import { defineConfig, normalizePath } from 'vite';

const repository = normalizePath(fileURLToPath(new URL('../', import.meta.url))).replace(/\/$/, '');

export default defineConfig({
  base: './',
  server: {
    fs: { allow: ['.', '../assets', '../Perfil/dist', '../elixir.html'].map((path) => fileURLToPath(new URL(path, import.meta.url))) },
  },
  plugins: [{
    name: 'elixir-repository-assets',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (/^\/(?:assets\/|Perfil\/dist\/|elixir\.html(?:\?|$))/.test(request.url ?? '')) {
          request.url = `/@fs/${repository}${request.url}`;
        }
        next();
      });
    },
  }],
  build: {
    assetsDir: 'studio/bundle',
  },
});
