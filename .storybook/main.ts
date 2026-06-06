import type { StorybookConfig } from '@storybook/react-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const config: StorybookConfig = {
  stories: ['../.storybook/stories/**/*.mdx', '../.storybook/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-themes'],
  framework: { name: '@storybook/react-vite', options: {} },
  typescript: { check: false },
  core: { disableTelemetry: true },
  docs: {},
  viteFinal: (config) => {
    config.plugins = config.plugins ?? [];
    config.plugins.push(react());
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@': resolve(__dirname, '../src'),
    };
    return config;
  },
};

export default config;
