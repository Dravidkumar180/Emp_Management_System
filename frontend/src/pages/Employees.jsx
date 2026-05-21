import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Input from '../components/common/Input';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { fetchEmployees } from '../services/api';
import './Employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  const itemsPerPage = 5;

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterAndSortEmployees();
  }, [searchTerm, departmentFilter, statusFilter, employees, sortField, sortDirection]);

  const loadEmployees = async () => {
    try {
      const data = await fetchEmployees();
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortEmployees = () => {
    let filtered = [...employees];
    
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (departmentFilter) {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }
    
    if (statusFilter) {
      filtered = filtered.filter(emp => emp.status === statusFilter);
    }
    
    // Sorting
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
    
    setFilteredEmployees(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const departments = [...new Set(employees.map(emp => emp.department))];
  const statuses = [...new Set(employees.map(emp => emp.status))];

  return (
    <DashboardLayout>
      <div className="employees-page">
        <div className="page-header">
          <div>
            <h1>Employees</h1>
            <p>Manage and view all employees</p>
          </div>
          <button className="btn-primary">+ Add New Employee</button>
        </div>

        <div className="stats-row">
          <StatCard title="Total Employees" value={employees.length} icon="👥" color="#4f46e5" />
          <StatCard title="Active" value={employees.filter(e => e.status === 'Active').length} icon="✅" color="#10b981" />
          <StatCard title="On Leave" value={employees.filter(e => e.status === 'On Leave').length} icon="🌴" color="#f59e0b" />
          <StatCard title="Remote" value={employees.filter(e => e.status === 'Remote').length} icon="🏠" color="#ef4444" />
        </div>

        <div className="filters-section">
          <Input
            type="text"
            placeholder="Search by name, email or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon="🔍"
          />
          
          <select 
            className="filter-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {(searchTerm || departmentFilter || statusFilter) && (
            <button className="clear-filters" onClick={() => {
              setSearchTerm('');
              setDepartmentFilter('');
              setStatusFilter('');
            }}>
              Clear Filters ✕
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading employees...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')}>
                      Employee {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('email')}>
                      Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('department')}>
                      Department {sortField === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('status')}>
                      Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map(emp => (
                    <tr key={emp.id}>
                      <td>
                        <div className="employee-info">
                          <div className="employee-avatar">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="employee-name">{emp.name}</div>
                            <div className="employee-username">@{emp.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="employee-email">{emp.email}</div>
                        <div className="employee-phone">{emp.phone}</div>
                      </td>
                      <td>{emp.department}</td>
                      <td><StatusBadge status={emp.status} /></td>
                      <td>{emp.location}</td>
                      <td>
                        <button className="action-icon" title="View">👁️</button>
                        <button className="action-icon" title="Edit">✏️</button>
                        <button className="action-icon" title="Delete">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredEmployees.length === 0 && (
              <div className="no-results">
                <p>No employees found matching your criteria</p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  ← Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages} ({filteredEmployees.length} total)
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Employees;