import { defineConfig } from 'vite';

// The co-op relay server (server/server.js) listens on 8787; in dev, Vite proxies /ws to it
// so the game can always connect to `${location.host}/ws`.
export default defineConfig({
  server: {
    host: true,
    proxy: {
      '/ws': { target: 'ws://localhost:8787', ws: true },
    },
  },
});
