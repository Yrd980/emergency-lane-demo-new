import { BrowserRouter, Route, Routes } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ProductShell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/review" element={<ReviewQueue />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/devices" element={<DeviceStatus />} />
            <Route path="/devices/:id" element={<DeviceDetail />} />
            <Route path="/health" element={<Health />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </ProductShell>
      </ToastProvider>
    </BrowserRouter>
  );
}
