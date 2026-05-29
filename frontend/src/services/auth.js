import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Register new user
export const registerUser = async (name, email, password, role = 'user') => {
  try {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      role
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
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    toast.success(`Welcome back, ${response.data.user.name}!`);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    toast.error(error.response?.data?.detail || 'Invalid credentials');
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

// Logout
export const logoutUser = () => {
  toast.success('Logged out successfully');
};