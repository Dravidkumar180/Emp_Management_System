import React, { useEffect, useMemo, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  fetchCompanyLoginDevices,
  fetchMyLoginDevices,
  forceLogoutDeviceSession,
  getCurrentSessionId,
  logoutAllDevices,
  logoutDevice,
  logoutOtherDevices,
  removeTrustedDevice,
  renameDevice,
  revokeDeviceSession,
} from '../services/loginDevices';
import './LoginDevices.css';

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

const statusClass = (status) => String(status || 'active').toLowerCase().replace(/\s+/g, '-');

const isAdminForceLoggedOut = (session) => /force/i.test(session.termination_reason || '');

const isAdminActionableSession = (session) => (
  !['Revoked', 'Session Expired'].includes(session.status) && !isAdminForceLoggedOut(session)
);

const adminDisplayStatus = (session) => {
  if (isAdminForceLoggedOut(session)) return 'Logged Out';
  return isAdminActionableSession(session) ? 'Active' : session.status;
};

const browserName = (browser = '') => {
  if (/chrome/i.test(browser)) return 'Chrome';
  if (/edge/i.test(browser)) return 'Edge';
  if (/firefox/i.test(browser)) return 'Firefox';
  if (/safari/i.test(browser)) return 'Safari';
  return 'Browser';
};

const browserIconClass = (browser = '') => `browser-dot ${browserName(browser).toLowerCase()}`;

const LoginDevices = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [browserFilter, setBrowserFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userLoggedOutIds, setUserLoggedOutIds] = useState([]);
  const currentSessionIdentifier = getCurrentSessionId();

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = isAdmin
        ? await fetchCompanyLoginDevices({
            search: searchTerm || undefined,
            browser: browserFilter || undefined,
          })
        : await fetchMyLoginDevices();
      setSessions(data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load login devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [isAdmin]);

  const filteredUserSessions = sessions.filter((session) => {
    const matchesBrowser = !browserFilter || browserName(session.browser) === browserFilter;
    const matchesStatus = !statusFilter || session.status === statusFilter;
    return matchesBrowser && matchesStatus;
  });

  const filteredAdminSessions = sessions.filter((session) => {
    const matchesStatus = !statusFilter || adminDisplayStatus(session) === statusFilter;
    return matchesStatus;
  });

  const visibleSessions = isAdmin ? filteredAdminSessions : filteredUserSessions;
  const currentSession = sessions.find((session) => session.session_identifier === currentSessionIdentifier);
  const userDisplayStatus = (session) => {
    if (['Revoked', 'Session Expired'].includes(session.status)) return session.status;
    return userLoggedOutIds.includes(session.id) ? 'Logged Out' : 'Active';
  };
  const activeCount = sessions.filter((session) => (
    isAdmin ? isAdminActionableSession(session) : userDisplayStatus(session) === 'Active'
  )).length;
  const trustedCount = sessions.filter((session) => session.trusted).length;
  const revokedCount = sessions.filter((session) => session.status === 'Revoked').length;
  const historicalCount = sessions.filter((session) => (isAdmin ? !isAdminActionableSession(session) : session.status !== 'Active')).length;
  const forceLogoutCount = sessions.filter((session) => /force/i.test(session.termination_reason || '')).length;

  const handleRename = async (session) => {
    const nextName = window.prompt('Rename trusted device', session.device_name || 'My Device');
    if (!nextName?.trim()) return;
    await renameDevice(session.id, nextName.trim());
    toast.success('Device renamed');
    loadSessions();
  };

  const handleLogoutDevice = async (session) => {
    if (session.status === 'Active') {
      await logoutDevice(session.id);
    }
    setUserLoggedOutIds((ids) => ids.includes(session.id) ? ids : [...ids, session.id]);
    setSessions((items) => items.map((item) => (
      item.id === session.id
        ? {
            ...item,
            status: 'Logged Out',
            termination_reason: item.termination_reason || 'User Logout',
            updated_at: new Date().toISOString(),
          }
        : item
    )));
    toast.success('Device logged out');
    loadSessions();
  };

  const handleRemoveTrusted = async (session) => {
    await removeTrustedDevice(session.id);
    toast.success('Trusted device removed');
    loadSessions();
  };

  const handleAdminRevoke = async (session, message = 'Session revoked') => {
    await revokeDeviceSession(session.id);
    toast.success(message);
    loadSessions();
  };

  const handleAdminForceLogout = async (session) => {
    await forceLogoutDeviceSession(session.id);
    toast.success('Session force logged out');
    loadSessions();
  };

  const handleLogoutOthers = async () => {
    await logoutOtherDevices();
    toast.success('Logged out from other devices');
    loadSessions();
  };

  const handleLogoutAll = async () => {
    await logoutAllDevices();
    toast.success('Logged out from all devices');
    loadSessions();
  };

  const browserOptions = useMemo(() => (
    [...new Set(sessions.map((session) => browserName(session.browser)))].filter(Boolean)
  ), [sessions]);

  const statCards = isAdmin
    ? [
        ['Total Users', new Set(sessions.map((session) => session.user_email)).size, 'All users', 'users'],
        ['Active Sessions', activeCount, 'Across users', 'active'],
        ['Historical Sessions', historicalCount, 'All completed sessions', 'history'],
        ['Revoked Sessions', revokedCount, 'Security revoked', 'revoked'],
        ['Force Logouts', forceLogoutCount, 'Admin initiated', 'force'],
      ]
    : [
        ['Current Device', currentSession ? 1 : 0, 'This device', 'current'],
        ['Active Sessions', activeCount, 'Including this device', 'active'],
        ['Trusted Devices', trustedCount, 'You trust', 'trusted'],
        ['Total Devices', sessions.length, 'All time', 'total'],
      ];

  return (
    <div className="login-devices-page">
      <Toaster position="top-right" />
      <div className="login-devices-header">
        <div>
          <h1>{isAdmin ? 'ADMIN VIEW - Company Device Monitoring' : 'USER VIEW - My Login Devices'}</h1>
          <p>{isAdmin ? 'View and manage user sessions across your company.' : 'View and manage all devices where your account is logged in.'}</p>
        </div>
      </div>

      <div className="device-stats">
        {statCards.map(([label, value, note, tone]) => (
          <div className="device-stat-card" key={label}>
            <span className={`stat-icon ${tone}`}>{label.slice(0, 1)}</span>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>

      <section className="device-table-card">
        <div className="device-card-title">
          <div>
            <h2>{isAdmin ? 'Company Devices & Sessions' : 'My Devices & Active Sessions'}</h2>
            <p>{isAdmin ? 'These are all user sessions in your company.' : 'These are all the devices that have access to your account.'}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="device-toolbar">
            <input placeholder="Search by user name, email or device name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select value={browserFilter} onChange={(e) => setBrowserFilter(e.target.value)}>
              <option value="">All Browsers</option>
              {browserOptions.map((browser) => <option key={browser}>{browser}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option>Active</option>
              <option>Logged Out</option>
              <option>Revoked</option>
              <option>Session Expired</option>
            </select>
            <input type="text" readOnly value="01 Jun 2026 - 19 Jun 2026" aria-label="Login date range" />
            <button onClick={loadSessions}>Filters</button>
          </div>
        )}

        <table className="device-table">
          <thead>
            <tr>
              {isAdmin && <th>User</th>}
              <th>Device / Browser</th>
              {!isAdmin && <th>Device Name</th>}
              <th>IP Address</th>
              <th>Login Time</th>
              <th>Last Activity</th>
              <th>Status</th>
              {!isAdmin && <th>Trusted</th>}
              {isAdmin && <th>Termination Reason</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 8 : 8} className="device-empty">Loading sessions...</td></tr>
            ) : visibleSessions.length === 0 ? (
              <tr><td colSpan={isAdmin ? 8 : 8} className="device-empty">No login devices found</td></tr>
            ) : (
              visibleSessions.map((session) => {
                const isCurrent = session.session_identifier === currentSessionIdentifier;
                const displayStatus = isAdmin ? adminDisplayStatus(session) : userDisplayStatus(session);
                const adminCanManage = isAdmin && isAdminActionableSession(session);
                return (
                  <tr key={session.id}>
                    {isAdmin && <td><strong>{session.user_name}</strong><span>{session.user_email}</span></td>}
                    <td>
                      <div className="device-browser-cell">
                        <span className={browserIconClass(session.browser)}>{browserName(session.browser).slice(0, 1)}</span>
                        <div>
                          <strong>{session.browser}</strong>
                          {isCurrent && <span className="current-mini">Current</span>}
                        </div>
                      </div>
                    </td>
                    {!isAdmin && (
                      <td>{session.device_name}</td>
                    )}
                    <td>{session.ip_address}</td>
                    <td>{formatDateTime(session.login_time)}</td>
                    <td>{formatDateTime(session.last_activity_time)}</td>
                    <td><span className={`device-status status-${statusClass(displayStatus)}`}>{displayStatus}</span></td>
                    {!isAdmin && <td><span className={`trusted-value ${session.trusted ? 'yes' : 'no'}`}>{session.trusted ? 'Yes' : 'No'}</span></td>}
                    {isAdmin && <td>{session.termination_reason || '-'}</td>}
                    <td className="device-actions-cell">
                      {!isAdmin && displayStatus === 'Active' && <button className="device-logout-btn" onClick={() => handleLogoutDevice(session)}>Logout</button>}
                      {adminCanManage && (
                        <select
                          className="admin-action-select"
                          defaultValue=""
                          onChange={(event) => {
                            const action = event.target.value;
                            event.target.value = '';
                            if (action === 'force') handleAdminForceLogout(session);
                            if (action === 'revoke') handleAdminRevoke(session, 'Session revoked');
                          }}
                        >
                          <option value="" disabled>Choose Action</option>
                          <option value="force">Force Logout</option>
                          <option value="revoke">Revoke Session</option>
                        </select>
                      )}
                      {((!isAdmin && displayStatus !== 'Active') || (isAdmin && !adminCanManage)) && <span className="action-dash">-</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {!isAdmin && (
        <section className="logout-options-card">
          <h2>Quick Actions</h2>
          <button onClick={handleLogoutOthers}><strong>Logout from All Devices</strong><span>Except this device</span></button>
          <button className="danger" onClick={handleLogoutAll}><strong>Logout from All Devices</strong><span>Including this device</span></button>
          <button onClick={() => currentSession && handleRename(currentSession)} disabled={!currentSession}><strong>Rename Trusted Device</strong><span>Edit device name</span></button>
          <button onClick={() => currentSession && handleRemoveTrusted(currentSession)} disabled={!currentSession || !currentSession.trusted}><strong>Remove Trusted Device</strong><span>Remove from trusted list</span></button>
        </section>
      )}
    </div>
  );
};

export default LoginDevices;
