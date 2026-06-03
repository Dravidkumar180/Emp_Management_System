import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Toaster, toast } from 'react-hot-toast';
import { fetchMyRoleRequests, submitRoleChangeRequest } from '../services/auth';
import './Settings.css';

const Settings = () => {
  const { user, login } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile Settings
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    department: ''
  });
  
  // Security Settings
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });
  
  // Appearance Settings
  const [appearance, setAppearance] = useState({
    theme: darkMode ? 'dark' : 'light',
    fontSize: 'medium',
    compactView: false,
    animations: true,
    sidebarCollapsed: false
  });
  
  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    attendanceReminders: false,
    leaveAlerts: true,
    systemUpdates: false,
    marketingEmails: false
  });
  
  // Role Request Settings
  const [roleRequest, setRoleRequest] = useState({
    adminEmail: '',
    currentPassword: '',
    reason: ''
  });
  const [roleRequestStatus, setRoleRequestStatus] = useState(null);
  const [existingRequest, setExistingRequest] = useState(null);

  // Load user data on mount
  useEffect(() => {
    loadUserProfile();
    checkExistingRoleRequest();
  }, []);

  const loadUserProfile = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setProfile({
          name: parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          location: parsed.location || '',
          bio: parsed.bio || '',
          department: parsed.department || ''
        });
      } catch (e) {
        console.error('Error loading profile:', e);
      }
    }
  };

  const checkExistingRoleRequest = async () => {
    try {
      const requests = await fetchMyRoleRequests();
      const latestRequest = Array.isArray(requests) && requests.length > 0
        ? requests[0]
        : null;
      setExistingRequest(latestRequest);
    } catch (error) {
      console.error('Error checking role request:', error);
    }
  };

  // Update Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/v1/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        toast.success('Profile updated successfully!');
        // Update local storage
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...savedUser, ...profile };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (security.newPassword !== security.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (security.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: security.currentPassword,
          newPassword: security.newPassword
        })
      });
      
      if (response.ok) {
        toast.success('Password changed successfully!');
        setSecurity({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          twoFactorEnabled: security.twoFactorEnabled
        });
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to change password');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Update Appearance
  const handleUpdateAppearance = (key, value) => {
    setAppearance({ ...appearance, [key]: value });
    if (key === 'theme') {
      toggleDarkMode();
    }
    toast.success(`${key} updated`);
  };

  // Update Notifications
  const handleUpdateNotifications = async (key, value) => {
    setNotifications({ ...notifications, [key]: value });
    
    try {
      const response = await fetch('/api/v1/auth/update-notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ [key]: value })
      });
      if (response.ok) {
        toast.success('Notification settings updated');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  };

  // Submit Role Request
  const handleRoleRequest = async (e) => {
    e.preventDefault();
    
    if (!roleRequest.adminEmail) {
      toast.error('Please enter admin email');
      return;
    }
    
    if (!roleRequest.currentPassword) {
      toast.error('Please enter your password');
      return;
    }
    
    setLoading(true);
    
    try {
      await submitRoleChangeRequest(roleRequest.currentPassword, roleRequest.adminEmail);
      setRoleRequestStatus('pending');
      setRoleRequest({ adminEmail: '', currentPassword: '', reason: '' });
      await checkExistingRoleRequest();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'roleRequest', name: 'Role Request', icon: '⭐' }
  ];

  return (
    <div className="settings-page">
        <Toaster position="top-right" />
        
        {/* Header */}
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account preferences and system configuration.</p>
        </div>
        
        {/* Tabs */}
        <div className="settings-tabs-container">
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
          
          {/* ========== PROFILE TAB ========== */}
          {activeTab === 'profile' && (
            <div className="settings-card">
              <h2>Profile Information</h2>
              <form onSubmit={handleUpdateProfile} className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      placeholder="Enter your email"
                      disabled
                    />
                    <small>Email cannot be changed</small>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({...profile, location: e.target.value})}
                      placeholder="Enter your location"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      value={profile.department}
                      onChange={(e) => setProfile({...profile, department: e.target.value})}
                      placeholder="Enter your department"
                    />
                  </div>
                  <div className="form-group">
                    <label>Bio</label>
                    <textarea
                      rows="3"
                      value={profile.bio}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      placeholder="Tell us about yourself"
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* ========== SECURITY TAB ========== */}
          {activeTab === 'security' && (
            <div className="settings-card">
              <h2>Security Settings</h2>
              
              {/* Change Password */}
              <div className="security-section">
                <h3>Change Password</h3>
                <form onSubmit={handleUpdatePassword} className="settings-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={security.currentPassword}
                      onChange={(e) => setSecurity({...security, currentPassword: e.target.value})}
                      placeholder="Enter your current password"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        value={security.newPassword}
                        onChange={(e) => setSecurity({...security, newPassword: e.target.value})}
                        placeholder="Enter new password"
                        required
                      />
                      <small>Minimum 6 characters</small>
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        value={security.confirmPassword}
                        onChange={(e) => setSecurity({...security, confirmPassword: e.target.value})}
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Two-Factor Authentication */}
              <div className="security-section">
                <h3>Two-Factor Authentication</h3>
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <span className="toggle-label">Enable 2FA</span>
                    <span className="toggle-desc">Add an extra layer of security to your account</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={security.twoFactorEnabled}
                      onChange={(e) => setSecurity({...security, twoFactorEnabled: e.target.checked})}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* ========== APPEARANCE TAB ========== */}
          {activeTab === 'appearance' && (
            <div className="settings-card">
              <h2>Appearance Settings</h2>
              
              <div className="appearance-settings">
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Theme</span>
                    <span className="setting-desc">Choose between light and dark mode</span>
                  </div>
                  <div className="theme-buttons">
                    <button
                      className={`theme-btn ${appearance.theme === 'light' ? 'active' : ''}`}
                      onClick={() => handleUpdateAppearance('theme', 'light')}
                    >
                      ☀️ Light
                    </button>
                    <button
                      className={`theme-btn ${appearance.theme === 'dark' ? 'active' : ''}`}
                      onClick={() => handleUpdateAppearance('theme', 'dark')}
                    >
                      🌙 Dark
                    </button>
                  </div>
                </div>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Font Size</span>
                    <span className="setting-desc">Adjust text size for better readability</span>
                  </div>
                  <select
                    value={appearance.fontSize}
                    onChange={(e) => handleUpdateAppearance('fontSize', e.target.value)}
                    className="setting-select"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <span className="toggle-label">Compact View</span>
                    <span className="toggle-desc">Show more content with tighter spacing</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={appearance.compactView}
                      onChange={(e) => handleUpdateAppearance('compactView', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <span className="toggle-label">Animations</span>
                    <span className="toggle-desc">Enable smooth animations and transitions</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={appearance.animations}
                      onChange={(e) => handleUpdateAppearance('animations', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* ========== NOTIFICATIONS TAB ========== */}
          {activeTab === 'notifications' && (
            <div className="settings-card">
              <h2>Notification Preferences</h2>
              
              <div className="notifications-settings">
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <span className="toggle-label">Email Notifications</span>
                    <span className="toggle-desc">Receive important updates via email</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => handleUpdateNotifications('emailNotifications', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <span className="toggle-label">Push Notifications</span>
                    <span className="toggle-desc">Get real-time notifications in browser</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifications.pushNotifications}
                      onChange={(e) => handleUpdateNotifications('pushNotifications', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <span className="toggle-label">Attendance Reminders</span>
                    <span className="toggle-desc">Daily reminders to mark attendance</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifications.attendanceReminders}
                      onChange={(e) => handleUpdateNotifications('attendanceReminders', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <span className="toggle-label">Leave Alerts</span>
                    <span className="toggle-desc">Get notified about leave requests and approvals</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifications.leaveAlerts}
                      onChange={(e) => handleUpdateNotifications('leaveAlerts', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <span className="toggle-label">System Updates</span>
                    <span className="toggle-desc">Receive notifications about system updates</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifications.systemUpdates}
                      onChange={(e) => handleUpdateNotifications('systemUpdates', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* ========== ROLE REQUEST TAB ========== */}
          {activeTab === 'roleRequest' && (
            <div className="settings-card">
              <h2>Role Request</h2>
              <p className="section-description">Request an upgrade to the Admin role.</p>
              
              {existingRequest && existingRequest.status === 'pending' ? (
                <div className="pending-request">
                  <div className="pending-icon">⏳</div>
                  <h3>Request Pending</h3>
                  <p>Your role change request is awaiting admin approval.</p>
                  <p className="request-details">
                    Submitted on: {new Date(existingRequest.requested_at).toLocaleString()}
                  </p>
                </div>
              ) : existingRequest && existingRequest.status === 'approved' ? (
                <div className="approved-request">
                  <div className="approved-icon">✅</div>
                  <h3>Request Approved!</h3>
                  <p>Your account has been upgraded to Admin role.</p>
                </div>
              ) : existingRequest && existingRequest.status === 'rejected' ? (
                <div className="rejected-request">
                  <div className="rejected-icon">❌</div>
                  <h3>Request Rejected</h3>
                  <p>Your request was rejected. You can submit a new request.</p>
                </div>
              ) : null}
              
              {(!existingRequest || existingRequest.status === 'rejected') && (
                <form onSubmit={handleRoleRequest} className="role-request-form">
                  <div className="form-group">
                    <label>Admin Email</label>
                    <input
                      type="email"
                      value={roleRequest.adminEmail}
                      onChange={(e) => setRoleRequest({...roleRequest, adminEmail: e.target.value})}
                      placeholder="admin@example.com"
                      required
                    />
                    <small>Enter the email address of the Admin who will review your request.</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={roleRequest.currentPassword}
                      onChange={(e) => setRoleRequest({...roleRequest, currentPassword: e.target.value})}
                      placeholder="Enter your current password"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Reason for Request (Optional)</label>
                    <textarea
                      rows="3"
                      value={roleRequest.reason}
                      onChange={(e) => setRoleRequest({...roleRequest, reason: e.target.value})}
                      placeholder="Tell us why you need admin access..."
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
    </div>
  );
};

export default Settings;
