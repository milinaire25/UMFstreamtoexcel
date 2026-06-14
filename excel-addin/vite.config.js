import { defineConfig } from 'vite';

const renderTarget = 'https://umfstreamtoexcel.onrender.com';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: {
      '/render': {
        target: renderTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/render/, ''),
      },
    },
  },
});
