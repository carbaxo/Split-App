import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages publica el proyecto bajo /Split-App/.
  // Si despliegas en otro sitio (raíz del dominio), cambia esto a '/'.
  base: '/Split-App/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Split App',
        short_name: 'Split',
        description: 'Comparte y reparte gastos con tu gente.',
        theme_color: '#16a87f',
        background_color: '#f4f6f8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/Split-App/',
        scope: '/Split-App/',
        id: '/Split-App/',
        lang: 'es',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
})
