import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Required for Vercel (assets served from root)
  base: '/',

  plugins: [
    tsconfigPaths()
  ],

  // Dev server ONLY (ignored by Vercel prod)
  server: {
    port: 4200,
    strictPort: true,
    host: true,

    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'vps-a5d9e339.vps.ovh.net',
      'sts-link.com'
    ]
  },

  resolve: {
    alias: {
      '@app': '/src/app'
    }
  }
});
