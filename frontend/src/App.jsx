// Main frontend app setup.
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import DepartmentTransfer from './pages/DepartmentTransfer';
import Attendance from './pages/Attendance';
import Companies from './pages/Companies';
import AuditLogs from './pages/AuditLogs';
import Export from './pages/Export';
import Tracking from './pages/Tracking';
import Users from './pages/Users';
import HolidayCalendar from './pages/HolidayCalendar';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import AccountDeactivated from './pages/AccountDeactivated';
import AccountSuspended from './pages/AccountSuspended';
import { Toaster } from 'react-hot-toast';
import './styles/global.css';
import './styles/App.css';

// Shows the home redirect component.
const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) return <Navigate to="/login" replace />;
  return user.is_active === false
    ? <Navigate to="/account-deactivated" replace />
    : user.is_suspended === true
    ? <Navigate to="/account-suspended" replace />
    : <Navigate to="/dashboard" replace />;
};

// Runs app.
function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
        <Router>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/account-deactivated" element={<AccountDeactivated />} />
            <Route path="/account-suspended" element={<AccountSuspended />} />
            <Route path="/" element={<HomeRedirect />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/employees" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Employees />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/departments" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <Departments />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/department-transfer" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <DepartmentTransfer />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/attendance" element={
              <ProtectedRoute allowedRoles={['admin', 'user']}>
                <DashboardLayout>
                  <Attendance />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/companies" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <DashboardLayout>
                  <Companies />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/audit-logs" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <AuditLogs />
              </ProtectedRoute>
            } />

            <Route path="/export" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <Export />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/tracking" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <DashboardLayout>
                  <Tracking />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <DashboardLayout>
                  <Users />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/holiday-calendar" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <HolidayCalendar />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['admin', 'user']}>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </Router>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;