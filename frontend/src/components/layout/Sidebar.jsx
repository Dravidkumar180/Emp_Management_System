import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: '📊' },
    { path: '/employees', name: 'Employees', icon: '👥' },
    { path: '/departments', name: 'Departments', icon: '🏢' },
    { path: '/attendance', name: 'Attendance', icon: '📅' },
    { path: '/settings', name: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>EMP MANAGE</h2>
        <p>Enterprise System</p>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
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
    </aside>
  );
};

export default Sidebar;