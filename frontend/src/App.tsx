import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RoleProvider } from './access/RoleProvider';
import AccessGate from './components/AccessGate';
import ProductShell from './components/ProductShell';
import { ToastProvider } from './components/Toast';
import Dashboard from './pages/Dashboard';
import DeviceDetail from './pages/DeviceDetail';
import DeviceStatus from './pages/DeviceStatus';
import SuspectedIncidentDetail from './pages/SuspectedIncidentDetail';
import SuspectedIncidentList from './pages/SuspectedIncidentList';
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
    return <div className="flex min-h-screen items-center justify-center bg-background text-on-surface">正在加载 Aegis 会话...</div>;
  }

  if (!user) return <Login />;

  return (
    <ToastProvider>
      <ProductShell>
        <Routes>
          <Route path="/" element={<AccessGate allowed={routeAccess.dashboard}><Dashboard /></AccessGate>} />
          <Route path="/setup" element={<AccessGate allowed={routeAccess.setup}><Setup /></AccessGate>} />
          <Route path="/review" element={<AccessGate allowed={routeAccess.review}><ReviewQueue /></AccessGate>} />
          <Route path="/suspected-incidents" element={<AccessGate allowed={routeAccess.suspected_incidents}><SuspectedIncidentList /></AccessGate>} />
          <Route path="/suspected-incidents/:id" element={<AccessGate allowed={routeAccess.suspected_incidents}><SuspectedIncidentDetail /></AccessGate>} />
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
