import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../utils/format';
import { useRole } from '../access/useRole';
import { navItems, roleDescriptions, roleLabels } from '../access/permissions';

export default function ProductShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, setRole } = useRole();
  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));
  const active = visibleNavItems.find((item) => item.to === location.pathname) ?? visibleNavItems[0];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--canvas)] text-[var(--text)]">
      {/* Sidebar — Desktop */}
      <aside className="hidden md:flex flex-col h-full py-6 px-4 gap-4 bg-[var(--surface-base)] w-64 shrink-0 border-r border-[var(--line)]/20">
        <div className="px-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--brand)] text-2xl">shield</span>
            <div>
              <h1 className="text-lg font-semibold text-[var(--brand)] tracking-tight">Aegis Monitoring</h1>
              <p className="text-[11px] text-[var(--muted)]/60 flex items-center gap-1.5">
                <span className="status-dot-healthy" /> Network Active
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.to === '/' && location.pathname === '/');
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive: linkActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm',
                    (linkActive || isActive)
                      ? 'text-[var(--brand)] font-semibold border-r-2 border-[var(--brand)] bg-[var(--surface-soft)]'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-soft)]',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Role Switcher */}
        <div className="rounded-xl border border-[var(--line)]/20 bg-[var(--surface-soft)] p-3">
          <p className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest mb-2">Role</p>
          <div className="grid gap-1">
            {(['reviewer', 'operator', 'maintainer'] as const).map((r) => (
              <button
                key={r}
                className={cn(
                  'rounded-lg px-3 py-2 text-left text-xs transition-all',
                  role === r
                    ? 'bg-[var(--brand)] text-[var(--on-brand)] font-semibold'
                    : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]',
                )}
                onClick={() => setRole(r)}
              >
                <div className="font-semibold">{roleLabels[r]}</div>
                <div className="mt-0.5 text-[10px] opacity-70 leading-tight">{roleDescriptions[r]}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 pt-4 border-t border-[var(--line)]/10">
          <a className="flex items-center gap-3 px-3 py-2 text-[var(--muted)] hover:text-[var(--text)] text-sm rounded-lg transition-colors" href="#">
            <span className="material-symbols-outlined text-lg">help</span>
            Support
          </a>
          <button
            className="flex items-center gap-3 px-3 py-2 text-[var(--muted)] hover:text-[var(--text)] text-sm rounded-lg transition-colors w-full text-left"
            onClick={() => {
              localStorage.removeItem('laneops-role');
              window.location.reload();
            }}
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Sign Out
          </button>
        </div>

        <div className="text-[10px] text-[var(--muted)]/40 px-3">
          {active.label} · {roleLabels[role]}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top App Bar */}
        <header className="flex justify-between items-center w-full px-6 py-3 z-30 bg-[var(--canvas)]/90 backdrop-blur border-b border-[var(--line)]/10">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold text-[var(--brand)] tracking-tight md:hidden">Aegis</span>
            <div className="hidden md:flex items-center bg-[var(--surface-soft)] rounded-lg px-3 py-1.5 border border-[var(--line)]/10 inner-glow-focus">
              <span className="material-symbols-outlined text-[var(--muted)] text-lg mr-2">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-sm text-[var(--text)] w-56 placeholder:text-[var(--muted)]/50 outline-none"
                placeholder="Search events, devices..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--brand-soft)] text-[var(--on-brand-container)] rounded-lg text-xs font-semibold hover:brightness-110 transition-all active:scale-95"
              onClick={() => navigate('/health')}
            >
              <span className="material-symbols-outlined text-base">download</span>
              Export Report
            </button>
            <div className="h-6 w-px bg-[var(--line)]/20 mx-1" />
            <button className="p-1.5 text-[var(--muted)] hover:bg-[var(--surface-raised)] rounded-lg transition-colors" title="Notifications">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-1.5 text-[var(--muted)] hover:bg-[var(--surface-raised)] rounded-lg transition-colors" title="Settings" onClick={() => navigate('/settings')}>
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[var(--surface-glow)] border border-[var(--line)]/30 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[var(--brand)]">AD</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="mx-auto max-w-[100rem] px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-2 py-2 pb-safe bg-[var(--surface-raised)]/95 backdrop-blur shadow-lg rounded-t-xl border-t border-[var(--line)]/20">
        {visibleNavItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || (item.to === '/' && location.pathname === '/');
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive: linkActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all',
                  (linkActive || isActive)
                    ? 'bg-[var(--brand-soft)] text-[var(--on-brand-container)]'
                    : 'text-[var(--muted)]',
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
