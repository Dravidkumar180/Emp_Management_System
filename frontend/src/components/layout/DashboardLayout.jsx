// Builds the dashboard layout.
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './DashboardLayout.css';

// Shows the dashboard layout component.
const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Prepares toggle sidebar.
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };
  return (
    <div className={`dashboard-layout ${sidebarOpen ? '' : 'sidebar-closed'}`}>
      <Sidebar isOpen={sidebarOpen} />
      <div className="main-content">
        <Navbar onSidebarToggle={toggleSidebar} />
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;