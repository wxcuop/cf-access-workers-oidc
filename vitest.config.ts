import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30000,
    include: ['tests/**/*.runtime.test.ts'],
    exclude: [
      'tests/**/*.unit.test.ts',
      'tests/**/*.integration.test.ts',
      'tests/routes.test.ts',
      'tests/endpoints.integration.test.ts',
      'tests/auth.test.ts*',
      'tests/auth.integration.test.ts*'
    ],
    setupFiles: ['./tests/setup.runtime.ts'],
    globals: false,
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
})
