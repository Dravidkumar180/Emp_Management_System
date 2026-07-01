// Connects the frontend to user invitations API features.
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// Prepares auth headers.
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// Gets invitation url data.
export const getInvitationUrl = (token) => `${window.location.origin}/login?invite=${token}`;

// Gets user invitations data.
export const fetchUserInvitations = async () => {
  const response = await axios.get(`${API_BASE_URL}/user-invitations`, {
    headers: authHeaders(),
  });
  return response.data;
};

// Gets members data.
export const fetchMembers = async () => {
  const response = await axios.get(`${API_BASE_URL}/user-invitations/members`, {
    headers: authHeaders(),
  });
  return response.data;
};

// Coordinates create user invitation behavior.
export const createUserInvitation = async ({ email, role, expiresDays }) => {
  const response = await axios.post(
    `${API_BASE_URL}/user-invitations`,
    { email, role, expires_days: Number(expiresDays) },
    { headers: authHeaders() }
  );
  toast.success('Invitation link created.');
  return response.data;
};

// Prepares revoke user invitation.
export const revokeUserInvitation = async (invitationId) => {
  const response = await axios.post(
    `${API_BASE_URL}/user-invitations/${invitationId}/revoke`,
    null,
    { headers: authHeaders() }
  );
  toast.success('Invitation revoked.');
  return response.data;
};

// Prepares deactivate member.
export const deactivateMember = async (userId) => {
  const response = await axios.post(
    `${API_BASE_URL}/user-invitations/members/${userId}/deactivate`,
    null,
    { headers: authHeaders() }
  );
  toast.success('Member deactivated.');
  return response.data;
};

// Prepares suspend member.
export const suspendMember = async (userId, reason) => {
  const response = await axios.post(
    `${API_BASE_URL}/user-invitations/members/${userId}/suspend`,
    { reason },
    { headers: authHeaders() }
  );
  toast.success('Member suspended.');
  return response.data;
};

// Prepares reinstate member.
export const reinstateMember = async (userId) => {
  const response = await axios.post(
    `${API_BASE_URL}/user-invitations/members/${userId}/reinstate`,
    null,
    { headers: authHeaders() }
  );
  toast.success('Member reinstated.');
  return response.data;
};

// Gets public invitation data.
export const fetchPublicInvitation = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/invitations/${token}`);
  return response.data;
};