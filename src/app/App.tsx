import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Landing } from './components/Landing';
import { IntakeForm } from './components/IntakeForm';
import { Listings } from './components/Listings';
import { RootLayout } from './components/RootLayout';
import { Dashboard } from './components/Dashboard';
import { BrokerageOperations } from './components/BrokerageOperations';
import { SalesMarketing } from './components/SalesMarketing';
import { ProjectManagement } from './components/ProjectManagement';
import { WorkforceKPI } from './components/WorkforceKPI';
import { FieldOperations } from './components/FieldOperations';
import { PendingApproval } from './components/PendingApproval';
import Login from './components/Login';
import ClientAuth from './components/ClientAuth';
import ClientDashboard from './components/ClientDashboard';
import { TeamManagement } from './components/TeamManagement';
import AcceptInvite from './components/AcceptInvite';
import Signup from './components/Signup';
import ProjectClientView from './components/ProjectClientView';

// ── Staff protected routes ──────────────────────────────────────────────────
function ProtectedRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Block pending or suspended accounts — only applies once status column exists
  if (profile?.status && profile.status !== 'active') {
    return <PendingApproval status={profile.status} />;
  }

  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="brokerage" element={<BrokerageOperations />} />
        <Route path="sales" element={<SalesMarketing />} />
        <Route path="projects" element={<ProjectManagement />} />
        <Route path="workforce" element={<WorkforceKPI />} />
        <Route path="field" element={<FieldOperations />} />
        <Route path="settings" element={<TeamManagement />} />
      </Route>
    </Routes>
  );
}

// ── Staff login gate — redirect clients/staff to the right portal ──────────
function AuthGate() {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (user && profile) {
    if (profile.role === 'client') return <Navigate to="/client/dashboard" replace />;
    return <Navigate to="/app" replace />;
  }
  return <Login />;
}

// ── Client login/signup gate ────────────────────────────────────────────────
function ClientAuthGate() {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (user && profile) {
    if (profile.role === 'client') return <Navigate to="/client/dashboard" replace />;
    return <Navigate to="/app" replace />;
  }
  return <ClientAuth />;
}

// ── Client portal route ─────────────────────────────────────────────────────
function ClientPortalRoute() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/client/login" replace />;
  if (profile && profile.role !== 'client') return <Navigate to="/app" replace />;

  return <ClientDashboard />;
}

// ── Root app ────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/intake" element={<IntakeForm />} />
          <Route path="/login" element={<AuthGate />} />
          <Route path="/client/login" element={<ClientAuthGate />} />
          <Route path="/client/dashboard" element={<ClientPortalRoute />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/project/:id/client" element={<ProjectClientView />} />
          <Route path="/app/*" element={<ProtectedRoutes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
