// Sets up the app routes.
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
 
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employees';
import Departments from '../pages/Departments';
import Attendance from '../pages/Attendance';
import Companies from '../pages/Companies';
import HolidayCalendar from '../pages/HolidayCalendar';
import UserSessionMonitor from '../pages/UserSessionMonitor';
import Settings from '../pages/Settings';
import Users from '../pages/Users';
import RoleRequests from '../pages/RoleRequests';
 
import PrivateRoute from '../components/common/PrivateRoute';
import Layout from '../layout/Layout';
 
// Shows the app routes component.
const AppRoutes = () => {
  return (
    <Routes>
 
      {/* Shows login page. */}
      <Route path="/login" element={<Login />} />
 
      {/* Protects logged-in pages. */}
      <Route
        element={
          <PrivateRoute>
            {/* Shows common page layout. */}
            <Layout />
          </PrivateRoute>
        }
      >
        {/* Opens dashboard by default. */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        {/* Shows dashboard page. */}
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Shows employee page. */}
        <Route path="/employees" element={<Employees />} />
        {/* Allows admins to view departments. */}
        <Route path="/departments" element={<PrivateRoute allowedRoles={['super_admin', 'admin']}><Departments /></PrivateRoute>} />
        {/* Allows attendance access by role. */}
        <Route path="/attendance" element={<PrivateRoute allowedRoles={['super_admin', 'admin', 'user']}><Attendance /></PrivateRoute>} />
        {/* Allows admins to view companies. */}
        <Route path="/companies" element={<PrivateRoute allowedRoles={['super_admin', 'admin']}><Companies /></PrivateRoute>} />
        {/* Allows admins to manage users. */}
        <Route path="/users" element={<PrivateRoute allowedRoles={['super_admin', 'admin']}><Users /></PrivateRoute>} />
        {/* Allows admins to manage holidays. */}
        <Route path="/holiday-calendar" element={<PrivateRoute allowedRoles={['admin']}><HolidayCalendar /></PrivateRoute>} />
        {/* Allows admins to monitor user sessions. */}
        <Route path="/user-session-monitor" element={<PrivateRoute allowedRoles={['admin']}><UserSessionMonitor /></PrivateRoute>} />
        {/* Allows users to open settings. */}
        <Route path="/settings" element={<PrivateRoute allowedRoles={['user']}><Settings /></PrivateRoute>} />
        {/* Allows admins to review roles. */}
        <Route path="/role-requests" element={<PrivateRoute allowedRoles={['admin']}><RoleRequests /></PrivateRoute>} />
      </Route>
 
    </Routes>
  );
};
 
// Sends AppRoutes to other files.
export default AppRoutes;
 
