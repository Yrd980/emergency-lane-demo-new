import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../access/useRole';
import { canAccess, navItems } from '../access/permissions';

export default function ProductShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const visibleNavItems = navItems.filter((item) => canAccess(user?.permissions ?? [], item.permissions));

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

        <div className="mt-auto flex flex-col gap-xs border-t border-outline-variant/10 pt-lg">
          <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:text-on-surface text-body-sm rounded-lg transition-colors" href="#">
            <span className="material-symbols-outlined">help</span>
            Support
          </a>
          <button
            className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:text-on-surface text-body-sm rounded-lg transition-colors w-full text-left"
            onClick={() => void logout()}
          >
            <span className="material-symbols-outlined">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
