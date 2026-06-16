import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Register new user
export const registerUser = async (name, email, password, role = 'user', companyId = 'company-a', inviteToken = null) => {
  try {
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
    console.error('Register error:', error);
    toast.error(error.response?.data?.detail || 'Registration failed');
    throw error;
  }
};

// Login user
export const loginUser = async (email, password, companyId = 'company-a') => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password,
      company_id: companyId
    });
    toast.success(`Welcome back, ${response.data.user.name}!`);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    toast.error(error.response?.data?.detail || 'Invalid credentials');
    throw error;
  }
};

export const resetPassword = async (email, password) => {
  try {
    const response = await api.post('/auth/forgot-password', {
      email,
      password,
      confirm_password: password
    });
    toast.success('Password has been reset successfully');
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error);
    toast.error(error.response?.data?.detail || 'Password reset failed');
    throw error;
  }
};

// Get current user
export const getCurrentUser = async (token) => {
  try {
    const response = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

export const submitRoleChangeRequest = async (currentPassword, adminEmail) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const normalizedAdminEmail = adminEmail.trim().toLowerCase();
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

export const fetchPendingRoleRequests = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const response = await api.get('/auth/role-requests/pending', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Fetch pending role requests error:', error);
    throw error;
  }
};

export const fetchMyRoleRequests = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const response = await api.get('/auth/role-requests', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Fetch my role requests error:', error);
    throw error;
  }
};

export const fetchAdminReviewers = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const response = await api.get('/auth/admins', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.admins;
  } catch (error) {
    console.error('Fetch admin reviewers error:', error);
    throw error;
  }
};

export const approveRoleRequest = async (requestId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

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

export const rejectRoleRequest = async (requestId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

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

export const submitReactivationRequest = async (message) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

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

export const fetchMyReactivationRequests = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const response = await api.get('/auth/reactivation-requests/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const fetchPendingReactivationRequests = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const response = await api.get('/auth/reactivation-requests/pending', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const approveReactivationRequest = async (requestId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

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

export const rejectReactivationRequest = async (requestId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

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

// Logout
export const logoutUser = () => {
  toast.success('Logged out successfully');
};
