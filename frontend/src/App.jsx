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
import LoginDevices from './pages/LoginDevices';
import UserSessionMonitor from './pages/UserSessionMonitor';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import AccountDeactivated from './pages/AccountDeactivated';
import AccountSuspended from './pages/AccountSuspended';
import { Toaster } from 'react-hot-toast';
import './styles/global.css';
import './styles/App.css';

// Shows the home redirect component.
const HomeRedirect = () => {
  // Gets current user.
  const { user, loading } = useAuth();

  // Waits for auth check.
  if (loading) {
    return null;
  }

  // Sends guests to login.
  if (!user) return <Navigate to="/login" replace />;
  // Sends user by status.
  return user.is_active === false
    ? <Navigate to="/account-deactivated" replace />
    : user.is_suspended === true
    ? <Navigate to="/account-suspended" replace />
    : <Navigate to="/dashboard" replace />;
};

// Runs app.
function App() {
  return (
    // Adds theme support.
    <ThemeProvider>
      {/* Adds notifications. */}
      <NotificationProvider>
        {/* Adds auth data. */}
        <AuthProvider>
        <Router>
          {/* Shows toast messages. */}
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            {/* Login page */}
            <Route path="/login" element={<Login />} />
            {/* Blocked account pages */}
            <Route path="/account-deactivated" element={<AccountDeactivated />} />
            <Route path="/account-suspended" element={<AccountSuspended />} />
            {/* Home redirect */}
            <Route path="/" element={<HomeRedirect />} />
            
            {/* Dashboard page */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Employees page */}
            <Route path="/employees" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Employees />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Departments page */}
            <Route path="/departments" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <Departments />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Transfer page */}
            <Route path="/department-transfer" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <DepartmentTransfer />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Attendance page */}
            <Route path="/attendance" element={
              <ProtectedRoute allowedRoles={['admin', 'user']}>
                <DashboardLayout>
                  <Attendance />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Companies page */}
            <Route path="/companies" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <DashboardLayout>
                  <Companies />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Audit logs */}
            <Route path="/audit-logs" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <AuditLogs />
              </ProtectedRoute>
            } />

            {/* Export page */}
            <Route path="/export" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <Export />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Tracking page */}
            <Route path="/tracking" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <DashboardLayout>
                  <Tracking />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Users page */}
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <DashboardLayout>
                  <Users />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Holiday page */}
            <Route path="/holiday-calendar" element={
              <ProtectedRoute allowedRoles={['admin', 'user']}>
                <DashboardLayout>
                  <HolidayCalendar />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Login devices page */}
            <Route path="/login-devices" element={
              <ProtectedRoute allowedRoles={['admin', 'user']}>
                <DashboardLayout>
                  <LoginDevices />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* User session monitoring page */}
            <Route path="/user-session-monitor" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <UserSessionMonitor />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Settings page */}
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['admin', 'user']}>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Forgot password */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </Router>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
