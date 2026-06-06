import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar } from '@/components/Layout/Sidebar';
import { MemoryRouter } from 'react-router-dom';

const meta = {
  title: 'Components/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="flex h-96">
          <Story />
          <main className="flex-1 bg-muted/20 p-4">主内容区</main>
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
