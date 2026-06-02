import React, { useEffect, useState } from 'react';
import { fetchPendingRoleRequests, approveRoleRequest, rejectRoleRequest } from '../services/auth';
import { useNotifications } from '../context/NotificationContext';
import './RoleRequests.css';

const RoleRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { addNotification } = useNotifications();

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchPendingRoleRequests();
      setRequests(data);
    } catch (error) {
      addNotification({ type: 'error', title: 'Load Error', message: error.response?.data?.detail || 'Unable to load role requests.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (requestId, action) => {
    setActionLoading(true);
    try {
      if (action === 'approve') {
        await approveRoleRequest(requestId);
        addNotification({ type: 'success', title: 'Approved', message: 'Role request approved successfully.' });
      } else {
        await rejectRoleRequest(requestId);
        addNotification({ type: 'info', title: 'Rejected', message: 'Role request rejected.' });
      }
      await loadRequests();
    } catch (error) {
      addNotification({ type: 'error', title: 'Action Failed', message: error.response?.data?.detail || 'Unable to update request.' });
    } finally {
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
        {loading ? (
          <div className="role-requests-loading">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="role-requests-empty">No pending requests at the moment.</div>
        ) : (
          <div className="role-requests-table">
            <div className="role-requests-row role-requests-head">
              <span>User</span>
              <span>User Email</span>
              <span>Submitted</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
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
                    onClick={() => handleAction(request.id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    className="reject-btn"
                    disabled={actionLoading}
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
