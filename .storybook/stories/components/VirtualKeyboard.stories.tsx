import type { Meta, StoryObj } from '@storybook/react';
import { VirtualKeyboard } from '@/components/VirtualKeyboard';

const meta = {
  title: 'Components/VirtualKeyboard',
  component: VirtualKeyboard,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof VirtualKeyboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPressedKeys: Story = {
  args: { pressedKeys: ['g', 'h', 'j', 'k', 'l'] },
};

export const TypingASentence: Story = {
  args: { pressedKeys: ['w', 'o'] },
};

export const NoHandColor: Story = {
  args: { showHands: false },
};
