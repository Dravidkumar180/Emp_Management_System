// Shows the account deactivated page.
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchMyReactivationRequests,
  submitReactivationRequest,
} from '../services/auth';
import './AccountDeactivated.css';

// Shows the account deactivated component.
const AccountDeactivated = () => {
  // Gets auth actions and user.
  const { user, logout, refreshUser } = useAuth();
  // Helps move to another page.
  const navigate = useNavigate();
  // Stores message typed by user.
  const [message, setMessage] = useState('');
  // Stores old reactivation requests.
  const [requests, setRequests] = useState([]);
  // Tracks request loading state.
  const [loading, setLoading] = useState(true);
  // Tracks form sending state.
  const [submitting, setSubmitting] = useState(false);
  // Stores success or error message.
  const [statusMessage, setStatusMessage] = useState('');

  // Loads reactivation request history.
  const loadRequests = async () => {
    try {
      // Starts loading request data.
      setLoading(true);
      // Gets requests from server.
      const data = await fetchMyReactivationRequests();
      // Saves requests in state.
      setRequests(data);
      // Refreshes user after approval.
      if (data[0]?.status === 'approved') {
        await refreshUser();
      }
    } catch (error) {
      // Shows request loading error.
      setStatusMessage(error.response?.data?.detail || 'Unable to load reactivation status.');
    } finally {
      // Stops loading request data.
      setLoading(false);
    }
  };

  // Runs when this screen needs to update data.
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
  // Prepares pending request.
  const pendingRequest = requests.find((request) => request.status === 'pending');

  // Handles reactivation form submit.
  const handleSubmit = async (event) => {
    // Stops page from refreshing.
    event.preventDefault();
    try {
      // Starts sending request.
      setSubmitting(true);
      // Clears old status message.
      setStatusMessage('');
      // Sends request to server.
      await submitReactivationRequest(message);
      // Clears message input box.
      setMessage('');
      // Shows successful request message.
      setStatusMessage('Your reactivation request has been sent.');
      // Reloads request history.
      await loadRequests();
    } catch (error) {
      // Shows request submit error.
      setStatusMessage(error.response?.data?.detail || 'Unable to submit reactivation request.');
    } finally {
      // Stops sending request.
      setSubmitting(false);
    }
  };

  // Handles logout actions.
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
          {/* Lets user type request message. */}
          <textarea
            id="reactivationMessage"
            rows="5"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Please reactivate my account. I need access for ongoing work."
            disabled={submitting || !!pendingRequest}
          />

          {/* Shows success or error message. */}
          {statusMessage && <div className="reactivation-message">{statusMessage}</div>}

          {/* Sends reactivation request to admin. */}
          <button type="submit" disabled={submitting || !!pendingRequest}>
            {pendingRequest ? 'Request Pending' : submitting ? 'Sending...' : 'Send Reactivation Request'}
          </button>
        </form>

        {/* Shows previous reactivation requests. */}
        {requests.length > 0 && (
          <div className="reactivation-history">
            <h2>Request History</h2>
            {requests.map((request) => (
              <div key={request.id} className="reactivation-history-row">
                {/* Shows request date and time. */}
                <span>{new Date(request.requested_at).toLocaleString()}</span>
                {/* Shows current request status. */}
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
