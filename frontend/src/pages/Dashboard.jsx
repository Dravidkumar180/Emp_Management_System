import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchEmployees } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees().then(data => {
      setEmployees(data);
      setLoading(false);
    });
  }, []);

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const attendanceRate = Math.round((activeEmployees / totalEmployees) * 100);
  const departments = [...new Set(employees.map(e => e.department))].length;
  const recentEmployees = employees.slice(0, 7);

  // Chart data for the line graph
  const chartData = [65, 70, 68, 72, 75, 73, 78, 76, 80, 82, 85, 88];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name || 'Admin'}! Here's what's happening.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21V19C22.8 16.8 21 15 19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 3.13C17.5 3.54 18.6 4.93 18.6 6.55C18.6 8.17 17.5 9.56 16 9.97" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalEmployees}</div>
            <div className="stat-label">Total Employees</div>
            <div className="stat-trend up">+12.5% from last month</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{activeEmployees}</div>
            <div className="stat-label">Active Employees</div>
            <div className="stat-trend up">+8.3% from last month</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 14H8.01M12 14H12.01M16 14H16.01M8 18H8.01M12 18H12.01M16 18H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{attendanceRate}%</div>
            <div className="stat-label">Attendance Today</div>
            <div className="stat-trend up">+5.4% from yesterday</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 21V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V21" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{departments}</div>
            <div className="stat-label">Departments</div>
            <div className="stat-trend">No change</div>
          </div>
        </div>
      </div>

      {/* Split Layout: Chart on Left, Recent Employees on Right */}
      <div className="dashboard-split">
        {/* Left Side - Chart */}
        <div className="chart-section">
          <div className="section-header">
            <h2>Employee Overview</h2>
            <select className="week-select">
              <option>This Week ▼</option>
              <option>Last Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          
          {/* Line Graph */}
          <div className="line-chart">
            <div className="chart-container">
              <svg width="100%" height="250" viewBox="0 0 600 250" preserveAspectRatio="none" className="chart-svg">
                {/* Grid lines */}
                <line x1="40" y1="200" x2="560" y2="200" stroke="var(--border)" strokeWidth="1"/>
                <line x1="40" y1="150" x2="560" y2="150" stroke="var(--border)" strokeWidth="1" strokeDasharray="4"/>
                <line x1="40" y1="100" x2="560" y2="100" stroke="var(--border)" strokeWidth="1" strokeDasharray="4"/>
                <line x1="40" y1="50" x2="560" y2="50" stroke="var(--border)" strokeWidth="1" strokeDasharray="4"/>
                
                {/* Y-axis labels */}
                <text x="30" y="204" fill="var(--text-muted)" fontSize="10">0</text>
                <text x="30" y="154" fill="var(--text-muted)" fontSize="10">25</text>
                <text x="30" y="104" fill="var(--text-muted)" fontSize="10">50</text>
                <text x="30" y="54" fill="var(--text-muted)" fontSize="10">75</text>
                <text x="30" y="14" fill="var(--text-muted)" fontSize="10">100</text>
                
                {/* Area under the line */}
                <polygon
                  points={`40,${200 - (chartData[0] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 0},${200 - (chartData[0] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 1},${200 - (chartData[1] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 2},${200 - (chartData[2] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 3},${200 - (chartData[3] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 4},${200 - (chartData[4] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 5},${200 - (chartData[5] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 6},${200 - (chartData[6] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 7},${200 - (chartData[7] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 8},${200 - (chartData[8] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 9},${200 - (chartData[9] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 10},${200 - (chartData[10] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 11},${200 - (chartData[11] * 1.2)} 560,200 40,200`}
                  fill="url(#gradient)"
                  opacity="0.3"
                />
                
                {/* Line */}
                <polyline
                  points={`40,${200 - (chartData[0] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 1},${200 - (chartData[1] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 2},${200 - (chartData[2] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 3},${200 - (chartData[3] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 4},${200 - (chartData[4] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 5},${200 - (chartData[5] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 6},${200 - (chartData[6] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 7},${200 - (chartData[7] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 8},${200 - (chartData[8] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 9},${200 - (chartData[9] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 10},${200 - (chartData[10] * 1.2)} ${560 - (560 - 40) / (chartData.length - 1) * 11},${200 - (chartData[11] * 1.2)}`}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                
                {/* Data points */}
                {chartData.map((value, index) => {
                  const x = 40 + (index * (520 / (chartData.length - 1)));
                  const y = 200 - (value * 1.2);
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="white"
                      stroke="var(--primary)"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
            </div>
            
            {/* X-axis labels */}
            <div className="chart-labels">
              {months.map((month, index) => (
                <span key={index} className="chart-label">{month}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Recent Employees */}
        <div className="recent-section">
          <div className="section-header">
            <h2>Recent Employees</h2>
          </div>
          <div className="recent-employees-list">
            {recentEmployees.map(emp => (
              <div key={emp.id} className="recent-employee-item">
                <div className="recent-employee-avatar">{emp.avatar}</div>
                <div className="recent-employee-info">
                  <div className="recent-employee-name">{emp.name}</div>
                  <div className="recent-employee-username">@{emp.username}</div>
                  <div className="recent-employee-company">{emp.company}</div>
                  <div className="recent-employee-date">{emp.joinDate}</div>
                </div>
                <button className="recent-more-btn">...</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;