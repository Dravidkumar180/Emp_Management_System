// Reusable private route component.
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Shows the private route component.
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  // Gets current logged-in user.
  const { user } = useAuth();
  // Checks if user is logged in.
  const isAuthenticated = user || localStorage.getItem('user');

  // Sends guest users to login.
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Gets user role for checking.
  const userRole = user?.role || JSON.parse(localStorage.getItem('user') || '{}')?.role;
  // Blocks users without allowed role.
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" />;
  }

  // Shows page when access allowed.
  return children;
};

// Sends PrivateRoute to other files.
export default PrivateRoute;
