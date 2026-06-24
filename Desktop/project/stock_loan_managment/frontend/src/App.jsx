import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Members from './pages/Members';
import Storage from './pages/Storage';
import Loans from './pages/Loans';
import Reports from './pages/Reports';

// Route protection wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-muted)',
        fontSize: '1.25rem',
        fontWeight: '600'
      }}>
        Verifying Session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user's role is not authorized, redirect back to their dashboard
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main App Layout including Sidebar and content window
const AppLayout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/products" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Products />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/members" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Members />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/storage" 
          element={
            <ProtectedRoute>
              <Storage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/loans" 
          element={
            <ProtectedRoute>
              <Loans />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'member']}>
              <Reports />
            </ProtectedRoute>
          } 
        />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
