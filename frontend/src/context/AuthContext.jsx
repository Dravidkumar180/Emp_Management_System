import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../services/auth';

const AuthContext = createContext();

const COMPANY_STORAGE_KEY = 'userCompanies';

const normalizeEmail = (email) => email.trim().toLowerCase();

const getStoredUserCompany = (email) => {
  const userCompanies = JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || '{}');
  return userCompanies[normalizeEmail(email)] || 'company-a';
};

const saveUserCompany = (email, companyId) => {
  const userCompanies = JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || '{}');
  userCompanies[normalizeEmail(email)] = companyId;
  localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(userCompanies));
};

const withCompany = (userData, fallbackEmail) => {
  const email = userData?.email || fallbackEmail;
  return {
    ...userData,
    companyId: getStoredUserCompany(email),
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = await getCurrentUser(token);
        if (userData) {
          const userWithCompany = withCompany(userData, userData.email);
          setUser(userWithCompany);
          localStorage.setItem('user', JSON.stringify(userWithCompany));
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
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
        const userWithCompany = withCompany(response.user, email);
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify(userWithCompany));
        setUser(userWithCompany);
        return { success: true, user: userWithCompany };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (name, email, password, role = 'user', companyId = 'company-a') => {
    try {
      const response = await registerUser(name, email, password, role);
      if (response && response.user) {
        saveUserCompany(email, companyId);
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
    setUser(null);
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
