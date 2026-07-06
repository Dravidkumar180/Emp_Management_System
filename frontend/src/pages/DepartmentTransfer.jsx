// Shows the department transfer page.
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getAllEmployees, updateEmployee } from '../services/api';
import { logAuditAction } from '../services/audit';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import './DepartmentTransfer.css';

const TRANSFERS_KEY = 'departmentTransfers';

const DEFAULT_DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Finance',
  'Marketing',
  'Human Resources',
  'Operations',
  'Product',
  'Design',
  'Data'
];

const DEPARTMENT_PERMISSIONS = {
  Engineering: ['codebase', 'deployments', 'technical-docs'],
  Sales: ['crm', 'pipeline', 'contracts'],
  Finance: ['billing', 'payroll', 'reports'],
  Marketing: ['campaigns', 'analytics', 'brand-assets'],
  'Human Resources': ['employee-records', 'policies', 'onboarding'],
  Operations: ['vendors', 'facilities', 'procurement'],
  Product: ['roadmap', 'feedback', 'releases'],
  Design: ['design-system', 'prototypes', 'research'],
  Data: ['warehouse', 'dashboards', 'exports']
};

// Reads json data from storage.
const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

// Employee notice
const writeEmployeeNotification = (employee, transfer) => {
  // Skip missing email
  if (!employee?.email) return;

  // User company
  const companyId = employee.companyId || employee.company_id || 'company-a';
  // Notification key
  const storageKey = `notifications:${employee.email}:user:${companyId}`;
  const notifications = readJson(storageKey, []);
  // New notification
  const nextNotification = {
    id: `transfer-${Date.now()}`,
    type: 'info',
    title: 'Department Changed',
    message: `You have been transferred from ${transfer.fromDepartment} to ${transfer.toDepartment}.`,
    time: new Date().toISOString()
  };

  // Save notification
  localStorage.setItem(storageKey, JSON.stringify([nextNotification, ...notifications]));
};

// Helps with format date time.
const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Shows the department transfer component.
const DepartmentTransfer = () => {
  // Current user
  const { user } = useAuth();
  // App notification
  const { addNotification } = useNotifications();
  // Employee list
  const [employees, setEmployees] = useState([]);
  // Transfer list
  const [transfers, setTransfers] = useState([]);
  // Selected employee
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  // From department
  const [currentDepartment, setCurrentDepartment] = useState('');
  // To department
  const [toDepartment, setToDepartment] = useState('');
  // Transfer date
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  // Transfer reason
  const [reason, setReason] = useState('');
  // Loading
  const [loading, setLoading] = useState(true);
  // Show all
  const [showAll, setShowAll] = useState(false);
  // Full history
  const [showFullHistory, setShowFullHistory] = useState(false);
  // Filter panel
  const [showHistoryFilters, setShowHistoryFilters] = useState(false);
  // Department filter
  const [historyDepartmentFilter, setHistoryDepartmentFilter] = useState('All Departments');
  // Status filter
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All Statuses');

  // Current company
  const currentCompanyId = user?.companyId || user?.company_id || 'company-a';

  // Runs when this screen needs to update data.
  useEffect(() => {
    // Gets page data.
    const loadPageData = async () => {
      try {
        setLoading(true);
        const allEmployees = await getAllEmployees();
        // Prepares company employees.
        const companyEmployees = allEmployees.filter((employee) => (
          (employee.companyId || employee.company_id || 'company-a') === currentCompanyId
        ));
        setEmployees(companyEmployees);

        const savedTransfers = readJson(TRANSFERS_KEY, []);
        setTransfers(savedTransfers.filter((transfer) => transfer.companyId === currentCompanyId));

        if (companyEmployees.length > 0) {
          setSelectedEmployeeId(String(companyEmployees[0].id));
        }
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [currentCompanyId]);

  // Prepares departments.
  const departments = useMemo(() => {
    const savedDepartments = readJson('departments', []);
    return [...new Set([
      ...employees.map((employee) => employee.department),
      ...savedDepartments,
      ...DEFAULT_DEPARTMENTS
    ].filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [employees]);

  // Prepares selected employee.
  const selectedEmployee = employees.find((employee) => String(employee.id) === selectedEmployeeId);
  // Prepares transfer targets.
  const transferTargets = departments.filter((department) => department !== currentDepartment);
  const visibleTransfers = showAll ? transfers : transfers.slice(0, 1);
  // Prepares history departments.
  const historyDepartments = useMemo(() => {
    return [...new Set(
      transfers.flatMap((transfer) => [transfer.fromDepartment, transfer.toDepartment]).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }, [transfers]);
  // Prepares history statuses.
  const historyStatuses = useMemo(() => {
    return [...new Set(transfers.map((transfer) => transfer.status || 'Completed'))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [transfers]);
  // Filter history
  const filteredHistoryTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      // Transfer status
      const status = transfer.status || 'Completed';
      // Department match
      const matchesDepartment = historyDepartmentFilter === 'All Departments'
        || transfer.fromDepartment === historyDepartmentFilter
        || transfer.toDepartment === historyDepartmentFilter;
      // Status match
      const matchesStatus = historyStatusFilter === 'All Statuses' || status === historyStatusFilter;

      // Keep matching
      return matchesDepartment && matchesStatus;
    });
  }, [historyDepartmentFilter, historyStatusFilter, transfers]);
  // Visible history
  const historyTransfers = showFullHistory ? filteredHistoryTransfers : filteredHistoryTransfers.slice(0, 5);
  // Has filters
  const hasHistoryFilters = historyDepartmentFilter !== 'All Departments' || historyStatusFilter !== 'All Statuses';
  // Form ready
  const isTransferReady = Boolean(
    selectedEmployee && currentDepartment && toDepartment && effectiveDate && reason.trim() && transferTargets.length
  );

  // Runs when this screen needs to update data.
  useEffect(() => {
    setCurrentDepartment(selectedEmployee?.department || departments[0] || '');
  }, [departments, selectedEmployee]);

  // Runs when this screen needs to update data.
  useEffect(() => {
    if (!toDepartment && transferTargets.length > 0) {
      setToDepartment(transferTargets[0]);
    }
    if (toDepartment && !transferTargets.includes(toDepartment)) {
      setToDepartment(transferTargets[0] || '');
    }
  }, [toDepartment, transferTargets]);

  // Helps with reset form.
  const resetForm = () => {
    setCurrentDepartment(selectedEmployee?.department || departments[0] || '');
    setToDepartment(transferTargets[0] || '');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setReason('');
  };

  // Handles transfer actions.
  const handleTransfer = async (event) => {
    event.preventDefault();

    if (!selectedEmployee || !currentDepartment || !toDepartment || !effectiveDate || !reason.trim()) {
      toast.error('Please complete the transfer details');
      return;
    }

    const fromDepartment = currentDepartment;
    const transfer = {
      id: Date.now(),
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      employeeCode: selectedEmployee.employeeId || `EMP-${selectedEmployee.id}`,
      employeeEmail: selectedEmployee.email,
      fromDepartment,
      toDepartment,
      effectiveDate,
      reason: reason.trim(),
      status: 'Completed',
      companyId: currentCompanyId,
      transferredAt: new Date().toISOString(),
      transferredBy: user?.name || user?.email || 'Admin'
    };

    // Updated employee
    const updatedEmployee = {
      ...selectedEmployee,
      department: toDepartment,
      departmentPermissions: DEPARTMENT_PERMISSIONS[toDepartment] || [],
      accessScope: toDepartment
    };

    try {
      // Save employee
      await updateEmployee(selectedEmployee.id, updatedEmployee);

      // Save transfer
      const allTransfers = readJson(TRANSFERS_KEY, []);
      const nextTransfers = [transfer, ...allTransfers];
      localStorage.setItem(TRANSFERS_KEY, JSON.stringify(nextTransfers));
      setTransfers((prev) => [transfer, ...prev]);
      // Update employee list
      setEmployees((prev) => prev.map((employee) => (
        employee.id === selectedEmployee.id ? updatedEmployee : employee
      )));

      // Notify employee
      writeEmployeeNotification(selectedEmployee, transfer);
      // Notify admin
      addNotification({
        type: 'success',
        title: 'Employee Transferred',
        message: `${selectedEmployee.name} moved to ${toDepartment}.`
      });

      // Audit log
      await logAuditAction({
        action: 'Department Transfer',
        entityType: 'employee',
        entityId: selectedEmployee.id,
        entityName: selectedEmployee.name,
        details: `${selectedEmployee.name} transferred from ${fromDepartment} to ${toDepartment}`,
        oldValue: { department: fromDepartment },
        newValue: {
          department: toDepartment,
          permissions: updatedEmployee.departmentPermissions
        }
      });

      // Refresh employees
      window.dispatchEvent(new CustomEvent('employeesUpdated', {
        detail: { message: 'Employee department transfer completed' }
      }));
      // Success message
      toast.success('Employee transferred successfully');
      // Clear form
      resetForm();
    } catch (error) {
      // Error message
      toast.error('Failed to transfer employee');
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="transfer-loading">
        <div className="transfer-spinner" />
        <p>Loading transfer workspace...</p>
      </div>
    );
  }

  return (
    <div className="transfer-page">
      <header className="transfer-header">
        <div className="transfer-header-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M7 7H20M20 7L16 3M20 7L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 17H4M4 17L8 13M4 17L8 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h1>Employee Department Transfer</h1>
          <p>Transfer employees between departments and manage history, notifications, and audit logs.</p>
        </div>
      </header>

      <div className="transfer-layout">
        <section className="transfer-panel">
          <div className="panel-title">
            <span className="panel-title-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M16 21V19C16 16.8 14.2 15 12 15H6C3.8 15 2 16.8 2 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M19 8V14M22 11H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <h2>Transfer Employee</h2>
          </div>

          <form className="transfer-form" onSubmit={handleTransfer}>
            <label>
              Employee Name <span>*</span>
              <select value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)}>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.employeeId || `EMP-${employee.id}`})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Current Department
              <select className="current-department-select" value={currentDepartment} onChange={(event) => setCurrentDepartment(event.target.value)}>
                {departments.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </label>

            <label>
              Transfer To <span>*</span>
              <select value={toDepartment} onChange={(event) => setToDepartment(event.target.value)}>
                {transferTargets.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </label>

            <label>
              Effective Date <span>*</span>
              <input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} />
            </label>

            <label>
              Reason <span>*</span>
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Promotion, project reassignment, or team move" />
            </label>

            <div className="transfer-actions">
              <button type="button" className="transfer-secondary" onClick={resetForm}>
                Reset
              </button>
              <button type="submit" className="transfer-primary" disabled={!isTransferReady}>
                Transfer Employee
              </button>
            </div>
          </form>
        </section>

        <section className="transfer-panel transfer-history-panel">
          <div className="transfer-history-header">
            <div className="panel-title">
              <span className="panel-title-icon green" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M7 7H20M20 7L16 3M20 7L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 17H4M4 17L8 13M4 17L8 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h2>Recent Transfers</h2>
            </div>
            <button type="button" className="history-toggle" onClick={() => setShowAll((value) => !value)}>
              {showAll ? 'Show Recent' : 'View All History'}
            </button>
          </div>

          <div className="transfer-table-wrap">
            <table className="transfer-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleTransfers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-transfers">No transfers yet</td>
                  </tr>
                ) : visibleTransfers.map((transfer) => (
                  <tr key={transfer.id}>
                    <td>
                      <div className="employee-cell">
                        <div className="employee-avatar">{transfer.employeeName.charAt(0)}</div>
                        <div>
                          <strong>{transfer.employeeName}</strong>
                          <span>{transfer.employeeCode}</span>
                        </div>
                      </div>
                    </td>
                    <td>{transfer.fromDepartment}</td>
                    <td className="target-department">{transfer.toDepartment}</td>
                    <td>{formatDateTime(transfer.transferredAt)}</td>
                    <td><span className="status-pill">Completed</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="transfer-count">Showing {visibleTransfers.length} of {transfers.length} transfers</p>
        </section>
      </div>

      <section className="department-history-panel">
        <div className="department-history-header">
          <div className="panel-title">
            <span className="history-title-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3.05 11A9 9 0 1 1 5.64 17.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M3 17H6.8V13.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2>Department Transfer History</h2>
          </div>
          <button
            type="button"
            className={`history-filter-btn ${showHistoryFilters || hasHistoryFilters ? 'active' : ''}`}
            onClick={() => setShowHistoryFilters((value) => !value)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 5H20L14 12V18L10 20V12L4 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Filter
          </button>
        </div>

        {showHistoryFilters && (
          <div className="history-filter-panel">
            <label>
              Department
              <select value={historyDepartmentFilter} onChange={(event) => setHistoryDepartmentFilter(event.target.value)}>
                <option value="All Departments">All Departments</option>
                {historyDepartments.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select value={historyStatusFilter} onChange={(event) => setHistoryStatusFilter(event.target.value)}>
                <option value="All Statuses">All Statuses</option>
                {historyStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="history-filter-reset"
              onClick={() => {
                setHistoryDepartmentFilter('All Departments');
                setHistoryStatusFilter('All Statuses');
                setShowFullHistory(false);
              }}
            >
              Reset
            </button>
          </div>
        )}

        <div className="department-history-table-wrap">
          <table className="department-history-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Old Department</th>
                <th aria-label="Direction"></th>
                <th>New Department</th>
                <th>Transferred By</th>
                <th>Date &amp; Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {historyTransfers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-transfers">No transfer history yet</td>
                </tr>
              ) : historyTransfers.map((transfer) => (
                <tr key={`history-${transfer.id}`}>
                  <td>
                    <div className="history-employee-cell">
                      <div className="employee-avatar small">{transfer.employeeName.charAt(0)}</div>
                      <div>
                        <strong>{transfer.employeeName}</strong>
                        <span>{transfer.employeeCode}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="department-chip old">{transfer.fromDepartment}</span>
                  </td>
                  <td className="history-arrow">→</td>
                  <td>
                    <span className="department-chip new">{transfer.toDepartment}</span>
                  </td>
                  <td>
                    <strong className="transferred-by">{transfer.transferredBy}</strong>
                    <span className="transfer-role">(Admin)</span>
                  </td>
                  <td>{formatDateTime(transfer.transferredAt)}</td>
                  <td><span className="status-pill">Completed</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredHistoryTransfers.length > 5 && (
          <button type="button" className="view-full-history" onClick={() => setShowFullHistory((value) => !value)}>
            {showFullHistory ? 'Show Recent History' : 'View Full History'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </section>
    </div>
  );
};

export default DepartmentTransfer;
