import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import { Login, Signup } from './pages/Auth';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/Admin';
import { ClaimsPage } from './pages/Claims';
import { ProfilePage } from './pages/Profile';
import { SupportPage } from './pages/Support';
import { InsurancePage } from './pages/Insurance';
import { Landing } from './pages/Landing';
import Weather from "./weather"; // adjust path if needed

function App() {
  return (
    <>
      <Weather />
    </>
  );
}

export default App;

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;
  
  if (profile && !profile.onboarded && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/" />;

  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/onboarding" /> : <Signup />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/claims" element={
        <ProtectedRoute>
          <Layout><ClaimsPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout><ProfilePage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/support" element={
        <ProtectedRoute>
          <Layout><SupportPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/insurance" element={
        <ProtectedRoute>
          <Layout><InsurancePage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <Layout><AdminPanel /></Layout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
