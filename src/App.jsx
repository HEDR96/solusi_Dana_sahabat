import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { canAccessPath, defaultRouteFor } from './data/permissions';
import { Login } from './pages/Login';

// Code-splitting per halaman — bundle awal mengecil drastis (Recharts, date-fns,
// dll. hanya diunduh saat halamannya dibuka). Halaman diekspor bernama, jadi
// perlu di-map ke default untuk React.lazy.
const lazyPage = (loader, name) => lazy(() => loader().then(m => ({ default: m[name] })));

const Dashboard         = lazyPage(() => import('./pages/Dashboard'), 'Dashboard');
const AgentList         = lazyPage(() => import('./pages/Agents/AgentList'), 'AgentList');
const AgentDetail       = lazyPage(() => import('./pages/Agents/AgentDetail'), 'AgentDetail');
const ApplicationList   = lazyPage(() => import('./pages/Applications/ApplicationList'), 'ApplicationList');
const ApplicationDetail = lazyPage(() => import('./pages/Applications/ApplicationDetail'), 'ApplicationDetail');
const Pipeline          = lazyPage(() => import('./pages/Pipeline'), 'Pipeline');
const CalendarPage      = lazyPage(() => import('./pages/CalendarPage'), 'CalendarPage');
const Commission        = lazyPage(() => import('./pages/Commission'), 'Commission');
const Simulation        = lazyPage(() => import('./pages/Simulation'), 'Simulation');
const SalesReport       = lazyPage(() => import('./pages/Reports/SalesReport'), 'SalesReport');
const ApplicationReport = lazyPage(() => import('./pages/Reports/ApplicationReport'), 'ApplicationReport');
const CommissionReport  = lazyPage(() => import('./pages/Reports/CommissionReport'), 'CommissionReport');
const Users             = lazyPage(() => import('./pages/Users'), 'Users');
const AuditLog          = lazyPage(() => import('./pages/AuditLog'), 'AuditLog');
const Settings          = lazyPage(() => import('./pages/Settings'), 'Settings');
const Profile           = lazyPage(() => import('./pages/Profile'), 'Profile');
const AgentActivity     = lazyPage(() => import('./pages/AgentActivity'), 'AgentActivity');
const AgentMap          = lazyPage(() => import('./pages/AgentMap'), 'AgentMap');
const MasterData        = lazyPage(() => import('./pages/MasterData'), 'MasterData');
const ApplyAgent        = lazyPage(() => import('./pages/ApplyAgent'), 'ApplyAgent');
const ResetPassword     = lazyPage(() => import('./pages/ResetPassword'), 'ResetPassword');

function Spinner() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '3px solid var(--border-light)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { currentUser } = useApp();
  const location = useLocation();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!canAccessPath(currentUser.role, location.pathname)) {
    return <Navigate to={defaultRouteFor(currentUser.role)} replace />;
  }
  return children;
}

function AppRoutes() {
  const { currentUser, authLoading } = useApp();
  if (authLoading) return <Spinner />;
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/daftar-agen" element={<ApplyAgent />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/agents" element={<ProtectedRoute><AgentList /></ProtectedRoute>} />
        <Route path="/agents/:id" element={<ProtectedRoute><AgentDetail /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute><ApplicationList /></ProtectedRoute>} />
        <Route path="/applications/:id" element={<ProtectedRoute><ApplicationDetail /></ProtectedRoute>} />
        <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/commission" element={<ProtectedRoute><Commission /></ProtectedRoute>} />
        <Route path="/leasing" element={<Navigate to="/masterdata" replace />} />
        <Route path="/simulation" element={<ProtectedRoute><Simulation /></ProtectedRoute>} />
        <Route path="/reports/sales" element={<ProtectedRoute><SalesReport /></ProtectedRoute>} />
        <Route path="/reports/applications" element={<ProtectedRoute><ApplicationReport /></ProtectedRoute>} />
        <Route path="/reports/commission" element={<ProtectedRoute><CommissionReport /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/activities" element={<ProtectedRoute><AgentActivity /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><AgentMap /></ProtectedRoute>} />
        <Route path="/masterdata" element={<ProtectedRoute><MasterData /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
