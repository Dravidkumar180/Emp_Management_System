import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { fetchPendingRoleRequests } from '../../services/auth';
import { useEffect, useRef, useState } from 'react';
import './Navbar.css';

const Navbar = ({ onSidebarToggle }) => {
  const navigate = useNavigate();
  const { notifications, removeNotification, clearNotifications, addNotification } = useNotifications();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const pendingRequestIdsRef = useRef(new Set());
  const initialPendingLoad = useRef(true);
  const wrapRef = useRef(null);

  useEffect(() => {
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

  const isAdmin = user?.role === 'admin';
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  useEffect(() => {
    if (!isAdmin) {
      setPendingCount(0);
      return;
    }

    let active = true;

    const loadPendingNotifications = async () => {
      try {
        const requests = await fetchPendingRoleRequests();
        if (!active) return;

        setPendingCount(requests.length);
        const currentIds = new Set(requests.map((request) => request.id));

        if (initialPendingLoad.current) {
          initialPendingLoad.current = false;
          if (requests.length > 0) {
            addNotification({
              type: 'info',
              title: 'Pending Role Requests',
              message: `You have ${requests.length} pending admin request${requests.length > 1 ? 's' : ''}.`,
            });
          }
        } else {
          const newRequests = requests.filter((request) => !pendingRequestIdsRef.current.has(request.id));
          if (newRequests.length > 0) {
            addNotification({
              type: 'info',
              title: 'New Role Request',
              message: `${newRequests.length} new role request${newRequests.length > 1 ? 's' : ''} need review.`,
            });
          }
        }

        pendingRequestIdsRef.current = currentIds;
      } catch (error) {
        console.error('Failed to load pending role requests for notifications', error);
      }
    };

    loadPendingNotifications();
    const interval = setInterval(loadPendingNotifications, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isAdmin, addNotification]);

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
                  {(notifications.length || pendingCount) > 0 && (
                    <span className="notification-badge">{Math.max(notifications.length, pendingCount)}</span>
                  )}
                </button>
                <div className={`notifications-dropdown ${dropdownOpen ? 'open' : ''}`}>
                  <div className="notifications-header">
                    <span>Notifications</span>
                    <button className="clear-notifs" onClick={() => clearNotifications()}>Clear All</button>
                  </div>
                  <div className="notifications-list">
                    {notifications.length === 0 && pendingCount === 0 && (
                      <div className="no-notifs">No notifications</div>
                    )}
                    {notifications.length === 0 && pendingCount > 0 && (
                      <div className="no-notifs">You have {pendingCount} pending role request{pendingCount > 1 ? 's' : ''}.</div>
                    )}
                    {notifications.map(n => (
                      <div key={n.id} className="notification-item">
                        <div className="notification-content">
                          <div className="notification-title">{n.title}</div>
                          <div className="notification-message">{n.message}</div>
                          <div className="notification-time">{new Date(n.time).toLocaleString()}</div>
                        </div>
                        <button className="notification-close" onClick={() => removeNotification(n.id)}>✕</button>
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