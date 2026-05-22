import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import './styles/global.css';

// Placeholder components for other pages
const Departments = () => (
  <div style={{ padding: '2rem' }}>
    <h1>Departments</h1>
    <p>Department management coming soon...</p>
  </div>
);

const Attendance = () => (
  <div style={{ padding: '2rem' }}>
    <h1>Attendance</h1>
    <p>Attendance tracking coming soon...</p>
  </div>
);

const Settings = () => (
  <div style={{ padding: '2rem' }}>
    <h1>Settings</h1>
    <p>Settings coming soon...</p>
  </div>
);

const PrivateRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/employees" element={
              <PrivateRoute>
                <DashboardLayout>
                  <Employees />
                </DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/departments" element={
              <PrivateRoute>
                <DashboardLayout>
                  <Departments />
                </DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/attendance" element={
              <PrivateRoute>
                <DashboardLayout>
                  <Attendance />
                </DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;