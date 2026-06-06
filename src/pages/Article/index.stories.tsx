import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ArticlePage } from './index';

function withProviders(Story: React.ComponentType) {
  return (
    <ThemeProvider>
      <MemoryRouter initialEntries={['/article']}>
        <Routes>
          <Route path="/article" element={<Story />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

const meta = {
  title: 'Pages/Article',
  component: ArticlePage,
  decorators: [withProviders],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ArticlePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};
