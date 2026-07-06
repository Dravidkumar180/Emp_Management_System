// Shows the users page.
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { createNotificationForUser, useNotifications } from '../context/NotificationContext';
import {
  createUserInvitation,
  deactivateMember,
  fetchMembers,
  fetchUserInvitations,
  getInvitationUrl,
  revokeUserInvitation,
  suspendMember,
} from '../services/userInvitations';
import {
  fetchReinstatementRequests,
} from '../services/auth';
import './Users.css';

// Prepares company name from ID.
const companyNameFromId = (companyId) => {
  if (companyId === 1 || companyId === '1' || companyId === 'company-a') return 'Company A';
  if (companyId === 2 || companyId === '2' || companyId === 'company-b') return 'Company B';
  return 'your company';
};

// Helps with copy text.
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

// Helps with format history date.
const formatHistoryDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

// Shows the users component.
const Users = () => {
  // Gets logged-in user.
  const { user } = useAuth();
  // Shows app notifications.
  const { addNotification } = useNotifications();
  // Stores invite email.
  const [email, setEmail] = useState('');
  // Stores invite role.
  const [role, setRole] = useState('user');
  // Stores invite expiry days.
  const [expiresDays, setExpiresDays] = useState(7);
  // Stores invite list.
  const [invitations, setInvitations] = useState([]);
  // Stores member list.
  const [members, setMembers] = useState([]);
  // Stores reinstatement requests.
  const [reinstatementRequests, setReinstatementRequests] = useState([]);
  // Stores history filter.
  const [reinstatementFilter, setReinstatementFilter] = useState('pending');
  // Stores suspension reasons.
  const [suspensionReasons, setSuspensionReasons] = useState({});
  // Tracks page loading.
  const [loading, setLoading] = useState(true);
  // Tracks invite creation.
  const [creating, setCreating] = useState(false);
  // Tracks active action.
  const [busyId, setBusyId] = useState(null);

  // Prepares company name.
  const companyName = useMemo(() => companyNameFromId(user?.companyId || user?.company_id), [user]);
  // Prepares pending invitations.
  const pendingInvitations = invitations.filter((invite) => invite.status === 'pending');
  // Prepares active members.
  const activeMembers = members.filter((member) => member.is_active && !member.is_suspended);
  // Prepares suspended members.
  const suspendedMembers = members.filter((member) => member.is_suspended);
  // Prepares deactivated members.
  const deactivatedMembers = members.filter((member) => !member.is_active);
  // Prepares pending reinstatement requests.
  const pendingReinstatementRequests = reinstatementRequests.filter((request) => request.status === 'pending');
  const reinstatementCounts = {
    pending: reinstatementRequests.filter((request) => request.status === 'pending').length,
    approved: reinstatementRequests.filter((request) => request.status === 'approved').length,
    rejected: reinstatementRequests.filter((request) => request.status === 'rejected').length,
  };
  // Filters reinstatement history.
  const visibleReinstatementRequests = reinstatementFilter === 'all'
    ? reinstatementRequests
    : reinstatementRequests.filter((request) => request.status === reinstatementFilter);
  // Prepares member by ID.
  const memberById = useMemo(() => {
    const lookup = new Map();
    members.forEach((member) => lookup.set(member.id, member));
    return lookup;
  }, [members]);

  // Gets users data.
  const loadUsersData = async () => {
    try {
      // Starts loading users.
      setLoading(true);
      // Loads invites, members, requests.
      const [inviteData, memberData, reinstatementData] = await Promise.all([
        fetchUserInvitations(),
        fetchMembers(),
        fetchReinstatementRequests(),
      ]);
      // Saves loaded data.
      setInvitations(inviteData);
      setMembers(memberData);
      setReinstatementRequests(reinstatementData);
    } catch (error) {
      // Shows loading error.
      toast.error(error.response?.data?.detail || 'Unable to load users');
    } finally {
      // Stops loading users.
      setLoading(false);
    }
  };

  // Runs when this screen needs to update data.
  useEffect(() => {
    loadUsersData();
  }, []);

  // Handles create invite actions.
  const handleCreateInvite = async (event) => {
    // Stops page refresh.
    event.preventDefault();
    // Checks invite email.
    if (!email.trim()) {
      toast.error('Enter an email address');
      return;
    }

    try {
      // Starts invite creation.
      setCreating(true);
      // Creates invite on server.
      const invitation = await createUserInvitation({ email, role, expiresDays });
      // Builds invite link.
      const inviteUrl = getInvitationUrl(invitation.token);
      // Copies invite link.
      await copyText(inviteUrl);
      toast.success('Invitation link copied.');
      // Clears invite form.
      setEmail('');
      setRole('user');
      setExpiresDays(7);
      // Refreshes users data.
      await loadUsersData();
    } catch (error) {
      // Shows invite error.
      toast.error(error.response?.data?.detail || 'Unable to create invitation');
    } finally {
      // Stops invite creation.
      setCreating(false);
    }
  };

  // Handles copy invite actions.
  const handleCopyInvite = async (token) => {
    try {
      await copyText(getInvitationUrl(token));
      toast.success('Invitation link copied.');
    } catch {
      toast.error('Unable to copy invitation link');
    }
  };

  // Handles revoke actions.
  const handleRevoke = async (invitationId) => {
    try {
      // Marks invite as busy.
      setBusyId(`invite-${invitationId}`);
      // Revokes selected invite.
      await revokeUserInvitation(invitationId);
      // Refreshes users data.
      await loadUsersData();
    } catch (error) {
      // Shows revoke error.
      toast.error(error.response?.data?.detail || 'Unable to revoke invitation');
    } finally {
      // Clears busy action.
      setBusyId(null);
    }
  };

  // Handles deactivate actions.
  const handleDeactivate = async (memberId) => {
    try {
      // Marks member as busy.
      setBusyId(`member-${memberId}`);
      // Deactivates selected member.
      await deactivateMember(memberId);
      // Refreshes users data.
      await loadUsersData();
    } catch (error) {
      // Shows deactivate error.
      toast.error(error.response?.data?.detail || 'Unable to deactivate member');
    } finally {
      // Clears busy action.
      setBusyId(null);
    }
  };

  // Handles suspend actions.
  const handleSuspend = async (memberId) => {
    // Gets suspension reason.
    const reason = suspensionReasons[memberId]?.trim() || 'No reason provided';
    // Prepares member.
    const member = members.find((item) => item.id === memberId);

    try {
      // Marks suspend as busy.
      setBusyId(`suspend-${memberId}`);
      // Suspends selected member.
      const suspendedMember = await suspendMember(memberId, reason);
      const notificationMember = suspendedMember || member;
      // Notifies current admin.
      addNotification({
        type: 'warning',
        title: 'Account Suspended',
        message: `${notificationMember?.name || notificationMember?.email || 'Member'} was suspended.`,
      });
      // Notifies suspended member.
      if (notificationMember?.email) {
        createNotificationForUser(notificationMember, {
          type: 'warning',
          title: 'Account Suspended',
          message: `Your account was suspended. Reason: ${reason}`,
        });
      }
      // Clears reason input.
      setSuspensionReasons((current) => ({ ...current, [memberId]: '' }));
      // Refreshes users data.
      await loadUsersData();
    } catch (error) {
      // Shows suspend error.
      toast.error(error.response?.data?.detail || 'Unable to suspend member');
    } finally {
      // Clears busy action.
      setBusyId(null);
    }
  };

  // Shows loading screen.
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
        <h1>Suspension Management</h1>
        <p>Manage members, suspend company users or admins, and review reinstatement requests for <strong>{companyName}</strong>.</p>
      </div>

      <div className="suspension-stats">
        {/* Shows user status counts. */}
        <div className="suspension-stat">
          <span>Active Users</span>
          <strong>{activeMembers.length}</strong>
          <small>{activeMembers.length === 1 ? '1 active account' : `${activeMembers.length} active accounts`}</small>
        </div>
        <div className="suspension-stat warning">
          <span>Suspended Users</span>
          <strong>{suspendedMembers.length}</strong>
          <small>{suspendedMembers.length === 0 ? 'No suspensions' : 'Access blocked after login'}</small>
        </div>
        <div className="suspension-stat muted">
          <span>Deactivated Users</span>
          <strong>{deactivatedMembers.length}</strong>
          <small>Login blocked</small>
        </div>
        <div className="suspension-stat info">
          <span>Reinstatement Requests</span>
          <strong>{pendingReinstatementRequests.length}</strong>
          <small>{pendingReinstatementRequests.length === 0 ? 'No pending review' : 'Pending review'}</small>
        </div>
      </div>

      <div className="users-top-grid">
        <section className="users-card invite-card">
          <h2>Create Invite</h2>
          {/* Creates and copies invite link. */}
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
          {/* Shows pending invitations. */}
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
        {/* Shows members and actions. */}
        <div className="users-table-wrap">
          <table className="users-table members-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Suspension Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-table-cell">No members found</td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.role}</td>
                    <td>
                      <span className={`member-status ${member.is_suspended ? 'suspended' : member.is_active ? 'active' : 'inactive'}`}>
                        {member.is_suspended ? 'Suspended' : member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {member.is_suspended ? (
                        <span className="suspension-reason-text">{member.suspension_reason || 'No reason provided'}</span>
                      ) : (
                        <input
                          className="suspension-reason-input"
                          value={suspensionReasons[member.id] || ''}
                          onChange={(event) => setSuspensionReasons((current) => ({
                            ...current,
                            [member.id]: event.target.value,
                          }))}
                          placeholder="Reason for suspension"
                          disabled={!member.is_active || member.id === user?.id}
                        />
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        {member.is_suspended ? (
                          <button
                            className="danger-action"
                            disabled
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            className="danger-action"
                            onClick={() => handleSuspend(member.id)}
                            disabled={!member.is_active || member.id === user?.id || busyId === `suspend-${member.id}`}
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          className="danger-action"
                          onClick={() => handleDeactivate(member.id)}
                          disabled={!member.is_active || member.id === user?.id || busyId === `member-${member.id}`}
                        >
                          Deactivate
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

      <section className="users-card reinstatement-card">
        <div className="users-section-heading">
          <h2>Reinstatement History</h2>
          <p>Review reinstatement request status for suspended users.</p>
        </div>
        {/* Filters reinstatement history. */}
        <div className="reinstatement-history-tabs" role="tablist" aria-label="Reinstatement history filters">
          <button
            type="button"
            className={reinstatementFilter === 'pending' ? 'active' : ''}
            onClick={() => setReinstatementFilter('pending')}
          >
            Pending ({reinstatementCounts.pending})
          </button>
          <button
            type="button"
            className={reinstatementFilter === 'approved' ? 'active' : ''}
            onClick={() => setReinstatementFilter('approved')}
          >
            Approved ({reinstatementCounts.approved})
          </button>
          <button
            type="button"
            className={reinstatementFilter === 'rejected' ? 'active' : ''}
            onClick={() => setReinstatementFilter('rejected')}
          >
            Rejected ({reinstatementCounts.rejected})
          </button>
          <button
            type="button"
            className={reinstatementFilter === 'all' ? 'active' : ''}
            onClick={() => setReinstatementFilter('all')}
          >
            All Requests
          </button>
        </div>
        {/* Shows reinstatement requests. */}
        <div className="users-table-wrap">
          <table className="users-table reinstatement-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleReinstatementRequests.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-table-cell">No reinstatement requests found</td>
                </tr>
              ) : (
                visibleReinstatementRequests.map((request) => {
                  const requestMember = memberById.get(request.user_id);
                  return (
                    <tr key={request.id}>
                      <td>
                        <strong>{request.requester_name || requestMember?.name || 'Unknown Employee'}</strong>
                        <small>{request.requester_email || requestMember?.email || '-'}</small>
                      </td>
                      <td>{requestMember?.department || request.department || '-'}</td>
                      <td>{formatHistoryDate(request.requested_at)}</td>
                      <td>
                        <span className={`request-status-pill ${request.status}`}>
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="users-card status-management-card">
        <div className="users-section-heading">
          <h2>User Status Management</h2>
          <p>Manage and configure user account statuses and their behavior.</p>
        </div>
        {/* Explains account statuses. */}
        <div className="users-table-wrap">
          <table className="users-table status-management-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Description</th>
                <th>Login Allowed</th>
                <th>Access to Modules</th>
                <th>Actions Allowed</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="status-guide-pill active">Active</span></td>
                <td>User has full access to all modules and features.</td>
                <td className="yes-text">Yes</td>
                <td className="yes-text">Full Access</td>
                <td className="yes-text">All Allowed</td>
              </tr>
              <tr>
                <td><span className="status-guide-pill suspended">Suspended</span></td>
                <td>User can login but all modules are blocked. Only suspension page is visible.</td>
                <td className="yes-text">Yes</td>
                <td><span className="blocked-pill">Blocked</span></td>
                <td className="no-text">None Allowed</td>
              </tr>
              <tr>
                <td><span className="status-guide-pill deactivated">Deactivated</span></td>
                <td>Account is permanently deactivated. No login allowed.</td>
                <td className="no-text">No</td>
                <td className="no-text">No Access</td>
                <td className="no-text">None Allowed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Users;
