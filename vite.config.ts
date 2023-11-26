import { defineConfig } from 'vite'
import { electron } from './scripts/vite-plugin'

export default defineConfig({
  plugins: [electron()],
})
