import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Update `site` to your real domain before deploying (used for sitemap + canonical URLs).
export default defineConfig({
  site: 'https://zippies.example.com',
  integrations: [sitemap()],
  build: { inlineStylesheets: 'auto' },
});
