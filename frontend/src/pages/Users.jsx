import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  createUserInvitation,
  deactivateMember,
  fetchMembers,
  fetchUserInvitations,
  getInvitationUrl,
  revokeUserInvitation,
} from '../services/userInvitations';
import './Users.css';

const companyNameFromId = (companyId) => {
  if (companyId === 1 || companyId === '1' || companyId === 'company-a') return 'Company A';
  if (companyId === 2 || companyId === '2' || companyId === 'company-b') return 'Company B';
  return 'your company';
};

const copyText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'absolute';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
};

const Users = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [expiresDays, setExpiresDays] = useState(7);
  const [invitations, setInvitations] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const companyName = useMemo(() => companyNameFromId(user?.companyId || user?.company_id), [user]);
  const pendingInvitations = invitations.filter((invite) => invite.status === 'pending');

  const loadUsersData = async () => {
    try {
      setLoading(true);
      const [inviteData, memberData] = await Promise.all([
        fetchUserInvitations(),
        fetchMembers(),
      ]);
      setInvitations(inviteData);
      setMembers(memberData);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersData();
  }, []);

  const handleCreateInvite = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error('Enter an email address');
      return;
    }

    try {
      setCreating(true);
      const invitation = await createUserInvitation({ email, role, expiresDays });
      const inviteUrl = getInvitationUrl(invitation.token);
      await copyText(inviteUrl);
      toast.success('Invitation link copied.');
      setEmail('');
      setRole('user');
      setExpiresDays(7);
      await loadUsersData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to create invitation');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyInvite = async (token) => {
    try {
      await copyText(getInvitationUrl(token));
      toast.success('Invitation link copied.');
    } catch {
      toast.error('Unable to copy invitation link');
    }
  };

  const handleRevoke = async (invitationId) => {
    try {
      setBusyId(`invite-${invitationId}`);
      await revokeUserInvitation(invitationId);
      await loadUsersData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to revoke invitation');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeactivate = async (memberId) => {
    try {
      setBusyId(`member-${memberId}`);
      await deactivateMember(memberId);
      await loadUsersData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to deactivate member');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="users-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>Users</h1>
        <p>Manage members and invite links for <strong>{companyName}</strong>.</p>
      </div>

      <div className="users-top-grid">
        <section className="users-card invite-card">
          <h2>Create Invite</h2>
          <form className="invite-form" onSubmit={handleCreateInvite}>
            <label>
              <span>Email</span>
              <input
                type="email"
                placeholder="user@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={creating}
              />
            </label>
            <label>
              <span>Role</span>
              <select value={role} onChange={(event) => setRole(event.target.value)} disabled={creating}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              <span>Expires (days)</span>
              <input
                type="number"
                min="1"
                max="30"
                value={expiresDays}
                onChange={(event) => setExpiresDays(event.target.value)}
                disabled={creating}
              />
            </label>
            <button type="submit" className="primary-action" disabled={creating}>
              {creating ? 'Creating...' : 'Create & Copy Link'}
            </button>
          </form>
          <p className="invite-note">Invite links open signup with the company and role locked to the invite.</p>
        </section>

        <section className="users-card pending-card">
          <h2>Pending Invites</h2>
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvitations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-table-cell">No pending invitations</td>
                  </tr>
                ) : (
                  pendingInvitations.map((invite) => (
                    <tr key={invite.id}>
                      <td>{invite.email}</td>
                      <td>{invite.role}</td>
                      <td>{invite.status}</td>
                      <td>{invite.expires_at ? new Date(invite.expires_at).toLocaleString() : '-'}</td>
                      <td>
                        <div className="row-actions">
                          <button className="secondary-action" onClick={() => handleCopyInvite(invite.token)}>
                            Copy link
                          </button>
                          <button
                            className="danger-action"
                            onClick={() => handleRevoke(invite.id)}
                            disabled={busyId === `invite-${invite.id}`}
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="users-card members-card">
        <h2>Members</h2>
        <div className="users-table-wrap">
          <table className="users-table members-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-table-cell">No members found</td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.role}</td>
                    <td>
                      <span className={`member-status ${member.is_active ? 'active' : 'inactive'}`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="danger-action"
                        onClick={() => handleDeactivate(member.id)}
                        disabled={!member.is_active || member.id === user?.id || busyId === `member-${member.id}`}
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Users;
