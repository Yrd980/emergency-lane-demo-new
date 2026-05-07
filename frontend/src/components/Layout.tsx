import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: '概览' },
  { to: '/events', label: '事件' },
  { to: '/devices', label: '设备' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <aside className="flex w-64 flex-col border-r border-outline-variant/10 bg-surface-container-lowest">
        <div className="border-b border-outline-variant/10 p-4 text-lg font-bold text-primary">
          应急车道检测
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block min-h-11 rounded-lg px-4 py-3 text-body-sm ${
                  isActive
                    ? 'bg-surface-container-high text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
