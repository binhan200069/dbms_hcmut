/**
 * App.jsx — Router hoàn chỉnh cho toàn bộ ứng dụng
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';

// ── Lazy imports — tất cả các trang ──────────────────────────────────
// STAFF
const StaffDashboard    = lazy(() => import('./pages/staff/StaffDashboard'));
const VehicleManagement = lazy(() => import('./pages/staff/VehicleManagement'));
const DispatchPanel     = lazy(() => import('./pages/staff/DispatchPanel'));
const StaffManagement   = lazy(() => import('./pages/staff/StaffManagement'));

// CUSTOMER
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'));
const CreateOrder       = lazy(() => import('./pages/customer/CreateOrder'));
const OrderHistory      = lazy(() => import('./pages/customer/OrderHistory'));

// DRIVER
const DriverDashboard   = lazy(() => import('./pages/driver/DriverDashboard'));
const MyTrips           = lazy(() => import('./pages/driver/MyTrips'));

// ── Loading Spinner ───────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Đang tải...</p>
      </div>
    </div>
  );
}

// ── Wrap lazy page ────────────────────────────────────────────────────
const P = ({ C }) => (
  <Suspense fallback={<PageLoader />}>
    <C />
  </Suspense>
);

// ── RoleRedirect ──────────────────────────────────────────────────────
function RoleRedirect() {
  const { getHomePath } = useAuth();
  return <Navigate to={getHomePath()} replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              maxWidth: '420px',
            },
            success: {
              duration: 3000,
              style: { border: '1px solid #d1fae5', background: '#fff', color: '#065f46' },
            },
            error: {
              duration: 6000,
              style: { border: '1px solid #fecaca', background: '#fff', color: '#991b1b' },
            },
          }}
        />

        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<RoleRedirect />} />

            {/* ── STAFF ──────────────────────────────────── */}
            <Route path="/admin"            element={<P C={StaffDashboard} />} />
            <Route path="/admin/vehicles"   element={<P C={VehicleManagement} />} />
            <Route path="/admin/dispatch"   element={<P C={DispatchPanel} />} />
            <Route path="/admin/shipments"  element={<P C={DispatchPanel} />} />
            <Route path="/admin/orders"     element={<P C={OrderHistory} />} />
            <Route path="/admin/staff"      element={<P C={StaffManagement} />} />

            {/* ── CUSTOMER ───────────────────────────────── */}
            <Route path="/customer"         element={<P C={CustomerDashboard} />} />
            <Route path="/customer/create"  element={<P C={CreateOrder} />} />
            <Route path="/customer/history" element={<P C={OrderHistory} />} />
            <Route path="/customer/tracking" element={<P C={OrderHistory} />} />

            {/* ── DRIVER ─────────────────────────────────── */}
            <Route path="/driver"           element={<P C={DriverDashboard} />} />
            <Route path="/driver/trips"     element={<P C={MyTrips} />} />
            <Route path="/driver/tracking"  element={<P C={MyTrips} />} />

            <Route path="*" element={<RoleRedirect />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
