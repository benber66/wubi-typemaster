import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { StatsPage } from './index';

function withProviders(Story: React.ComponentType) {
  return (
    <ThemeProvider>
      <MemoryRouter initialEntries={['/stats']}>
        <Routes>
          <Route path="/stats" element={<Story />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

const meta = {
  title: 'Pages/Stats',
  component: StatsPage,
  decorators: [withProviders],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StatsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
