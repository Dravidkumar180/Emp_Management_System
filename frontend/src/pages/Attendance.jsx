import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import './Dashboard.css';

const Attendance = () => {
  return (
    <DashboardLayout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Attendance</h1>
          <p>Track employee attendance and leaves</p>
        </div>
        <div className="section">
          <p style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            📅 Attendance tracking module coming soon...
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;