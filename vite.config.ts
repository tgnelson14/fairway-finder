import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: 'https://api.golfcourseapi.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/v1'),
          headers: {
            Authorization: `Key ${env.GOLF_API_KEY}`,
          },
        },
        '/ogapi': {
          target: 'https://api.opengolfapi.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ogapi/, '/v1'),
        },
        '/weather': {
          target: 'https://api.open-meteo.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/weather/, '/v1/forecast'),
        },
      },
    },
  }
})
