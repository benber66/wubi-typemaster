import { NavLink } from 'react-router-dom';
import { Home, BarChart3, Settings as SettingsIcon, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: '/', label: '首页', icon: <Home className="h-4 w-4" /> },
  { to: '/stats', label: '统计', icon: <BarChart3 className="h-4 w-4" /> },
  { to: '/keyboard', label: '键位', icon: <Keyboard className="h-4 w-4" /> },
  { to: '/settings', label: '设置', icon: <SettingsIcon className="h-4 w-4" /> },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
          五
        </div>
        <div>
          <div className="text-sm font-semibold leading-none">WubiTypeMaster</div>
          <div className="text-[10px] text-muted-foreground">v0.2.0</div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent',
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-3 text-[10px] text-muted-foreground">
        © 2026 benber66 · MIT
      </div>
    </aside>
  );
}
