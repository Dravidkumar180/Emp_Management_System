// Shows the departments page.
import React, { useState, useEffect } from 'react';
import { getAllEmployees } from '../services/api';
import './Departments.css';
import { useNotifications } from '../context/NotificationContext';
import { logAuditAction } from '../services/audit';

// Shows the departments component.
const Departments = () => {
  // List
  const [departments, setDepartments] = useState([]);
  // Loading
  const [loading, setLoading] = useState(true);
  // Search text
  const [searchTerm, setSearchTerm] = useState('');
  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  // New name
  const [newDepartment, setNewDepartment] = useState('');
  // Add error
  const [addError, setAddError] = useState('');

  // Runs when this screen needs to update data.
  useEffect(() => {
    loadDepartments();
  }, []);

  const { addNotification } = useNotifications();

  // Gets saved departments data.
  const getSavedDepartments = () => {
    return JSON.parse(localStorage.getItem('departments') || '[]');
  };

  // Build list
  const buildDepartmentList = (employees, savedDepartments) => {
    // Count names
    const deptMap = {};
    employees.forEach(emp => {
      if (emp.department) {
        deptMap[emp.department] = (deptMap[emp.department] || 0) + 1;
      }
    });

    // Unique names
    const departmentNames = new Map();
    Object.keys(deptMap).forEach((name) => departmentNames.set(name.toLowerCase(), name));
    savedDepartments.forEach((name) => {
      if (name) departmentNames.set(name.toLowerCase(), name);
    });

    // Sort list
    return [...departmentNames.values()]
      .map((name) => ({ name, count: deptMap[name] || 0 }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Gets departments data.
  const loadDepartments = async () => {
    try {
      setLoading(true);
      const employees = await getAllEmployees();
      setDepartments(buildDepartmentList(employees, getSavedDepartments()));
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save department
  const saveDepartment = async () => {
    // Clean name
    const trimmedName = newDepartment.trim();
    // Required check
    if (!trimmedName) {
      setAddError('Department name is required');
      return;
    }

    // Duplicate check
    if (departments.some((dept) => dept.name.toLowerCase() === trimmedName.toLowerCase())) {
      setAddError('This department already exists');
      return;
    }

    // Saved list
    const savedDepartments = getSavedDepartments();
    // Remove duplicates
    const updatedDepartments = [...savedDepartments, trimmedName]
      .filter((name, index, list) => (
        list.findIndex((item) => item.toLowerCase() === name.toLowerCase()) === index
      ));
    localStorage.setItem('departments', JSON.stringify(updatedDepartments));

    // Update list
    setDepartments((prev) => [...prev, { name: trimmedName, count: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
    // Notify app
    window.dispatchEvent(new CustomEvent('departmentsUpdated', { detail: { department: trimmedName } }));
    setNewDepartment('');
    setAddError('');
    setShowAddModal(false);
    // Success message
    addNotification({ type: 'success', title: 'Department Added', message: `${trimmedName} was created` });
    // Audit log
    await logAuditAction({
      action: 'Department Created',
      entityType: 'department',
      entityName: trimmedName,
      details: `Department ${trimmedName} was created`,
      newValue: { name: trimmedName }
    });
  };

  // Filter departments based on search
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="departments-loading">
        <div className="spinner"></div>
        <p>Loading departments...</p>
      </div>
    );
  }

  return (
      <div className="departments-page">
        {/* Header */}
        <div className="departments-header">
          <div className="departments-header-top">
            <div>
              <h1>Departments</h1>
              <p className="departments-description">Organize employees by department</p>
            </div>
            <button
              type="button"
              className="add-department-btn"
              onClick={() => setShowAddModal(true)}
            >
              + Add Departments
            </button>
          </div>
        </div>

        {showAddModal && (
          <div className="departments-modal-backdrop" onClick={() => setShowAddModal(false)}>
            <div className="departments-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add New Department</h2>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <label htmlFor="department-name">Department Name</label>
                <input
                  id="department-name"
                  type="text"
                  value={newDepartment}
                  onChange={(e) => {
                    setNewDepartment(e.target.value);
                    setAddError('');
                  }}
                  placeholder="Enter a department name"
                />
                {addError && <div className="modal-error">{addError}</div>}
              </div>
              <div className="modal-actions">
                <button className="modal-btn cancel" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="modal-btn save" type="button" onClick={saveDepartment}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="departments-search">
          <div className="search-icon"></div>
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Departments Grid */}
        <div className="departments-grid">
          {filteredDepartments.length === 0 ? (
            <div className="no-departments">
              <p>No departments found</p>
            </div>
          ) : (
            filteredDepartments.map((dept, index) => (
              <div key={index} className="department-card">
                <div className="department-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M16 21V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V21" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div className="department-info">
                  <div className="department-name">{dept.name}</div>
                  <div className="department-stats">
                    <span className="department-count">{dept.count}</span>
                    <span className="department-label">{dept.count === 1 ? 'employee' : 'employees'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Footer */}
        <div className="departments-footer">
          <div className="total-departments">
            <span className="total-label">Total Departments</span>
            <span className="total-value">{departments.length}</span>
          </div>
        </div>
      </div>
  );
};

export default Departments;
