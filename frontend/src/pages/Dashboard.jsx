import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/common/StatCard';
import { fetchEmployees, getDepartmentStats, getStatusStats, getLocationStats } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, departments: {}, statuses: {}, locations: {} });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchEmployees();
      setEmployees(data);
      setStats({
        total: data.length,
        departments: getDepartmentStats(data),
        statuses: getStatusStats(data),
        locations: getLocationStats(data)
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentEmployees = employees.slice(0, 5);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard Overview</h1>
          <p>Real-time insights and analytics</p>
        </div>

        <div className="stats-grid">
          <StatCard 
            title="Total Employees" 
            value={stats.total} 
            icon="👥" 
            color="#4f46e5" 
          />
          <StatCard 
            title="Departments" 
            value={Object.keys(stats.departments).length} 
            icon="🏢" 
            color="#10b981" 
          />
          <StatCard 
            title="Active Employees" 
            value={stats.statuses.Active || 0} 
            icon="✅" 
            color="#f59e0b" 
          />
          <StatCard 
            title="Remote Workers" 
            value={stats.statuses.Remote || 0} 
            icon="🏠" 
            color="#ef4444" 
          />
        </div>

        <div className="dashboard-sections">
          <div className="section">
            <h2>Department Distribution</h2>
            <div className="department-list">
              {Object.entries(stats.departments).map(([dept, count]) => (
                <div key={dept} className="department-item">
                  <span className="dept-name">{dept}</span>
                  <div className="dept-bar">
                    <div 
                      className="dept-bar-fill" 
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="dept-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h2>Recent Employees</h2>
            <div className="recent-employees">
              {recentEmployees.map(emp => (
                <div key={emp.id} className="recent-employee-item">
                  <div className="recent-avatar">{emp.name.charAt(0)}</div>
                  <div className="recent-info">
                    <div className="recent-name">{emp.name}</div>
                    <div className="recent-dept">{emp.department}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h2>Location Distribution</h2>
            <div className="location-list">
              {Object.entries(stats.locations).map(([loc, count]) => (
                <div key={loc} className="location-item">
                  <span className="location-name">{loc}</span>
                  <span className="location-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <button className="action-btn">➕ Add Employee</button>
              <button className="action-btn">📊 Generate Report</button>
              <button className="action-btn">📅 View Attendance</button>
              <button className="action-btn">🏢 Manage Departments</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;