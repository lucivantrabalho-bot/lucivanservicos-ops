import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CreatePendencia from './components/CreatePendencia';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import PendingApproval from './components/PendingApproval';
import DashboardCharts from './components/DashboardCharts';
import LocationsMap from './components/LocationsMap';

// Auth context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" />;
  
  // Redirect pending users to approval screen
  if (user.status === 'PENDING') {
    return <Navigate to="/pending-approval" />;
  }
  
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <CreatePendencia />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pending-approval"
        element={
          <PendingApproval />
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <DashboardCharts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/locations"
        element={
          <ProtectedRoute>
            <LocationsMap />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="App min-h-screen bg-background text-foreground transition-colors duration-300">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;