import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { WordInvadersPage } from './index';

function withProviders(Story: React.ComponentType) {
  return (
    <ThemeProvider>
      <MemoryRouter initialEntries={['/word-invaders']}>
        <Routes>
          <Route path="/word-invaders" element={<Story />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

const meta = {
  title: 'Pages/WordInvaders',
  component: WordInvadersPage,
  decorators: [withProviders],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof WordInvadersPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};
