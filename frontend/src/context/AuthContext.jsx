// Shares auth context data across the app.
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../services/auth';
import { recordLoginActivity, recordLogoutActivity, recordSignupActivity } from '../services/activityTracking';
import { logAuditAction } from '../services/audit';
import { clearCurrentSession, fetchMyLoginDevices, logoutDevice, saveCurrentSession, updateSessionActivity } from '../services/loginDevices';
import { createNotificationForUser, useNotifications } from './NotificationContext';

const AuthContext = createContext();

const COMPANY_STORAGE_KEY = 'userCompanies';

// Helps with normalize email.
const normalizeEmail = (email) => email.trim().toLowerCase();

// Helps with normalize company id.
const normalizeCompanyId = (companyId) => {
  if (companyId === 1 || companyId === '1') return 'company-a';
  if (companyId === 2 || companyId === '2') return 'company-b';
  return companyId || 'company-a';
};

// Gets stored user company data.
const getStoredUserCompany = (email) => {
  const userCompanies = JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || '{}');
  return userCompanies[normalizeEmail(email)] || 'company-a';
};

// Gets saved user company data.
const getSavedUserCompany = (email) => {
  const userCompanies = JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || '{}');
  return userCompanies[normalizeEmail(email)];
};

// Saves user company data.
const saveUserCompany = (email, companyId) => {
  const userCompanies = JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || '{}');
  userCompanies[normalizeEmail(email)] = companyId;
  localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(userCompanies));
};

// Prepares with company.
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

// Shows the auth provider component.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { refreshNotificationScope } = useNotifications();

  // Runs when this screen needs to update data.
  useEffect(() => {
    // Checks saved login on start.
    const checkAuth = async () => {
      // Gets saved login token.
      const token = localStorage.getItem('token');
      // Runs only when token exists.
      if (token) {
        // Gets current user from server.
        const userData = await getCurrentUser(token);
        // Saves user when token works.
        if (userData) {
          const userWithCompany = withCompany(userData, userData.email);
          setUser(userWithCompany);
          localStorage.setItem('user', JSON.stringify(userWithCompany));
        } else {
          // Clears bad saved login data.
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      // Stops showing loading screen.
      setLoading(false);
    };
    // Starts checking saved login.
    checkAuth();
  }, []);

  // Keeps current login device session active and catches revoked sessions.
  useEffect(() => {
    if (!user) return undefined;
    const validateSession = async () => {
      try {
        await updateSessionActivity();
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          clearCurrentSession();
          setUser(null);
        }
      }
    };
    validateSession();
    const intervalId = window.setInterval(validateSession, 60000);
    return () => window.clearInterval(intervalId);
  }, [user]);

  // Handles user login request.
  const login = async (email, password, companyId) => {
    try {
      // Sends login details to server.
      const response = await loginUser(email, password, companyId || getSavedUserCompany(email));
      // Checks login response token.
      if (response && response.access_token) {
        // Adds company to user data.
        const userWithCompany = withCompany(response.user, email);
        // Saves token in browser.
        localStorage.setItem('token', response.access_token);
        // Saves current login device session.
        saveCurrentSession(response.session);
        // Saves user in browser.
        localStorage.setItem('user', JSON.stringify(userWithCompany));
        // Updates current logged-in user.
        setUser(userWithCompany);
        // Records login activity details.
        const activity = await recordLoginActivity(userWithCompany);
        // Saves login in audit log.
        await logAuditAction({
          action: 'User Login',
          entityType: 'account',
          entityId: userWithCompany.id,
          entityName: userWithCompany.name || userWithCompany.email,
          details: `${userWithCompany.name || userWithCompany.email} logged in`,
          newValue: activity,
        });
        // Creates login notification for user.
        createNotificationForUser(userWithCompany, {
          type: 'success',
          title: 'Login Recorded',
          message: `${userWithCompany.name || userWithCompany.email} logged in`,
          category: 'account-activity',
        });
        // Updates notifications for new user.
        refreshNotificationScope();
        // Returns successful login result.
        return { success: true, user: userWithCompany };
      }
      // Returns invalid login message.
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      // Returns server login error.
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  // Handles new user registration.
  const register = async (name, email, password, role = 'user', companyId = 'company-a', inviteToken = null) => {
    try {
      // Sends signup details to server.
      const response = await registerUser(name, email, password, role, companyId, inviteToken);
      // Checks signup response user data.
      if (response && response.user) {
        // Saves company for this user.
        saveUserCompany(email, companyId);
        // Logs in after successful signup.
        const loginResult = await login(email, password, companyId);
        // Records signup when login works.
        if (loginResult.success) {
          const signupActivity = await recordSignupActivity(loginResult.user);
          // Saves signup in audit log.
          await logAuditAction({
            action: 'User Signup',
            entityType: 'account',
            entityId: loginResult.user.id,
            entityName: loginResult.user.name || loginResult.user.email,
            details: `${loginResult.user.name || loginResult.user.email} signed up as ${loginResult.user.role || role}`,
            newValue: signupActivity,
          });
          // Creates signup notification for user.
          createNotificationForUser(loginResult.user, {
            type: 'success',
            title: 'Signup Recorded',
            message: `${loginResult.user.name || loginResult.user.email} signed up`,
            category: 'account-activity',
          });
          // Updates notifications after signup.
          refreshNotificationScope();
        }
        // Returns signup login result.
        return loginResult;
      }
      // Returns registration failed message.
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      // Returns server signup error.
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  // Handles user logout request.
  const logout = async () => {
    // Gets current or saved user.
    const savedUser = user || JSON.parse(localStorage.getItem('user') || 'null');
    // Records logout activity details.
    const activity = recordLogoutActivity(savedUser);
    // Saves logout in audit log.
    logAuditAction({
      action: 'User Logout',
      entityType: 'account',
      entityId: savedUser?.id,
      entityName: savedUser?.name || savedUser?.email,
      details: `${savedUser?.name || savedUser?.email || 'User'} logged out`,
      newValue: activity,
    });
    // Creates logout notification for user.
    createNotificationForUser(savedUser, {
      type: 'info',
      title: 'Logout Recorded',
      message: `${savedUser?.name || savedUser?.email || 'User'} logged out`,
      category: 'account-activity',
    });
    try {
      const currentSessionIdentifier = localStorage.getItem('currentSessionId');
      if (currentSessionIdentifier) {
        // Finds current session record before clearing auth.
        const sessions = await fetchMyLoginDevices();
        const currentSession = sessions.find((session) => session.session_identifier === currentSessionIdentifier);
        if (currentSession) await logoutDevice(currentSession.id);
      }
    } catch (error) {
      console.error('Unable to mark device session as logged out:', error);
    }
    // Removes saved login token.
    localStorage.removeItem('token');
    // Removes current session id.
    clearCurrentSession();
    // Removes saved user data.
    localStorage.removeItem('user');
    // Clears current logged-in user.
    setUser(null);
  };

  // Refreshes current user data.
  const refreshUser = useCallback(async () => {
    // Gets saved login token.
    const token = localStorage.getItem('token');
    // Stops if token is missing.
    if (!token) return null;
    // Gets latest user from server.
    const userData = await getCurrentUser(token);
    // Stops if user is missing.
    if (!userData) return null;
    // Adds company to user data.
    const userWithCompany = withCompany(userData, userData.email);
    // Saves updated user in browser.
    localStorage.setItem('user', JSON.stringify(userWithCompany));
    // Updates current logged-in user.
    setUser(userWithCompany);
    // Returns latest user data.
    return userWithCompany;
  }, []);

  // Checks has role.
  const hasRole = (role) => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Provides auth.
export const useAuth = () => useContext(AuthContext);
