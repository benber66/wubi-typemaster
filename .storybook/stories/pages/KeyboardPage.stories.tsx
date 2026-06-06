import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { KeyboardPage } from '@/pages/Keyboard';

const meta = {
  title: 'Pages/Keyboard',
  component: KeyboardPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <ThemeProvider>
          <Story />
        </ThemeProvider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof KeyboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
