import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Het moment van bouwen, voor de versieregel in Instellingen. package.json
  // staat nog op 0.0.0 en zegt dus niets; de bouwdatum beantwoordt wel de vraag
  // waar het om gaat: heeft mijn telefoon de laatste versie al?
  define: {
    __GEBOUWD_OP__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'PayMeBack',
        short_name: 'PayMeBack',
        description: 'Voorgeschoten bedragen bijhouden en verrekenen.',
        lang: 'nl',
        theme_color: '#3B6D11',
        background_color: '#f9fafb',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  // Pure logica-tests, geen DOM nodig. Vitest-functies importeer je per bestand
  // uit 'vitest', zodat tsc -b (en dus de Netlify-build) niet struikelt over
  // globale namen die hij niet kent.
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
