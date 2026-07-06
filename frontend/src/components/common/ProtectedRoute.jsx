// Reusable protected route component.
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Shows the protected route component.
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Gets user and loading status.
  const { user, loading } = useAuth();

  // Shows loader while checking user.
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Sends guests to login page.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Blocks deactivated user accounts.
  if (user.is_active === false) {
    return <Navigate to="/account-deactivated" replace />;
  }

  // Blocks suspended user accounts.
  if (user.is_suspended === true) {
    return <Navigate to="/account-suspended" replace />;
  }

  // Blocks users without allowed role.
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Shows page when access allowed.
  return children;
};

// Sends ProtectedRoute to other files.
export default ProtectedRoute;
