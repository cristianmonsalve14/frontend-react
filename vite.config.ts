/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const gatewayTarget = 'http://localhost:8090'

const apiPaths = [
  '/auth',
  '/admin',
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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/assets/**',
      ],
    },
  },
})
