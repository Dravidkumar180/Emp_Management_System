import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const NotificationContext = createContext(null);

const getNotificationStorageKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.email) {
      return `notifications:${user.email}:${user.role || 'user'}:${user.companyId || user.company_id || 'company-a'}`;
    }
  } catch {
    // Fall back to the anonymous key.
  }
  return 'notifications';
};

const loadNotifications = (storageKey) => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const NotificationProvider = ({ children }) => {
  const [storageKey, setStorageKey] = useState(getNotificationStorageKey);
  const [notifications, setNotifications] = useState(() => loadNotifications(getNotificationStorageKey()));

  const refreshNotificationScope = useCallback(() => {
    const nextKey = getNotificationStorageKey();
    setStorageKey(nextKey);
    setNotifications(loadNotifications(nextKey));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch (e) {
      // ignore
    }
  }, [notifications, storageKey]);

  const addNotification = useCallback(({ type = 'info', title = '', message = '', ...rest }) => {
    const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const time = new Date().toISOString();
    const notif = { id, type, title, message, time, ...rest };
    setNotifications((prev) => [notif, ...prev]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearNotifications, refreshNotificationScope }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export default NotificationContext;
