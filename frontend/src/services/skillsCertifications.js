// Connects the frontend to skills and certifications API features.
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const showError = (error, fallback) => {
  const message = error.response?.data?.detail || fallback;
  toast.error(message);
  throw error;
};

export const fetchMySkills = async () => {
  const response = await api.get('/skills');
  return response.data;
};

export const createSkill = async (payload) => {
  try {
    const response = await api.post('/skills', payload);
    toast.success('Skill saved.');
    return response.data;
  } catch (error) {
    showError(error, 'Unable to save skill');
  }
};

export const updateSkill = async (id, payload) => {
  try {
    const response = await api.put(`/skills/${id}`, payload);
    toast.success('Skill updated.');
    return response.data;
  } catch (error) {
    showError(error, 'Unable to update skill');
  }
};

export const deleteSkill = async (id) => {
  try {
    const response = await api.delete(`/skills/${id}`);
    toast.success('Skill deleted.');
    return response.data;
  } catch (error) {
    showError(error, 'Unable to delete skill');
  }
};

export const fetchMyCertifications = async () => {
  const response = await api.get('/certifications');
  return response.data;
};

export const createCertification = async (payload) => {
  try {
    const response = await api.post('/certifications', payload);
    toast.success('Certification saved.');
    return response.data;
  } catch (error) {
    showError(error, 'Unable to save certification');
  }
};

export const updateCertification = async (id, payload) => {
  try {
    const response = await api.put(`/certifications/${id}`, payload);
    toast.success('Certification updated.');
    return response.data;
  } catch (error) {
    showError(error, 'Unable to update certification');
  }
};

export const deleteCertification = async (id) => {
  try {
    const response = await api.delete(`/certifications/${id}`);
    toast.success('Certification deleted.');
    return response.data;
  } catch (error) {
    showError(error, 'Unable to delete certification');
  }
};

export const fetchCompetencyProfile = async () => {
  const response = await api.get('/profile/competency');
  return response.data;
};

export const fetchAdminCompetencies = async (params = {}) => {
  const response = await api.get('/admin/skills', { params });
  return response.data.rows;
};

export const fetchCertificationExpiryNotifications = async () => {
  const response = await api.get('/certifications/expiry-notifications');
  return response.data;
};

export const exportCompetencyReport = async (params = {}) => {
  const response = await api.get('/admin/reports', {
    params,
    responseType: 'blob',
  });
  const format = params.format === 'excel' ? 'csv' : params.format || 'csv';
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `competency-report.${format}`;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const fileToCertificatePayload = (file) => (
  new Promise((resolve, reject) => {
    if (!file) {
      resolve({});
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve({
      document_name: file.name,
      document_type: file.type,
      document_data: reader.result,
    });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })
);
