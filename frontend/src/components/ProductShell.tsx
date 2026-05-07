import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useRole } from '../access/useRole';
import { navItems, roleDescriptions, roleLabels } from '../access/permissions';

export default function ProductShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, setRole } = useRole();
  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-on-surface font-body-sm">
      {/* Sidebar — Desktop */}
      <aside className="hidden md:flex flex-col h-full py-lg px-md gap-md bg-surface-container-lowest w-64 shrink-0 border-r border-outline-variant/10">
        <div className="px-sm mb-lg">
          <h1 className="text-headline-md font-headline-md text-primary">Aegis Monitoring</h1>
          <p className="text-label-xs font-label-xs text-on-surface-variant opacity-60 flex items-center gap-xs mt-xs">
            <span className="status-dot-healthy" /> Network Active
          </p>
        </div>

        <nav className="flex-1 flex flex-col gap-xs">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to === '/' && location.pathname === '/');
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={() =>
                  `flex items-center gap-md px-md py-sm rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-low'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`
                }
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-body-sm text-body-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Role Switcher */}
        <div className="mt-auto rounded-xl border border-outline-variant/10 bg-surface-container-low p-3">
          <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Role</p>
          <div className="grid gap-1">
            {(['reviewer', 'operator', 'maintainer'] as const).map((r) => (
              <button
                key={r}
                className={`rounded-lg px-3 py-2 text-left text-xs transition-all ${
                  role === r
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                onClick={() => setRole(r)}
              >
                <div className="font-semibold">{roleLabels[r]}</div>
                <div className="mt-0.5 text-[10px] opacity-70 leading-tight">{roleDescriptions[r]}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-xs pt-lg border-t border-outline-variant/10">
          <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:text-on-surface text-body-sm rounded-lg transition-colors" href="#">
            <span className="material-symbols-outlined">help</span>
            Support
          </a>
          <button
            className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:text-on-surface text-body-sm rounded-lg transition-colors w-full text-left"
            onClick={() => {
              localStorage.removeItem('laneops-role');
              window.location.reload();
            }}
          >
            <span className="material-symbols-outlined">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top App Bar */}
        <header className="flex justify-between items-center w-full px-margin py-sm z-30 bg-background border-b border-outline-variant/5">
          <div className="flex items-center gap-lg">
            <span className="text-headline-md font-headline-md font-bold text-primary md:hidden">Aegis</span>
            <div className="hidden md:flex items-center gap-sm bg-surface-container-low rounded-lg px-md py-xs border border-outline-variant/10 inner-glow-focus">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-body-sm text-on-surface w-64 placeholder:text-on-surface-variant/50 outline-none"
                placeholder="Search analytics..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-md">
            <button
              className="flex items-center gap-xs px-md py-sm bg-primary-container text-on-primary-container rounded-lg font-label-xs text-label-xs hover:brightness-110 transition-all active:scale-95"
              onClick={() => navigate('/health')}
            >
              <span className="material-symbols-outlined text-base">download</span>
              Export Report
            </button>
            <div className="h-8 w-px bg-outline-variant/20 mx-xs" />
            <button className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" title="Notifications">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" title="Settings" onClick={() => navigate('/settings')}>
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/20 overflow-hidden flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">AD</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="mx-auto max-w-[100rem] px-margin py-lg">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-4 py-2 pb-safe bg-surface-container-high shadow-lg rounded-t-xl">
        {visibleNavItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.to || (item.to === '/' && location.pathname === '/');
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={() =>
                `flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl transition-all scale-95 duration-100 ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant'
                }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label-xs text-label-xs">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
