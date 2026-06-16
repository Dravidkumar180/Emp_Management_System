import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchMyReactivationRequests,
  submitReactivationRequest,
} from '../services/auth';
import './AccountDeactivated.css';

const AccountDeactivated = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchMyReactivationRequests();
      setRequests(data);
      if (data[0]?.status === 'approved') {
        await refreshUser();
      }
    } catch (error) {
      setStatusMessage(error.response?.data?.detail || 'Unable to load reactivation status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_active === false) {
      loadRequests();
    }
  }, [user, refreshUser]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.is_active !== false) {
    return <Navigate to="/dashboard" replace />;
  }

  const latestRequest = requests[0];
  const pendingRequest = requests.find((request) => request.status === 'pending');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setStatusMessage('');
      await submitReactivationRequest(message);
      setMessage('');
      setStatusMessage('Your reactivation request has been sent.');
      await loadRequests();
    } catch (error) {
      setStatusMessage(error.response?.data?.detail || 'Unable to submit reactivation request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="account-deactivated-page">
      <section className="account-deactivated-card">
        <h1>Account Deactivated</h1>
        <p>
          Your account is currently deactivated. You can only access this page until the admin who
          deactivated your account reactivates it.
        </p>

        <div className="deactivated-meta">
          <span>Signed in as <strong>{user.email}</strong></span>
          <span>Deactivated by <strong>{user.deactivated_by_name || 'Admin'}</strong></span>
        </div>

        <div className="request-status-box">
          <div>
            <span className="status-label">Account status</span>
            <strong>Deactivated</strong>
          </div>
          <div>
            <span className="status-label">Request status</span>
            <strong>{loading ? 'Loading...' : latestRequest?.status || 'Not submitted'}</strong>
          </div>
        </div>

        <form className="reactivation-form" onSubmit={handleSubmit}>
          <label htmlFor="reactivationMessage">Message to admin (optional)</label>
          <textarea
            id="reactivationMessage"
            rows="5"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Please reactivate my account. I need access for ongoing work."
            disabled={submitting || !!pendingRequest}
          />

          {statusMessage && <div className="reactivation-message">{statusMessage}</div>}

          <button type="submit" disabled={submitting || !!pendingRequest}>
            {pendingRequest ? 'Request Pending' : submitting ? 'Sending...' : 'Send Reactivation Request'}
          </button>
        </form>

        {requests.length > 0 && (
          <div className="reactivation-history">
            <h2>Request History</h2>
            {requests.map((request) => (
              <div key={request.id} className="reactivation-history-row">
                <span>{new Date(request.requested_at).toLocaleString()}</span>
                <strong className={`request-state ${request.status}`}>{request.status}</strong>
              </div>
            ))}
          </div>
        )}

        <button type="button" className="deactivated-logout" onClick={handleLogout}>
          Logout
        </button>
      </section>
    </div>
  );
};

export default AccountDeactivated;
