import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './modules/context/AuthContext';
import { ThemeProvider } from './modules/context/ThemeContext';

import LayoutComponent from './modules/UI/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workspaces from './pages/Workspaces';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';

import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>

            {/* AUTH */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* PROTECTED APP */}
            <Route path="/" element={
              <ProtectedRoute>
                <LayoutComponent />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="workspaces" element={<Workspaces />} />
              <Route path="workspaces/:workspaceId" element={<Projects />} />
              <Route path="projects/:projectId" element={<Tasks />} />
            </Route>

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
