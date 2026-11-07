import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' — чтобы собранную версию можно было открыть с любого пути,
// в том числе локально с диска, без настройки сервера.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173 },
})
