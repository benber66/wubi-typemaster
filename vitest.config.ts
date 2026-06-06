import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/integration/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}', 'electron/**/*.ts'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/types.ts',
        'src/**/index.ts',
        'electron/**/*.test.ts',
        'src/db/migrations/**',
        'src/components/ui/**',
        'src/components/Layout/**',
        'src/components/ThemeProvider/**',
        'src/components/VirtualKeyboard/**',
        'src/pages/**',
        // Entry points — tested via E2E
        'src/main.tsx',
        'src/App.tsx',
        'electron/main.ts',
        'electron/preload.ts',
      ],
      thresholds: {
        // 核心数据 / 业务逻辑 — 必须高覆盖
        'src/lib/wubi/**': { lines: 100, statements: 100, functions: 100, branches: 80 },
        'src/lib/typing/**': { lines: 100, statements: 100, functions: 100, branches: 80 },
        'src/db/**': { lines: 80, statements: 80, functions: 80, branches: 70 },
        // 其他（stores、纯 utils）跟随全局
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@electron': resolve(__dirname, 'electron'),
      '@tests': resolve(__dirname, 'tests'),
    },
  },
});
