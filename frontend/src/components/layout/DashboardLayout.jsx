import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;