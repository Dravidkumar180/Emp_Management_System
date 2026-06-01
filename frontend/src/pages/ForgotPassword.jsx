import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/auth';
import ThemeToggle from '../components/common/ThemeToggle';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await resetPassword(email, password);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="theme-toggle-absolute">
        <ThemeToggle />
      </div>
      <div className="login-card">
        <div className="login-header">
          <div className="logo">🔒</div>
          <h1>Forgot Password</h1>
          <p>Reset your account password securely</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email / Name</label>
            <input
              type="text"
              placeholder="Enter your email or name"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Please wait...' : 'Reset Password'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Remembered your password?{' '}
            <button type="button" className="switch-btn" onClick={() => navigate('/login')}>
              Back to login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
