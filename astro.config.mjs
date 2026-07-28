import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://cloudbridge.info',
  trailingSlash: 'never',
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
});
