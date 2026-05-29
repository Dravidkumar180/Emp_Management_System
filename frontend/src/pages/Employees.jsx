import React, { useState, useEffect, useCallback } from 'react';
import { getAllEmployees, createEmployee, updateEmployee, deleteEmployee } from '../services/api';
import { Toaster, toast } from 'react-hot-toast';
import './Employees.css';
import { useNotifications } from '../context/NotificationContext';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statusEditingId, setStatusEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    status: 'Active',
    phone: '',
    location: '',
    joinDate: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const itemsPerPage = 5;
  const statusOptions = ['Active', 'Remote', 'On Leave', 'Inactive'];

  // Load employees
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllEmployees();
      console.log('Loaded employees:', data.length);
      setEmployees(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Get unique departments
  const departments = ['All Departments', ...new Set(employees.map(emp => emp.department))];

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = searchTerm === '' || 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === '' || departmentFilter === 'All Departments' || emp.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.email.includes('@')) errors.email = 'Invalid email format';
    if (!formData.role) errors.role = 'Role is required';
    if (!formData.department) errors.department = 'Department is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: '',
      department: '',
      status: 'Active',
      phone: '',
      location: '',
      joinDate: ''
    });
    setFormErrors({});
  };

  // Function to notify dashboard about data changes
  const notifyDashboardUpdate = () => {
    // Dispatch custom event to notify dashboard that employees data has changed
    window.dispatchEvent(new CustomEvent('employeesUpdated', { 
      detail: { message: 'Employee data has been updated' } 
    }));
    console.log('📢 Dashboard notified about employee data change');
  };

  const { addNotification } = useNotifications();

  const handleStatusChange = async (employee, status) => {
    try {
      await updateEmployee(employee.id, { ...employee, status });
      setStatusEditingId(null);
      await loadEmployees();
      if (selectedEmployee?.id === employee.id) {
        setSelectedEmployee({ ...selectedEmployee, status });
      }
      toast.success('Status updated successfully!');
      addNotification({ type: 'info', title: 'Employee Status', message: `${employee.name} status set to ${status}` });
      notifyDashboardUpdate();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Add employee
  const handleAddEmployee = async () => {
    if (!validateForm()) return;
    
    try {
      const employeeToAdd = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        status: formData.status,
        phone: formData.phone || '',
        location: formData.location || '',
        joinDate: formData.joinDate || new Date().toISOString().split('T')[0]
      };
      await createEmployee(employeeToAdd);
      await loadEmployees();
      setShowAddModal(false);
      resetForm();
      toast.success('Employee added successfully!');
      
      // 🟢 Notify dashboard about the change
      notifyDashboardUpdate();
      addNotification({ type: 'success', title: 'Employee Added', message: `${employeeToAdd.name} added to ${employeeToAdd.department}` });
      
    } catch (error) {
      toast.error('Failed to add employee');
    }
  };

  // Edit employee
  const handleEditClick = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      status: employee.status,
      phone: employee.phone || '',
      location: employee.location || '',
      joinDate: employee.joinDate || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async () => {
    if (!validateForm()) return;
    
    try {
      await updateEmployee(selectedEmployee.id, formData);
      await loadEmployees();
      setShowEditModal(false);
      setSelectedEmployee(null);
      resetForm();
      toast.success('Employee updated successfully!');
      
      // 🟢 Notify dashboard about the change
      notifyDashboardUpdate();
      addNotification({ type: 'success', title: 'Employee Updated', message: `${formData.name} updated` });
      
    } catch (error) {
      toast.error('Failed to update employee');
    }
  };

  // Delete employee
  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id);
        await loadEmployees();
        if (selectedEmployee?.id === id) setSelectedEmployee(null);
        toast.success('Employee deleted successfully!');
        
        // 🟢 Notify dashboard about the change
        notifyDashboardUpdate();
          addNotification({ type: 'warning', title: 'Employee Deleted', message: `Employee removed from system` });
        
      } catch (error) {
        toast.error('Failed to delete employee');
      }
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
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
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="page-header">
        <h1>Employees</h1>
        <p className="page-description">Manage your team members, search, and filter by department.</p>
        <p className="db-status">📊 Total: {employees.length} employees</p>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Filter and Add Button */}
      <div className="filter-add-row">
        <div className="departments-filter">
          <label>Department:</label>
          <select 
            value={departmentFilter} 
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setCurrentPage(1);
            }}
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

      {/* Employee Table and Details Panel - Two Column Layout */}
      <div className="employees-main-layout">
        {/* Left Side - Employee Table */}
        <div className="employees-table-wrapper">
          <table className="employees-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>ROLE</th>
                <th>DEPARTMENT</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                    No employees found
                    </td>
                </tr>
              ) : (
                paginatedEmployees.map(emp => (
                  <tr key={emp.id} onClick={() => setSelectedEmployee(emp)}>
                    <td>
                      <div className="employee-cell">
                        <div className="employee-avatar">{emp.avatar}</div>
                        <div>
                          <div className="employee-name">{emp.name}</div>
                          <div className="employee-email">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.role}</td>
                    <td>{emp.department}</td>
                    <td>
                      {statusEditingId === emp.id ? (
                        <select
                          value={emp.status}
                          onChange={(e) => handleStatusChange(emp, e.target.value)}
                          onBlur={() => setStatusEditingId(null)}
                          className="status-select"
                        >
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`status status-${emp.status?.toLowerCase().replace(' ', '-')}`}
                          title="Click or tap to edit status"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusEditingId(emp.id);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            setStatusEditingId(emp.id);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {emp.status}
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="action-edit"
                        aria-label={`Edit ${emp.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(emp);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="action-delete"
                        aria-label={`Delete ${emp.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEmployee(emp.id);
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-numbers">
              <button 
                className="page-nav"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ←
              </button>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      className={`page-number ${currentPage === pageNumber ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                  return <span key={pageNumber} className="page-dots">...</span>;
                }
                return null;
              })}
              
              <button 
                className="page-nav"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                →
              </button>
            </div>
          )}
        </div>

        {/* Right Side - Employee Details Panel (Shows when employee is selected) */}
        {selectedEmployee && !showEditModal && (
          <div className="employee-details-panel">
            <div className="details-header">
              <h3>EMPLOYEE PROFILE</h3>
              <button className="close-details" onClick={() => setSelectedEmployee(null)}>×</button>
            </div>

            <div className="details-avatar">
              <div className="avatar-large">{selectedEmployee.avatar}</div>
              <h2>{selectedEmployee.name}</h2>
              <p>{selectedEmployee.role}</p>
            </div>

            <div className="details-section">
              <div className="detail-row">
                <label>ID</label>
                <span>{selectedEmployee.id}</span>
              </div>
              <div className="detail-row">
                <label>DEPARTMENT</label>
                <span>{selectedEmployee.department}</span>
              </div>
              <div className="detail-row">
                <label>STATUS</label>
                <span className={`status ${selectedEmployee.status?.toLowerCase().replace(' ', '-')}`}>
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
            </div>

            <div className="details-actions">
              <button className="message-btn">Message</button>
              <button className="edit-profile-btn" onClick={() => handleEditClick(selectedEmployee)}>Edit Profile</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal - Popup Style */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="popup-modal-header">
              <h2>Add Employee</h2>
            </div>
            
            <div className="popup-modal-body">
              {/* Name and Role */}
              <div className="popup-form-row">
                <div className="popup-form-group">
                  <label>Name <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={formErrors.name ? 'error' : ''}
                  />
                  {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                </div>
                
                <div className="popup-form-group">
                  <label>Role <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter role"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className={formErrors.role ? 'error' : ''}
                  />
                  {formErrors.role && <span className="error-text">{formErrors.role}</span>}
                </div>
              </div>
              
              {/* Status and Email */}
              <div className="popup-form-row">
                <div className="popup-form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option>Active</option>
                    <option>Remote</option>
                    <option>On Leave</option>
                    <option>Inactive</option>
                  </select>
                </div>
                
                <div className="popup-form-group">
                  <label>Email <span className="required">*</span></label>
                  <input
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={formErrors.email ? 'error' : ''}
                  />
                  {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                </div>
              </div>
              
              {/* Department and Joined Date */}
              <div className="popup-form-row">
                <div className="popup-form-group">
                  <label>Department <span className="required">*</span></label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className={formErrors.department ? 'error' : ''}
                  >
                    <option value="">Select Department</option>
                    <option>IT Department</option>
                    <option>Engineering</option>
                    <option>Human Resources</option>
                    <option>Marketing</option>
                    <option>Sales</option>
                    <option>Finance</option>
                    <option>Operations</option>
                    <option>Product</option>
                    <option>Design</option>
                    <option>Data</option>
                  </select>
                  {formErrors.department && <span className="error-text">{formErrors.department}</span>}
                </div>
                
                <div className="popup-form-group">
                  <label>Joined Date</label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="popup-modal-footer">
              <button className="popup-cancel-btn" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button 
                className="popup-submit-btn" 
                onClick={handleAddEmployee}
                disabled={!formData.name.trim() || !formData.email.trim() || !formData.role.trim() || !formData.department}
              >
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); resetForm(); }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Employee</h2>
              <button className="modal-close" onClick={() => { setShowEditModal(false); resetForm(); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Full Name</label><input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={formErrors.name ? 'error' : ''} />{formErrors.name && <span className="error-text">{formErrors.name}</span>}</div>
              <div className="form-group"><label>Email</label><input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={formErrors.email ? 'error' : ''} />{formErrors.email && <span className="error-text">{formErrors.email}</span>}</div>
              <div className="form-group"><label>Role</label><input value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className={formErrors.role ? 'error' : ''} />{formErrors.role && <span className="error-text">{formErrors.role}</span>}</div>
              <div className="form-group"><label>Department</label><select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>
                <option>Marketing</option><option>Data</option><option>Product</option><option>Human Resources</option>
                <option>Design</option><option>Engineering</option><option>Sales</option><option>Finance</option>
              </select></div>
              <div className="form-group"><label>Status</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option>Active</option><option>Remote</option><option>On Leave</option><option>Inactive</option>
              </select></div>
              <div className="form-group"><label>Phone</label><input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="form-group"><label>Location</label><input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => { setShowEditModal(false); resetForm(); }}>Cancel</button>
              <button className="btn-submit" onClick={handleUpdateEmployee}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;