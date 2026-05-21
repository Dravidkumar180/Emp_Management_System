import React, { useState, useEffect } from 'react';

// Styles object
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  title: {
    fontSize: '28px',
    color: '#4f46e5',
    marginBottom: '10px'
  },
  input: {
    width: '100%',
    padding: '12px',
    margin: '10px 0',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'all 0.2s'
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s'
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '20px'
  },
  nav: {
    background: '#1f2937',
    padding: '15px',
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  navButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '8px 20px',
    borderRadius: '8px',
    transition: 'all 0.2s'
  },
  activeNav: {
    background: '#4f46e5',
    color: 'white'
  },
  content: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  th: {
    padding: '15px',
    background: '#f9fafb',
    textAlign: 'left',
    borderBottom: '2px solid #e5e7eb',
    fontWeight: '600',
    cursor: 'pointer',
    userSelect: 'none'
  },
  td: {
    padding: '15px',
    borderBottom: '1px solid #e5e7eb'
  },
  searchBox: {
    padding: '12px',
    marginBottom: '20px',
    width: '300px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    display: 'inline-block',
    fontWeight: '500'
  },
  header: {
    background: 'white',
    padding: '20px 30px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  employeeCard: {
    background: 'white',
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s'
  },
  avatar: {
    width: '40px',
    height: '40px',
    background: '#4f46e5',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '18px'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '20px',
    alignItems: 'center'
  },
  pageButton: {
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    background: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  activePage: {
    background: '#4f46e5',
    color: 'white',
    borderColor: '#4f46e5'
  },
  filterSelect: {
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    marginLeft: '10px'
  },
  departmentList: {
    marginTop: '20px'
  },
  departmentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #e5e7eb'
  },
  progressBar: {
    flex: 1,
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    margin: '0 15px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: '#4f46e5',
    transition: 'width 0.3s'
  }
};

// API function
const fetchEmployees = async () => {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    const data = await response.json();
    return data.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      website: user.website,
      company: user.company.name,
      department: ['Engineering', 'Human Resources', 'Marketing', 'Sales', 'Finance', 'Operations'][user.id % 6],
      status: ['Active', 'Active', 'Remote', 'On Leave', 'Active', 'Probation'][user.id % 6],
      location: ['New York', 'London', 'Tokyo', 'Sydney', 'Toronto', 'Berlin'][user.id % 6],
      joinDate: `202${user.id % 3}-${String(user.id % 12 + 1).padStart(2, '0')}-01`
    }));
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};

// Login Component
function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email);
    } else {
      setError('Please enter email and password');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏢</div>
        <h1 style={styles.title}>EMP MANAGE</h1>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>Enterprise Employee Management System</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '10px' }}>{error}</p>}
          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
        <p style={{ marginTop: '20px', fontSize: '12px', color: '#9ca3af' }}>
          Demo: Enter any email and password
        </p>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard({ user, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchEmployees().then(data => {
      setEmployees(data);
      setLoading(false);
    });
  }, []);

  // Filter and sort employees
  const getFilteredAndSortedEmployees = () => {
    let filtered = [...employees];
    
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (departmentFilter) {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }
    
    if (statusFilter) {
      filtered = filtered.filter(emp => emp.status === statusFilter);
    }
    
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  };

  const filteredEmployees = getFilteredAndSortedEmployees();
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPageNum - 1) * itemsPerPage,
    currentPageNum * itemsPerPage
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getDepartmentStats = () => {
    const stats = {};
    employees.forEach(emp => {
      stats[emp.department] = (stats[emp.department] || 0) + 1;
    });
    return stats;
  };

  const DashboardView = () => {
    const departmentStats = getDepartmentStats();
    const activeCount = employees.filter(e => e.status === 'Active').length;
    const remoteCount = employees.filter(e => e.status === 'Remote').length;
    const onLeaveCount = employees.filter(e => e.status === 'On Leave').length;
    
    return (
      <div>
        <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>Dashboard Overview</h2>
        
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={styles.statCard}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>👥</div>
            <h3 style={{ fontSize: '14px', color: '#6b7280' }}>Total Employees</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{employees.length}</p>
          </div>
          <div style={styles.statCard}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
            <h3 style={{ fontSize: '14px', color: '#6b7280' }}>Active Employees</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{activeCount}</p>
          </div>
          <div style={styles.statCard}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🏠</div>
            <h3 style={{ fontSize: '14px', color: '#6b7280' }}>Remote Workers</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{remoteCount}</p>
          </div>
          <div style={styles.statCard}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🌴</div>
            <h3 style={{ fontSize: '14px', color: '#6b7280' }}>On Leave</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{onLeaveCount}</p>
          </div>
        </div>

        {/* Department Distribution */}
        <div style={{ ...styles.statCard, marginBottom: '30px', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '15px', color: '#1f2937' }}>Department Distribution</h3>
          <div style={styles.departmentList}>
            {Object.entries(departmentStats).map(([dept, count]) => (
              <div key={dept} style={styles.departmentItem}>
                <span style={{ fontWeight: '500', minWidth: '150px' }}>{dept}</span>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${(count / employees.length) * 100}%` }}></div>
                </div>
                <span style={{ fontWeight: '600', minWidth: '40px', textAlign: 'right' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Employees */}
        <div style={styles.statCard}>
          <h3 style={{ marginBottom: '15px', color: '#1f2937' }}>Recent Employees</h3>
          {employees.slice(0, 5).map(emp => (
            <div key={emp.id} style={styles.employeeCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={styles.avatar}>{emp.name.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: '500' }}>{emp.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{emp.department}</div>
                </div>
              </div>
              <span style={{
                ...styles.statusBadge,
                background: emp.status === 'Active' ? '#d1fae5' : emp.status === 'Remote' ? '#dbeafe' : '#fed7aa',
                color: emp.status === 'Active' ? '#065f46' : emp.status === 'Remote' ? '#1e40af' : '#92400e'
              }}>
                {emp.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const EmployeesView = () => {
    const departments = [...new Set(employees.map(emp => emp.department))];
    const statuses = [...new Set(employees.map(emp => emp.status))];
    
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ color: '#1f2937' }}>Employee Directory</h2>
          <button style={{ ...styles.button, width: 'auto', padding: '10px 20px' }}>+ Add Employee</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Search by name, email, or department..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPageNum(1);
            }}
            style={styles.searchBox}
          />
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setCurrentPageNum(1);
            }}
            style={styles.filterSelect}
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPageNum(1);
            }}
            style={styles.filterSelect}
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          {(searchTerm || departmentFilter || statusFilter) && (
            <button onClick={() => {
              setSearchTerm('');
              setDepartmentFilter('');
              setStatusFilter('');
              setCurrentPageNum(1);
            }} style={{ ...styles.button, width: 'auto', background: '#6b7280' }}>
              Clear Filters ✕
            </button>
          )}
        </div>

        {/* Employee Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th} onClick={() => handleSort('name')}>
                  Employee {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={styles.th} onClick={() => handleSort('email')}>
                  Contact {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={styles.th} onClick={() => handleSort('department')}>
                  Department {sortField === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={styles.th} onClick={() => handleSort('status')}>
                  Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.map(emp => (
                <tr key={emp.id}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={styles.avatar}>{emp.name.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: '500' }}>{emp.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>@{emp.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div>{emp.email}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{emp.phone}</div>
                  </td>
                  <td style={styles.td}>{emp.department}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: emp.status === 'Active' ? '#d1fae5' : emp.status === 'Remote' ? '#dbeafe' : emp.status === 'On Leave' ? '#fed7aa' : '#fef3c7',
                      color: emp.status === 'Active' ? '#065f46' : emp.status === 'Remote' ? '#1e40af' : emp.status === 'On Leave' ? '#92400e' : '#92400e'
                    }}>
                      {emp.status}
                    </span>
                  </td>
                  <td style={styles.td}>{emp.location}</td>
                  <td style={styles.td}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', margin: '0 5px' }} title="View">👁️</button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', margin: '0 5px' }} title="Edit">✏️</button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', margin: '0 5px' }} title="Delete">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            No employees found matching your criteria
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={styles.pagination}>
            <button
              onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))}
              disabled={currentPageNum === 1}
              style={{ ...styles.pageButton, opacity: currentPageNum === 1 ? 0.5 : 1 }}
            >
              ← Previous
            </button>
            <span style={{ padding: '8px 16px' }}>
              Page {currentPageNum} of {totalPages} ({filteredEmployees.length} total)
            </span>
            <button
              onClick={() => setCurrentPageNum(p => Math.min(totalPages, p + 1))}
              disabled={currentPageNum === totalPages}
              style={{ ...styles.pageButton, opacity: currentPageNum === totalPages ? 0.5 : 1 }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    );
  };

  const DepartmentsView = () => {
    const departmentStats = getDepartmentStats();
    return (
      <div>
        <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>Department Management</h2>
        <div style={styles.statCard}>
          {Object.entries(departmentStats).map(([dept, count]) => (
            <div key={dept} style={styles.departmentItem}>
              <div>
                <strong style={{ fontSize: '16px' }}>{dept}</strong>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>{count} employees</div>
              </div>
              <button style={{ ...styles.button, width: 'auto', padding: '8px 16px', fontSize: '12px' }}>View Details</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const AttendanceView = () => (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>Attendance Tracking</h2>
      <div style={styles.statCard}>
        <p style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          📅 Attendance tracking module coming soon...
        </p>
      </div>
    </div>
  );

  const SettingsView = () => (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>System Settings</h2>
      <div style={styles.statCard}>
        <p style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          ⚙️ Settings module coming soon...
        </p>
      </div>
    </div>
  );

  if (loading) return <div style={styles.container}><p>Loading employee data...</p></div>;

  return (
    <div>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ color: '#1f2937', marginBottom: '5px' }}>EMP MANAGE</h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Enterprise Employee Management System</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={styles.avatar}>{user.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{user}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Administrator</div>
              </div>
            </div>
            <button onClick={onLogout} style={{ ...styles.button, width: 'auto', padding: '8px 16px', background: '#ef4444' }}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={styles.nav}>
        <button onClick={() => { setCurrentPage('dashboard'); setCurrentPageNum(1); }} style={{...styles.navButton, ...(currentPage === 'dashboard' ? styles.activeNav : {})}}>
          📊 Dashboard
        </button>
        <button onClick={() => { setCurrentPage('employees'); setCurrentPageNum(1); }} style={{...styles.navButton, ...(currentPage === 'employees' ? styles.activeNav : {})}}>
          👥 Employees
        </button>
        <button onClick={() => setCurrentPage('departments')} style={{...styles.navButton, ...(currentPage === 'departments' ? styles.activeNav : {})}}>
          🏢 Departments
        </button>
        <button onClick={() => setCurrentPage('attendance')} style={{...styles.navButton, ...(currentPage === 'attendance' ? styles.activeNav : {})}}>
          📅 Attendance
        </button>
        <button onClick={() => setCurrentPage('settings')} style={{...styles.navButton, ...(currentPage === 'settings' ? styles.activeNav : {})}}>
          ⚙️ Settings
        </button>
      </div>

      <div style={styles.content}>
        {currentPage === 'dashboard' && <DashboardView />}
        {currentPage === 'employees' && <EmployeesView />}
        {currentPage === 'departments' && <DepartmentsView />}
        {currentPage === 'attendance' && <AttendanceView />}
        {currentPage === 'settings' && <SettingsView />}
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setIsLoggedIn(true);
      setUserEmail(savedUser);
    }
  }, []);

  const handleLogin = (email) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    localStorage.setItem('user', email);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    localStorage.removeItem('user');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard user={userEmail} onLogout={handleLogout} />;
}

export default App;