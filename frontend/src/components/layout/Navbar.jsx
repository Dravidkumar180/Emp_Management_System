import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="mobile-menu-btn">☰</button>
        <div>
          <h1>Welcome back, {user?.name || 'User'}!</h1>
          <p className="date-text">{currentDate}</p>
        </div>
      </div>
      
      <div className="navbar-right">
        <div className="notifications">
          <button className="icon-btn">🔔</button>
          <span className="notification-badge">3</span>
        </div>
        
        <div className="user-menu" onClick={() => setShowMenu(!showMenu)}>
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.email || 'user@example.com'}</span>
            <span className="user-role">Administrator</span>
          </div>
          {showMenu && (
            <div className="dropdown-menu">
              <button className="dropdown-item">👤 Profile</button>
              <button className="dropdown-item">⚙️ Settings</button>
              <hr className="dropdown-divider" />
              <button onClick={handleLogout} className="dropdown-item logout">
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;