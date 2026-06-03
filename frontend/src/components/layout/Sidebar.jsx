import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  const menuItems = [
    { 
      path: '/dashboard', 
      name: 'Dashboard', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9L12 3L21 9L12 15L3 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 11V17L12 21L19 17V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      path: '/employees', 
      name: 'Employees', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M23 21V19C22.8 16.8 21 15 19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 3.13C17.5 3.54 18.6 4.93 18.6 6.55C18.6 8.17 17.5 9.56 16 9.97" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    { 
      path: '/departments', 
      name: 'Departments', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 21V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V21" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    { 
      path: '/attendance', 
      name: 'Attendance', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M15 14L12 17M9 14L12 17M12 17V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      path: '/companies',
      name: 'Companies',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 5H20V9H4V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 15H20V19H4V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 10H20V14H4V10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      path: '/settings', 
      name: 'Settings', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.27 16.88l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.7 0 1.27-.5 1.47-1.2.2-.7-.04-1.44-.54-1.94L3.38 3.86A2 2 0 1 1 6.21.03l.06.06c.5.5 1.24.74 1.94.54.7-.2 1.2-.77 1.2-1.47V.01A2 2 0 1 1 13 .01v.09c0 .7.5 1.27 1.2 1.47.7.2 1.44-.04 1.94-.54l.06-.06A2 2 0 1 1 21 3.86l-.06.06c-.5.5-.74 1.24-.54 1.94.2.7.77 1.2 1.47 1.2H21a2 2 0 1 1 0 4h-.09c-.7 0-1.27.5-1.47 1.2-.2.7.04 1.44.54 1.94l.06.06A2 2 0 0 1 19.4 15z" stroke="currentColor" strokeWidth="1"/>
        </svg>
      )
    },
  ];

  const getUserRole = () => {
    try {
      if (authUser && authUser.role) return authUser.role;
      const saved = localStorage.getItem('user');
      if (saved) return JSON.parse(saved)?.role;
    } catch (e) {
      console.error('Error parsing user role from storage', e);
    }
    return 'user';
  };

  const userRole = getUserRole();
  const visibleMenuItems = menuItems.filter(item => {
    // admin-only items
    if (item.path === '/departments' || item.path === '/attendance' || item.path === '/companies' || item.path === '/role-requests') {
      return userRole === 'admin';
    }
    // everyone can see dashboard, employees, and settings
    return true;
  }); // show menu depending on role

  // Safe function to get user initials
  const getUserInitials = () => {
    try {
      if (authUser && authUser.name) {
        return authUser.name.charAt(0).toUpperCase();
      }
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.name) {
          return parsedUser.name.charAt(0).toUpperCase();
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
    return 'A';
  };

  // Safe function to get user name
  const getUserName = () => {
    try {
      if (authUser && authUser.name) {
        return authUser.name;
      }
      if (authUser && authUser.email) {
        return authUser.email.split('@')[0];
      }
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.name) {
          return parsedUser.name;
        }
        if (parsedUser && parsedUser.email) {
          return parsedUser.email.split('@')[0];
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
    return 'Admin User';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ✅ KEEP THIS CODE EXACTLY AS IS - DO NOT DELETE OR MODIFY
return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo-section">
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 3L21 9L12 15L3 9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 11V17L12 21L19 17V11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="logo-text">
            <h2>EEMS</h2>
            <p>Enterprise System</p>
          </div>
        </div>
      </div>  
      
      <nav className="sidebar-nav">
        {visibleMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="logout-section">
        <button className="logout-btn-sidebar" onClick={handleLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {getUserInitials()}
          </div>
          <div className="user-details">
            <span className="user-name">{getUserName()}</span>
            <span className="user-role">{(authUser?.role || 'user').charAt(0).toUpperCase() + (authUser?.role || 'user').slice(1)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;