import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../access/useRole';
import { canAccess, navItems } from '../access/permissions';

export default function ProductShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const visibleNavItems = navItems.filter((item) => canAccess(user?.permissions ?? [], item.permissions));
  const navItemClass =
    'flex min-h-12 w-full items-center gap-3 rounded-lg px-4 text-[15px] leading-none transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
  const navIconClass = 'material-symbols-outlined text-[24px] leading-none';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-on-surface font-body-sm">
      {/* Sidebar — Desktop */}
      <aside className="hidden md:flex flex-col h-full w-64 shrink-0 gap-md bg-surface-container-lowest px-sm py-lg border-r border-outline-variant/10">
        <div className="px-md pb-md">
          <h1 className="text-[22px] font-semibold leading-tight text-primary">Aegis Monitoring</h1>
          <p className="mt-sm flex items-center gap-sm text-[13px] font-medium leading-none text-on-surface-variant opacity-80">
            <span className="status-dot-healthy" /> Network Active
          </p>
        </div>

        <nav className="flex-1 flex flex-col gap-sm">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to === '/' && location.pathname === '/');
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={() =>
                  `${navItemClass} ${
                    isActive
                      ? 'bg-surface-container-high text-primary font-semibold shadow-[inset_-1px_0_0_#c2c1ff]'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`
                }
              >
                <span className={navIconClass}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-sm border-t border-outline-variant/10 pt-md">
          <a className={`${navItemClass} text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface`} href="#">
            <span className={navIconClass}>help</span>
            Support
          </a>
          <button
            className={`${navItemClass} text-left text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface`}
            onClick={() => void logout()}
          >
            <span className={navIconClass}>logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="mx-auto max-w-[100rem] px-md pb-28 pt-lg md:px-margin md:pb-lg">
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
