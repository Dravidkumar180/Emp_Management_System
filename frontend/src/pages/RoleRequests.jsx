// Shows the role requests page.
import React, { useEffect, useState } from 'react';
import { fetchPendingRoleRequests, approveRoleRequest, rejectRoleRequest } from '../services/auth';
import { useNotifications } from '../context/NotificationContext';
import './RoleRequests.css';

// Shows the role requests component.
const RoleRequests = () => {
  // Stores role requests.
  const [requests, setRequests] = useState([]);
  // Tracks page loading.
  const [loading, setLoading] = useState(true);
  // Tracks button loading.
  const [actionLoading, setActionLoading] = useState(false);
  // Shows notifications.
  const { addNotification } = useNotifications();

  // Loads pending requests.
  const loadRequests = async () => {
    // Starts loading requests.
    setLoading(true);
    try {
      // Gets requests from server.
      const data = await fetchPendingRoleRequests();
      // Saves requests in state.
      setRequests(data);
    } catch (error) {
      // Shows loading error.
      addNotification({ type: 'error', title: 'Load Error', message: error.response?.data?.detail || 'Unable to load role requests.' });
    } finally {
      // Stops loading requests.
      setLoading(false);
    }
  };

  // Runs when this screen needs to update data.
  useEffect(() => {
    loadRequests();
  }, []);

  // Handles approve or reject.
  const handleAction = async (requestId, action) => {
    // Starts action loading.
    setActionLoading(true);
    try {
      // Approves selected request.
      if (action === 'approve') {
        await approveRoleRequest(requestId);
        addNotification({ type: 'success', title: 'Approved', message: 'Role request approved successfully.' });
      } else {
        // Rejects selected request.
        await rejectRoleRequest(requestId);
        addNotification({ type: 'info', title: 'Rejected', message: 'Role request rejected.' });
      }
      // Reloads updated requests.
      await loadRequests();
    } catch (error) {
      // Shows action error.
      addNotification({ type: 'error', title: 'Action Failed', message: error.response?.data?.detail || 'Unable to update request.' });
    } finally {
      // Stops action loading.
      setActionLoading(false);
    }
  };

  return (
    <div className="role-requests-page">
      <div className="role-requests-header">
        <h1>Pending Role Change Requests</h1>
        <p>Review user requests submitted to your admin account.</p>
      </div>
      <div className="role-requests-card">
        {/* Shows loading message. */}
        {loading ? (
          <div className="role-requests-loading">Loading requests...</div>
        ) : requests.length === 0 ? (
          /* Shows empty request message. */
          <div className="role-requests-empty">No pending requests at the moment.</div>
        ) : (
          /* Shows requests table. */
          <div className="role-requests-table">
            <div className="role-requests-row role-requests-head">
              <span>User</span>
              <span>User Email</span>
              <span>Submitted</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {/* Shows each request row. */}
            {requests.map((request) => (
              <div key={request.id} className="role-requests-row">
                <span>{request.requester_email.split('@')[0]}</span>
                <span>{request.requester_email}</span>
                <span>{new Date(request.requested_at).toLocaleString()}</span>
                <span className={`status-badge status-${request.status}`}>{request.status}</span>
                <span className="actions-cell">
                  <button
                    className="approve-btn"
                    disabled={actionLoading}
                    // Approves this request.
                    onClick={() => handleAction(request.id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    className="reject-btn"
                    disabled={actionLoading}
                    // Rejects this request.
                    onClick={() => handleAction(request.id, 'reject')}
                  >
                    Reject
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleRequests;
