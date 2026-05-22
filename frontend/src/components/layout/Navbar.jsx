import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h1>Welcome back, {user?.name || 'Admin'}!</h1>
        <p>Here's what's happening.</p>
      </div>
      
      <div className="navbar-right">
        <ThemeToggle />
        <div className="user-menu">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;