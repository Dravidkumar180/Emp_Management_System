import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  bulkRevokeDeviceSessions,
  fetchCompanyLoginDevices,
  revokeDeviceSession,
} from '../services/loginDevices';
import './UserSessionMonitor.css';

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizeStatus = (status) => (status === 'Session Expired' ? 'Expired' : status || '-');

const statusClass = (status) => normalizeStatus(status).toLowerCase().replace(/\s+/g, '-');

const browserName = (browser = '') => {
  if (/chrome/i.test(browser)) return 'Chrome';
  if (/edge/i.test(browser)) return 'Edge';
  if (/firefox/i.test(browser)) return 'Firefox';
  if (/safari/i.test(browser)) return 'Safari';
  return 'Browser';
};

const departmentName = (session) => session.department || session.user_department || 'General';

const isRecentSession = (session) => {
  const loginDate = new Date(session.login_time);
  if (Number.isNaN(loginDate.getTime())) return false;
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  return loginDate.getTime() >= sevenDaysAgo;
};

const UserSessionMonitor = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [browserFilter, setBrowserFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [detailSession, setDetailSession] = useState(null);
  const [page, setPage] = useState(1);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await fetchCompanyLoginDevices();
      setSessions(data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load user sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm, departmentFilter, browserFilter, statusFilter]);

  const departments = useMemo(() => (
    [...new Set(sessions.map(departmentName))].filter(Boolean)
  ), [sessions]);

  const browsers = useMemo(() => (
    [...new Set(sessions.map((session) => browserName(session.browser)))].filter(Boolean)
  ), [sessions]);

  const filteredSessions = useMemo(() => sessions.filter((session) => {
    const searchable = `${session.user_name || ''} ${session.user_email || ''} ${session.browser || ''} ${session.ip_address || ''}`.toLowerCase();
    const matchesSearch = !searchTerm || searchable.includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || departmentName(session) === departmentFilter;
    const matchesBrowser = !browserFilter || browserName(session.browser) === browserFilter;
    const matchesStatus = !statusFilter || normalizeStatus(session.status) === statusFilter;
    const matchesTab = activeTab === 'active'
      ? session.status === 'Active'
      : activeTab === 'recent'
      ? isRecentSession(session)
      : true;
    return matchesSearch && matchesDepartment && matchesBrowser && matchesStatus && matchesTab;
  }), [activeTab, browserFilter, departmentFilter, searchTerm, sessions, statusFilter]);

  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const pageSessions = filteredSessions.slice((page - 1) * pageSize, page * pageSize);
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const stats = [
    ['Total Active Sessions', sessions.filter((session) => session.status === 'Active').length, `Across ${new Set(sessions.map((session) => session.user_id)).size} users`, 'active'],
    ['Expired Sessions', sessions.filter((session) => session.status === 'Session Expired').length, 'Last 7 days', 'expired'],
    ['Revoked Sessions', sessions.filter((session) => session.status === 'Revoked').length, 'Last 7 days', 'revoked'],
    ['Force Logouts', sessions.filter((session) => /revoked|force/i.test(session.termination_reason || '')).length, 'Last 7 days', 'force'],
    ['Total Users', new Set(sessions.map((session) => session.user_email)).size, 'In this company', 'users'],
  ];

  const selectedActiveIds = selectedIds.filter((id) => {
    const session = sessions.find((item) => item.id === id);
    return session?.status === 'Active';
  });

  const handleForceLogout = async (session) => {
    if (session.status !== 'Active') return;
    await revokeDeviceSession(session.id);
    toast.success('Session force logged out');
    setOpenMenuId(null);
    loadSessions();
  };

  const handleBulkRevoke = async () => {
    if (selectedActiveIds.length === 0) {
      toast.error('Select at least one active session');
      return;
    }
    await bulkRevokeDeviceSessions(selectedActiveIds);
    toast.success('Selected sessions revoked');
    setSelectedIds([]);
    loadSessions();
  };

  const handleExport = () => {
    const headers = ['User Name', 'Email', 'Login Time', 'Last Activity', 'Browser', 'IP Address', 'Status', 'Termination Reason'];
    const rows = filteredSessions.map((session) => [
      session.user_name,
      session.user_email,
      formatDateTime(session.login_time),
      formatDateTime(session.last_activity_time),
      session.browser,
      session.ip_address,
      normalizeStatus(session.status),
      session.termination_reason || '-',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user-session-monitor.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="session-monitor-page">
      <header className="session-monitor-header">
        <h1>User Session Monitoring</h1>
        <p>View and manage all active and recent user sessions within your company.</p>
      </header>

      <section className="session-stat-grid">
        {stats.map(([label, value, note, tone]) => (
          <div className="session-stat-card" key={label}>
            <span className={`session-stat-icon ${tone}`}>{label.slice(0, 1)}</span>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </section>

      <div className="session-monitor-layout">
        <section className="session-table-card">
          <div className="session-filters">
            <input placeholder="Search by user name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map((department) => <option key={department}>{department}</option>)}
            </select>
            <select value={browserFilter} onChange={(e) => setBrowserFilter(e.target.value)}>
              <option value="">All Browsers</option>
              {browsers.map((browser) => <option key={browser}>{browser}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option>Active</option>
              <option>Expired</option>
              <option>Revoked</option>
              <option>Logged Out</option>
            </select>
            <input readOnly value="01 Jun 2026 - 19 Jun 2026" aria-label="Session date range" />
            <button type="button" onClick={loadSessions}>Filters</button>
          </div>

          <div className="session-tabs">
            <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>Active Sessions ({sessions.filter((session) => session.status === 'Active').length})</button>
            <button className={activeTab === 'recent' ? 'active' : ''} onClick={() => setActiveTab('recent')}>Recent Sessions</button>
            <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>All Sessions History</button>
          </div>

          <div className="session-table-wrap">
            <table className="session-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={pageSessions.length > 0 && pageSessions.every((session) => selectedIds.includes(session.id))} onChange={(e) => setSelectedIds(e.target.checked ? [...new Set([...selectedIds, ...pageSessions.map((session) => session.id)])] : selectedIds.filter((id) => !pageSessions.some((session) => session.id === id)))} /></th>
                  <th>User Name</th>
                  <th>Department</th>
                  <th>Login Time</th>
                  <th>Last Activity</th>
                  <th>Browser / Device</th>
                  <th>IP Address</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="10" className="session-empty">Loading sessions...</td></tr>
                ) : pageSessions.length === 0 ? (
                  <tr><td colSpan="10" className="session-empty">No sessions found</td></tr>
                ) : pageSessions.map((session) => (
                  <tr key={session.id}>
                    <td><input type="checkbox" checked={selectedIds.includes(session.id)} onChange={(e) => setSelectedIds((ids) => e.target.checked ? [...ids, session.id] : ids.filter((id) => id !== session.id))} /></td>
                    <td><strong>{session.user_name}</strong><span>{session.user_email}</span></td>
                    <td>{departmentName(session)}</td>
                    <td>{formatDateTime(session.login_time)}</td>
                    <td>{formatDateTime(session.last_activity_time)}</td>
                    <td><strong>{browserName(session.browser)}</strong><span>{session.device_name || session.device_info || 'Device'}</span></td>
                    <td>{session.ip_address}</td>
                    <td>{session.location || 'Unknown'}</td>
                    <td><span className={`session-status status-${statusClass(session.status)}`}>{normalizeStatus(session.status)}</span></td>
                    <td className="session-actions-cell">
                      {session.status === 'Active' ? (
                        <button className="session-force-btn" onClick={() => handleForceLogout(session)}>Force Logout</button>
                      ) : (
                        <button className="session-detail-btn" onClick={() => setDetailSession(session)}>View Details</button>
                      )}
                      <div className="session-menu-wrap">
                        <button className="session-menu-btn" onClick={() => setOpenMenuId(openMenuId === session.id ? null : session.id)} type="button">...</button>
                        {openMenuId === session.id && (
                          <div className="session-action-menu">
                            <button type="button" onClick={() => { setDetailSession(session); setOpenMenuId(null); }}>View Session History</button>
                            <button type="button" disabled={session.status !== 'Active'} onClick={() => handleForceLogout(session)}>Force Logout Session</button>
                            <button type="button" disabled={session.status !== 'Active'} onClick={() => handleForceLogout(session)}>Revoke Session</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="session-table-footer">
            <span>Showing {pageSessions.length ? ((page - 1) * pageSize) + 1 : 0} to {Math.min(page * pageSize, filteredSessions.length)} of {filteredSessions.length} sessions</span>
            <div className="session-pagination">
              <button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Prev</button>
              {pageNumbers.map((pageNumber) => (
                <button
                  className={pageNumber === page ? 'active' : ''}
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button type="button" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
            </div>
          </div>
        </section>

        <aside className="session-admin-card">
          <h2>Session Administration</h2>
          <button className="session-admin-action danger" type="button" onClick={() => selectedActiveIds.length === 1 ? handleBulkRevoke() : toast.error('Select one active session')}>
            <span className="session-admin-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 17L15 12L10 7" />
                <path d="M15 12H3" />
                <path d="M12 3H19C20.1 3 21 3.9 21 5V9" />
                <path d="M21 15V19C21 20.1 20.1 21 19 21H12" />
              </svg>
            </span>
            <span>
              <strong>Force Logout Session</strong>
              <small>Immediately logout an active user session.</small>
            </span>
          </button>
          <button className="session-admin-action purple" type="button" onClick={handleBulkRevoke}>
            <span className="session-admin-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 17L15 12L10 7" />
                <path d="M15 12H4" />
                <path d="M12 4H19C20.1 4 21 4.9 21 6V18C21 19.1 20.1 20 19 20H12" />
              </svg>
            </span>
            <span>
              <strong>Revoke Sessions</strong>
              <small>Revoke one or multiple user sessions.</small>
            </span>
          </button>
          <button className="session-admin-action blue" type="button" onClick={() => setActiveTab('history')}>
            <span className="session-admin-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 12A9 9 0 1 0 6 5.3" />
                <path d="M3 5V10H8" />
                <path d="M12 7V12L15 14" />
              </svg>
            </span>
            <span>
              <strong>View Session History</strong>
              <small>View all past user sessions.</small>
            </span>
          </button>
          <button className="session-admin-action sky" type="button" onClick={handleExport}>
            <span className="session-admin-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3V15" />
                <path d="M8 11L12 15L16 11" />
                <path d="M5 21H19C20.1 21 21 20.1 21 19V17" />
                <path d="M3 17V19C3 20.1 3.9 21 5 21" />
              </svg>
            </span>
            <span>
              <strong>Export Session Report</strong>
              <small>Download sessions report.</small>
            </span>
          </button>
        </aside>
      </div>

      {detailSession && (
        <div className="session-modal-backdrop" onClick={() => setDetailSession(null)}>
          <div className="session-detail-modal" onClick={(event) => event.stopPropagation()}>
            <button className="session-modal-close" onClick={() => setDetailSession(null)}>x</button>
            <h2>Session Details</h2>
            <p><strong>User:</strong> {detailSession.user_name} ({detailSession.user_email})</p>
            <p><strong>Browser:</strong> {detailSession.browser}</p>
            <p><strong>IP Address:</strong> {detailSession.ip_address}</p>
            <p><strong>Status:</strong> {normalizeStatus(detailSession.status)}</p>
            <p><strong>Termination Reason:</strong> {detailSession.termination_reason || '-'}</p>
            <p><strong>Login Time:</strong> {formatDateTime(detailSession.login_time)}</p>
            <p><strong>Last Activity:</strong> {formatDateTime(detailSession.last_activity_time)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSessionMonitor;
