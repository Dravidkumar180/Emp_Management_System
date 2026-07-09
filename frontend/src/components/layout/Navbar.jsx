// Builds the navbar layout.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  fetchMyRoleRequests,
  fetchMyReinstatementRequests,
  fetchPendingRoleRequests,
  fetchPendingReactivationRequests,
  fetchReinstatementRequests,
} from '../../services/auth';
import { fetchCertificationExpiryNotifications } from '../../services/skillsCertifications';
import { logAuditAction } from '../../services/audit';
import { useEffect, useRef, useState } from 'react';
import './Navbar.css';

const ACCESS_REQUESTS_KEY = 'attendanceAccessRequests';

// Reads data from storage.
const readStorage = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

// Writes storage.
const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Helps with format date time.
const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

// Shows the navbar component.
const Navbar = ({ onSidebarToggle }) => {
  const navigate = useNavigate();
  const { notifications, removeNotification, clearNotifications, addNotification, refreshNotificationScope } = useNotifications();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingAttendanceRequests, setPendingAttendanceRequests] = useState([]);
  const pendingRequestIdsRef = useRef(new Set());
  const initialPendingLoad = useRef(true);
  const lastNotificationUserRef = useRef('');
  const wrapRef = useRef(null);

  // Runs when this screen needs to update data.
  useEffect(() => {
    // Handles click outside actions.
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Get user name for welcome message
  const getUserName = () => {
    if (user?.name) {
      return user.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        return parsed.name || parsed.email?.split('@')[0] || 'Admin';
      } catch {
        return 'Admin';
      }
    }
    return 'Admin';
  };

  // Get user initial for avatar
  const getUserInitial = () => {
    const name = getUserName();
    return name.charAt(0).toUpperCase();
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const userEmail = user?.email || '';
  const userCompanyId = user?.companyId || user?.company_id || 'company-a';
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Runs when this screen needs to update data.
  useEffect(() => {
    const notificationUserKey = userEmail ? `${userEmail}:${user?.role || 'user'}:${userCompanyId}` : '';
    if (lastNotificationUserRef.current !== notificationUserKey) {
      refreshNotificationScope();
      setPendingCount(0);
      setPendingAttendanceRequests([]);
      pendingRequestIdsRef.current = new Set();
      initialPendingLoad.current = true;
      lastNotificationUserRef.current = notificationUserKey;
    }
  }, [refreshNotificationScope, user?.role, userCompanyId, userEmail]);

  // Runs when this screen needs to update data.
  useEffect(() => {
    if (!isAdmin) {
      setPendingCount(0);
      return;
    }

    let active = true;

    // Gets pending notifications data.
    const loadPendingNotifications = async () => {
      try {
        const roleRequests = await fetchPendingRoleRequests();
        const reactivationRequests = await fetchPendingReactivationRequests();
        const reinstatementRequests = await fetchReinstatementRequests();
        if (!active) return;

        const requests = [
          ...roleRequests.map((request) => ({ ...request, notificationType: 'role' })),
          ...reactivationRequests.map((request) => ({ ...request, notificationType: 'reactivation' })),
          ...reinstatementRequests
            .filter((request) => request.status === 'pending')
            .map((request) => ({ ...request, notificationType: 'reinstatement' })),
        ];

        setPendingCount(requests.length);
        // Prepares current ids.
        const currentIds = new Set(requests.map((request) => `${request.notificationType}:${request.id}`));

        if (initialPendingLoad.current) {
          initialPendingLoad.current = false;
          if (requests.length > 0) {
            addNotification({
              type: 'info',
              title: 'Pending Requests',
              message: `You have ${requests.length} pending request${requests.length > 1 ? 's' : ''}.`,
            });
          }
        } else {
          // Prepares new requests.
          const newRequests = requests.filter((request) => !pendingRequestIdsRef.current.has(`${request.notificationType}:${request.id}`));
          if (newRequests.length > 0) {
            // Prepares reactivation count.
            const reactivationCount = newRequests.filter((request) => request.notificationType === 'reactivation').length;
            // Prepares reinstatement count.
            const reinstatementCount = newRequests.filter((request) => request.notificationType === 'reinstatement').length;
            addNotification({
              type: 'info',
              title: reinstatementCount > 0 ? 'New Reinstatement Request' : reactivationCount > 0 ? 'New Reactivation Request' : 'New Role Request',
              message: reinstatementCount > 0
                ? `${reinstatementCount} reinstatement request${reinstatementCount > 1 ? 's' : ''} need review.`
                : reactivationCount > 0
                ? `${reactivationCount} reactivation request${reactivationCount > 1 ? 's' : ''} need review.`
                : `${newRequests.length} new role request${newRequests.length > 1 ? 's' : ''} need review.`,
            });
          }
        }

        pendingRequestIdsRef.current = currentIds;
      } catch (error) {
        console.error('Failed to load pending requests for notifications', error);
      }
    };

    loadPendingNotifications();
    const interval = setInterval(loadPendingNotifications, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isAdmin, addNotification]);

  // Runs when this screen needs to update data.
  useEffect(() => {
    if (!isAdmin) {
      setPendingAttendanceRequests([]);
      return;
    }

    let active = true;

    // Sends attendance access requests notifications.
    const notifyAttendanceAccessRequests = () => {
      try {
        const requests = readStorage(ACCESS_REQUESTS_KEY);
        if (!active) return;

        setPendingAttendanceRequests(
          requests.filter((request) => request.companyId === userCompanyId && request.status === 'pending')
        );
      } catch (error) {
        console.error('Failed to load attendance access notifications', error);
      }
    };

    notifyAttendanceAccessRequests();
    const interval = setInterval(notifyAttendanceAccessRequests, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isAdmin, userCompanyId]);

  // Handles attendance access review actions.
  const handleAttendanceAccessReview = async (requestId, nextStatus) => {
    const requests = readStorage(ACCESS_REQUESTS_KEY);
    // Prepares old request.
    const oldRequest = requests.find((request) => request.id === requestId);
    if (!oldRequest) return;

    const reviewedRequest = {
      ...oldRequest,
      status: nextStatus,
      reviewedAt: new Date().toISOString(),
      reviewedBy: user?.name || user?.email || 'Admin',
    };
    // Prepares next requests.
    const nextRequests = requests.map((request) => (
      request.id === requestId ? reviewedRequest : request
    ));
    writeStorage(ACCESS_REQUESTS_KEY, nextRequests);
    setPendingAttendanceRequests(
      nextRequests.filter((request) => request.companyId === userCompanyId && request.status === 'pending')
    );

    const approved = nextStatus === 'approved';
    addNotification({
      type: approved ? 'success' : 'info',
      title: approved ? 'Attendance Access Approved' : 'Attendance Access Rejected',
      message: `${reviewedRequest.name || reviewedRequest.email} was ${nextStatus}.`,
    });
    await logAuditAction({
      action: approved ? 'Attendance Access Approved' : 'Attendance Access Rejected',
      entityType: 'attendance',
      entityId: reviewedRequest.id,
      entityName: reviewedRequest.name || reviewedRequest.email,
      details: `Attendance access ${nextStatus} for ${reviewedRequest.email}`,
      oldValue: oldRequest,
      newValue: reviewedRequest,
    });
  };

  // Runs when this screen needs to update data.
  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let active = true;
    const seenStorageKey = `leaveRequestAdminNotifications:${userCompanyId}:${userEmail || 'admin'}`;

    // Gets seen notifications data.
    const getSeenNotifications = () => {
      try {
        return new Set(JSON.parse(localStorage.getItem(seenStorageKey) || '[]'));
      } catch {
        return new Set();
      }
    };

    // Saves seen notifications data.
    const saveSeenNotifications = (seen) => {
      localStorage.setItem(seenStorageKey, JSON.stringify([...seen]));
    };

    // Sends leave requests notifications.
    const notifyLeaveRequests = () => {
      try {
        const requests = JSON.parse(localStorage.getItem('userLeaveRequests') || '[]');
        if (!active) return;

        const seen = getSeenNotifications();
        let changed = false;

        requests
          .filter((request) => request.companyId === userCompanyId && request.status === 'pending')
          .forEach((request) => {
            const seenKey = `${request.id}:pending`;
            if (seen.has(seenKey)) return;

            addNotification({
              type: 'info',
              title: 'Leave Request Pending',
              message: `${request.name || request.email} requested ${request.type} leave.`,
            });
            seen.add(seenKey);
            changed = true;
          });

        if (changed) {
          saveSeenNotifications(seen);
        }
      } catch (error) {
        console.error('Failed to load leave request notifications', error);
      }
    };

    notifyLeaveRequests();
    const interval = setInterval(notifyLeaveRequests, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [addNotification, isAdmin, userCompanyId, userEmail]);

  // Runs when this screen needs to update data.
  useEffect(() => {
    if (!userEmail || isAdmin) {
      return;
    }

    let active = true;
    const seenStorageKey = `reinstatementUserNotifications:${userEmail}:${userCompanyId}`;

    // Gets seen notifications data.
    const getSeenNotifications = () => {
      try {
        return new Set(JSON.parse(localStorage.getItem(seenStorageKey) || '[]'));
      } catch {
        return new Set();
      }
    };

    // Saves seen notifications data.
    const saveSeenNotifications = (seen) => {
      localStorage.setItem(seenStorageKey, JSON.stringify([...seen]));
    };

    // Sends reinstatement status notifications.
    const notifyReinstatementStatus = async () => {
      try {
        const requests = await fetchMyReinstatementRequests();
        if (!active) return;

        const seen = getSeenNotifications();
        let changed = false;

        requests
          .filter((request) => request.status === 'approved' || request.status === 'rejected')
          .forEach((request) => {
            const seenKey = `${request.id}:${request.status}:${request.reviewed_at || ''}`;
            if (seen.has(seenKey)) return;

            const approved = request.status === 'approved';
            addNotification({
              type: approved ? 'success' : 'info',
              title: approved ? 'Reinstatement Approved' : 'Reinstatement Rejected',
              message: approved
                ? 'Your reinstatement request was approved.'
                : 'Your reinstatement request was rejected.',
            });
            seen.add(seenKey);
            changed = true;
          });

        if (changed) {
          saveSeenNotifications(seen);
        }
      } catch (error) {
        console.error('Failed to load reinstatement status notification', error);
      }
    };

    notifyReinstatementStatus();
    const interval = setInterval(notifyReinstatementStatus, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [addNotification, isAdmin, userCompanyId, userEmail]);

  // Sends certification expiry notifications.
  useEffect(() => {
    if (!userEmail || isAdmin) {
      return;
    }

    let active = true;
    const seenStorageKey = `certificationExpiryNotifications:${userEmail}:${userCompanyId}`;

    const getSeenNotifications = () => {
      try {
        return new Set(JSON.parse(localStorage.getItem(seenStorageKey) || '[]'));
      } catch {
        return new Set();
      }
    };

    const saveSeenNotifications = (seen) => {
      localStorage.setItem(seenStorageKey, JSON.stringify([...seen]));
    };

    const notifyCertificationExpiry = async () => {
      try {
        const expiryNotifications = await fetchCertificationExpiryNotifications();
        if (!active) return;

        const seen = getSeenNotifications();
        let changed = false;
        expiryNotifications.forEach((notification) => {
          const seenKey = `${notification.certification_id}:${notification.status}`;
          if (seen.has(seenKey)) return;
          addNotification({
            type: notification.status === 'expired' ? 'error' : 'warning',
            title: notification.title,
            message: notification.message,
          });
          seen.add(seenKey);
          changed = true;
        });
        if (changed) saveSeenNotifications(seen);
      } catch (error) {
        console.error('Failed to load certification expiry notifications', error);
      }
    };

    notifyCertificationExpiry();
    const interval = setInterval(notifyCertificationExpiry, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [addNotification, isAdmin, userCompanyId, userEmail]);

  // Runs when this screen needs to update data.
  useEffect(() => {
    if (!userEmail || isAdmin) {
      return;
    }

    let active = true;
    const seenStorageKey = `roleRequestNotifications:${userEmail}:${userCompanyId}`;

    // Gets seen notifications data.
    const getSeenNotifications = () => {
      try {
        return new Set(JSON.parse(localStorage.getItem(seenStorageKey) || '[]'));
      } catch {
        return new Set();
      }
    };

    // Saves seen notifications data.
    const saveSeenNotifications = (seen) => {
      localStorage.setItem(seenStorageKey, JSON.stringify([...seen]));
    };

    // Sends reviewed requests notifications.
    const notifyReviewedRequests = async () => {
      try {
        const requests = await fetchMyRoleRequests();
        if (!active) return;

        const seen = getSeenNotifications();
        let changed = false;

        requests
          .filter((request) => request.status === 'approved' || request.status === 'rejected')
          .forEach((request) => {
            const seenKey = `${request.id}:${request.status}`;
            if (seen.has(seenKey)) return;

            const approved = request.status === 'approved';
            addNotification({
              type: approved ? 'success' : 'info',
              title: approved ? 'Role Request Approved' : 'Role Request Rejected',
              message: approved
                ? 'Your role request has been approved.'
                : 'Your role request has been rejected.',
            });
            seen.add(seenKey);
            changed = true;
          });

        if (changed) {
          saveSeenNotifications(seen);
        }
      } catch (error) {
        console.error('Failed to load role request status notifications', error);
      }
    };

    notifyReviewedRequests();
    const interval = setInterval(notifyReviewedRequests, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [addNotification, isAdmin, userCompanyId, userEmail]);

  // Runs when this screen needs to update data.
  useEffect(() => {
    if (!userEmail || isAdmin) {
      return;
    }

    let active = true;
    const seenStorageKey = `leaveRequestUserNotifications:${userEmail}:${userCompanyId}`;

    // Gets seen notifications data.
    const getSeenNotifications = () => {
      try {
        return new Set(JSON.parse(localStorage.getItem(seenStorageKey) || '[]'));
      } catch {
        return new Set();
      }
    };

    // Saves seen notifications data.
    const saveSeenNotifications = (seen) => {
      localStorage.setItem(seenStorageKey, JSON.stringify([...seen]));
    };

    // Sends leave status notifications.
    const notifyLeaveStatus = () => {
      try {
        const requests = JSON.parse(localStorage.getItem('userLeaveRequests') || '[]');
        if (!active) return;

        const seen = getSeenNotifications();
        let changed = false;

        requests
          .filter((request) => request.email === userEmail && request.companyId === userCompanyId)
          .filter((request) => request.status === 'approved' || request.status === 'rejected')
          .forEach((request) => {
            const seenKey = `${request.id}:${request.status}:${request.reviewedAt || ''}`;
            if (seen.has(seenKey)) return;

            const approved = request.status === 'approved';
            addNotification({
              type: approved ? 'success' : 'info',
              title: approved ? 'Leave Approved' : 'Leave Rejected',
              message: `Your ${request.type} leave request was ${request.status}.`,
            });
            seen.add(seenKey);
            changed = true;
          });

        if (changed) {
          saveSeenNotifications(seen);
        }
      } catch (error) {
        console.error('Failed to load leave status notification', error);
      }
    };

    notifyLeaveStatus();
    const interval = setInterval(notifyLeaveStatus, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [addNotification, isAdmin, userCompanyId, userEmail]);

  // Runs when this screen needs to update data.
  useEffect(() => {
    if (!userEmail || isAdmin) {
      return;
    }

    let active = true;
    const seenStorageKey = `attendanceAccessUserNotifications:${userEmail}:${userCompanyId}`;

    // Gets seen notifications data.
    const getSeenNotifications = () => {
      try {
        return new Set(JSON.parse(localStorage.getItem(seenStorageKey) || '[]'));
      } catch {
        return new Set();
      }
    };

    // Saves seen notifications data.
    const saveSeenNotifications = (seen) => {
      localStorage.setItem(seenStorageKey, JSON.stringify([...seen]));
    };

    // Sends attendance access status notifications.
    const notifyAttendanceAccessStatus = () => {
      try {
        const requests = JSON.parse(localStorage.getItem('attendanceAccessRequests') || '[]');
        if (!active) return;

        // Prepares request.
        const request = requests.find((item) => item.email === userEmail && item.companyId === userCompanyId);
        if (!request || (request.status !== 'approved' && request.status !== 'rejected')) return;

        const seen = getSeenNotifications();
        const seenKey = `${request.id}:${request.status}:${request.reviewedAt || ''}`;
        if (seen.has(seenKey)) return;

        const approved = request.status === 'approved';
        addNotification({
          type: approved ? 'success' : 'info',
          title: approved ? 'Attendance Access Approved' : 'Attendance Access Rejected',
          message: approved
            ? 'You can now check in and check out from Attendance.'
            : 'Your attendance access request was rejected.',
        });
        seen.add(seenKey);
        saveSeenNotifications(seen);
      } catch (error) {
        console.error('Failed to load attendance access status notification', error);
      }
    };

    notifyAttendanceAccessStatus();
    const interval = setInterval(notifyAttendanceAccessStatus, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [addNotification, isAdmin, userCompanyId, userEmail]);

  const totalNotificationCount = notifications.length + pendingAttendanceRequests.length;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="navbar-toggle-btn" onClick={onSidebarToggle} aria-label="Toggle sidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="greeting">
          <h1>Welcome back, {getUserName()}!</h1>
          <p className="date">{currentDate}</p>
        </div>
      </div>
      
      <div className="navbar-center">
        {/* Team Button - Redirects to Employees Page */}
        <button className="nav-icon-btn" onClick={() => navigate('/employees')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M23 21V19C22.8 16.8 21 15 19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 3.13C17.5 3.54 18.6 4.93 18.6 6.55C18.6 8.17 17.5 9.56 16 9.97" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Team</span>
        </button>

        {isAdmin && (
          <>
            {/* Attendance Button - Redirects to Attendance Page */}
            <button className="nav-icon-btn" onClick={() => navigate('/attendance')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 14L12 17M9 14L12 17M12 17V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Attendance</span>
            </button>

            {/* Departments Button - Redirects to Departments Page */}
            <button className="nav-icon-btn" onClick={() => navigate('/departments')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 21V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V21" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>Departments</span>
            </button>
          </>
        )}
      </div>
      
      <div className="navbar-right">
              {/* Notification Bell Icon */}
              <div className="notification-wrap" ref={wrapRef}>
                <button className="notification-btn" onClick={() => setDropdownOpen((s) => !s)} aria-haspopup="true" aria-expanded={dropdownOpen}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {(totalNotificationCount || pendingCount) > 0 && (
                    <span className="notification-badge">{Math.max(totalNotificationCount, pendingCount)}</span>
                  )}
                </button>
                <div className={`notifications-dropdown ${dropdownOpen ? 'open' : ''}`}>
                  <div className="notifications-header">
                    <span>Notifications</span>
                    <button className="clear-notifs" onClick={() => clearNotifications()}>Clear All</button>
                  </div>
                  <div className="notifications-list">
                    {notifications.length === 0 && pendingAttendanceRequests.length === 0 && pendingCount === 0 && (
                      <div className="no-notifs">No notifications</div>
                    )}
                    {notifications.length === 0 && pendingAttendanceRequests.length === 0 && pendingCount > 0 && (
                      <div className="no-notifs">You have {pendingCount} pending role request{pendingCount > 1 ? 's' : ''}.</div>
                    )}
                    {pendingAttendanceRequests.map((request) => (
                      <div key={`attendance-${request.id}`} className="notification-item notification-item-actionable">
                        <div className="notification-content">
                          <div className="notification-title">Attendance Access Pending</div>
                          <div className="notification-message">{request.name || request.email} requested attendance access.</div>
                          <div className="notification-time">{formatDateTime(request.submittedAt)}</div>
                          <div className="notification-actions">
                            <button className="notification-approve" onClick={() => handleAttendanceAccessReview(request.id, 'approved')}>
                              Approve
                            </button>
                            <button className="notification-reject" onClick={() => handleAttendanceAccessReview(request.id, 'rejected')}>
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {notifications.map(n => (
                      <div key={n.id} className="notification-item">
                        <div className="notification-content">
                          <div className="notification-title">{n.title}</div>
                          <div className="notification-message">{n.message}</div>
                          <div className="notification-time">{new Date(n.time).toLocaleString()}</div>
                        </div>
                        <button className="notification-close" onClick={() => removeNotification(n.id)}>x</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <ThemeToggle />
        
        {/* Admin Info */}
        <div className="admin-info-navbar">
          <div className="admin-avatar-navbar">
            {getUserInitial()}
          </div>
          <div className="admin-details-navbar">
            <span className="admin-name-navbar">{getUserName()}</span>
            <span className="admin-role-navbar">{(user?.role || 'user').charAt(0).toUpperCase() + (user?.role || 'user').slice(1)}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
