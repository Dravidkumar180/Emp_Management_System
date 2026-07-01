// Shares notification context data across the app.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const NotificationContext = createContext(null);

// Gets notification storage key data.
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

// Gets notifications data.
const loadNotifications = (storageKey) => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// Gets user notification storage key data.
const getUserNotificationStorageKey = (user) => {
  if (!user?.email) return 'notifications';
  return `notifications:${user.email}:${user.role || 'user'}:${user.companyId || user.company_id || 'company-a'}`;
};

// Coordinates create notification for user behavior.
export const createNotificationForUser = (user, { type = 'info', title = '', message = '', ...rest }) => {
  const storageKey = getUserNotificationStorageKey(user);
  const notifications = loadNotifications(storageKey);
  const notification = {
    id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    type,
    title,
    message,
    time: new Date().toISOString(),
    ...rest,
  };

  localStorage.setItem(storageKey, JSON.stringify([notification, ...notifications]));
  return notification;
};

// Shows the notification provider component.
export const NotificationProvider = ({ children }) => {
  const [storageKey, setStorageKey] = useState(getNotificationStorageKey);
  const [notifications, setNotifications] = useState(() => loadNotifications(getNotificationStorageKey()));

  // Prepares refresh notification scope.
  const refreshNotificationScope = useCallback(() => {
    const nextKey = getNotificationStorageKey();
    setStorageKey(nextKey);
    setNotifications(loadNotifications(nextKey));
  }, []);

  // Runs when this screen needs to update data.
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch (e) {
      // ignore
    }
  }, [notifications, storageKey]);

  // Saves notification data.
  const addNotification = useCallback(({ type = 'info', title = '', message = '', ...rest }) => {
    const notif = {
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      type,
      title,
      message,
      time: new Date().toISOString(),
      ...rest,
    };
    setNotifications((prev) => [notif, ...prev]);
  }, []);

  // Removes notification data.
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  }, []);

  // Prepares clear notifications.
  const clearNotifications = useCallback(() => setNotifications([]), []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearNotifications, refreshNotificationScope }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Provides notifications.
export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export default NotificationContext;