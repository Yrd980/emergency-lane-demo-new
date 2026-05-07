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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f6f8_0%,#eef2f4_42%,#e9eef1_100%)] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-[18rem] border-r border-slate-200/80 bg-[#0f1720] text-white lg:flex lg:flex-col">
        <div className="border-b border-white/8 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-400 text-slate-950">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide">LaneOps</div>
              <div className="text-xs text-slate-400">应急车道检测工作台</div>
            </div>
          </div>
          <p className="mt-4 max-w-[14rem] text-sm leading-6 text-slate-400">
            接入设备, 处理待复核事件, 盯住系统健康, 继续下一条。
          </p>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            导航
          </div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition',
                      isActive
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:bg-white/6 hover:text-white',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/8 px-6 py-4 text-xs leading-6 text-slate-400">
          当前页面：{active.label}
          <br />
          先看状态，再看证据，最后做操作。
        </div>
      </aside>

      <div className="lg:pl-[18rem]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/88 px-4 py-3 backdrop-blur md:px-6 lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700">LaneOps</div>
              <div className="font-semibold text-slate-950">{active.label}</div>
            </div>
            <ShieldCheck className="h-5 w-5 text-cyan-700" />
          </div>
        </header>

        <main className="mx-auto min-h-screen max-w-[96rem] px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/96 shadow-[0_-8px_24px_rgba(15,23,32,0.08)] backdrop-blur lg:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium',
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
