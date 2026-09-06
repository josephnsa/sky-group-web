// @ts-check
import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://sky.com.pe',
  integrations: [
    preact(),
    sitemap(),
    AstroPWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-512.png', 'icons/apple-touch-icon.png'],
      devOptions: {
        // Permite probar el manifest/service worker con `npm run dev`,
        // sin depender de un build completo cada vez.
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'SKY Group',
        short_name: 'SKY Group',
        description: 'Accesorios y equipamiento para tu vehículo. Cotiza y compra por WhatsApp.',
        theme_color: '#00afef',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2}'],
        navigateFallback: '/',
        // Sin esto, un service worker nuevo se queda "esperando" hasta que
        // se cierren TODAS las pestañas de la versión vieja antes de
        // activarse — con una pestaña abierta durante horas mientras se
        // publican cambios (como pasó en esta sesión), el usuario queda
        // atascado viendo contenido viejo indefinidamente pese al
        // `registerType: 'autoUpdate'`. skipWaiting + clientsClaim hacen que
        // el nuevo service worker tome control de inmediato.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'imagenes-productos',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
