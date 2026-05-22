import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import './Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    companyName: 'EMP MANAGE',
    emailNotifications: true,
    dateFormat: 'MM/DD/YYYY',
    timezone: 'America/New_York',
    theme: 'light'
  });

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <DashboardLayout>
      <div className="settings-page">
        <div className="page-header">
          <h1>Settings</h1>
          <p>Configure system preferences</p>
        </div>

        <div className="settings-grid">
          <div className="settings-card">
            <h2>General Settings</h2>
            <div className="settings-form">
              <Input
                label="Company Name"
                value={settings.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
              />
              
              <div className="form-group">
                <label>Date Format</label>
                <select 
                  value={settings.dateFormat}
                  onChange={(e) => handleChange('dateFormat', e.target.value)}
                  className="settings-select"
                >
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>

              <div className="form-group">
                <label>Timezone</label>
                <select 
                  value={settings.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="settings-select"
                >
                  <option>America/New_York</option>
                  <option>Europe/London</option>
                  <option>Asia/Tokyo</option>
                  <option>Australia/Sydney</option>
                </select>
              </div>

              <div className="form-group">
                <label>Theme</label>
                <select 
                  value={settings.theme}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  className="settings-select"
                >
                  <option>light</option>
                  <option>dark</option>
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                  />
                  Enable Email Notifications
                </label>
              </div>

              <Button variant="primary">Save Changes</Button>
            </div>
          </div>

          <div className="settings-card">
            <h2>System Information</h2>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Version</span>
                <span className="info-value">1.0.0</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Updated</span>
                <span className="info-value">2024-01-01</span>
              </div>
              <div className="info-item">
                <span className="info-label">Database Status</span>
                <span className="info-value status-online">● Online</span>
              </div>
              <div className="info-item">
                <span className="info-label">API Endpoint</span>
                <span className="info-value">JSONPlaceholder API</span>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h2>Data Management</h2>
            <div className="actions-list">
              <button className="action-item">
                <span>📥 Export Data</span>
                <span>→</span>
              </button>
              <button className="action-item">
                <span>📤 Import Data</span>
                <span>→</span>
              </button>
              <button className="action-item danger">
                <span>🗑️ Clear All Data</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;