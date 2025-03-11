import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redirige les requêtes vers l'API du backend Express
      '/update-group': 'http://localhost:5000',
    }
  }
})
