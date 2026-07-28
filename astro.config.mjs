import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://cloudbridge.info',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});
