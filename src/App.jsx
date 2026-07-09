import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { canAccessPath, defaultRouteFor } from './data/permissions';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AgentList } from './pages/Agents/AgentList';
import { AgentDetail } from './pages/Agents/AgentDetail';
import { ApplicationList } from './pages/Applications/ApplicationList';
import { ApplicationDetail } from './pages/Applications/ApplicationDetail';
import { Pipeline } from './pages/Pipeline';
import { CalendarPage } from './pages/CalendarPage';
import { Commission } from './pages/Commission';
import { Leasing } from './pages/Leasing';
import { Simulation } from './pages/Simulation';
import { SalesReport } from './pages/Reports/SalesReport';
import { ApplicationReport } from './pages/Reports/ApplicationReport';
import { CommissionReport } from './pages/Reports/CommissionReport';
import { Users } from './pages/Users';
import { AuditLog } from './pages/AuditLog';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { AgentActivity } from './pages/AgentActivity';
import { AgentMap } from './pages/AgentMap';

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
  if (authLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '3px solid var(--border-light)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }
  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/agents" element={<ProtectedRoute><AgentList /></ProtectedRoute>} />
      <Route path="/agents/:id" element={<ProtectedRoute><AgentDetail /></ProtectedRoute>} />
      <Route path="/applications" element={<ProtectedRoute><ApplicationList /></ProtectedRoute>} />
      <Route path="/applications/:id" element={<ProtectedRoute><ApplicationDetail /></ProtectedRoute>} />
      <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/commission" element={<ProtectedRoute><Commission /></ProtectedRoute>} />
      <Route path="/leasing" element={<ProtectedRoute><Leasing /></ProtectedRoute>} />
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
      <Route path="*" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
    </Routes>
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
