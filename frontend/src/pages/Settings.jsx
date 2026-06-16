import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  fetchMyRoleRequests,
  fetchPendingRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
  submitRoleChangeRequest,
  fetchPendingReactivationRequests,
  approveReactivationRequest,
  rejectReactivationRequest
} from '../services/auth';
import './Settings.css';
import { useNotifications } from '../context/NotificationContext';
import { logAuditAction } from '../services/audit';

const LEAVE_REQUESTS_KEY = 'userLeaveRequests';

const readStorage = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const Settings = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const userCompanyId = user?.companyId || user?.company_id || 'company-a';

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    attendanceReminders: true,
    leaveApprovalAlerts: true,
    newEmployeeAlerts: true,
    systemUpdates: false,
    weeklyReports: true
  });

  // Attendance Settings
  const [attendanceSettings, setAttendanceSettings] = useState({
    checkInTime: '09:00',
    checkOutTime: '18:00',
    lateGracePeriod: '15',
    earlyLeaveGrace: '15',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    autoMarkAbsent: true,
    requireCheckInNote: false
  });

  // Leave Settings
  const [leaveSettings, setLeaveSettings] = useState({
    annualLeave: '12',
    sickLeave: '10',
    casualLeave: '6',
    emergencyLeave: '3',
    carryForward: true,
    maxCarryForward: '15',
    approvalRequired: true
  });

  // Report Settings
  const [reportSettings, setReportSettings] = useState({
    autoGenerateReports: true,
    reportFrequency: 'Monthly',
    reportFormat: 'PDF',
    sendToEmail: true,
    recipients: 'admin@empmanage.com'
  });

  // Role Request State
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsMessage, setRequestsMessage] = useState('');
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [reactivationRequests, setReactivationRequests] = useState([]);
  const [reactivationMessage, setReactivationMessage] = useState('');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveMessage, setLeaveMessage] = useState('');

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: darkMode ? 'dark' : 'light',
    sidebarCollapsed: false,
    compactView: false,
    showAvatars: true,
    animationsEnabled: true,
    fontSize: 'medium'
  });

  const [profileSettings, setProfileSettings] = useState({
    displayName: user?.name || '',
    email: user?.email || '',
    company: user?.companyId === 'company-b' ? 'Company B' : 'Company A'
  });

  const [securitySettings, setSecuritySettings] = useState({
    loginAlerts: true,
    twoFactorAuth: false,
    rememberDevice: true,
    sessionTimeout: true
  });

  const [activeTab, setActiveTab] = useState('roleRequest');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  const loadRequests = async () => {
    if (!user) return;
    setRequestsLoading(true);
    setRequestsMessage('');
    try {
      const data = isAdmin
        ? await fetchPendingRoleRequests()
        : await fetchMyRoleRequests();
      setRequests(data);
      if (isAdmin) {
        const reactivationData = await fetchPendingReactivationRequests();
        setReactivationRequests(reactivationData);
        setLeaveRequests(
          readStorage(LEAVE_REQUESTS_KEY).filter((request) => (
            request.companyId === userCompanyId && request.status === 'pending'
          ))
        );
      }
    } catch (error) {
      setRequestsMessage(error.response?.data?.detail || 'Unable to load requests.');
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'roleRequest') {
      loadRequests();
    }
  }, [activeTab, user, userCompanyId]);

  const handleRoleRequest = async (event) => {
    event.preventDefault();
    if (!adminEmail || !currentPassword) {
      setRequestMessage('Please provide both admin email and current password.');
      return;
    }

    setRequestLoading(true);
    setRequestMessage('');
    try {
      await submitRoleChangeRequest(currentPassword, adminEmail);
      setRequestMessage('Your role request has been submitted successfully.');
      setAdminEmail('');
      setCurrentPassword('');
      await loadRequests();
    } catch (error) {
      setRequestMessage(error.response?.data?.detail || 'Unable to submit the request.');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleAdminAction = async (requestId, action) => {
    setAdminActionLoading(true);
    setRequestsMessage('');
    try {
      if (action === 'approve') {
        await approveRoleRequest(requestId);
        setRequestsMessage('Request approved successfully.');
      } else {
        await rejectRoleRequest(requestId);
        setRequestsMessage('Request rejected successfully.');
      }
      await loadRequests();
    } catch (error) {
      setRequestsMessage(error.response?.data?.detail || 'Unable to update the request.');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleNotificationChange = (key, value) => {
    setNotificationSettings({ ...notificationSettings, [key]: value });
  };

  const handleAttendanceChange = (key, value) => {
    setAttendanceSettings({ ...attendanceSettings, [key]: value });
  };

  const handleLeaveChange = (key, value) => {
    setLeaveSettings({ ...leaveSettings, [key]: value });
  };

  const handleReportChange = (key, value) => {
    setReportSettings({ ...reportSettings, [key]: value });
  };

  const handleAppearanceChange = (key, value) => {
    setAppearanceSettings({ ...appearanceSettings, [key]: value });
    if (key === 'theme') {
      toggleDarkMode();
    }
  };

  const handleReactivationAction = async (requestId, action) => {
    setAdminActionLoading(true);
    setReactivationMessage('');
    try {
      if (action === 'approve') {
        await approveReactivationRequest(requestId);
        setReactivationMessage('Account reactivated successfully.');
      } else {
        await rejectReactivationRequest(requestId);
        setReactivationMessage('Reactivation request rejected.');
      }
      await loadRequests();
    } catch (error) {
      setReactivationMessage(error.response?.data?.detail || 'Unable to update reactivation request.');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleLeaveAction = async (requestId, action) => {
    setAdminActionLoading(true);
    setLeaveMessage('');
    try {
      const requests = readStorage(LEAVE_REQUESTS_KEY);
      const oldRequest = requests.find((request) => request.id === requestId);
      if (!oldRequest) {
        setLeaveMessage('Leave request not found.');
        return;
      }

      const nextStatus = action === 'approve' ? 'approved' : 'rejected';
      const updatedRequest = {
        ...oldRequest,
        status: nextStatus,
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.name || user?.email || 'Admin',
      };
      const nextRequests = requests.map((request) => (
        request.id === requestId ? updatedRequest : request
      ));
      writeStorage(LEAVE_REQUESTS_KEY, nextRequests);
      setLeaveRequests(nextRequests.filter((request) => (
        request.companyId === userCompanyId && request.status === 'pending'
      )));

      const approved = nextStatus === 'approved';
      setLeaveMessage(`Leave request ${nextStatus} successfully.`);
      addNotification({
        type: approved ? 'success' : 'info',
        title: approved ? 'Leave Approved' : 'Leave Rejected',
        message: `${updatedRequest.name || updatedRequest.email}'s ${updatedRequest.type} leave was ${nextStatus}.`,
      });
      await logAuditAction({
        action: approved ? 'Leave Request Approved' : 'Leave Request Rejected',
        entityType: 'attendance',
        entityId: updatedRequest.id,
        entityName: updatedRequest.name || updatedRequest.email,
        details: `${updatedRequest.type} leave request ${nextStatus} for ${updatedRequest.email}`,
        oldValue: oldRequest,
        newValue: updatedRequest,
      });
    } catch (error) {
      setLeaveMessage('Unable to update leave request.');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const persistUserSettings = (updates = {}) => {
    const savedSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    localStorage.setItem('appSettings', JSON.stringify({
      ...savedSettings,
      notifications: updates.notifications || notificationSettings,
      appearance: updates.appearance || appearanceSettings,
      profile: updates.profile || profileSettings,
      security: updates.security || securitySettings
    }));
  };

  const handleProfileChange = (key, value) => {
    const nextProfile = { ...profileSettings, [key]: value };
    setProfileSettings(nextProfile);
    persistUserSettings({ profile: nextProfile });
  };

  const handleSecurityChange = (key, value) => {
    const nextSecurity = { ...securitySettings, [key]: value };
    setSecuritySettings(nextSecurity);
    persistUserSettings({ security: nextSecurity });
  };

  const handleUserNotificationChange = (key, value) => {
    const nextNotifications = { ...notificationSettings, [key]: value };
    setNotificationSettings(nextNotifications);
    persistUserSettings({ notifications: nextNotifications });
  };

  const handleUserAppearanceChange = (key, value) => {
    const nextAppearance = { ...appearanceSettings, [key]: value };
    setAppearanceSettings(nextAppearance);
    persistUserSettings({ appearance: nextAppearance });

    if (key === 'theme' && value !== appearanceSettings.theme) {
      toggleDarkMode();
    }
  };

  const saveAllSettings = () => {
    setSaving(true);
    // Simulate saving to backend
    setTimeout(() => {
      localStorage.setItem('appSettings', JSON.stringify({
        notifications: notificationSettings,
        attendance: attendanceSettings,
        leave: leaveSettings,
        report: reportSettings,
        appearance: appearanceSettings
      }));
      setSaving(false);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 1000);
  };

  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!saving && saveMessage) {
      addNotification({ type: 'success', title: 'Settings Saved', message: saveMessage });
    }
    // we only want to run when saveMessage changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveMessage]);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.notifications) setNotificationSettings(parsed.notifications);
        if (parsed.attendance) setAttendanceSettings(parsed.attendance);
        if (parsed.leave) setLeaveSettings(parsed.leave);
        if (parsed.report) setReportSettings(parsed.report);
        if (parsed.appearance) setAppearanceSettings(parsed.appearance);
        if (parsed.profile) setProfileSettings(parsed.profile);
        if (parsed.security) setSecuritySettings(parsed.security);
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);

  const tabs = [
    { id: 'roleRequest', name: 'Role Request' },
    { id: 'notifications', name: 'Notifications'},
    { id: 'attendance', name: 'Attendance' },
    { id: 'leave', name: 'Leave' },
    { id: 'report', name: 'Reports' },
    { id: 'appearance', name: 'Appearance' }
  ];

  if (!isAdmin) {
    const userTabs = [
      { id: 'profile', name: 'Profile', icon: 'P' },
      { id: 'security', name: 'Security', icon: 'S' },
      { id: 'appearance', name: 'Appearance', icon: 'A' },
      { id: 'notifications', name: 'Notifications', icon: 'N' },
      { id: 'roleRequest', name: 'Role Request', icon: 'R' }
    ];

    return (
      <div className="settings-page user-settings-page">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account preferences and system configuration.</p>
        </div>

        <div className="user-settings-shell">
          <aside className="user-settings-tabs">
            {userTabs.map((tab) => (
              <button
                key={tab.id}
                className={`user-settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </aside>

          <main className="user-settings-content">
            {activeTab === 'roleRequest' && (
              <section className="user-role-request">
                <h2>Role Request</h2>
                <p>Request an upgrade to the Admin role.</p>

                <form className="role-request-form" onSubmit={handleRoleRequest}>
                  <div className="setting-field full-width">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="setting-field full-width">
                    <label htmlFor="adminEmail">Admin Email</label>
                    <input
                      id="adminEmail"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                      required
                    />
                    <small>Enter the email address of the Admin who will review your request.</small>
                  </div>

                  {requestMessage && <div className="role-request-message">{requestMessage}</div>}

                  <button
                    className="submit-request-btn"
                    type="submit"
                    disabled={requestLoading || !currentPassword.trim() || !adminEmail.trim()}
                  >
                    <span>R</span>
                    {requestLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </form>
              </section>
            )}

            {activeTab === 'profile' && (
              <section className="user-role-request user-settings-panel">
                <h2>Profile</h2>
                <p>Update the account details shown across your workspace.</p>

                <div className="settings-grid">
                  <div className="setting-field full-width">
                    <label htmlFor="displayName">Display Name</label>
                    <input
                      id="displayName"
                      type="text"
                      value={profileSettings.displayName}
                      onChange={(e) => handleProfileChange('displayName', e.target.value)}
                    />
                  </div>
                  <div className="setting-field full-width">
                    <label htmlFor="profileEmail">Email</label>
                    <input
                      id="profileEmail"
                      type="email"
                      value={profileSettings.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                    />
                  </div>
                  <div className="setting-field full-width">
                    <label htmlFor="profileCompany">Company</label>
                    <input
                      id="profileCompany"
                      type="text"
                      value={profileSettings.company}
                      onChange={(e) => handleProfileChange('company', e.target.value)}
                    />
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'security' && (
              <section className="user-role-request user-settings-panel">
                <h2>Security</h2>
                <p>Control account protection and login safeguards.</p>

                <div className="settings-list">
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Login Alerts</span>
                      <span className="toggle-desc">Notify me when a new login is detected</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={securitySettings.loginAlerts}
                        onChange={(e) => handleSecurityChange('loginAlerts', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Two-Factor Authentication</span>
                      <span className="toggle-desc">Require a second verification step during login</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={securitySettings.twoFactorAuth}
                        onChange={(e) => handleSecurityChange('twoFactorAuth', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Remember Device</span>
                      <span className="toggle-desc">Keep trusted devices signed in for longer</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={securitySettings.rememberDevice}
                        onChange={(e) => handleSecurityChange('rememberDevice', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Session Timeout</span>
                      <span className="toggle-desc">Automatically sign out after inactivity</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={securitySettings.sessionTimeout}
                        onChange={(e) => handleSecurityChange('sessionTimeout', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'appearance' && (
              <section className="user-role-request user-settings-panel">
                <h2>Appearance</h2>
                <p>Adjust how the dashboard looks and feels.</p>

                <div className="settings-list">
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Dark Mode</span>
                      <span className="toggle-desc">Switch between light and dark interface colors</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={appearanceSettings.theme === 'dark'}
                        onChange={(e) => handleUserAppearanceChange('theme', e.target.checked ? 'dark' : 'light')}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Compact View</span>
                      <span className="toggle-desc">Reduce spacing to show more content on screen</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={appearanceSettings.compactView}
                        onChange={(e) => handleUserAppearanceChange('compactView', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Show Avatars</span>
                      <span className="toggle-desc">Display user and employee avatars</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={appearanceSettings.showAvatars}
                        onChange={(e) => handleUserAppearanceChange('showAvatars', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Animations</span>
                      <span className="toggle-desc">Enable smooth transitions and motion</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={appearanceSettings.animationsEnabled}
                        onChange={(e) => handleUserAppearanceChange('animationsEnabled', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'notifications' && (
              <section className="user-role-request user-settings-panel">
                <h2>Notifications</h2>
                <p>Choose which updates should reach you.</p>

                <div className="settings-list">
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Email Notifications</span>
                      <span className="toggle-desc">Receive important updates by email</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => handleUserNotificationChange('emailNotifications', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Push Notifications</span>
                      <span className="toggle-desc">Show browser notifications for live updates</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => handleUserNotificationChange('pushNotifications', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">New Employee Alerts</span>
                      <span className="toggle-desc">Notify me when team members are added</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.newEmployeeAlerts}
                        onChange={(e) => handleUserNotificationChange('newEmployeeAlerts', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Weekly Reports</span>
                      <span className="toggle-desc">Receive a weekly summary of activity</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.weeklyReports}
                        onChange={(e) => handleUserNotificationChange('weeklyReports', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    );
  }

  const adminTabs = [
    { id: 'profile', name: 'Profile', icon: 'P' },
    { id: 'security', name: 'Security', icon: 'S' },
    { id: 'appearance', name: 'Appearance', icon: 'A' },
    { id: 'notifications', name: 'Notifications', icon: 'N' },
    { id: 'roleRequest', name: 'Approvals', icon: '✓' }
  ];

  if (isAdmin) {
    return (
      <div className="settings-page user-settings-page">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account preferences and system configuration.</p>
        </div>

        <div className="user-settings-shell">
          <aside className="user-settings-tabs">
            {adminTabs.map((tab) => (
              <button
                key={tab.id}
                className={`user-settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </aside>

          <main className="user-settings-content">
            {activeTab === 'roleRequest' && (
              <div className="admin-approvals-stack">
              <section className="user-role-request admin-approvals-panel">
                <h2>Pending Role Requests</h2>
                <p>Manage pending role upgrade requests.</p>

                {requestsLoading ? (
                  <div className="role-requests-loading">Loading approvals...</div>
                ) : requests.length === 0 ? (
                  <div className="role-requests-empty">No pending role change requests for {user?.email}.</div>
                ) : (
                  <div className="approval-list">
                    {requests.map((request) => (
                      <div key={request.id} className="approval-row">
                        <div className="approval-user">
                          <strong>{request.requester_email.split('@')[0]}</strong>
                          <span>{request.requester_email}</span>
                        </div>
                        <div className="approval-actions">
                          <button
                            className="approval-approve"
                            type="button"
                            disabled={adminActionLoading}
                            onClick={() => handleAdminAction(request.id, 'approve')}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="approval-reject"
                            type="button"
                            disabled={adminActionLoading}
                            onClick={() => handleAdminAction(request.id, 'reject')}
                          >
                            ⊗ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {requestsMessage && <div className="role-request-message">{requestsMessage}</div>}
              </section>
              <section className="user-role-request admin-approvals-panel">
                <h2>Pending Reactivation Requests</h2>
                {requestsLoading ? (
                  <div className="role-requests-loading">Loading reactivation requests...</div>
                ) : reactivationRequests.length === 0 ? (
                  <div className="role-requests-empty">No pending reactivation requests for {user?.email}.</div>
                ) : (
                  <div className="approval-list">
                    {reactivationRequests.map((request) => (
                      <div key={request.id} className="approval-row reactivation-approval-row">
                        <div className="approval-user">
                          <strong>{request.requester_name}</strong>
                          <span>{request.requester_email} requested account reactivation.</span>
                          {request.message && <small>Message: {request.message}</small>}
                        </div>
                        <div className="approval-actions">
                          <button
                            className="approval-approve"
                            type="button"
                            disabled={adminActionLoading}
                            onClick={() => handleReactivationAction(request.id, 'approve')}
                          >
                            Reactivate
                          </button>
                          <button
                            className="approval-reject"
                            type="button"
                            disabled={adminActionLoading}
                            onClick={() => handleReactivationAction(request.id, 'reject')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {reactivationMessage && <div className="role-request-message">{reactivationMessage}</div>}
              </section>
              <section className="user-role-request admin-approvals-panel">
                <h2>Pending Leave Requests</h2>
                <p>Approve or reject submitted vacation and medical leave requests.</p>
                {requestsLoading ? (
                  <div className="role-requests-loading">Loading leave requests...</div>
                ) : leaveRequests.length === 0 ? (
                  <div className="role-requests-empty">No pending leave requests for {user?.email}.</div>
                ) : (
                  <div className="approval-list">
                    {leaveRequests.map((request) => (
                      <div key={request.id} className="approval-row leave-approval-row">
                        <div className="approval-user">
                          <strong>{request.name || request.email}</strong>
                          <span>{request.type} leave: {request.startDate} - {request.endDate}</span>
                          <small>{request.reason ? `Reason: ${request.reason}` : 'No reason provided'}</small>
                        </div>
                        <div className="approval-actions">
                          <button
                            className="approval-approve"
                            type="button"
                            disabled={adminActionLoading}
                            onClick={() => handleLeaveAction(request.id, 'approve')}
                          >
                            Approve
                          </button>
                          <button
                            className="approval-reject"
                            type="button"
                            disabled={adminActionLoading}
                            onClick={() => handleLeaveAction(request.id, 'reject')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {leaveMessage && <div className="role-request-message">{leaveMessage}</div>}
              </section>
              </div>
            )}

            {activeTab === 'profile' && (
              <section className="user-role-request user-settings-panel">
                <h2>Profile</h2>
                <p>Update the admin account details shown across your workspace.</p>

                <div className="settings-grid">
                  <div className="setting-field full-width">
                    <label htmlFor="adminDisplayName">Display Name</label>
                    <input
                      id="adminDisplayName"
                      type="text"
                      value={profileSettings.displayName}
                      onChange={(e) => handleProfileChange('displayName', e.target.value)}
                    />
                  </div>
                  <div className="setting-field full-width">
                    <label htmlFor="adminProfileEmail">Email</label>
                    <input
                      id="adminProfileEmail"
                      type="email"
                      value={profileSettings.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                    />
                  </div>
                  <div className="setting-field full-width">
                    <label htmlFor="adminProfileCompany">Company</label>
                    <input
                      id="adminProfileCompany"
                      type="text"
                      value={profileSettings.company}
                      onChange={(e) => handleProfileChange('company', e.target.value)}
                    />
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'security' && (
              <section className="user-role-request user-settings-panel">
                <h2>Security</h2>
                <p>Control admin account protection and login safeguards.</p>

                <div className="settings-list">
                  {[
                    ['loginAlerts', 'Login Alerts', 'Notify me when a new login is detected'],
                    ['twoFactorAuth', 'Two-Factor Authentication', 'Require a second verification step during login'],
                    ['rememberDevice', 'Remember Device', 'Keep trusted devices signed in for longer'],
                    ['sessionTimeout', 'Session Timeout', 'Automatically sign out after inactivity']
                  ].map(([key, label, desc]) => (
                    <div className="setting-toggle" key={key}>
                      <div className="toggle-info">
                        <span className="toggle-label">{label}</span>
                        <span className="toggle-desc">{desc}</span>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={securitySettings[key]}
                          onChange={(e) => handleSecurityChange(key, e.target.checked)}
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'appearance' && (
              <section className="user-role-request user-settings-panel">
                <h2>Appearance</h2>
                <p>Adjust how the dashboard looks and feels.</p>

                <div className="settings-list">
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Dark Mode</span>
                      <span className="toggle-desc">Switch between light and dark interface colors</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={appearanceSettings.theme === 'dark'}
                        onChange={(e) => handleUserAppearanceChange('theme', e.target.checked ? 'dark' : 'light')}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  {[
                    ['compactView', 'Compact View', 'Reduce spacing to show more content on screen'],
                    ['showAvatars', 'Show Avatars', 'Display user and employee avatars'],
                    ['animationsEnabled', 'Animations', 'Enable smooth transitions and motion']
                  ].map(([key, label, desc]) => (
                    <div className="setting-toggle" key={key}>
                      <div className="toggle-info">
                        <span className="toggle-label">{label}</span>
                        <span className="toggle-desc">{desc}</span>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={appearanceSettings[key]}
                          onChange={(e) => handleUserAppearanceChange(key, e.target.checked)}
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'notifications' && (
              <section className="user-role-request user-settings-panel">
                <h2>Notifications</h2>
                <p>Choose which admin updates should reach you.</p>

                <div className="settings-list">
                  {[
                    ['emailNotifications', 'Email Notifications', 'Receive important updates by email'],
                    ['pushNotifications', 'Push Notifications', 'Show browser notifications for live updates'],
                    ['leaveApprovalAlerts', 'Approval Alerts', 'Notify me when requests need review'],
                    ['weeklyReports', 'Weekly Reports', 'Receive a weekly summary of activity']
                  ].map(([key, label, desc]) => (
                    <div className="setting-toggle" key={key}>
                      <div className="toggle-info">
                        <span className="toggle-label">{label}</span>
                        <span className="toggle-desc">{desc}</span>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={notificationSettings[key]}
                          onChange={(e) => handleUserNotificationChange(key, e.target.checked)}
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
      <div className="settings-page">
        {/* Header */}
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Request a role upgrade or manage your app settings from one place.</p>
        </div>

        {/* Save Button */}
        <div className="settings-actions">
          {saveMessage && <div className="save-message success">{saveMessage}</div>}
          <button className="save-all-btn" onClick={saveAllSettings} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save All Settings'}
          </button>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="settings-content">
          {activeTab === 'roleRequest' && (
            <div className="settings-section">
              <div className="settings-card">
                <h2>{isAdmin ? 'Pending Role Change Requests' : 'Request Admin Role'}</h2>
                <p>
                  {isAdmin
                    ? 'Review and manage incoming role change requests submitted by users.'
                    : 'Submit a request to become an admin by verifying your current password and specifying the admin reviewer email.'}
                </p>

                {isAdmin ? (
                  <>
                    {requestsLoading ? (
                      <div className="role-requests-loading">Loading requests...</div>
                    ) : requests.length === 0 ? (
                      <div className="role-requests-empty">No pending requests at the moment.</div>
                    ) : (
                      <div className="role-requests-table">
                        <div className="role-requests-row role-requests-head">
                          <span>User</span>
                          <span>Email</span>
                          <span>Submitted</span>
                          <span>Status</span>
                          <span>Actions</span>
                        </div>
                        {requests.map((request) => (
                          <div key={request.id} className="role-requests-row">
                            <span>{request.requester_email.split('@')[0]}</span>
                            <span>{request.requester_email}</span>
                            <span>{new Date(request.requested_at).toLocaleString()}</span>
                            <span className={`status-badge status-${request.status}`}>
                              {request.status}
                            </span>
                            <span className="actions-cell">
                              <button
                                className="approve-btn"
                                disabled={adminActionLoading}
                                onClick={() => handleAdminAction(request.id, 'approve')}
                              >
                                Approve
                              </button>
                              <button
                                className="reject-btn"
                                disabled={adminActionLoading}
                                onClick={() => handleAdminAction(request.id, 'reject')}
                              >
                                Reject
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {requestsMessage && <div className="role-request-message">{requestsMessage}</div>}
                  </>
                ) : (
                  <>
                    <form className="role-request-form" onSubmit={handleRoleRequest}>
                      <div className="settings-grid">
                        <div className="setting-field full-width">
                          <label htmlFor="adminEmail">Admin Reviewer Email</label>
                          <input
                            id="adminEmail"
                            type="email"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            placeholder="admin@example.com"
                            required
                          />
                        </div>
                        <div className="setting-field full-width">
                          <label htmlFor="currentPassword">Current Password</label>
                          <input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter your current password"
                            required
                          />
                        </div>
                      </div>
                      {requestMessage && <div className="role-request-message">{requestMessage}</div>}
                      <button className="save-all-btn" type="submit" disabled={requestLoading}>
                        {requestLoading ? 'Submitting request...' : 'Request Admin Role'}
                      </button>
                    </form>

                    {requestsLoading ? (
                      <div className="role-requests-loading">Loading your request history...</div>
                    ) : requests.length > 0 ? (
                      <div className="role-requests-table">
                        <div className="role-requests-row role-requests-head">
                          <span>Admin Reviewer</span>
                          <span>Requested</span>
                          <span>Status</span>
                          <span>Reviewed</span>
                        </div>
                        {requests.map((request) => (
                          <div key={request.id} className="role-requests-row">
                            <span>{request.admin_email}</span>
                            <span>{new Date(request.requested_at).toLocaleString()}</span>
                            <span className={`status-badge status-${request.status}`}>
                              {request.status}
                            </span>
                            <span>{request.reviewed_at ? new Date(request.reviewed_at).toLocaleString() : '—'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="role-requests-empty">No role requests found yet.</div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <div className="settings-card">
                <h2> Notification Preferences</h2>
                <div className="settings-list">
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Email Notifications</span>
                      <span className="toggle-desc">Receive important updates via email</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Push Notifications</span>
                      <span className="toggle-desc">Get real-time notifications in browser</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Attendance Reminders</span>
                      <span className="toggle-desc">Daily reminders for check-in/check-out</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.attendanceReminders}
                        onChange={(e) => handleNotificationChange('attendanceReminders', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Leave Approval Alerts</span>
                      <span className="toggle-desc">Notifications when leave requests need approval</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.leaveApprovalAlerts}
                        onChange={(e) => handleNotificationChange('leaveApprovalAlerts', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">New Employee Alerts</span>
                      <span className="toggle-desc">Get notified when new employees join</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.newEmployeeAlerts}
                        onChange={(e) => handleNotificationChange('newEmployeeAlerts', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">System Updates</span>
                      <span className="toggle-desc">Receive notifications about system updates</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.systemUpdates}
                        onChange={(e) => handleNotificationChange('systemUpdates', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Weekly Reports</span>
                      <span className="toggle-desc">Receive weekly summary reports</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.weeklyReports}
                        onChange={(e) => handleNotificationChange('weeklyReports', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employee Settings */}
          {/* Attendance Settings */}
          {activeTab === 'attendance' && (
            <div className="settings-section">
              <div className="settings-card">
                <h2> Attendance Rules</h2>
                <div className="settings-grid">
                  <div className="setting-field">
                    <label>Default Check-in Time</label>
                    <input
                      type="time"
                      value={attendanceSettings.checkInTime}
                      onChange={(e) => handleAttendanceChange('checkInTime', e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label>Default Check-out Time</label>
                    <input
                      type="time"
                      value={attendanceSettings.checkOutTime}
                      onChange={(e) => handleAttendanceChange('checkOutTime', e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label>Late Grace Period (minutes)</label>
                    <input
                      type="number"
                      value={attendanceSettings.lateGracePeriod}
                      onChange={(e) => handleAttendanceChange('lateGracePeriod', e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label>Early Leave Grace (minutes)</label>
                    <input
                      type="number"
                      value={attendanceSettings.earlyLeaveGrace}
                      onChange={(e) => handleAttendanceChange('earlyLeaveGrace', e.target.value)}
                    />
                  </div>
                </div>
                <div className="settings-list">
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Auto Mark Absent</span>
                      <span className="toggle-desc">Automatically mark absent for no check-in</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={attendanceSettings.autoMarkAbsent}
                        onChange={(e) => handleAttendanceChange('autoMarkAbsent', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Require Check-in Note</span>
                      <span className="toggle-desc">Employees must add a note when checking in</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={attendanceSettings.requireCheckInNote}
                        onChange={(e) => handleAttendanceChange('requireCheckInNote', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
                <div className="setting-field">
                  <label>Working Days</label>
                  <div className="working-days">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <label key={day} className="day-checkbox">
                        <input
                          type="checkbox"
                          checked={attendanceSettings.workingDays.includes(day)}
                          onChange={(e) => {
                            let newDays = [...attendanceSettings.workingDays];
                            if (e.target.checked) {
                              newDays.push(day);
                            } else {
                              newDays = newDays.filter(d => d !== day);
                            }
                            handleAttendanceChange('workingDays', newDays);
                          }}
                        />
                        {day.slice(0, 3)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leave Settings */}
          {activeTab === 'leave' && (
            <div className="settings-section">
              <div className="settings-card">
                <h2> Leave Management</h2>
                <div className="settings-grid">
                  <div className="setting-field">
                    <label>Annual Leave (days/year)</label>
                    <input
                      type="number"
                      value={leaveSettings.annualLeave}
                      onChange={(e) => handleLeaveChange('annualLeave', e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label>Sick Leave (days/year)</label>
                    <input
                      type="number"
                      value={leaveSettings.sickLeave}
                      onChange={(e) => handleLeaveChange('sickLeave', e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label>Casual Leave (days/year)</label>
                    <input
                      type="number"
                      value={leaveSettings.casualLeave}
                      onChange={(e) => handleLeaveChange('casualLeave', e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label>Emergency Leave (days/year)</label>
                    <input
                      type="number"
                      value={leaveSettings.emergencyLeave}
                      onChange={(e) => handleLeaveChange('emergencyLeave', e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label>Max Carry Forward (days)</label>
                    <input
                      type="number"
                      value={leaveSettings.maxCarryForward}
                      onChange={(e) => handleLeaveChange('maxCarryForward', e.target.value)}
                    />
                  </div>
                </div>
                <div className="settings-list">
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Carry Forward Unused Leave</span>
                      <span className="toggle-desc">Allow unused leave to be carried to next year</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={leaveSettings.carryForward}
                        onChange={(e) => handleLeaveChange('carryForward', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Require Approval</span>
                      <span className="toggle-desc">Leave requests require manager approval</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={leaveSettings.approvalRequired}
                        onChange={(e) => handleLeaveChange('approvalRequired', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Report Settings */}
          {activeTab === 'report' && (
            <div className="settings-section">
              <div className="settings-card">
                <h2> Report Configuration</h2>
                <div className="settings-grid">
                  <div className="setting-field">
                    <label>Report Frequency</label>
                    <select
                      value={reportSettings.reportFrequency}
                      onChange={(e) => handleReportChange('reportFrequency', e.target.value)}
                    >
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                      <option>Quarterly</option>
                    </select>
                  </div>
                  <div className="setting-field">
                    <label>Report Format</label>
                    <select
                      value={reportSettings.reportFormat}
                      onChange={(e) => handleReportChange('reportFormat', e.target.value)}
                    >
                      <option>PDF</option>
                      <option>Excel</option>
                      <option>CSV</option>
                    </select>
                  </div>
                  <div className="setting-field full-width">
                    <label>Report Recipients</label>
                    <input
                      type="text"
                      value={reportSettings.recipients}
                      onChange={(e) => handleReportChange('recipients', e.target.value)}
                      placeholder="Enter email addresses separated by commas"
                    />
                  </div>
                </div>
                <div className="settings-list">
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Auto Generate Reports</span>
                      <span className="toggle-desc">Automatically generate reports on schedule</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={reportSettings.autoGenerateReports}
                        onChange={(e) => handleReportChange('autoGenerateReports', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Send Reports via Email</span>
                      <span className="toggle-desc">Email reports to specified recipients</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={reportSettings.sendToEmail}
                        onChange={(e) => handleReportChange('sendToEmail', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <div className="settings-card">
                <h2> Appearance</h2>
                <div className="settings-grid">
                  <div className="setting-field">
                    <label>Theme</label>
                    <select
                      value={appearanceSettings.theme}
                      onChange={(e) => handleAppearanceChange('theme', e.target.value)}
                    >
                      <option>light</option>
                      <option>dark</option>
                    </select>
                  </div>
                  <div className="setting-field">
                    <label>Font Size</label>
                    <select
                      value={appearanceSettings.fontSize}
                      onChange={(e) => handleAppearanceChange('fontSize', e.target.value)}
                    >
                      <option>small</option>
                      <option>medium</option>
                      <option>large</option>
                    </select>
                  </div>
                </div>
                <div className="settings-list">
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Collapsed Sidebar</span>
                      <span className="toggle-desc">Show sidebar in collapsed mode</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={appearanceSettings.sidebarCollapsed}
                        onChange={(e) => handleAppearanceChange('sidebarCollapsed', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Compact View</span>
                      <span className="toggle-desc">Show more content with compact spacing</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={appearanceSettings.compactView}
                        onChange={(e) => handleAppearanceChange('compactView', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Show Avatars</span>
                      <span className="toggle-desc">Display employee avatars throughout the app</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={appearanceSettings.showAvatars}
                        onChange={(e) => handleAppearanceChange('showAvatars', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="setting-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Enable Animations</span>
                      <span className="toggle-desc">Smooth animations and transitions</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={appearanceSettings.animationsEnabled}
                        onChange={(e) => handleAppearanceChange('animationsEnabled', e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
  );
};

export default Settings;
