import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import './Dashboard.css';

const Departments = () => {
  return (
    <DashboardLayout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Departments</h1>
          <p>Manage departments and teams</p>
        </div>
        <div className="section">
          <p style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            📋 Department management module coming soon...
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Departments;