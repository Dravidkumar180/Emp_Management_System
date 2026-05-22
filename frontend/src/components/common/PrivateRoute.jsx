import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  const isAuthenticated = user || localStorage.getItem('user');
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;