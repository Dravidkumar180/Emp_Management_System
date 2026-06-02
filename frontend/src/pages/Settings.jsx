import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchMyRoleRequests, fetchPendingRoleRequests, approveRoleRequest, rejectRoleRequest, submitRoleChangeRequest } from '../services/auth';
import './Settings.css';
import { useNotifications } from '../context/NotificationContext';

const Settings = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

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

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: darkMode ? 'dark' : 'light',
    sidebarCollapsed: false,
    compactView: false,
    showAvatars: true,
    animationsEnabled: true,
    fontSize: 'medium'
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
  }, [activeTab, user]);

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