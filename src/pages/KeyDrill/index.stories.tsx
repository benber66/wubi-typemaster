import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { KeyDrillPage } from './index';

function withProviders(Story: React.ComponentType) {
  return (
    <ThemeProvider>
      <MemoryRouter initialEntries={['/key-drill']}>
        <Routes>
          <Route path="/key-drill" element={<Story />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

const meta = {
  title: 'Pages/KeyDrill',
  component: KeyDrillPage,
  decorators: [withProviders],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof KeyDrillPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};
