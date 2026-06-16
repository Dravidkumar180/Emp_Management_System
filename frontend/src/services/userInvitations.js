import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const getInvitationUrl = (token) => `${window.location.origin}/login?invite=${token}`;

export const fetchUserInvitations = async () => {
  const response = await axios.get(`${API_BASE_URL}/user-invitations`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const fetchMembers = async () => {
  const response = await axios.get(`${API_BASE_URL}/user-invitations/members`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const createUserInvitation = async ({ email, role, expiresDays }) => {
  const response = await axios.post(
    `${API_BASE_URL}/user-invitations`,
    { email, role, expires_days: Number(expiresDays) },
    { headers: authHeaders() }
  );
  toast.success('Invitation link created.');
  return response.data;
};

export const revokeUserInvitation = async (invitationId) => {
  const response = await axios.post(
    `${API_BASE_URL}/user-invitations/${invitationId}/revoke`,
    null,
    { headers: authHeaders() }
  );
  toast.success('Invitation revoked.');
  return response.data;
};

export const deactivateMember = async (userId) => {
  const response = await axios.post(
    `${API_BASE_URL}/user-invitations/members/${userId}/deactivate`,
    null,
    { headers: authHeaders() }
  );
  toast.success('Member deactivated.');
  return response.data;
};

export const fetchPublicInvitation = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/invitations/${token}`);
  return response.data;
};
