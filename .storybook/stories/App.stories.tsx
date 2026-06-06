import type { Meta, StoryObj } from '@storybook/react';
import { App } from '../src/App';

const meta = {
  title: 'Example/App',
  component: App,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
