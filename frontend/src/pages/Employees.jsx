import React, { useState, useEffect } from 'react';
import { fetchEmployees, createEmployee, deleteEmployee, updateEmployee } from '../services/api';
import './Employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    status: '',
    phone: '',
    location: ''
  });
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    status: 'Active'
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique departments
  const departments = ['All Departments', ...new Set(employees.map(emp => emp.department))];

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === '' || departmentFilter === 'All Departments' || emp.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  // Toggle employee details (click to show/hide)
  const toggleEmployeeDetails = (employee) => {
    if (selectedEmployee?.id === employee.id) {
      setSelectedEmployee(null); // Hide if same employee clicked again
    } else {
      setSelectedEmployee(employee); // Show new employee
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.email) {
      alert('Please fill in name and email');
      return;
    }
    const added = await createEmployee(newEmployee);
    setEmployees([added, ...employees]);
    setShowAddModal(false);
    setNewEmployee({ name: '', email: '', role: '', department: '', status: 'Active' });
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      await deleteEmployee(id);
      setEmployees(employees.filter(emp => emp.id !== id));
      if (selectedEmployee?.id === id) setSelectedEmployee(null);
    }
  };

  const handleEditClick = (employee) => {
    setEditingEmployee(employee);
    setEditForm({
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      status: employee.status,
      phone: employee.phone || '',
      location: employee.location || ''
    });
  };

  const handleUpdateEmployee = async () => {
    const updated = await updateEmployee(editingEmployee.id, editForm);
    setEmployees(employees.map(emp => emp.id === editingEmployee.id ? updated : emp));
    setSelectedEmployee(updated);
    setEditingEmployee(null);
    alert('Employee updated successfully!');
  };

  if (loading) {
    return (
      <div className="employees-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employees-page">
      <div className="page-header">
        <h1>Employees</h1>
        <p className="page-description">Manage your team members and their account permissions here.</p>
      </div>

      {/* Departments Filter and Add Button Row */}
      <div className="filter-add-row">
        <div className="departments-filter">
          {/* <label>Departments</label> */}
          <select 
            value={departmentFilter} 
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="dept-select"
          >
            {departments.map(dept => (
              <option key={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <button className="add-btn-top" onClick={() => setShowAddModal(true)}>
          + Add Employee
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="employees-container">
        {/* Left Side - Employee List */}
        <div className="employees-list">
          <div className="employee-items">
            {filteredEmployees.map(emp => (
              <div 
                key={emp.id} 
                className={`employee-item ${selectedEmployee?.id === emp.id ? 'active' : ''}`}
                onClick={() => toggleEmployeeDetails(emp)}
              >
                <div className="employee-name-line">
                  <strong>{emp.name}</strong>
                </div>
                <div className="employee-email-line">{emp.email}</div>
                <div className="employee-info-line">
                  <span>{emp.role}</span>
                  <span>{emp.department}</span>
                  <span className={`status ${emp.status.toLowerCase().replace(' ', '-')}`}>
                    {emp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Employee Details (shows only when selected) */}
        {selectedEmployee && (
          <div className="employee-details-panel">
            <div className="details-header">
              <h3>Employee Details</h3>
            </div>

            {editingEmployee?.id === selectedEmployee.id ? (
              // Edit Form
              <div className="edit-form">
                <div className="form-group">
                  <label>NAME</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>EMAIL</label>
                  <input
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>ROLE</label>
                  <input
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>DEPARTMENT</label>
                  <select
                    value={editForm.department}
                    onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                  >
                    <option>Engineering</option>
                    <option>Human Resources</option>
                    <option>Marketing</option>
                    <option>Sales</option>
                    <option>Finance</option>
                    <option>Operations</option>
                    <option>IT</option>
                    <option>Product</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>STATUS</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  >
                    <option>Active</option>
                    <option>Remote</option>
                    <option>On Leave</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>PHONE</label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>LOCATION</label>
                  <input
                    value={editForm.location}
                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  />
                </div>
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleUpdateEmployee}>Save</button>
                  <button className="cancel-btn" onClick={() => setEditingEmployee(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              // View Details
              <>
                <div className="details-avatar">
                  <div className="avatar-large">{selectedEmployee.avatar}</div>
                  <h2>{selectedEmployee.name}</h2>
                  <p>{selectedEmployee.email}</p>
                </div>

                <div className="details-section">
                  <div className="detail-row">
                    <label>ROLE</label>
                    <span>{selectedEmployee.role}</span>
                  </div>
                  <div className="detail-row">
                    <label>DEPARTMENT</label>
                    <span>{selectedEmployee.department}</span>
                  </div>
                  <div className="detail-row">
                    <label>STATUS</label>
                    <span className={`status ${selectedEmployee.status.toLowerCase().replace(' ', '-')}`}>
                      {selectedEmployee.status}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>EMAIL</label>
                    <span>{selectedEmployee.email}</span>
                  </div>
                  <div className="detail-row">
                    <label>PHONE</label>
                    <span>{selectedEmployee.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label>JOIN DATE</label>
                    <span>{selectedEmployee.joinDate}</span>
                  </div>
                  <div className="detail-row">
                    <label>LOCATION</label>
                    <span>{selectedEmployee.location || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label>COMPANY</label>
                    <span>{selectedEmployee.company}</span>
                  </div>
                </div>

                <div className="details-actions">
                  <button className="edit-profile-btn" onClick={() => handleEditClick(selectedEmployee)}>
                     Edit
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteEmployee(selectedEmployee.id)}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Employee</h2>
              <button onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Full Name *"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
              />
              <input
                type="email"
                placeholder="Email *"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
              />
              <input
                type="text"
                placeholder="Role"
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
              />
              <select
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
              >
                <option value="">Select Department</option>
                <option>Engineering</option>
                <option>Human Resources</option>
                <option>Marketing</option>
                <option>Sales</option>
                <option>Finance</option>
                <option>Operations</option>
                <option>IT</option>
                <option>Product</option>
              </select>
              <select
                value={newEmployee.status}
                onChange={(e) => setNewEmployee({...newEmployee, status: e.target.value})}
              >
                <option>Active</option>
                <option>Remote</option>
                <option>On Leave</option>
                <option>Inactive</option>
              </select>
            </div>
            <div className="modal-footer">
              <button className="cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="submit" onClick={handleAddEmployee}>Add Employee</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;