import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Input from '../components/common/Input';
import StatusBadge from '../components/common/StatusBadge';
import { fetchEmployees } from '../services/api';
import './Attendance.css';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const data = await fetchEmployees();
      const today = new Date().toISOString().split('T')[0];
      const attendanceData = data.map(emp => ({
        ...emp,
        date: today,
        checkIn: '09:00 AM',
        checkOut: '06:00 PM',
        hoursWorked: '8h'
      }));
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = attendance.filter(record =>
    record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedAttendance = filteredAttendance.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
  const presentCount = attendance.filter(a => a.status === 'Active').length;
  const attendanceRate = Math.round((presentCount / attendance.length) * 100);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading attendance records...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="attendance-page">
        <div className="page-header">
          <div>
            <h1>Attendance</h1>
            <p>Track daily attendance records by employee</p>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-value">{attendance.length}</div>
              <div className="stat-label">Total Employees</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">{presentCount}</div>
              <div className="stat-label">Present Today</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-value">{attendanceRate}%</div>
              <div className="stat-label">Attendance Rate</div>
            </div>
          </div>
        </div>

        <div className="filters-section">
          <Input
            type="text"
            placeholder="Search by employee name or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon="🔍"
          />
        </div>

        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAttendance.map(record => (
                <tr key={record.id}>
                  <td>
                    <div className="employee-cell">
                      <div className="employee-avatar">{record.avatar}</div>
                      <div>
                        <div className="employee-name">{record.name}</div>
                        <div className="employee-email">{record.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{record.department}</td>
                  <td>{record.date}</td>
                  <td>{record.checkIn}</td>
                  <td>{record.checkOut}</td>
                  <td>{record.hoursWorked}</td>
                  <td><StatusBadge status={record.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAttendance.length === 0 && (
          <div className="no-results">
            <p>No attendance records found</p>
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
              Page {currentPage} of {totalPages}
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
      </div>
    </DashboardLayout>
  );
};

export default Attendance;