import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../services/auth';

const AuthContext = createContext();

const COMPANY_STORAGE_KEY = 'userCompanies';

const normalizeEmail = (email) => email.trim().toLowerCase();

const normalizeCompanyId = (companyId) => {
  if (companyId === 1 || companyId === '1') return 'company-a';
  if (companyId === 2 || companyId === '2') return 'company-b';
  return companyId || 'company-a';
};

const getStoredUserCompany = (email) => {
  const userCompanies = JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || '{}');
  return userCompanies[normalizeEmail(email)] || 'company-a';
};

const getSavedUserCompany = (email) => {
  const userCompanies = JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || '{}');
  return userCompanies[normalizeEmail(email)];
};

const saveUserCompany = (email, companyId) => {
  const userCompanies = JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || '{}');
  userCompanies[normalizeEmail(email)] = companyId;
  localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(userCompanies));
};

const withCompany = (userData, fallbackEmail) => {
  const email = userData?.email || fallbackEmail;
  const companyId = normalizeCompanyId(userData?.companyId || userData?.company_id || getStoredUserCompany(email));

  if (email && companyId) {
    saveUserCompany(email, companyId);
  }

  return {
    ...userData,
    companyId,
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

  const login = async (email, password, companyId) => {
    try {
      const response = await loginUser(email, password, companyId || getSavedUserCompany(email));
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

  const register = async (name, email, password, role = 'user', companyId = 'company-a', inviteToken = null) => {
    try {
      const response = await registerUser(name, email, password, role, companyId, inviteToken);
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

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const userData = await getCurrentUser(token);
    if (!userData) return null;
    const userWithCompany = withCompany(userData, userData.email);
    localStorage.setItem('user', JSON.stringify(userWithCompany));
    setUser(userWithCompany);
    return userWithCompany;
  }, []);

  const hasRole = (role) => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
