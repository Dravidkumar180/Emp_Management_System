import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
export const CURRENT_SESSION_KEY = 'currentSessionId';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  const sessionId = localStorage.getItem(CURRENT_SESSION_KEY);
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(sessionId ? { 'X-Session-Id': sessionId } : {}),
  };
};

export const saveCurrentSession = (session) => {
  if (session?.session_identifier) {
    localStorage.setItem(CURRENT_SESSION_KEY, session.session_identifier);
  }
};

export const getCurrentSessionId = () => localStorage.getItem(CURRENT_SESSION_KEY);

export const clearCurrentSession = () => localStorage.removeItem(CURRENT_SESSION_KEY);

export const fetchMyLoginDevices = async () => {
  const response = await axios.get(`${API_BASE_URL}/login-devices/me`, { headers: authHeaders() });
  return response.data;
};

export const fetchCompanyLoginDevices = async (params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/login-devices/company`, { headers: authHeaders(), params });
  return response.data;
};

export const updateSessionActivity = async () => {
  const response = await axios.post(`${API_BASE_URL}/login-devices/activity`, null, { headers: authHeaders() });
  return response.data;
};

export const renameDevice = async (sessionId, deviceName) => {
  const response = await axios.patch(`${API_BASE_URL}/login-devices/${sessionId}/rename`, { device_name: deviceName }, { headers: authHeaders() });
  return response.data;
};

export const removeTrustedDevice = async (sessionId) => {
  const response = await axios.post(`${API_BASE_URL}/login-devices/${sessionId}/remove-trusted`, null, { headers: authHeaders() });
  return response.data;
};

export const logoutDevice = async (sessionId) => {
  const response = await axios.post(`${API_BASE_URL}/login-devices/${sessionId}/logout`, null, { headers: authHeaders() });
  return response.data;
};

export const logoutOtherDevices = async () => {
  const response = await axios.post(`${API_BASE_URL}/login-devices/logout-others`, null, { headers: authHeaders() });
  return response.data;
};

export const logoutAllDevices = async () => {
  const response = await axios.post(`${API_BASE_URL}/login-devices/logout-all`, null, { headers: authHeaders() });
  return response.data;
};

export const revokeDeviceSession = async (sessionId) => {
  const response = await axios.post(`${API_BASE_URL}/login-devices/${sessionId}/revoke`, null, { headers: authHeaders() });
  return response.data;
};

export const forceLogoutDeviceSession = async (sessionId) => {
  const response = await axios.post(`${API_BASE_URL}/login-devices/${sessionId}/force-logout`, null, { headers: authHeaders() });
  return response.data;
};

export const bulkRevokeDeviceSessions = async (sessionIds) => {
  const response = await axios.post(`${API_BASE_URL}/login-devices/bulk-revoke`, { session_ids: sessionIds }, { headers: authHeaders() });
  return response.data;
};
