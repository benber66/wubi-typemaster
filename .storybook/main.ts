import { defineConfig } from '@storybook/react-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  stories: ['../.storybook/stories/**/*.mdx', '../.storybook/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-themes'],
  framework: { name: '@storybook/react-vite', options: {} },
  typescript: { check: false },
  core: { disableTelemetry: true },
  docs: {},
});
