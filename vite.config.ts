import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const gatewayTarget = 'http://localhost:8090'

const apiPaths = [
  '/auth',
  '/students',
  '/courses',
  '/teachers',
  '/subjects',
  '/enrollments',
  '/evaluations',
  '/grades',
  '/guardians',
  '/sessions',
  '/attendances',
  '/annotations',
]

const proxy = Object.fromEntries(
  apiPaths.map((path) => [
    path,
    { target: gatewayTarget, changeOrigin: true },
  ])
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8094,
    proxy,
  },
})
