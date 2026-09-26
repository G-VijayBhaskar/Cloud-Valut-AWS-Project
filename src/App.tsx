import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { MyFiles } from './pages/MyFiles';
import { Folders } from './pages/Folders';
import { Recent } from './pages/Recent';
import { Trash } from './pages/Trash';
import { Settings } from './pages/Settings';
import { DeveloperStatusPage } from './pages/DeveloperStatus';

// Protected layout component for authenticated users
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Authenticating session...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        {children}
      </div>
    </div>
  );
};

// Guard component specifically for developer role
const DeveloperRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user || user.role !== 'developer') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Application Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            } 
          />

          <Route 
            path="/files" 
            element={
              <ProtectedLayout>
                <MyFiles />
              </ProtectedLayout>
            } 
          />

          <Route 
            path="/folders" 
            element={
              <ProtectedLayout>
                <Folders />
              </ProtectedLayout>
            } 
          />

          <Route 
            path="/recent" 
            element={
              <ProtectedLayout>
                <Recent />
              </ProtectedLayout>
            } 
          />

          <Route 
            path="/trash" 
            element={
              <ProtectedLayout>
                <Trash />
              </ProtectedLayout>
            } 
          />

          <Route 
            path="/settings" 
            element={
              <ProtectedLayout>
                <Settings />
              </ProtectedLayout>
            } 
          />

          <Route 
            path="/developer" 
            element={
              <ProtectedLayout>
                <DeveloperRoute>
                  <DeveloperStatusPage />
                </DeveloperRoute>
              </ProtectedLayout>
            } 
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
