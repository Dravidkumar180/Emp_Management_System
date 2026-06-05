import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  // Menu items with SVG icons
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
      ),
      roles: ['super_admin', 'admin', 'user']
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
      ),
      roles: ['super_admin', 'admin', 'user']
    },
    { 
      path: '/departments', 
      name: 'Departments', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 21V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V21" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      roles: ['super_admin', 'admin']
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
      ),
      roles: ['super_admin', 'admin']
    },
    { 
      path: '/companies', 
      name: 'Companies', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 21V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V21" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="7" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="2"/>
          <line x1="19" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      roles: ['super_admin', 'admin', 'user']
    },
    { 
      path: '/audit-logs', 
      name: 'Audit Logs', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      roles: ['super_admin', 'admin']
    },
    { 
      path: '/settings', 
      name: 'Settings', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M19.4 15.1L20.5 16.2C20.8 16.5 20.8 17 20.5 17.3L17.3 20.5C17 20.8 16.5 20.8 16.2 20.5L15.1 19.4" stroke="currentColor" strokeWidth="2"/>
          <path d="M8.9 4.9L7.8 3.8C7.5 3.5 7 3.5 6.7 3.8L3.5 7C3.2 7.3 3.2 7.8 3.5 8.1L4.6 9.2" stroke="currentColor" strokeWidth="2"/>
          <path d="M4.6 14.8L3.5 15.9C3.2 16.2 3.2 16.7 3.5 17L6.7 20.2C7 20.5 7.5 20.5 7.8 20.2L8.9 19.1" stroke="currentColor" strokeWidth="2"/>
          <path d="M19.4 8.9L20.5 7.8C20.8 7.5 20.8 7 20.5 6.7L17.3 3.5C17 3.2 16.5 3.2 16.2 3.5L15.1 4.6" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      roles: ['super_admin', 'admin', 'user']
    },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'user')
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        return parsed.name || parsed.email?.split('@')[0] || 'User';
      } catch {
        return 'User';
      }
    }
    return 'User';
  };

  const getUserInitial = () => {
    const name = getUserName();
    return name.charAt(0).toUpperCase();
  };

  const getUserRole = () => {
    if (user?.role === 'super_admin') return 'Super Admin';
    if (user?.role === 'admin') return 'Administrator';
    return 'User';
  };

  return (
    <aside className="sidebar">
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
        {filteredMenuItems.map((item) => (
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
          <div className="user-avatar">{getUserInitial()}</div>
          <div className="user-details">
            <span className="user-name">{getUserName()}</span>
            <span className="user-role">{getUserRole()}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
