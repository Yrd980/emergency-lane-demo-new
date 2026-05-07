import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RoleProvider } from './access/RoleProvider';
import AccessGate from './components/AccessGate';
import ProductShell from './components/ProductShell';
import { ToastProvider } from './components/Toast';
import Dashboard from './pages/Dashboard';
import DeviceDetail from './pages/DeviceDetail';
import DeviceStatus from './pages/DeviceStatus';
import EventDetail from './pages/EventDetail';
import EventList from './pages/EventList';
import Health from './pages/Health';
import ReviewQueue from './pages/ReviewQueue';
import Settings from './pages/Settings';
import Setup from './pages/Setup';
import { routeAccess } from './access/permissions';
import Login from './pages/Login';
import { useAuth } from './access/useRole';

function AuthenticatedApp() {
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-on-surface">Loading Aegis session...</div>;
  }

  if (!user) return <Login />;

  return (
    <ToastProvider>
      <ProductShell>
        <Routes>
          <Route path="/" element={<AccessGate allowed={routeAccess.dashboard}><Dashboard /></AccessGate>} />
          <Route path="/setup" element={<AccessGate allowed={routeAccess.setup}><Setup /></AccessGate>} />
          <Route path="/review" element={<AccessGate allowed={routeAccess.review}><ReviewQueue /></AccessGate>} />
          <Route path="/events" element={<AccessGate allowed={routeAccess.events}><EventList /></AccessGate>} />
          <Route path="/events/:id" element={<AccessGate allowed={routeAccess.events}><EventDetail /></AccessGate>} />
          <Route path="/devices" element={<AccessGate allowed={routeAccess.devices}><DeviceStatus /></AccessGate>} />
          <Route path="/devices/:id" element={<AccessGate allowed={routeAccess.devices}><DeviceDetail /></AccessGate>} />
          <Route path="/health" element={<AccessGate allowed={routeAccess.health}><Health /></AccessGate>} />
          <Route path="/settings" element={<AccessGate allowed={routeAccess.settings}><Settings /></AccessGate>} />
        </Routes>
      </ProductShell>
    </ToastProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <AuthenticatedApp />
      </RoleProvider>
    </BrowserRouter>
  );
}
