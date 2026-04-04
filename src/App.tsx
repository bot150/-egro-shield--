import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ClaimsProvider } from './ClaimsContext';
import { Toaster } from 'sonner';

// Pages
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Onboarding } from './pages/Onboarding';
import { Insurance } from './pages/Insurance';
import { Claims } from './pages/Claims';
import { Profile } from './pages/Profile';
import { Support } from './pages/Support';
import { Terms } from './pages/Terms';
import { Auth } from './pages/Auth';
import { Admin } from './pages/Admin';

import { Sidebar } from './components/Sidebar';
import Layout from './components/Layout';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If user is logged in but has no profile, redirect to onboarding
  // EXCEPT if they are already on the onboarding page
  if (!profile && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Auth />} />
      
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/insurance" element={
        <ProtectedRoute>
          <Insurance />
        </ProtectedRoute>
      } />
      
      <Route path="/claims" element={
        <ProtectedRoute>
          <Claims />
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      
      <Route path="/support" element={
        <ProtectedRoute>
          <Support />
        </ProtectedRoute>
      } />

      <Route path="/terms" element={
        <ProtectedRoute>
          <Terms />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const AppContent: React.FC = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {!isLandingPage && <Sidebar />}
      <main className={`flex-1 overflow-y-auto relative ${isLandingPage ? 'w-full' : ''}`}>
        <AppRoutes />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ClaimsProvider>
        <Router>
          <AppContent />
          <Toaster position="top-right" richColors />
        </Router>
      </ClaimsProvider>
    </AuthProvider>
  );
}

