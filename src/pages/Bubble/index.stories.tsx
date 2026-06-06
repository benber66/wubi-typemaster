import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { BubblePage } from './index';

function withProviders(Story: React.ComponentType) {
  return (
    <ThemeProvider>
      <MemoryRouter initialEntries={['/bubble']}>
        <Routes>
          <Route path="/bubble" element={<Story />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

const meta = {
  title: 'Pages/Bubble',
  component: BubblePage,
  decorators: [withProviders],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BubblePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};
