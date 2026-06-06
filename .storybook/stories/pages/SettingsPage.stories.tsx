import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SettingsPage } from '@/pages/Settings';

const meta = {
  title: 'Pages/Settings',
  component: SettingsPage,
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
} satisfies Meta<typeof SettingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
