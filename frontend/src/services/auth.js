// Connects the frontend to auth API features.
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

const getBrowserInfo = () => {
  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || 'Unknown OS';
  const rules = [
    [/Edg\/([\d.]+)/, 'Edge'],
    [/Chrome\/([\d.]+)/, 'Chrome'],
    [/Firefox\/([\d.]+)/, 'Firefox'],
    [/Version\/([\d.]+).*Safari/, 'Safari'],
  ];
  const browser = rules
    .map(([regex, name]) => {
      const match = userAgent.match(regex);
      return match ? `${name} ${match[1].split('.')[0]}` : null;
    })
    .find(Boolean) || 'Browser';
  return `${platform} · ${browser}`;
};

const getDeviceName = () => {
  const platform = navigator.platform || 'Device';
  if (/iphone/i.test(navigator.userAgent)) return 'iPhone';
  if (/android/i.test(navigator.userAgent)) return 'Android Mobile';
  if (/mac/i.test(platform)) return 'Mac Device';
  if (/win/i.test(platform)) return 'Windows Device';
  return platform;
};

// Registers new user.
export const registerUser = async (name, email, password, role = 'user', companyId = 'company-a', inviteToken = null) => {
  try {
    // Sends signup data.
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      role,
      company_id: companyId,
      invite_token: inviteToken
    });
    toast.success('Registration successful! Please login.');
    return response.data;
  } catch (error) {
    // Shows signup error.
    console.error('Register error:', error);
    toast.error(error.response?.data?.detail || 'Registration failed');
    throw error;
  }
};

// Logs in user.
export const loginUser = async (email, password, companyId = 'company-a') => {
  try {
    // Sends login data.
    const response = await api.post('/auth/login', {
      email,
      password,
      company_id: companyId,
      browser: getBrowserInfo(),
      device_name: getDeviceName(),
      device_info: navigator.userAgent || 'Unknown device',
      location: 'Unknown Location'
    });
    toast.success(`Welcome back, ${response.data.user.name}!`);
    return response.data;
  } catch (error) {
    // Shows login error.
    console.error('Login error:', error);
    toast.error(error.response?.data?.detail || 'Invalid credentials');
    throw error;
  }
};

// Helps with reset password.
export const resetPassword = async (email, password) => {
  try {
    // Sends new password.
    const response = await api.post('/auth/forgot-password', {
      email,
      password,
      confirm_password: password
    });
    toast.success('Password has been reset successfully');
    return response.data;
  } catch (error) {
    // Shows reset error.
    console.error('Reset password error:', error);
    toast.error(error.response?.data?.detail || 'Password reset failed');
    throw error;
  }
};

// Gets current user.
export const getCurrentUser = async (token) => {
  try {
    // Sends token to verify user.
    const response = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    // Returns null if invalid.
    console.error('Get user error:', error);
    return null;
  }
};

// Coordinates submit role change request behavior.
export const submitRoleChangeRequest = async (currentPassword, adminEmail) => {
  try {
    // Gets saved login token.
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    // Cleans admin email.
    const normalizedAdminEmail = adminEmail.trim().toLowerCase();
    // Sends role request.
    const response = await api.post(
      '/auth/role-request',
      {
        current_password: currentPassword,
        admin_email: normalizedAdminEmail
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    toast.success('Role change request submitted to admin.');
    return response.data;
  } catch (error) {
    console.error('Submit role change request error:', error);
    toast.error(error.response?.data?.detail || 'Unable to submit role request');
    throw error;
  }
};

// Gets pending role requests data.
export const fetchPendingRoleRequests = async () => {
  try {
    // Gets saved login token.
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    // Gets pending admin requests.
    const response = await api.get('/auth/role-requests/pending', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Fetch pending role requests error:', error);
    throw error;
  }
};

// Gets my role requests data.
export const fetchMyRoleRequests = async () => {
  try {
    // Gets saved login token.
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    // Gets user's role requests.
    const response = await api.get('/auth/role-requests', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Fetch my role requests error:', error);
    throw error;
  }
};

// Gets admin reviewers data.
export const fetchAdminReviewers = async () => {
  try {
    // Gets saved login token.
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    // Gets admin reviewer list.
    const response = await api.get('/auth/admins', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.admins;
  } catch (error) {
    console.error('Fetch admin reviewers error:', error);
    throw error;
  }
};

// Prepares approve role request.
export const approveRoleRequest = async (requestId) => {
  try {
    // Gets saved login token.
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    // Approves role request.
    const response = await api.post(`/auth/role-requests/${requestId}/approve`, null, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success('Role request approved.');
    return response.data;
  } catch (error) {
    console.error('Approve role request error:', error);
    toast.error(error.response?.data?.detail || 'Unable to approve request');
    throw error;
  }
};

// Prepares reject role request.
export const rejectRoleRequest = async (requestId) => {
  try {
    // Gets saved login token.
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    // Rejects role request.
    const response = await api.post(`/auth/role-requests/${requestId}/reject`, null, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success('Role request rejected.');
    return response.data;
  } catch (error) {
    console.error('Reject role request error:', error);
    toast.error(error.response?.data?.detail || 'Unable to reject request');
    throw error;
  }
};

// Coordinates submit reactivation request behavior.
export const submitReactivationRequest = async (message) => {
  try {
    // Gets saved login token.
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    // Sends reactivation request.
    const response = await api.post(
      '/auth/reactivation-request',
      { message },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success('Reactivation request submitted.');
    return response.data;
  } catch (error) {
    console.error('Submit reactivation request error:', error);
    toast.error(error.response?.data?.detail || 'Unable to submit reactivation request');
    throw error;
  }
};

// Gets my reactivation requests data.
export const fetchMyReactivationRequests = async () => {
  // Gets saved login token.
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  // Gets user's reactivation requests.
  const response = await api.get('/auth/reactivation-requests/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Gets pending reactivation requests data.
export const fetchPendingReactivationRequests = async () => {
  // Gets saved login token.
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  // Gets pending reactivation requests.
  const response = await api.get('/auth/reactivation-requests/pending', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Prepares approve reactivation request.
export const approveReactivationRequest = async (requestId) => {
  try {
    // Gets saved login token.
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    // Approves reactivation request.
    const response = await api.post(`/auth/reactivation-requests/${requestId}/approve`, null, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success('Account reactivated.');
    return response.data;
  } catch (error) {
    console.error('Approve reactivation request error:', error);
    toast.error(error.response?.data?.detail || 'Unable to approve request');
    throw error;
  }
};

// Prepares reject reactivation request.
export const rejectReactivationRequest = async (requestId) => {
  try {
    // Gets saved login token.
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    // Rejects reactivation request.
    const response = await api.post(`/auth/reactivation-requests/${requestId}/reject`, null, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success('Reactivation request rejected.');
    return response.data;
  } catch (error) {
    console.error('Reject reactivation request error:', error);
    toast.error(error.response?.data?.detail || 'Unable to reject request');
    throw error;
  }
};

// Coordinates submit reinstatement request behavior.
export const submitReinstatementRequest = async (message) => {
  try {
    // Gets saved login token.
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    // Sends reinstatement request.
    const response = await api.post(
      '/auth/reinstatement-request',
      { message },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success('Reinstatement request submitted.');
    return response.data;
  } catch (error) {
    console.error('Submit reinstatement request error:', error);
    toast.error(error.response?.data?.detail || 'Unable to submit reinstatement request');
    throw error;
  }
};

// Gets my reinstatement requests data.
export const fetchMyReinstatementRequests = async () => {
  // Gets saved login token.
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  // Gets user's reinstatement requests.
  const response = await api.get('/auth/reinstatement-requests/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Gets reinstatement requests data.
export const fetchReinstatementRequests = async () => {
  // Gets saved login token.
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  // Gets all reinstatement requests.
  const response = await api.get('/auth/reinstatement-requests', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Prepares approve reinstatement request.
export const approveReinstatementRequest = async (requestId) => {
  try {
    // Gets saved login token.
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    // Approves reinstatement request.
    const response = await api.post(`/auth/reinstatement-requests/${requestId}/approve`, null, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success('Reinstatement request approved.');
    return response.data;
  } catch (error) {
    console.error('Approve reinstatement request error:', error);
    toast.error(error.response?.data?.detail || 'Unable to approve request');
    throw error;
  }
};

// Prepares reject reinstatement request.
export const rejectReinstatementRequest = async (requestId) => {
  try {
    // Gets saved login token.
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    // Rejects reinstatement request.
    const response = await api.post(`/auth/reinstatement-requests/${requestId}/reject`, null, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success('Reinstatement request rejected.');
    return response.data;
  } catch (error) {
    console.error('Reject reinstatement request error:', error);
    toast.error(error.response?.data?.detail || 'Unable to reject request');
    throw error;
  }
};

// Logout
export const logoutUser = () => {
  toast.success('Logged out successfully');
};
