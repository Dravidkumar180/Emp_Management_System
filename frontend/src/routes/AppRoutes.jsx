import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
 
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employees';
import Departments from '../pages/Departments';
import Attendance from '../pages/Attendance';
import Settings from '../pages/Settings';
 
import PrivateRoute from '../components/common/PrivateRoute';
import Layout from '../layout/Layout';
 
const AppRoutes = () => {
  return (
    <Routes>
 
      {/* Login */}
      <Route path="/login" element={<Login />} />
 
      {/* Protected Routes */}
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
 
    </Routes>
  );
};
 
export default AppRoutes;
 