import type { Meta, StoryObj } from '@storybook/react';
import { CodeHint } from './index';

const meta = {
  title: 'Components/CodeHint',
  component: CodeHint,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CodeHint>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { expectedChar: '我', expectedCode: 'trd' },
};

export const WithWordSuggestions: Story = {
  args: {
    expectedChar: '我',
    expectedCode: 'trd',
    wordSuggestions: [
      { word: '我们', code: 'trwu', rank: 1, isCore: true },
      { word: '我国', code: 'trpl', rank: 5, isCore: true },
    ] as never,
  },
};

export const Dismissable: Story = {
  args: { expectedChar: '中', expectedCode: 'khk', onDismiss: () => undefined },
};
