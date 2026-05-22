import React, { useState, useEffect } from 'react';
import { fetchEmployees } from '../services/api';
import './Employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchEmployees().then(data => {
      setEmployees(data);
      setFilteredEmployees(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let filtered = employees;
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (departmentFilter) {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }
    setFilteredEmployees(filtered);
  }, [searchTerm, departmentFilter, employees]);

  const departments = ['All Departments', ...new Set(employees.map(emp => emp.department))];
  const roles = ['Software Engineer', 'Product Manager', 'HR Manager', 'UI/UX Designer', 'Data Scientist', 'QA Engineer'];

  const handleAddEmployee = () => {
    if (newEmployee.name && newEmployee.email) {
      const employee = {
        id: employees.length + 1,
        ...newEmployee,
        username: newEmployee.name.toLowerCase().replace(' ', '.'),
        phone: '+1 (555) 000-0000',
        company: 'New Company',
        joinDate: new Date().toISOString().split('T')[0],
        location: 'New York',
        avatar: newEmployee.name.charAt(0)
      };
      setEmployees([employee, ...employees]);
      setFilteredEmployees([employee, ...filteredEmployees]);
      setShowAddModal(false);
      setNewEmployee({
        name: '',
        email: '',
        role: '',
        department: '',
        status: 'Active'
      });
    }
  };

  if (loading) {
    return (
      <div className="employees-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="employees-page">
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p className="page-description">Manage your team members and their account permissions here.</p>
        </div>
        <button className="add-employee-btn" onClick={() => setShowAddModal(true)}>
          + Add Employee
        </button>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="department-select"
        >
          {departments.map(dept => (
            <option key={dept} value={dept === 'All Departments' ? '' : dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      <div className="employees-container">
        <div className="employees-table-container">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>ROLE</th>
                <th>DEPARTMENT</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id} onClick={() => setSelectedEmployee(emp)}>
                  <td>
                    <div className="employee-cell">
                      <div className="employee-avatar">{emp.name.charAt(0)}</div>
                      <div>
                        <div className="employee-name">{emp.name}</div>
                        <div className="employee-email">{emp.email}</div>
                      </div>
                    </div>
                   </td>
                   <td>{emp.role}</td>
                   <td>{emp.department}</td>
                   <td>
                    <span className={`status-badge status-${emp.status.toLowerCase().replace(' ', '-')}`}>
                      {emp.status}
                    </span>
                   </td>
                   <td>
                    <button className="action-btn">:</button>
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedEmployee && (
          <div className="employee-details">
            <div className="details-header">
              <h3>Details</h3>
              <button className="close-details" onClick={() => setSelectedEmployee(null)}>×</button>
            </div>
            <div className="details-content">
              <div className="detail-item">
                <label>EMAIL</label>
                <p>{selectedEmployee.email}</p>
              </div>
              <div className="detail-item">
                <label>PHONE</label>
                <p>{selectedEmployee.phone}</p>
              </div>
              <div className="detail-item">
                <label>JOIN DATE</label>
                <p>{selectedEmployee.joinDate}</p>
              </div>
              <div className="detail-item">
                <label>LOCATION</label>
                <p>{selectedEmployee.location}</p>
              </div>
            </div>
            <div className="details-actions">
              <button className="message-btn">Message</button>
              <button className="edit-profile-btn">Edit Profile</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Employee</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <select
                  value={newEmployee.department}
                  onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                >
                  <option value="">Select Department</option>
                  {departments.filter(d => d !== 'All Departments').map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newEmployee.status}
                  onChange={(e) => setNewEmployee({...newEmployee, status: e.target.value})}
                >
                  <option value="Active">Active</option>
                  <option value="Remote">Remote</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="submit-btn" onClick={handleAddEmployee}>Add Employee</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;