import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import {
  fetchAdminReviewers,
  fetchPendingRoleRequests,
  fetchMyRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
  submitRoleChangeRequest,
  verifyCredentials,
  updatePassword
} from '../services/auth';
import './Settings.css';

const defaultNotificationSettings = {
  email: true,
  push: true,
  activity: true,
  reminders: true
};

const Settings = () => {
  const { user, updateUserProfile } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notificationSettings, setNotificationSettings] = useState(defaultNotificationSettings);
  const [adminReviewers, setAdminReviewers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [roleRequestLoading, setRoleRequestLoading] = useState(false);
  const [requestForm, setRequestForm] = useState({ password: '', adminEmail: '' });

  const settingsKey = user ? `settings:${user.email}` : 'settings:guest';
  const isAdmin = user?.role === 'admin';
  const isUser = user?.role === 'user';

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    try {
      const stored = localStorage.getItem(settingsKey);
      if (stored) {
        setNotificationSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadAdmins = async () => {
      try {
        const list = await fetchAdminReviewers();
        setAdminReviewers(list || []);
      } catch (error) {
        console.error('Unable to load admin reviewers', error);
      }
    };

    const loadRequests = async () => {
      try {
        if (isAdmin) {
          const data = await fetchPendingRoleRequests();
          setPendingRequests(data || []);
        } else {
          const data = await fetchMyRoleRequests();
          setMyRequests(data || []);
        }
      } catch (error) {
        console.error('Unable to load role requests', error);
      }
    };

    loadAdmins();
    loadRequests();
  }, [user, isAdmin]);

  const saveLocalSettings = () => {
    try {
      localStorage.setItem(settingsKey, JSON.stringify(notificationSettings));
    } catch (error) {
      console.error('Failed to save settings', error);
    }
  };

  const handleSaveAllSettings = () => {
    const updatedName = name.trim() || user.name;
    if (updatedName !== user.name) {
      updateUserProfile({ name: updatedName });
    }
    saveLocalSettings();
    addNotification({ type: 'success', title: 'Settings Saved', message: 'All settings have been saved successfully.' });
  };

  const handleSaveProfile = () => {
    const updatedName = name.trim();
    if (!updatedName) {
      addNotification({ type: 'warning', title: 'Missing Name', message: 'Please enter a valid name.' });
      return;
    }
    updateUserProfile({ name: updatedName });
    addNotification({ type: 'success', title: 'Profile Updated', message: 'Your profile information has been saved.' });
  };

  const handleSecuritySave = async () => {
    if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
      addNotification({ type: 'warning', title: 'Missing Fields', message: 'Fill in all password fields before saving.' });
      return;
    }

    if (security.newPassword !== security.confirmPassword) {
      addNotification({ type: 'warning', title: 'Password Mismatch', message: 'New passwords do not match.' });
      return;
    }

    setSecurityLoading(true);
    try {
      await verifyCredentials(user.email, security.currentPassword);
      await updatePassword(user.email, security.newPassword);
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
      addNotification({ type: 'success', title: 'Password Updated', message: 'Your password has been changed successfully.' });
    } catch (error) {
      addNotification({ type: 'error', title: 'Security Update Failed', message: error.response?.data?.detail || 'Unable to change password.' });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleNotificationToggle = (key) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRoleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.password || !requestForm.adminEmail) {
      addNotification({ type: 'warning', title: 'Missing Fields', message: 'Please enter your password and select an admin reviewer.' });
      return;
    }
    setRoleRequestLoading(true);
    try {
      await submitRoleChangeRequest(requestForm.password, requestForm.adminEmail);
      setRequestForm({ password: '', adminEmail: '' });
      const requests = await fetchMyRoleRequests();
      setMyRequests(requests || []);
      addNotification({ type: 'success', title: 'Request Sent', message: 'Your role request has been submitted.' });
    } catch (error) {
      addNotification({ type: 'error', title: 'Request Failed', message: error.response?.data?.detail || 'Unable to submit role request.' });
    } finally {
      setRoleRequestLoading(false);
    }
  };

  const refreshPendingRequests = async () => {
    try {
      const data = await fetchPendingRoleRequests();
      setPendingRequests(data || []);
    } catch (error) {
      console.error('Unable to refresh pending role requests', error);
    }
  };

  const handleApproveReject = async (requestId, action) => {
    setRequestLoading(true);
    try {
      if (action === 'approve') {
        await approveRoleRequest(requestId);
        addNotification({ type: 'success', title: 'Request Approved', message: 'The role upgrade request has been approved.' });
      } else {
        await rejectRoleRequest(requestId);
        addNotification({ type: 'info', title: 'Request Rejected', message: 'The role upgrade request has been rejected.' });
      }
      await refreshPendingRequests();
    } catch (error) {
      addNotification({ type: 'error', title: 'Action Failed', message: error.response?.data?.detail || 'Unable to update request.' });
    } finally {
      setRequestLoading(false);
    }
  };

  const renderProfileTab = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>Profile</h2>
        <p>Update your basic account settings and display name.</p>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input value={user?.email || ''} disabled />
        </div>
        <div className="form-group">
          <label>Role</label>
          <input value={(user?.role || 'user').toUpperCase()} disabled />
        </div>
      </div>
      <div className="section-actions">
        <button className="save-btn" onClick={handleSaveProfile}>Save Profile</button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>Security</h2>
        <p>Change your password and secure your account.</p>
      </div>
      <div className="form-row">
        <div className="form-group full-width">
          <label>Current Password</label>
          <input
            type="password"
            value={security.currentPassword}
            onChange={(e) => setSecurity((prev) => ({ ...prev, currentPassword: e.target.value }))}
            placeholder="Current password"
          />
        </div>
        <div className="form-group full-width">
          <label>New Password</label>
          <input
            type="password"
            value={security.newPassword}
            onChange={(e) => setSecurity((prev) => ({ ...prev, newPassword: e.target.value }))}
            placeholder="New password"
          />
        </div>
        <div className="form-group full-width">
          <label>Confirm New Password</label>
          <input
            type="password"
            value={security.confirmPassword}
            onChange={(e) => setSecurity((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="Confirm new password"
          />
        </div>
      </div>
      <div className="section-actions">
        <button className="save-btn" onClick={handleSecuritySave} disabled={securityLoading}>
          {securityLoading ? 'Updating...' : 'Change Password'}
        </button>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>Appearance</h2>
        <p>Choose your theme preferences.</p>
      </div>
      <div className="form-row appearance-row">
        <div className="form-group appearance-card">
          <label>Color Mode</label>
          <div className="appearance-toggle">
            <span>{darkMode ? 'Dark' : 'Light'}</span>
            <button className="toggle-switch" onClick={toggleDarkMode}>
              {darkMode ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>
        </div>
      </div>
      <div className="section-actions">
        <button className="save-btn" onClick={handleSaveAllSettings}>Save All Settings</button>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>Notifications</h2>
        <p>Manage what notifications are sent to your bell and inbox.</p>
      </div>
      <div className="form-row notification-row">
        {Object.entries(notificationSettings).map(([key, value]) => (
          <div className="notification-switch" key={key}>
            <label>{key.charAt(0).toUpperCase() + key.slice(1)} Notifications</label>
            <button
              type="button"
              className={`toggle-btn ${value ? 'active' : ''}`}
              onClick={() => handleNotificationToggle(key)}
              aria-pressed={value}
              aria-label={`${key.charAt(0).toUpperCase() + key.slice(1)} notifications ${value ? 'on' : 'off'}`}
            >
              <span className="switch-track">
                <span className="switch-thumb" />
                <span className="switch-label">{value ? 'ON' : 'OFF'}</span>
              </span>
            </button>
          </div>
        ))}
      </div>
      <div className="section-actions">
        <button className="save-btn" onClick={handleSaveAllSettings}>Save All Settings</button>
      </div>
    </div>
  );

  const tabList = [
    { key: 'profile', label: 'Profile', icon: '👤' },
    { key: 'security', label: 'Security', icon: '🔒' },
    { key: 'appearance', label: 'Appearance', icon: '🎨' },
    { key: 'notifications', label: 'Notifications', icon: '🔔' },
    { key: 'role-request', label: isAdmin ? 'Approvals' : 'Role Request', icon: '📨' }
  ];

  const renderRoleRequestTab = () => (
    <div className="settings-section">
      {isAdmin ? (
        <>
          <div className="section-header">
            <h2>Role Approvals</h2>
            <p>Manage pending role upgrade requests.</p>
          </div>
          <div className="approval-table">
            {pendingRequests.length === 0 ? (
              <div className="empty-state">No pending role requests at the moment.</div>
            ) : (
              <div className="request-list">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="request-item">
                    <div className="request-user">
                      <strong>{request.requester_email.split('@')[0]}</strong>
                      <span>{request.requester_email}</span>
                    </div>
                    <div className="request-actions">
                      <button className="approve-btn" onClick={() => handleApproveReject(request.id, 'approve')} disabled={requestLoading}>
                        Approve
                      </button>
                      <button className="reject-btn" onClick={() => handleApproveReject(request.id, 'reject')} disabled={requestLoading}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="section-header">
            <h2>Role Request</h2>
            <p>Request an upgrade to admin access from an existing admin reviewer.</p>
          </div>
          <form className="role-request-form" onSubmit={handleRoleRequestSubmit}>
            <div className="form-group full-width">
              <label>Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={requestForm.password}
                onChange={(e) => setRequestForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div className="form-group full-width">
              <label>Admin Reviewer</label>
              <select
                value={requestForm.adminEmail}
                onChange={(e) => setRequestForm((prev) => ({ ...prev, adminEmail: e.target.value }))}
              >
                <option value="">Select admin email</option>
                {adminReviewers.map((admin) => (
                  <option key={admin} value={admin}>{admin}</option>
                ))}
              </select>
            </div>
            <p className="helper">Choose the admin who will review your role upgrade request.</p>
            <div className="section-actions">
              <button className="save-btn" type="submit" disabled={roleRequestLoading}>
                {roleRequestLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>

          <div className="request-history">
            <h3>My Requests</h3>
            {myRequests.length === 0 ? (
              <div className="empty-state">You have not submitted any role requests yet.</div>
            ) : (
              <div className="request-list">
                {myRequests.map((request) => (
                  <div key={request.id} className="request-item">
                    <div>
                      <strong>{request.admin_email}</strong>
                      <span>{new Date(request.requested_at).toLocaleString()}</span>
                    </div>
                    <div className={`status-badge status-${request.status}`}>{request.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="settings-title">
          <h1>Settings</h1>
          <p>Manage your account preferences and system configuration.</p>
        </div>
      </div>
      <div className="settings-container">
        <aside className="settings-sidebar">
          <ul>
            {tabList.map((tab) => (
              <li
                key={tab.key}
                className={activeTab === tab.key ? 'active' : ''}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </li>
            ))}
          </ul>
        </aside>

        <main className="settings-main">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'appearance' && renderAppearanceTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
          {activeTab === 'role-request' && renderRoleRequestTab()}
        </main>
      </div>
    </div>
  );
};

export default Settings;
