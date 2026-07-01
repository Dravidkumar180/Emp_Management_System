// Shows the account suspended page.
// Account Suspended defines the suspension-only post-login experience.
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchMyReinstatementRequests,
  submitReinstatementRequest,
} from '../services/auth';
import './AccountSuspended.css';

// Helps with format date.
const formatDate = (value) => (value ? new Date(value).toLocaleString() : '-');

// Shows the account suspended component.
const AccountSuspended = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('summary');
  const [message, setMessage] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Gets requests data.
  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchMyReinstatementRequests();
      setRequests(data);
      if (data[0]?.status === 'approved') {
        await refreshUser();
      }
    } catch (error) {
      setStatusMessage(error.response?.data?.detail || 'Unable to load request status.');
    } finally {
      setLoading(false);
    }
  };

  // Runs when this screen needs to update data.
  useEffect(() => {
    if (user?.is_suspended === true) {
      loadRequests();
    }
  }, [user, refreshUser]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.is_suspended !== true) {
    return <Navigate to="/dashboard" replace />;
  }

  const latestRequest = requests[0];
  // Prepares pending request.
  const pendingRequest = requests.find((request) => request.status === 'pending');
  const currentStep = latestRequest?.status === 'approved' || latestRequest?.status === 'rejected'
    ? 3
    : pendingRequest
    ? 2
    : 1;

  // Handles submit actions.
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setStatusMessage('');
      await submitReinstatementRequest(message);
      setMessage('');
      setStatusMessage('Your reinstatement request has been submitted.');
      await loadRequests();
    } catch (error) {
      setStatusMessage(error.response?.data?.detail || 'Unable to submit reinstatement request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handles logout actions.
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="account-suspended-page">
      {mode === 'summary' ? (
        <section className="suspended-summary">
          <div className="suspended-icon" aria-hidden="true">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 14v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1>Account Suspended</h1>
          <p>Your account has been suspended. You can still log in, but access to all modules is currently blocked.</p>

          <div className="suspension-details-card">
            <div>
              <span>Suspension Status</span>
              <strong className="suspended-pill">Suspended</strong>
            </div>
            <div>
              <span>Suspension Date</span>
              <strong>{formatDate(user.suspended_at)}</strong>
            </div>
            <div>
              <span>Reason</span>
              <strong>{user.suspension_reason || 'No reason provided'}</strong>
            </div>
            <div>
              <span>Suspended By</span>
              <strong>{user.suspended_by_name || 'Admin'}</strong>
            </div>
          </div>

          <button type="button" className="request-reinstatement-btn" onClick={() => setMode('request')}>
            Request Reinstatement
          </button>
          <button type="button" className="suspended-logout" onClick={handleLogout}>
            Logout
          </button>
        </section>
      ) : (
        <section className="reinstatement-shell">
          <div className="reinstatement-main">
            <div className="reinstatement-header">
              <div className="reinstatement-title">
                <button type="button" onClick={() => setMode('summary')}>Back</button>
                <h1>Reinstatement Request</h1>
              </div>
              <button type="button" className="reinstatement-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>

            <div className="request-steps" aria-label="Request progress">
              {['Submit Request', 'Under Review', 'Decision', 'Completed'].map((label, index) => (
                <div key={label} className={`request-step ${currentStep >= index + 1 ? 'active' : ''}`}>
                  <span>{index + 1}</span>
                  <p>{label}</p>
                </div>
              ))}
            </div>

            <form className="reinstatement-form" onSubmit={handleSubmit}>
              <label htmlFor="reinstatementReason">Reason / Comments *</label>
              <textarea
                id="reinstatementReason"
                rows="7"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="I understand the issue and have taken necessary actions. I request you to please review my account and restore access."
                required
                disabled={submitting || !!pendingRequest}
              />

              {statusMessage && <div className="reinstatement-message">{statusMessage}</div>}

              <button type="submit" disabled={submitting || !!pendingRequest}>
                {pendingRequest ? 'Request Pending' : submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>

          <aside className="request-status-panel">
            <h2>Request Status</h2>
            <strong className={`request-status-badge ${latestRequest?.status || 'none'}`}>
              {loading ? 'Loading' : latestRequest?.status || 'Not submitted'}
            </strong>
            <p>
              {pendingRequest
                ? 'Your request has been submitted and is awaiting admin review.'
                : latestRequest
                ? 'Your latest request decision is shown below.'
                : 'Submit a request for admin review.'}
            </p>
            <dl>
              <div>
                <dt>Requested On</dt>
                <dd>{formatDate(latestRequest?.requested_at)}</dd>
              </div>
              <div>
                <dt>Last Updated</dt>
                <dd>{formatDate(latestRequest?.reviewed_at || latestRequest?.requested_at)}</dd>
              </div>
            </dl>
          </aside>
        </section>
      )}
    </div>
  );
};

export default AccountSuspended;