import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedCompany = localStorage.getItem('selectedCompany');
      if (storedCompany) {
        setSelectedCompany(storedCompany);
      }
      if (token) {
        const userData = await getCurrentUser(token);
        if (userData) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          if (!storedCompany && userData.company) {
            setSelectedCompany(userData.company);
            localStorage.setItem('selectedCompany', userData.company);
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('selectedCompany');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await loginUser(email, password);
      if (response && response.access_token) {
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        if (response.user.company) {
          setSelectedCompany(response.user.company);
          localStorage.setItem('selectedCompany', response.user.company);
        }
        return { success: true, user: response.user };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const updateUserProfile = (profileUpdates) => {
    const updatedUser = { ...user, ...profileUpdates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const register = async (name, email, password, role = 'user', company = 'Company A') => {
    try {
      const response = await registerUser(name, email, password, role, company);
      if (response && response.user) {
        // Auto login after registration
        return await login(email, password);
      }
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedCompany');
    setUser(null);
    setSelectedCompany(null);
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider value={{ user, loading, selectedCompany, setSelectedCompany, login, register, logout, hasRole, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);