import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import './Dashboard.css';

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Settings</h1>
          <p>Configure system preferences</p>
        </div>
        <div className="section">
          <p style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            ⚙️ Settings module coming soon...
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;