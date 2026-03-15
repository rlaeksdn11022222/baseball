import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa'


export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: '숫자야구 게임',
        short_name: '숫자야구',
        description: '재밌는 숫자야구 게임을 모바일에서 즐기세요!',
        theme_color: '#1a73e8',
        icons: [
          {
            src: 'baseball.jpeg',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'baseball.jpeg',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});