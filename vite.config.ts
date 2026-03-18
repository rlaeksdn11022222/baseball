import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'cow_icon_512.png'],
      manifest: {
        name: '소여준게임',
        short_name: '소여준',
        description: '여준이 게임을 즐기세요!',
        theme_color: '#1a73e8',
        icons: [
          {
            src: 'cow_icon_512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'   // 하나로 합치면 됨
          }
        ]
      }
    })
  ]
});