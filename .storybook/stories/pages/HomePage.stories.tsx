import type { Meta, StoryObj } from '@storybook/react';
import { HomePage } from '@/pages/Home';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';

const meta = {
  title: 'Pages/Home',
  component: HomePage,
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
} satisfies Meta<typeof HomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
