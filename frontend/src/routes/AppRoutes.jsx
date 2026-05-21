import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employees';
import Departments from '../pages/Departments';
import Attendance from '../pages/Attendance';
import Settings from '../pages/Settings';
import PrivateRoute from '../components/common/PrivateRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/employees" element={<PrivateRoute><Employees /></PrivateRoute>} />
      <Route path="/departments" element={<PrivateRoute><Departments /></PrivateRoute>} />
      <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
    </Routes>
  );
};

export default AppRoutes;