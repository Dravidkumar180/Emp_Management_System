// Shows the attendance page.
import React, { useEffect, useMemo, useState } from 'react';
import { getAllEmployees } from '../services/api';
import './Attendance.css';
import { useNotifications } from '../context/NotificationContext';
import { logAuditAction } from '../services/audit';
import { useAuth } from '../context/AuthContext';
import { formatHolidayDate, getHolidayForDate, refreshCompanyHolidays } from '../services/holidays';

const ACCESS_REQUESTS_KEY = 'attendanceAccessRequests';
const USER_ATTENDANCE_KEY = 'userAttendanceRecords';
const LEAVE_REQUESTS_KEY = 'userLeaveRequests';

// Prepares today key.
const todayKey = () => new Date().toISOString().split('T')[0];
// Helps with normalize company id.
const normalizeCompanyId = (companyId) => companyId || 'company-a';
// Helps with normalize email.
const normalizeEmail = (email = '') => email.trim().toLowerCase();

// Reads data from storage.
const readStorage = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

// Writes storage.
const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Helps with format date time.
const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('sv-SE').replace('T', ' ');
};

// Prepares status label.
const statusLabel = (record) => {
  if (!record) return 'Present';
  if (record.checkIn && !record.checkOut) return 'Checked In';
  return record.status || 'Present';
};

// Prepares status class.
const statusClass = (status) => String(status || 'present').toLowerCase().replace(/\s+/g, '-');
// Checks is currently checked in.
const isCurrentlyCheckedIn = (record) => Boolean(record?.checkIn && !record?.checkOut);

// Gets recent dates data.
const getRecentDates = (count = 7) => {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return date.toISOString().split('T')[0];
  });
};

// Shows the attendance component.
const Attendance = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [accessRequests, setAccessRequests] = useState([]);
  const [userAttendance, setUserAttendance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [holidayVersion, setHolidayVersion] = useState(0);
  const [leaveForm, setLeaveForm] = useState({
    type: 'Vacation',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const isUser = user?.role === 'user';
  const userEmail = normalizeEmail(user?.email);
  const companyId = normalizeCompanyId(user?.companyId || user?.company_id);
  const itemsPerPage = 8;

  // Prepares current access request.
  const currentAccessRequest = useMemo(() => (
    accessRequests.find((request) => request.email === userEmail && request.companyId === companyId)
  ), [accessRequests, companyId, userEmail]);

  // Prepares today attendance.
  const todayAttendance = useMemo(() => (
    userAttendance.find((record) => record.email === userEmail && record.companyId === companyId && record.date === todayKey())
  ), [companyId, userAttendance, userEmail]);

  // Prepares today holiday.
  const todayHoliday = useMemo(() => (
    getHolidayForDate(companyId, todayKey())
  ), [companyId, holidayVersion]);

  // Prepares selected date holiday.
  const selectedDateHoliday = useMemo(() => (
    getHolidayForDate(companyId, selectedDate)
  ), [companyId, holidayVersion, selectedDate]);

  // Prepares my leave requests.
  const myLeaveRequests = useMemo(() => (
    leaveRequests.filter((request) => request.email === userEmail && request.companyId === companyId)
  ), [companyId, leaveRequests, userEmail]);

  // Runs when this screen needs to update data.
  useEffect(() => {
    setAccessRequests(readStorage(ACCESS_REQUESTS_KEY));
    setUserAttendance(readStorage(USER_ATTENDANCE_KEY));
    setLeaveRequests(readStorage(LEAVE_REQUESTS_KEY));
    refreshCompanyHolidays(companyId)
      .then(() => setHolidayVersion((version) => version + 1))
      .catch((error) => console.error('Holiday refresh failed:', error));

    // Handles holiday update actions.
    const handleHolidayUpdate = () => setHolidayVersion((version) => version + 1);
    window.addEventListener('holidaysUpdated', handleHolidayUpdate);
    return () => window.removeEventListener('holidaysUpdated', handleHolidayUpdate);
  }, [companyId]);

  // Runs when this screen needs to update data.
  useEffect(() => {
    if (!isUser || !userEmail || !companyId) return;

    const requests = readStorage(ACCESS_REQUESTS_KEY);
    // Prepares existing.
    const existing = requests.find((request) => request.email === userEmail && request.companyId === companyId);
    if (existing) {
      setAccessRequests(requests);
      return;
    }

    // Creates new attendance access request.
    const request = {
      id: Date.now(),
      email: userEmail,
      name: user?.name || userEmail.split('@')[0],
      companyId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    };
    // Saves newest request first.
    const nextRequests = [request, ...requests];
    writeStorage(ACCESS_REQUESTS_KEY, nextRequests);
    setAccessRequests(nextRequests);
    // Records access request in audit.
    logAuditAction({
      action: 'Attendance Access Requested',
      entityType: 'attendance',
      entityId: request.id,
      entityName: request.name,
      details: `${request.name} requested attendance access`,
      newValue: request,
    });
  }, [companyId, isUser, user?.name, userEmail]);

  // Runs when this screen needs to update data.
  useEffect(() => {
    if (isUser) {
      setLoading(false);
      return;
    }

    loadAttendanceData();
  }, [holidayVersion, selectedDate, user?.role]);

  // Gets attendance data.
  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const employees = await getAllEmployees();
      const holiday = getHolidayForDate(companyId, selectedDate);
      // Prepares records.
      const records = employees.map(emp => ({
        id: emp.id,
        employee: emp.name,
        department: emp.department,
        date: selectedDate,
        status: holiday ? 'Holiday' : getRandomStatus(),
        avatar: emp.avatar,
        email: emp.email,
        checkIn: holiday ? null : getRandomTime('09:00', '10:30'),
        checkOut: holiday ? null : getRandomTime('17:00', '18:30'),
        hoursWorked: holiday ? null : getRandomHours(),
        holidayName: holiday?.name || null,
      }));

      setAttendanceRecords(records);
      setFilteredRecords(records);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gets random status data.
  const getRandomStatus = () => {
    const statuses = ['Active', 'Active', 'Active', 'On Leave', 'Inactive', 'Remote'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  // Gets random time data.
  const getRandomTime = (min, max) => {
    const minTime = new Date(`2000-01-01 ${min}`).getTime();
    const maxTime = new Date(`2000-01-01 ${max}`).getTime();
    const randomTime = new Date(minTime + Math.random() * (maxTime - minTime));
    return randomTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Gets random hours data.
  const getRandomHours = () => {
    const hours = ['8.5', '8.0', '7.5', '9.0', '8.2'];
    return hours[Math.floor(Math.random() * hours.length)];
  };

  // Runs when this screen needs to update data.
  useEffect(() => {
    // Helps with filtered.
    const filtered = attendanceRecords.filter(record =>
      record.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRecords(filtered);
    setCurrentPage(1);
  }, [searchTerm, attendanceRecords]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalEmployees = attendanceRecords.length;
  // Prepares present count.
  const presentCount = attendanceRecords.filter(r => r.status === 'Active').length;
  // Handles leave count actions.
  const onLeaveCount = attendanceRecords.filter(r => r.status === 'On Leave').length;
  // Prepares inactive count.
  const inactiveCount = attendanceRecords.filter(r => r.status === 'Inactive').length;
  // Prepares remote count.
  const remoteCount = attendanceRecords.filter(r => r.status === 'Remote').length;

  // Helps with format submitted at.
  const formatSubmittedAt = (value) => formatDateTime(value || new Date().toISOString());

  // Handles date change actions.
  const handleDateChange = async (e) => {
    const nextDate = e.target.value;
    // Updates selected attendance date.
    setSelectedDate(nextDate);
    // Shows date change notification.
    addNotification({ type: 'info', title: 'Attendance Date', message: `Viewing attendance for ${nextDate}` });
    // Records attendance date view.
    await logAuditAction({
      action: 'Attendance Viewed',
      entityType: 'attendance',
      entityName: nextDate,
      details: `Attendance date changed to ${nextDate}`,
      oldValue: { date: selectedDate },
      newValue: { date: nextDate },
    });
  };

  // Saves user attendance data.
  const saveUserAttendance = (records) => {
    writeStorage(USER_ATTENDANCE_KEY, records);
    setUserAttendance(records);
  };

  // Handles check in actions.
  const handleCheckIn = async () => {
    if (todayHoliday) {
      addNotification({ type: 'info', title: 'Holiday', message: `${todayHoliday.name} is a holiday. Check-in is not required.` });
      return;
    }
    const records = readStorage(USER_ATTENDANCE_KEY);
    const now = new Date().toISOString();
    // Prepares existing.
    const existing = records.find((record) => record.email === userEmail && record.companyId === companyId && record.date === todayKey());
    if (isCurrentlyCheckedIn(existing)) return;

    const nextRecord = {
      id: existing?.id || Date.now(),
      email: userEmail,
      name: user?.name || userEmail.split('@')[0],
      companyId,
      department: user?.department || 'General Department',
      date: todayKey(),
      status: 'Present',
      checkIn: now,
      checkOut: null,
      lastCheckOut: existing?.checkOut || existing?.lastCheckOut || null,
      sessions: existing?.sessions || [],
    };
    const nextRecords = existing
      ? records.map((record) => record.id === existing.id ? nextRecord : record)
      : [nextRecord, ...records];
    saveUserAttendance(nextRecords);
    addNotification({ type: 'success', title: 'Checked In', message: `Checked in at ${formatDateTime(now)}` });
    await logAuditAction({
      action: 'Attendance Check In',
      entityType: 'attendance',
      entityId: nextRecord.id,
      entityName: nextRecord.name,
      details: `${nextRecord.name} checked in`,
      oldValue: existing || null,
      newValue: nextRecord,
    });
  };

  // Handles check out actions.
  const handleCheckOut = async () => {
    if (todayHoliday) {
      addNotification({ type: 'info', title: 'Holiday', message: `${todayHoliday.name} is a holiday. Check-out is not required.` });
      return;
    }
    const records = readStorage(USER_ATTENDANCE_KEY);
    const now = new Date().toISOString();
    // Prepares existing.
    const existing = records.find((record) => record.email === userEmail && record.companyId === companyId && record.date === todayKey());
    if (!isCurrentlyCheckedIn(existing)) return;

    const completedSession = { checkIn: existing.checkIn, checkOut: now };
    const nextRecord = {
      ...existing,
      status: 'Present',
      checkOut: now,
      lastCheckOut: now,
      sessions: [...(existing.sessions || []), completedSession],
    };
    // Prepares next records.
    const nextRecords = records.map((record) => record.id === existing.id ? nextRecord : record);
    saveUserAttendance(nextRecords);
    addNotification({ type: 'success', title: 'Checked Out', message: `Checked out at ${formatDateTime(now)}` });
    await logAuditAction({
      action: 'Attendance Check Out',
      entityType: 'attendance',
      entityId: nextRecord.id,
      entityName: nextRecord.name,
      details: `${nextRecord.name} checked out`,
      oldValue: existing,
      newValue: nextRecord,
    });
  };

  // Handles leave submit actions.
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate) {
      addNotification({ type: 'warning', title: 'Leave Request', message: 'Please select start and end dates.' });
      return;
    }

    const request = {
      id: Date.now(),
      email: userEmail,
      name: user?.name || userEmail.split('@')[0],
      companyId,
      type: leaveForm.type,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    // Saves newest leave request first.
    const requests = [request, ...readStorage(LEAVE_REQUESTS_KEY)];
    writeStorage(LEAVE_REQUESTS_KEY, requests);
    setLeaveRequests(requests);
    // Clears leave request form.
    setLeaveForm({ type: 'Vacation', startDate: '', endDate: '', reason: '' });
    // Shows leave request success message.
    addNotification({ type: 'success', title: 'Leave Requested', message: 'Your leave request was submitted.' });
    // Records leave request in audit.
    await logAuditAction({
      action: 'Leave Request Submitted',
      entityType: 'attendance',
      entityId: request.id,
      entityName: request.name,
      details: `${request.name} requested ${request.type} leave`,
      newValue: request,
    });
  };

  // Coordinates download report behavior.
  const downloadReport = () => {
    try {
      // Prepares rows.
      const rows = filteredRecords.map(r => ({
        Employee: r.employee,
        Department: r.department,
        Date: r.date,
        Status: r.status,
        'Check In': r.checkIn || '-',
        'Check Out': r.checkOut || '-',
        Hours: r.hoursWorked || '-',
      }));

      // Stops download when no records.
      if (rows.length === 0) {
        addNotification({ type: 'info', title: 'Download Report', message: 'No records to download' });
        return;
      }

      // Converts attendance rows to CSV.
      const headers = Object.keys(rows[0]);
      const csvContent = [headers.join(',')].concat(
        rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
      ).join('\n');

      // Creates downloadable CSV file.
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

      // Shows report download success.
      addNotification({ type: 'success', title: 'Report Downloaded', message: `Report saved as ${fileName}` });
      // Records report download in audit.
      logAuditAction({
        action: 'Attendance Report Downloaded',
        entityType: 'attendance',
        entityName: selectedDate,
        details: `Attendance report downloaded for ${selectedDate}`,
        newValue: { date: selectedDate, records: rows.length, fileName },
      });
    } catch (e) {
      console.error('Download failed', e);
      // Shows report download failure.
      addNotification({ type: 'warning', title: 'Download Failed', message: 'Could not generate report' });
    }
  };

  // Coordinates render user attendance behavior.
  const renderUserAttendance = () => {
    if (currentAccessRequest?.status !== 'approved') {
      return (
        <div className="attendance-page attendance-user-page">
          <div className="attendance-header">
            <h1>Attendance</h1>
            <p>Check in/out for today and submit leave requests for admin approval.</p>
          </div>

          <div className="attendance-access-card">
            <h2>{currentAccessRequest?.status === 'rejected' ? 'Attendance Access Rejected' : 'Attendance Access Pending'}</h2>
            <p>
              {currentAccessRequest?.status === 'rejected'
                ? 'Your attendance access request was rejected. Please contact your company admin.'
                : 'Your account is waiting for attendance access approval from your company admin.'}
            </p>
            <span>Submitted on {formatSubmittedAt(currentAccessRequest?.submittedAt || user?.created_at || user?.createdAt)}</span>
          </div>
        </div>
      );
    }

    // Prepares recent attendance.
    const recentAttendance = getRecentDates().map((date, index) => {
      const holiday = getHolidayForDate(companyId, date);
      if (holiday) {
        return {
          id: `${userEmail}-${date}-holiday`,
          date,
          status: 'Holiday',
          holidayName: holiday.name,
          checkIn: null,
          checkOut: null,
        };
      }
      // Prepares record.
      const record = userAttendance.find((item) => item.email === userEmail && item.companyId === companyId && item.date === date);
      if (record) return record;
      const fallbackStatuses = ['Present', 'Absent', 'Present', 'Present', 'Late', 'Present'];
      return {
        id: `${userEmail}-${date}`,
        date,
        status: index === 0 ? 'Present' : fallbackStatuses[index % fallbackStatuses.length],
        checkIn: null,
        checkOut: null,
      };
    });
    const checkedInNow = !todayHoliday && isCurrentlyCheckedIn(todayAttendance);

    return (
      <div className="attendance-page attendance-user-page">
        <div className="attendance-header">
          <h1>Attendance</h1>
          <p>Check in/out for today and submit leave requests for admin approval.</p>
        </div>

        <div className="attendance-user-grid">
          <section className="attendance-card today-card">
            <div className="attendance-section-title">
              <span className="title-icon">[]</span>
              <div>
                <h2>Today's Attendance</h2>
                <p>{user?.name || userEmail.split('@')[0]} - {todayAttendance?.department || 'General Department'}</p>
              </div>
            </div>
            <span className={`wide-status status-${statusClass(todayHoliday ? 'Holiday' : statusLabel(todayAttendance))}`}>
              {todayHoliday ? 'Holiday' : statusLabel(todayAttendance)}
            </span>
            {todayHoliday && (
              <div className="holiday-attendance-banner">
                <strong>It's a Holiday!</strong>
                <span>{todayHoliday.name} - {todayHoliday.type}</span>
                <p>Check-in and check-out are not required. Working hours are not calculated for {formatHolidayDate(todayKey())}.</p>
              </div>
            )}
            <p className="check-time">
              {todayHoliday ? 'Attendance marked as Holiday' : checkedInNow ? `Checked in ${formatDateTime(todayAttendance.checkIn)}` : 'Not checked in'}
            </p>
            {!checkedInNow && todayAttendance?.lastCheckOut && (
              <p className="check-time">Last checked out {formatDateTime(todayAttendance.lastCheckOut)}</p>
            )}
            <div className="attendance-actions">
              <button className="check-btn check-in-btn" onClick={handleCheckIn} disabled={Boolean(todayHoliday) || checkedInNow}>
                {'-> Check In'}
              </button>
              <button className="check-btn check-out-btn" onClick={handleCheckOut} disabled={Boolean(todayHoliday) || !checkedInNow}>
                {'<- Check Out'}
              </button>
            </div>
          </section>

          <section className="attendance-card leave-card">
            <h2>Request Leave</h2>
            <form onSubmit={handleLeaveSubmit} className="leave-form">
              <label>
                <span>Leave type</span>
                <select value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}>
                  <option value="Vacation">Vacation</option>
                  <option value="Medical">Medical</option>
                </select>
              </label>
              <label>
                <span>Start date</span>
                <input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} />
              </label>
              <label>
                <span>End date</span>
                <input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} />
              </label>
              <label className="reason-field">
                <span>Reason (optional)</span>
                <textarea value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Brief reason for your leave request" />
              </label>
              <button type="submit" className="submit-leave-btn">Submit Leave Request</button>
            </form>
          </section>
        </div>

        <section className="attendance-card attendance-list-card">
          <h2>Recent Attendance</h2>
          <table className="user-attendance-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>STATUS</th>
                <th>CHECK IN</th>
                <th>CHECK OUT</th>
              </tr>
            </thead>
            <tbody>
              {recentAttendance.map((record) => (
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td><span className={`mini-status status-${statusClass(record.status)}`}>{record.status}</span></td>
                  <td>{formatDateTime(record.checkIn)}</td>
                  <td>{formatDateTime(record.checkOut)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="attendance-card attendance-list-card">
          <h2>My Leave Requests</h2>
          <table className="user-attendance-table">
            <thead>
              <tr>
                <th>TYPE</th>
                <th>DATES</th>
                <th>STATUS</th>
                <th>REASON</th>
              </tr>
            </thead>
            <tbody>
              {myLeaveRequests.length === 0 ? (
                <tr><td colSpan="4" className="no-data">No leave requests submitted</td></tr>
              ) : (
                myLeaveRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.type}</td>
                    <td>{request.startDate} - {request.endDate}</td>
                    <td>{request.status}</td>
                    <td>{request.reason || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    );
  };

  if (isUser) {
    return renderUserAttendance();
  }

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <h1>Attendance</h1>
        <p>Track daily attendance records by employee.</p>
      </div>

      {/* Shows banner when date is holiday. */}
      {selectedDateHoliday && (
        <div className="holiday-attendance-banner admin-holiday-banner">
          <strong>{formatHolidayDate(selectedDate)} is a holiday: {selectedDateHoliday.name}</strong>
          <span>{selectedDateHoliday.type}{selectedDateHoliday.recurring ? ' - Recurring annually' : ''}</span>
          <p>Employees are not required to check in/out, no absent status is applied, and working hours are not calculated.</p>
        </div>
      )}

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
            <input type="date" value={selectedDate} onChange={handleDateChange} />
          </div>
          <button className="download-report-btn" onClick={downloadReport} title="Download CSV report">Download Report</button>
        </div>
      </div>

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
              <tr><td colSpan="7" className="no-data">{loading ? 'Loading attendance...' : 'No attendance records found'}</td></tr>
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
                      {record.status}{record.holidayName ? ` - ${record.holidayName}` : ''}
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

      {totalPages > 1 && (
        <div className="pagination-numbers">
          <button className="page-nav" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
          {[...Array(totalPages)].map((_, index) => {
            const pageNumber = index + 1;
            if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
              return (
                <button
                  key={pageNumber}
                  className={`page-number ${currentPage === pageNumber ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            }
            if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
              return <span key={pageNumber} className="page-dots">...</span>;
            }
            return null;
          })}
          <button className="page-nav" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
        </div>
      )}

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
          Last updated: {new Date().toLocaleTimeString()} - Total employees: {totalEmployees}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
