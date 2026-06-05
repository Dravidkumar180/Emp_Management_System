import React, { useState, useEffect } from 'react';
import { getAllEmployees } from '../services/api';
import './Attendance.css';
import { useNotifications } from '../context/NotificationContext';
import { logAuditAction } from '../services/audit';

const Attendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const itemsPerPage = 8;

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const employees = await getAllEmployees();
      
      // Generate attendance records for today
      const records = employees.map(emp => ({
        id: emp.id,
        employee: emp.name,
        department: emp.department,
        date: selectedDate,
        status: getRandomStatus(),
        avatar: emp.avatar,
        email: emp.email,
        checkIn: getRandomTime('09:00', '10:30'),
        checkOut: getRandomTime('17:00', '18:30'),
        hoursWorked: getRandomHours()
      }));
      
      setAttendanceRecords(records);
      setFilteredRecords(records);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRandomStatus = () => {
    const statuses = ['Active', 'Active', 'Active', 'On Leave', 'Inactive', 'Remote'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getRandomTime = (min, max) => {
    const minTime = new Date(`2000-01-01 ${min}`).getTime();
    const maxTime = new Date(`2000-01-01 ${max}`).getTime();
    const randomTime = new Date(minTime + Math.random() * (maxTime - minTime));
    return randomTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getRandomHours = () => {
    const hours = ['8.5', '8.0', '7.5', '9.0', '8.2'];
    return hours[Math.floor(Math.random() * hours.length)];
  };

  useEffect(() => {
    const filtered = attendanceRecords.filter(record =>
      record.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRecords(filtered);
    setCurrentPage(1);
  }, [searchTerm, attendanceRecords]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const totalEmployees = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'Active').length;
  const onLeaveCount = attendanceRecords.filter(r => r.status === 'On Leave').length;
  const inactiveCount = attendanceRecords.filter(r => r.status === 'Inactive').length;
  const remoteCount = attendanceRecords.filter(r => r.status === 'Remote').length;
  const attendanceRate = Math.round((presentCount / totalEmployees) * 100);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const { addNotification } = useNotifications();

  const handleDateChange = async (e) => {
    const nextDate = e.target.value;
    setSelectedDate(nextDate);
    addNotification({ type: 'info', title: 'Attendance Date', message: `Viewing attendance for ${nextDate}` });
    await logAuditAction({
      action: 'Attendance Viewed',
      entityType: 'attendance',
      entityName: nextDate,
      details: `Attendance date changed to ${nextDate}`,
      oldValue: { date: selectedDate },
      newValue: { date: nextDate }
    });
  };

  const downloadReport = () => {
    try {
      const rows = filteredRecords.map(r => ({
        Employee: r.employee,
        Department: r.department,
        Date: r.date,
        Status: r.status,
        'Check In': r.checkIn || '-',
        'Check Out': r.checkOut || '-',
        Hours: r.hoursWorked || '-'
      }));

      if (rows.length === 0) {
        addNotification({ type: 'info', title: 'Download Report', message: 'No records to download' });
        return;
      }

      const headers = Object.keys(rows[0]);
      const csvContent = [headers.join(',')].concat(
        rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fileName = `attendance-report-${selectedDate}.csv`;
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      addNotification({ type: 'success', title: 'Report Downloaded', message: `Report saved as ${fileName}` });
      logAuditAction({
        action: 'Attendance Report Downloaded',
        entityType: 'attendance',
        entityName: selectedDate,
        details: `Attendance report downloaded for ${selectedDate}`,
        newValue: { date: selectedDate, records: rows.length, fileName }
      });
    } catch (e) {
      console.error('Download failed', e);
      addNotification({ type: 'warning', title: 'Download Failed', message: 'Could not generate report' });
    }
  };

  return (
      <div className="attendance-page">
        {/* Header */}
        <div className="attendance-header">
          <h1>Attendance</h1>
          <p>Track daily attendance records by employee.</p>
        </div>

        {/* Filters */}
        <div className="attendance-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by employee name or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filters-right">
            <div className="date-picker">
              <label>Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
              />
            </div>
            <button className="download-report-btn" onClick={downloadReport} title="Download CSV report">⬇️ Download Report</button>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>DEPARTMENT</th>
                <th>DATE</th>
                <th>STATUS</th>
                <th>CHECK IN</th>
                <th>CHECK OUT</th>
                <th>HOURS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(record => (
                  <tr key={record.id}>
                    <td>
                      <div className="employee-info">
                        <div className="employee-avatar">{record.avatar}</div>
                        <div>
                          <div className="employee-name">{record.employee}</div>
                          <div className="employee-email">{record.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{record.department}</td>
                    <td>{record.date}</td>
                    <td>
                      <span className={`attendance-status status-${record.status.toLowerCase().replace(' ', '-')}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>{record.status === 'Active' ? record.checkIn : '-'}</td>
                    <td>{record.status === 'Active' ? record.checkOut : '-'}</td>
                    <td>{record.status === 'Active' ? `${record.hoursWorked} hrs` : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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

        {/* Summary Footer */}
        <div className="attendance-footer">
          <div className="summary">
            <span className="summary-dot active"></span>
            <span>Present: {presentCount}</span>
            <span className="summary-dot leave"></span>
            <span>On Leave: {onLeaveCount}</span>
            <span className="summary-dot remote"></span>
            <span>Remote: {remoteCount}</span>
            <span className="summary-dot inactive"></span>
            <span>Inactive: {inactiveCount}</span>
          </div>
          <div className="update-time">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
  );
};

export default Attendance;
