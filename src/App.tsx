import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AppLayout } from '@/components/Layout/AppLayout';
import { HomePage } from '@/pages/Home';
import { SettingsPage } from '@/pages/Settings';
import { KeyboardPage } from '@/pages/Keyboard';
import {
  ArticlePage,
  BubblePage,
  KeyDrillPage,
  StatsPage,
  WordInvadersPage,
} from '@/pages/Placeholder';

export function App() {
  return (
    <ThemeProvider>
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/article" element={<ArticlePage />} />
            <Route path="/word-invaders" element={<WordInvadersPage />} />
            <Route path="/bubble" element={<BubblePage />} />
            <Route path="/key-drill" element={<KeyDrillPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/keyboard" element={<KeyboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}
