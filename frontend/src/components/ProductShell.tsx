import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  ClipboardCheck,
  Gauge,
  MonitorSmartphone,
  Route,
  Settings,
  ShieldCheck,
  Siren,
} from 'lucide-react';
import { cn } from '../utils/format';

const navItems = [
  { to: '/', label: '工作台', icon: Gauge },
  { to: '/setup', label: '接入', icon: Route },
  { to: '/review', label: '复核', icon: ClipboardCheck },
  { to: '/events', label: '事件', icon: Siren },
  { to: '/devices', label: '设备', icon: MonitorSmartphone },
  { to: '/health', label: '健康', icon: Activity },
  { to: '/settings', label: '设置', icon: Settings },
];

export default function ProductShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const active = navItems.find((item) => item.to === location.pathname) ?? navItems[0];

  return (
    <div className="min-h-screen bg-[#eef2f5] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-[#111820] text-white lg:flex lg:flex-col">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400 text-slate-950">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide">LaneOps</div>
              <div className="text-xs text-slate-400">应急车道检测工作台</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
                    isActive
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs leading-5 text-slate-400">
          当前产品环：接入设备 → 发现事件 → 复核证据 → 监控健康
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">LaneOps</div>
              <div className="font-semibold">{active.label}</div>
            </div>
            <ShieldCheck className="h-5 w-5 text-amber-500" />
          </div>
        </header>
        <main className="mx-auto min-h-screen max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white shadow-lg lg:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-1 py-2 text-[11px]',
                  isActive ? 'text-slate-950' : 'text-slate-500',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
