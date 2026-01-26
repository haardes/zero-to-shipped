/**
 * Vitest Configuration
 * 
 * Configures Vitest testing framework for the Next.js application with React support.
 * This configuration enables testing React components with jsdom environment and sets up
 * path aliases to match the Next.js configuration.
 * 
 * @module vitest.config
 * 
 * @example
 * // Run tests using this configuration
 * npm run test
 * 
 * @example
 * // Run tests in watch mode
 * npm run test:watch
 * 
 * @example
 * // Run tests with coverage
 * npm run test:coverage
 * 
 * Configuration Features:
 * - React plugin for JSX/TSX support
 * - jsdom environment for DOM testing
 * - Global test APIs (describe, it, expect)
 * - Setup file for test initialization
 * - Path alias '@' pointing to project root
 * 
 * @see {@link https://vitest.dev/config/} Vitest Configuration Reference
 */
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
