import path from 'node:path';
import {URL} from 'node:url';
import {defineConfig} from '@blinkk/root';

const rootDir = new URL('.', import.meta.url).pathname;

export default defineConfig({
  vite: {
    server: {
      host: '0.0.0.0',
      allowedHosts: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(rootDir),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [path.resolve(rootDir, './styles')],
        },
      },
    },
  },
});
