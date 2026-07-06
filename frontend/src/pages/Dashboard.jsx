// Shows the dashboard page.
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllEmployees } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer
} from 'recharts';
import './Dashboard.css';

// Shows the dashboard component.
const Dashboard = () => {
  // Gets current logged-in user.
  const { user } = useAuth();
  // Stores all employee records.
  const [employees, setEmployees] = useState([]);
  // Tracks dashboard loading state.
  const [loading, setLoading] = useState(true);
  // Stores dashboard summary numbers.
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    departments: 0,
    attendanceRate: 0,
    remote: 0,
    onLeave: 0,
    inactive: 0
  });
  // Stores department chart data.
  const [departmentData, setDepartmentData] = useState([]);
  // Stores role chart data.
  const [roleData, setRoleData] = useState([]);
  // Stores status chart data.
  const [statusData, setStatusData] = useState([]);
  // Stores recently joined employees.
  const [recentEmployees, setRecentEmployees] = useState([]);
  // Stores weekly activity chart data.
  const [activityData, setActivityData] = useState([]);

  const BAR_COLORS = ['#2f6de1', '#7c3aed', '#0f91a8', '#db2777', '#ea580c', '#2563eb', '#7c3aed', '#0f91a8'];
  const STATUS_COLORS = {
    Active: '#10b981',
    Inactive: '#ef4444',
    'On Leave': '#f59e0b',
    Remote: '#06b6d4'
  };

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllEmployees();
      setEmployees(data);
      
      // Calculate statistics
      const total = data.length;
      // Prepares active.
      const active = data.filter(emp => emp.status === 'Active').length;
      // Prepares remote.
      const remote = data.filter(emp => emp.status === 'Remote').length;
      // Handles leave actions.
      const onLeave = data.filter(emp => emp.status === 'On Leave').length;
      // Prepares inactive.
      const inactive = data.filter(emp => emp.status === 'Inactive').length;
      // Prepares departments.
      const departments = [...new Set(data.map(emp => emp.department))].length;
      const attendanceRate = total > 0 ? Math.round((active / total) * 100) : 0;
      
      setStats({
        total,
        active,
        departments,
        attendanceRate,
        remote,
        onLeave,
        inactive
      });
      
      // Department distribution
      const deptMap = {};
      data.forEach(emp => {
        deptMap[emp.department] = (deptMap[emp.department] || 0) + 1;
      });
      // Prepares dept data.
      const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));
      setDepartmentData(deptData);

      // Role distribution
      const roleMap = {};
      data.forEach(emp => {
        roleMap[emp.role] = (roleMap[emp.role] || 0) + 1;
      });
      // Prepares role data array.
      const roleDataArray = Object.entries(roleMap).map(([name, value]) => ({ name, value }));
      setRoleData(roleDataArray);
      
      // Status distribution
      const statusMap = { Active: active, Inactive: inactive, 'On Leave': onLeave, Remote: remote };
      // Prepares status data array.
      const statusDataArray = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
      setStatusData(statusDataArray);
      
      // Activity data (last 7 days simulation based on actual data)
      const activityDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      // Prepares activity sim.
      const activitySim = activityDays.map(day => ({
        day,
        present: Math.floor(Math.random() * active) + 10,
        absent: Math.floor(Math.random() * inactive) + 2,
        remote: Math.floor(Math.random() * remote) + 5
      }));
      setActivityData(activitySim);
      
      // Recent employees (last 5 added)
      const recent = [...data].sort((a, b) => b.id - a.id).slice(0, 5);
      setRecentEmployees(recent);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Runs when this screen needs to update data.
  useEffect(() => {
    loadDashboardData();

    // Handles employees updated actions.
    const handleEmployeesUpdated = () => {
      loadDashboardData();
    };
    window.addEventListener('employeesUpdated', handleEmployeesUpdated);
    
    // Prepares interval.
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('employeesUpdated', handleEmployeesUpdated);
    };
  }, [loadDashboardData]);

  // Shows the custom tooltip component.
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const title = label || payload[0].name;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{title}</p>
          <p className="tooltip-value">Count: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name || 'Admin'}! Here's what's happening in your organization.</p>
        </div>
        <div className="date-badge">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Statistics Cards with SVG Icons */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21V19C22.8 16.8 21 15 19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 3.13C17.5 3.54 18.6 4.93 18.6 6.55C18.6 8.17 17.5 9.56 16 9.97" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Employees</div>
            <div className="stat-trend up">+12% from last month</div>
          </div>
        </div>
        
        <div className="stat-card stat-card-success">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active Employees</div>
            <div className="stat-trend up">+8% from last month</div>
          </div>
        </div>
        
        <div className="stat-card stat-card-info">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 21V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V21" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.departments}</div>
            <div className="stat-label">Departments</div>
            <div className="stat-trend">No change</div>
          </div>
        </div>
        
        <div className="stat-card stat-card-warning">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="16" r="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 14V12M12 18V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.attendanceRate}%</div>
            <div className="stat-label">Attendance Rate</div>
            <div className="stat-trend up">+5% from yesterday</div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row with SVG Icons */}
      <div className="stats-secondary">
        <div className="stat-mini">
          <span className="stat-mini-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9L12 3L21 9L12 15L3 9Z" stroke="currentColor"/>
              <path d="M5 11V17L12 21L19 17V11" stroke="currentColor"/>
            </svg>
          </span>
          <div>
            <div className="stat-mini-value">{stats.remote}</div>
            <div className="stat-mini-label">Remote Workers</div>
          </div>
        </div>
        <div className="stat-mini">
          <span className="stat-mini-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" stroke="currentColor"/>
              <path d="M12 6V12L16 14" stroke="currentColor"/>
            </svg>
          </span>
          <div>
            <div className="stat-mini-value">{stats.onLeave}</div>
            <div className="stat-mini-label">On Leave</div>
          </div>
        </div>
        <div className="stat-mini">
          <span className="stat-mini-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" stroke="currentColor"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor"/>
              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor"/>
            </svg>
          </span>
          <div>
            <div className="stat-mini-value">{stats.inactive}</div>
            <div className="stat-mini-label">Inactive</div>
          </div>
        </div>
        <div className="stat-mini">
          <span className="stat-mini-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3H8C9.1 3 10 3.9 10 5V19C10 20.1 9.1 21 8 21H2V3Z" stroke="currentColor"/>
              <path d="M22 3H16C14.9 3 14 3.9 14 5V19C14 20.1 14.9 21 16 21H22V3Z" stroke="currentColor"/>
            </svg>
          </span>
          <div>
            <div className="stat-mini-value">{stats.active}/{stats.total}</div>
            <div className="stat-mini-label">Active Ratio</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Department Distribution - Bar Chart */}
        <div className="chart-card employee-status-card">
          <div className="chart-header">
            <h3>Employee Distribution by Department</h3>
            <p>Hover a bar to view department details</p>
          </div>
          <div className="chart-container department-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={departmentData}
                layout="vertical"
                margin={{ top: 18, right: 28, left: 12, bottom: 12 }}
                barCategoryGap={12}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={96}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#2f6de1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Role Count - Bar Chart */}
        <div className="chart-card weekly-activity-card">
          <div className="chart-header">
            <h3>Employee Count by Role</h3>
          </div>
          <div className="chart-container role-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roleData} margin={{ top: 18, right: 28, left: 10, bottom: 46 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  interval="preserveStartEnd"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  angle={0}
                  height={58}
                />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {roleData.map((entry, index) => (
                    <Cell key={`role-cell-${entry.name}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution - Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Employee Status Overview</h3>
          </div>
          <div className="chart-container pie-chart-container status-overview-chart">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={66}
                  outerRadius={106}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                >
                  {statusData.map((entry) => (
                    <Cell key={`status-cell-${entry.name}`} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Overview - Line Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Weekly Activity</h3>
            <p>Attendance overview for this week</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="remote" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Employees Section */}
      <div className="recent-section">
        <div className="recent-header">
          <h3>Recently Joined Employees</h3>
          <button className="view-all-btn" onClick={() => window.location.href = '/employees'}>View All →</button>
        </div>
        <div className="recent-table-wrapper">
          <table className="recent-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Department</th>
                <th>Join Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentEmployees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">No employees found</td>
                </tr>
              ) : (
                recentEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="recent-employee-cell">
                        <div className="recent-avatar">{emp.avatar}</div>
                        <div>
                          <div className="recent-name">{emp.name}</div>
                          <div className="recent-email">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.role}</td>
                    <td>{emp.department}</td>
                    <td>{emp.joinDate}</td>
                    <td>
                      <span className={`status status-${emp.status?.toLowerCase().replace(' ', '-')}`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
