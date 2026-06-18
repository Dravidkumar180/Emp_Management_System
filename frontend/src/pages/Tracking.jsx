import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ensureLegacyAccountHistory } from '../services/activityTracking';
import './Tracking.css';

const COMPANIES = [
  { id: 'company-a', name: 'Company A' },
  { id: 'company-b', name: 'Company B' },
];

const normalizeCompanyId = (companyId) => {
  if (companyId === 1 || companyId === '1') return 'company-a';
  if (companyId === 2 || companyId === '2') return 'company-b';
  return companyId || 'company-a';
};

const formatDateTime = (value) => {
  if (!value) return 'Not recorded';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const getInitial = (name, email) => (name || email || 'U').charAt(0).toUpperCase();

const hasChangedValue = (history = [], field) => {
  const values = new Set(history.map((item) => item[field]).filter(Boolean));
  return values.size > 1;
};

const getRoleLabel = (role) => {
  if (role === 'admin') return 'Admin';
  if (role === 'super_admin') return 'Super Admin';
  return 'User';
};

const normalizeHistory = (record) => {
  const history = Array.isArray(record.history) ? [...record.history] : [];
  const hasLogin = history.some((item) => item.type === 'login' && item.timestamp === record.lastLogin);
  const hasLogout = history.some((item) => item.type === 'logout' && item.timestamp === record.lastLogout);

  if (record.lastLogin && !hasLogin) {
    history.push({
      type: 'login',
      timestamp: record.lastLogin,
      browser: record.browser,
      ipAddress: record.ipAddress,
    });
  }

  if (record.lastLogout && !hasLogout) {
    history.push({
      type: 'logout',
      timestamp: record.lastLogout,
      browser: record.browser,
      ipAddress: record.ipAddress,
    });
  }

  return history.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
};

const Tracking = () => {
  const { user } = useAuth();
  const userCompanyId = normalizeCompanyId(user?.companyId || user?.company_id);
  const canSwitchCompany = user?.role === 'super_admin';
  const [activeCompanyId, setActiveCompanyId] = useState(userCompanyId);
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityTab, setActivityTab] = useState('activity');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivity = () => {
      setLoading(true);
      setRecords(ensureLegacyAccountHistory());
      setLoading(false);
    };

    loadActivity();
  }, []);

  useEffect(() => {
    if (!canSwitchCompany) {
      setActiveCompanyId(userCompanyId);
    }
  }, [canSwitchCompany, userCompanyId]);

  const companyOptions = canSwitchCompany ? COMPANIES : COMPANIES.filter((company) => company.id === userCompanyId);
  const activeCompany = COMPANIES.find((company) => company.id === activeCompanyId) || COMPANIES[0];

  const companyRecords = useMemo(() => (
    records
      .filter((record) => record.source === 'account' || !record.department)
      .filter((record) => normalizeCompanyId(record.companyId) === activeCompanyId)
      .map((record) => {
        const history = normalizeHistory(record);
        const loginEvents = history.filter((item) => item.type === 'login');
        const logoutEvents = history.filter((item) => item.type === 'logout');
        return {
          ...record,
          history,
          loginCount: loginEvents.length,
          logoutCount: logoutEvents.length,
          lastLogin: record.lastLogin || loginEvents[0]?.timestamp,
          lastLogout: record.lastLogout || logoutEvents[0]?.timestamp,
        };
      })
      .filter((record) => {
        const search = searchTerm.trim().toLowerCase();
        if (!search) return true;
        return [record.name, record.email, getRoleLabel(record.role), record.browser, record.ipAddress]
          .some((value) => String(value || '').toLowerCase().includes(search));
      })
      .sort((a, b) => new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0))
  ), [activeCompanyId, records, searchTerm]);

  const loginHistory = companyRecords.flatMap((record) => (
    (record.history || [])
      .filter((item) => item.type === 'login')
      .map((item) => ({ ...item, name: record.name, email: record.email, role: record.role, companyName: record.companyName || activeCompany.name }))
  )).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  const logoutHistory = companyRecords.flatMap((record) => (
    (record.history || [])
      .filter((item) => item.type === 'logout')
      .map((item) => ({ ...item, name: record.name, email: record.email, role: record.role, companyName: record.companyName || activeCompany.name }))
  )).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  const newDeviceCount = companyRecords.filter((record) => hasChangedValue(record.history, 'browser')).length;
  const newIpCount = companyRecords.filter((record) => hasChangedValue(record.history, 'ipAddress')).length;

  const summary = [
    { label: 'Total Logins', value: loginHistory.length, accent: 'blue' },
    { label: 'Total Logouts', value: logoutHistory.length, accent: 'green' },
    { label: 'New Devices', value: newDeviceCount, accent: 'purple' },
    { label: 'New IP Addresses', value: newIpCount, accent: 'orange' },
  ];

  const visibleHistory = activityTab === 'login' ? loginHistory : logoutHistory;

  if (loading) {
    return (
      <div className="tracking-loading">
        <div className="spinner" />
        <p>Loading account activity...</p>
      </div>
    );
  }

  return (
    <div className="tracking-page">
      <header className="tracking-header">
        <div className="tracking-title-row">
          <div className="tracking-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 11h-6" />
              <path d="M19 8v6" />
            </svg>
          </div>
          <div>
            <h1>Account Activity Tracking</h1>
            <p>Track account logins, logouts, browser information, IP addresses, and activity history for users and admins in {activeCompany.name}.</p>
          </div>
        </div>

        <div className="tracking-summary">
          {summary.map((item) => (
            <div className={`tracking-stat stat-${item.accent}`} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </header>

      <section className="tracking-panel">
        <div className="tracking-tabs">
          <button type="button" className={activityTab === 'activity' ? 'active' : ''} onClick={() => setActivityTab('activity')}>
            User Activity
          </button>
          <button type="button" className={activityTab === 'login' ? 'active' : ''} onClick={() => setActivityTab('login')}>
            Login History
          </button>
          <button type="button" className={activityTab === 'logout' ? 'active' : ''} onClick={() => setActivityTab('logout')}>
            Logout History
          </button>
        </div>

        <div className="tracking-filters">
          <div className="tracking-search">
            <input
              type="search"
              placeholder="Search by name, email, browser, or IP..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <div className="tracking-company-tabs" aria-label="Company filter">
            {companyOptions.map((company) => (
              <button
                type="button"
                key={company.id}
                className={company.id === activeCompanyId ? 'active' : ''}
                onClick={() => setActiveCompanyId(company.id)}
              >
                {company.name}
              </button>
            ))}
          </div>
        </div>

        {activityTab === 'activity' && (
          <div className="tracking-table-wrap">
            <table className="tracking-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Last Login</th>
                  <th>Last Logout</th>
                  <th>Total Logins</th>
                  <th>Total Logouts</th>
                  <th>Browser</th>
                  <th>IP Address</th>
                  <th>Status</th>
                  <th>New Device</th>
                  <th>New IP</th>
                </tr>
              </thead>
              <tbody>
                {companyRecords.length === 0 ? (
                  <tr>
                    <td colSpan="12">
                      <div className="tracking-empty">No account activity has been recorded for {activeCompany.name} yet.</div>
                    </td>
                  </tr>
                ) : companyRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="tracking-user">
                        <span>{getInitial(record.name, record.email)}</span>
                        <div>
                          <strong>{record.name}</strong>
                          <small>{activeCompany.name}</small>
                        </div>
                      </div>
                    </td>
                    <td><span className="tracking-role">{getRoleLabel(record.role)}</span></td>
                    <td>{record.email}</td>
                    <td>{formatDateTime(record.lastLogin)}</td>
                    <td>{formatDateTime(record.lastLogout)}</td>
                    <td>{record.loginCount}</td>
                    <td>{record.logoutCount}</td>
                    <td>{record.browser}</td>
                    <td>{record.ipAddress}</td>
                    <td><span className={`tracking-badge ${record.status === 'Inactive' ? 'muted' : 'active'}`}>{record.status || 'Active'}</span></td>
                    <td><span className={`tracking-badge ${hasChangedValue(record.history, 'browser') ? 'warn' : 'ok'}`}>{hasChangedValue(record.history, 'browser') ? 'Yes' : 'No'}</span></td>
                    <td><span className={`tracking-badge ${hasChangedValue(record.history, 'ipAddress') ? 'warn' : 'ok'}`}>{hasChangedValue(record.history, 'ipAddress') ? 'Yes' : 'No'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(activityTab === 'login' || activityTab === 'logout') && (
          <div className="tracking-history-list">
            {visibleHistory.length === 0 ? (
              <div className="tracking-empty">
                No {activityTab === 'login' ? 'login' : 'logout'} history has been recorded for {activeCompany.name} yet.
              </div>
            ) : visibleHistory.map((item, index) => (
              <div className="tracking-history-item" key={`${item.email}-${item.timestamp}-${index}`}>
                <span className={`history-dot ${item.type}`} />
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.email} - {getRoleLabel(item.role)} - {item.companyName}</p>
                </div>
                <time>{formatDateTime(item.timestamp)}</time>
                <small>{item.browser} | {item.ipAddress}</small>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Tracking;
