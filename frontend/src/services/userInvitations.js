// Connects the frontend to user invitations API features.
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// Prepares auth headers.
const authHeaders = () => {
  // Gets saved login token.
  const token = localStorage.getItem('token');
  // Sends token to backend.
  return { Authorization: `Bearer ${token}` };
};

// Builds invitation signup link.
export const getInvitationUrl = (token) => `${window.location.origin}/login?invite=${token}`;

// Gets user invitations data.
export const fetchUserInvitations = async () => {
  // Gets invitation list.
  const response = await axios.get(`${API_BASE_URL}/user-invitations`, {
    headers: authHeaders(),
  });
  return response.data;
};

// Gets members data.
export const fetchMembers = async () => {
  // Gets company members.
  const response = await axios.get(`${API_BASE_URL}/user-invitations/members`, {
    headers: authHeaders(),
  });
  return response.data;
};

// Creates user invitation.
export const createUserInvitation = async ({ email, role, expiresDays }) => {
  // Sends invite details.
  const response = await axios.post(
    `${API_BASE_URL}/user-invitations`,
    { email, role, expires_days: Number(expiresDays) },
    { headers: authHeaders() }
  );
  // Shows invite success.
  toast.success('Invitation link created.');
  return response.data;
};

// Revokes user invitation.
export const revokeUserInvitation = async (invitationId) => {
  // Sends revoke request.
  const response = await axios.post(
    `${API_BASE_URL}/user-invitations/${invitationId}/revoke`,
    null,
    { headers: authHeaders() }
  );
  // Shows revoke success.
  toast.success('Invitation revoked.');
  return response.data;
};

// Deactivates member.
export const deactivateMember = async (userId) => {
  // Sends deactivate request.
  const response = await axios.post(
    `${API_BASE_URL}/user-invitations/members/${userId}/deactivate`,
    null,
    { headers: authHeaders() }
  );
  // Shows deactivate success.
  toast.success('Member deactivated.');
  return response.data;
};

// Suspends member.
export const suspendMember = async (userId, reason) => {
  // Sends suspend reason.
  const response = await axios.post(
    `${API_BASE_URL}/user-invitations/members/${userId}/suspend`,
    { reason },
    { headers: authHeaders() }
  );
  // Shows suspend success.
  toast.success('Member suspended.');
  return response.data;
};

// Reinstates member.
export const reinstateMember = async (userId) => {
  // Sends reinstate request.
  const response = await axios.post(
    `${API_BASE_URL}/user-invitations/members/${userId}/reinstate`,
    null,
    { headers: authHeaders() }
  );
  // Shows reinstate success.
  toast.success('Member reinstated.');
  return response.data;
};

// Gets public invitation data.
export const fetchPublicInvitation = async (token) => {
  // Gets invite by token.
  const response = await axios.get(`${API_BASE_URL}/invitations/${token}`);
  return response.data;
};
