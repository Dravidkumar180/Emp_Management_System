// Shows the employees page.
import React, { useState, useEffect, useCallback } from 'react';
import { getAllEmployees, createEmployee, updateEmployee, deleteEmployee } from '../services/api';
import { logAuditAction } from '../services/audit';
import { Toaster, toast } from 'react-hot-toast';
import './Employees.css';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const PROFILE_COMPLETION_THRESHOLD = 80;

const PROFILE_FIELDS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'department', label: 'Department' },
  { key: 'designation', label: 'Designation' },
  { key: 'profilePicture', label: 'Profile Picture' },
  { key: 'address', label: 'Address' },
  { key: 'dateOfJoining', label: 'Date of Joining' },
  { key: 'employeeId', label: 'Employee ID' }
];

// Prepares split employee name.
const splitEmployeeName = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ')
  };
};

// Gets join date data.
const getJoinDate = (employee = {}) => employee.joinDate || employee.join_date || '';

// Gets profile values data.
const getProfileValues = (employee = {}) => {
  const { firstName, lastName } = splitEmployeeName(employee.name);
  return {
    firstName,
    lastName,
    email: employee.email,
    phone: employee.phone,
    department: employee.department,
    designation: employee.role,
    profilePicture: employee.avatar,
    address: employee.location,
    dateOfJoining: getJoinDate(employee),
    employeeId: employee.id
  };
};

// Checks has profile value.
const hasProfileValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

// Helps with calculate profile completion.
const calculateProfileCompletion = (employee = {}) => {
  const values = getProfileValues(employee);
  // Prepares completed.
  const completed = PROFILE_FIELDS.filter((field) => hasProfileValue(values[field.key]));
  const missingFields = PROFILE_FIELDS
    .filter((field) => !hasProfileValue(values[field.key]))
    .map((field) => field.label);

  return {
    percentage: Math.round((completed.length / PROFILE_FIELDS.length) * 100),
    missingFields
  };
};

// Gets completion class data.
const getCompletionClass = (percentage) => {
  if (percentage === 100) return 'complete';
  if (percentage < PROFILE_COMPLETION_THRESHOLD) return 'low';
  return 'good';
};

// Checks is image avatar.
const isImageAvatar = (avatar = '') => /^(https?:|data:image\/)/i.test(String(avatar).trim());

// Helps with render avatar.
const renderAvatar = (employee, className) => {
  const avatar = employee?.avatar || employee?.name?.charAt(0)?.toUpperCase() || '?';
  if (isImageAvatar(avatar)) {
    return <img className={`${className} avatar-image`} src={avatar} alt={`${employee.name} profile`} />;
  }
  return <div className={className}>{avatar}</div>;
};

// Shows the employees component.
const Employees = () => {
  // Gets current user.
  const { user } = useAuth();
  // Stores employee list.
  const [employees, setEmployees] = useState([]);
  // Tracks loading state.
  const [loading, setLoading] = useState(true);
  // Stores search text.
  const [searchTerm, setSearchTerm] = useState('');
  // Stores department filter.
  const [departmentFilter, setDepartmentFilter] = useState('');
  // Stores profile filter.
  const [profileFilter, setProfileFilter] = useState('All Profiles');
  // Stores selected employee.
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  // Controls add modal.
  const [showAddModal, setShowAddModal] = useState(false);
  // Controls edit modal.
  const [showEditModal, setShowEditModal] = useState(false);
  // Tracks status editing row.
  const [statusEditingId, setStatusEditingId] = useState(null);
  // Stores current page.
  const [currentPage, setCurrentPage] = useState(1);
  // Stores form values.
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    status: 'Active',
    phone: '',
    location: '',
    joinDate: '',
    avatar: '',
    firstName: '',
    lastName: ''
  });
  // Stores form errors.
  const [formErrors, setFormErrors] = useState({});
  // Stores saved departments.
  const [savedDepartments, setSavedDepartments] = useState([]);

  const itemsPerPage = 5;
  const statusOptions = ['Active', 'Remote', 'On Leave', 'Inactive'];
  const currentCompanyId = user?.companyId || 'company-a';
  const currentCompanyName = currentCompanyId === 'company-b' ? 'Company B' : 'Company A';

  const defaultDepartments = [
    'IT Department',
    'Engineering',
    'Human Resources',
    'Marketing',
    'Sales',
    'Finance',
    'Operations',
    'Product',
    'Design',
    'Data'
  ];

  // Loads saved departments.
  const loadSavedDepartments = useCallback(() => {
    const departmentsFromStorage = JSON.parse(localStorage.getItem('departments') || '[]');
    setSavedDepartments(departmentsFromStorage);
  }, []);

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

  // Runs when this screen needs to update data.
  useEffect(() => {
    loadEmployees();
    loadSavedDepartments();

    // Reloads departments after changes.
    const handleDepartmentsUpdated = () => {
      loadSavedDepartments();
    };

    // Listens for department updates.
    window.addEventListener('departmentsUpdated', handleDepartmentsUpdated);

    return () => {
      // Removes department listener.
      window.removeEventListener('departmentsUpdated', handleDepartmentsUpdated);
    };
  }, [loadEmployees, loadSavedDepartments]);

  // Prepares company employees.
  const companyEmployees = employees.filter(emp => (emp.companyId || 'company-a') === currentCompanyId);

  // Builds unique department options.
  const departmentOptions = [
    ...new Set(
      [...companyEmployees.map(emp => emp.department), ...savedDepartments, ...defaultDepartments]
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b));
  // Adds all departments option.
  const departments = ['All Departments', ...departmentOptions];

  // Filters employees for table.
  const filteredEmployees = companyEmployees.filter(emp => {
    // Checks name or email search.
    const matchesSearch = searchTerm === '' || 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    // Checks department filter.
    const matchesDept = departmentFilter === '' || departmentFilter === 'All Departments' || emp.department === departmentFilter;
    const completion = calculateProfileCompletion(emp).percentage;
    // Checks profile completion filter.
    const matchesProfile =
      profileFilter === 'All Profiles' ||
      (profileFilter === 'Incomplete Profiles' && completion < 100) ||
      (profileFilter === 'Below Threshold' && completion < PROFILE_COMPLETION_THRESHOLD) ||
      (profileFilter === 'Complete Profiles' && completion === 100);
    return matchesSearch && matchesDept && matchesProfile;
  });

  // Calculates profile stats.
  const profileStats = companyEmployees.reduce((stats, emp) => {
    const completion = calculateProfileCompletion(emp).percentage;
    return {
      total: stats.total + completion,
      incomplete: stats.incomplete + (completion < 100 ? 1 : 0),
      belowThreshold: stats.belowThreshold + (completion < PROFILE_COMPLETION_THRESHOLD ? 1 : 0)
    };
  }, { total: 0, incomplete: 0, belowThreshold: 0 });
  // Calculates average completion.
  const averageCompletion = companyEmployees.length
    ? Math.round(profileStats.total / companyEmployees.length)
    : 0;

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Validates employee form.
  const validateForm = () => {
    const errors = {};
    // Checks required fields.
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.email.includes('@')) errors.email = 'Invalid email format';
    if (!formData.role) errors.role = 'Role is required';
    if (!formData.department) errors.department = 'Department is required';
    // Saves validation errors.
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helps with reset form.
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: '',
      department: '',
      status: 'Active',
      phone: '',
      location: '',
      joinDate: '',
      avatar: '',
      firstName: '',
      lastName: ''
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

  // Handles status change actions.
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
        joinDate: formData.joinDate || new Date().toISOString().split('T')[0],
        avatar: formData.avatar || formData.name.charAt(0).toUpperCase(),
        companyId: currentCompanyId
      };
      // Creates employee record.
      await createEmployee(employeeToAdd);
      // Reloads employee list.
      await loadEmployees();
      // Closes add modal.
      setShowAddModal(false);
      // Clears form data.
      resetForm();
      toast.success('Employee added successfully!');
      
      //  Notify dashboard about the change
      notifyDashboardUpdate();
      addNotification({ type: 'success', title: 'Employee Added', message: `${employeeToAdd.name} added to ${employeeToAdd.department}` });
      
    } catch (error) {
      toast.error('Failed to add employee');
    }
  };

  // Edit employee
  const handleEditClick = (employee) => {
    const { firstName, lastName } = splitEmployeeName(employee.name);
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      firstName,
      lastName,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      status: employee.status,
      phone: employee.phone || '',
      location: employee.location || '',
      joinDate: getJoinDate(employee),
      avatar: employee.avatar || ''
    });
    setShowEditModal(true);
  };

  // Handles update employee actions.
  const handleUpdateEmployee = async () => {
    if (!validateForm()) return;
    
    try {
      const updatedEmployeeData = {
        ...selectedEmployee,
        name: `${formData.firstName} ${formData.lastName}`.trim() || formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        status: formData.status,
        phone: formData.phone,
        location: formData.location,
        joinDate: formData.joinDate,
        avatar: formData.avatar || formData.firstName?.charAt(0).toUpperCase() || selectedEmployee.avatar
      };
      const oldCompletion = calculateProfileCompletion(selectedEmployee).percentage;
      const newCompletion = calculateProfileCompletion(updatedEmployeeData).percentage;

      await updateEmployee(selectedEmployee.id, updatedEmployeeData);
      if (oldCompletion !== newCompletion) {
        await logAuditAction({
          action: 'Profile Completion Score Changed',
          entityType: 'employee',
          entityId: selectedEmployee.id,
          entityName: updatedEmployeeData.name,
          details: `${updatedEmployeeData.name} profile completion changed from ${oldCompletion}% to ${newCompletion}%`,
          oldValue: { profileCompletion: oldCompletion },
          newValue: { profileCompletion: newCompletion }
        });
      }
      if (oldCompletion < 100 && newCompletion === 100) {
        await logAuditAction({
          action: 'Profile Reached 100% Completion',
          entityType: 'employee',
          entityId: selectedEmployee.id,
          entityName: updatedEmployeeData.name,
          details: `${updatedEmployeeData.name} reached 100% profile completion`,
          newValue: { profileCompletion: newCompletion }
        });
      }
      await loadEmployees();
      setShowEditModal(false);
      setSelectedEmployee(null);
      resetForm();
      toast.success('Employee updated successfully!');
      
      // Updates dashboard data.
      notifyDashboardUpdate();
      // Shows update notification.
      addNotification({ type: 'success', title: 'Employee Updated', message: `${updatedEmployeeData.name} updated` });
      // Warns for low completion.
      if (newCompletion < PROFILE_COMPLETION_THRESHOLD) {
        addNotification({
          type: 'warning',
          title: 'Profile Completion Alert',
          message: `${updatedEmployeeData.name} is below ${PROFILE_COMPLETION_THRESHOLD}% profile completion`
        });
      }
      // Shows complete profile message.
      if (oldCompletion < 100 && newCompletion === 100) {
        addNotification({
          type: 'success',
          title: 'Profile Complete',
          message: `${updatedEmployeeData.name} reached 100% profile completion`
        });
      }
      
    } catch (error) {
      // Shows update failure.
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

  // Handles page change actions.
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
        <p className="page-description">Manage {currentCompanyName} team members, search, and filter by department.</p>
        <p className="db-status">Total: {companyEmployees.length} employees in {currentCompanyName}</p>
      </div>

      <div className="profile-summary">
        <div>
          <strong>Profile Completion: {averageCompletion}%</strong>
          <p>{profileStats.belowThreshold} employee(s) are below the {PROFILE_COMPLETION_THRESHOLD}% readiness threshold.</p>
        </div>
        <span>Complete profiles improve account readiness.</span>
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
        <div className="filter-controls">
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
          <div className="departments-filter">
            <label>Profile:</label>
            <select
              value={profileFilter}
              onChange={(e) => {
                setProfileFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="dept-select"
            >
              <option>All Profiles</option>
              <option>Incomplete Profiles</option>
              <option>Below Threshold</option>
              <option>Complete Profiles</option>
            </select>
          </div>
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
                <th>PROFILE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                    No employees found
                    </td>
                </tr>
              ) : (
                paginatedEmployees.map(emp => (
                  <tr key={emp.id} onClick={() => setSelectedEmployee(emp)}>
                    {(() => {
                      const profile = calculateProfileCompletion(emp);
                      return (
                        <>
                    <td>
                      <div className="employee-cell">
                        {renderAvatar(emp, 'employee-avatar')}
                        <div>
                          <div className="employee-name">{emp.name}</div>
                          <div className="employee-email">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.role}</td>
                    <td>{emp.department}</td>
                    <td>
                      <div className="profile-cell">
                        <span className={`completion-pill ${getCompletionClass(profile.percentage)}`}>{profile.percentage}%</span>
                        <div className="mini-progress" aria-label={`Profile completion ${profile.percentage}%`}>
                          <span style={{ width: `${profile.percentage}%` }}></span>
                        </div>
                        {profile.missingFields.length > 0 && (
                          <small>{profile.missingFields.length} missing</small>
                        )}
                      </div>
                    </td>
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
                        </>
                      );
                    })()}
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
              {renderAvatar(selectedEmployee, 'avatar-large')}
              <h2>{selectedEmployee.name}</h2>
              <p>{selectedEmployee.role}</p>
            </div>

            <div className="details-section">
              {(() => {
                const profile = calculateProfileCompletion(selectedEmployee);
                return (
                  <div className="profile-details-card">
                    <div className="profile-details-header">
                      <span>Profile Completion</span>
                      <strong>{profile.percentage}%</strong>
                    </div>
                    <div className="profile-progress">
                      <span style={{ width: `${profile.percentage}%` }}></span>
                    </div>
                    <p>Complete your profile to improve account readiness.</p>
                    {profile.missingFields.length > 0 ? (
                      <div className="missing-info">
                        <strong>Missing Information:</strong>
                        <ul>
                          {profile.missingFields.map((field) => (
                            <li key={field}>{field}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="profile-complete-note">All required profile information is complete.</p>
                    )}
                  </div>
                );
              })()}
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
                <span>{getJoinDate(selectedEmployee) || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>ADDRESS</label>
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
                    {departmentOptions.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
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
              <div className="form-group"><label>Employee ID</label><input value={selectedEmployee?.id || ''} readOnly /></div>
              <div className="form-group"><label>First Name</label><input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value, name: `${e.target.value} ${formData.lastName}`.trim()})} className={formErrors.name ? 'error' : ''} />{formErrors.name && <span className="error-text">{formErrors.name}</span>}</div>
              <div className="form-group"><label>Last Name</label><input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value, name: `${formData.firstName} ${e.target.value}`.trim()})} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={formErrors.email ? 'error' : ''} />{formErrors.email && <span className="error-text">{formErrors.email}</span>}</div>
              <div className="form-group"><label>Phone Number</label><input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="form-group"><label>Department</label><select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select></div>
              <div className="form-group"><label>Designation</label><input value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className={formErrors.role ? 'error' : ''} />{formErrors.role && <span className="error-text">{formErrors.role}</span>}</div>
              <div className="form-group"><label>Profile Picture</label><input value={formData.avatar} onChange={(e) => setFormData({...formData, avatar: e.target.value})} placeholder="Initials, image URL, or avatar text" /></div>
              <div className="form-group"><label>Address</label><input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} /></div>
              <div className="form-group"><label>Date of Joining</label><input type="date" value={formData.joinDate} onChange={(e) => setFormData({...formData, joinDate: e.target.value})} /></div>
              <div className="form-group"><label>Status</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option>Active</option><option>Remote</option><option>On Leave</option><option>Inactive</option>
              </select></div>
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
