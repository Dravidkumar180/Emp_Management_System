import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  const isAuthenticated = user || localStorage.getItem('user');

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const userRole = user?.role || JSON.parse(localStorage.getItem('user') || '{}')?.role;
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default PrivateRoute;