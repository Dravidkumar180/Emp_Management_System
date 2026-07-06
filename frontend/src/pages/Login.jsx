// Shows the login page.
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';
import { fetchPublicInvitation } from '../services/userInvitations';
import './Login.css';

// Shows the login component.
const Login = () => {
  // Login mode
  const [isLogin, setIsLogin] = useState(true);
  // User name
  const [name, setName] = useState('');
  // User email
  const [email, setEmail] = useState('');
  // User password
  const [password, setPassword] = useState('');
  // Confirm password
  const [confirmPassword, setConfirmPassword] = useState('');
  // User role
  const [role, setRole] = useState('user');
  // Company id
  const [companyId, setCompanyId] = useState('company-a');
  // Invite token
  const [inviteToken, setInviteToken] = useState('');
  // Lock invite fields
  const [inviteLocked, setInviteLocked] = useState(false);
  // Invite loading
  const [inviteLoading, setInviteLoading] = useState(false);
  // Remember option
  const [rememberMe, setRememberMe] = useState(false);
  // Error message
  const [error, setError] = useState('');
  // Submit loading
  const [loading, setLoading] = useState(false);
  
  // Auth actions
  const { login, register } = useAuth();
  // Page navigation
  const navigate = useNavigate();
  // Url params
  const [searchParams] = useSearchParams();

  // Navigates based on the user role.
  const navigateByRole = (userData) => {
    if (userData?.is_active === false) {
      navigate('/account-deactivated');
      return;
    }
    if (userData?.is_suspended === true) {
      navigate('/account-suspended');
      return;
    }
    navigate(userData?.role === 'admin' ? '/users' : '/dashboard');
  };

  // Runs when this screen needs to update data.
  useEffect(() => {
    const token = searchParams.get('invite');
    if (!token) return;

    // Gets invite data.
    const loadInvite = async () => {
      try {
        // Starts invite loading.
        setInviteLoading(true);
        // Fetches invite details.
        const invitation = await fetchPublicInvitation(token);
        // Checks invite validity.
        if (invitation.status !== 'pending' || invitation.is_expired) {
          setError('This invitation is no longer available');
          return;
        }
        // Applies invite data.
        setInviteToken(token);
        setInviteLocked(true);
        setIsLogin(false);
        setEmail(invitation.email);
        setRole(invitation.role);
        setCompanyId(String(invitation.company_id));
      } catch (error) {
        // Shows invite error.
        setError(error.response?.data?.detail || 'Invalid invitation link');
      } finally {
        // Stops invite loading.
        setInviteLoading(false);
      }
    };

    // Loads invite link.
    loadInvite();
  }, [searchParams]);

  // Handles form submit.
  const handleSubmit = async (e) => {
    // Stops page refresh.
    e.preventDefault();
    // Clears old error.
    setError('');
    // Starts submit loading.
    setLoading(true);

    // Runs login flow.
    if (isLogin) {
      // Checks login fields.
      if (!email || !password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }
      
      // Sends login request.
      const result = await login(email, password);
      if (result.success) {
        // Opens correct page.
        navigateByRole(result.user);
      } else {
        // Shows login error.
        setError(result.error || 'Login failed');
      }
    } else {
      // Checks signup fields.
      if (!name || !email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }
      
      // Checks password match.
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      
      // Checks password length.
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      
      // Sends signup request.
      const result = await register(name, email, password, role, companyId, inviteToken || null);
      if (result.success) {
        // Opens correct page.
        navigateByRole(result.user);
      } else {
        // Shows signup error.
        setError(result.error || 'Registration failed');
      }
    }
    
    // Stops submit loading.
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="theme-toggle-absolute">
        <ThemeToggle />
      </div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="logo">🏢</div>
          <h1>Welcome Back!</h1>
          <p>Login to your account</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Shows name for signup. */}
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {/* Shows company for signup. */}
          {!isLogin && (
            <div className="form-group">
              <label>Company</label>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} disabled={loading || inviteLocked}>
                <option value="company-a">Company A</option>
                <option value="company-b">Company B</option>
                <option value="1">Company A</option>
                <option value="2">Company B</option>
              </select>
            </div>
          )}

          {/* Shows role for signup. */}
          {!isLogin && (
            <div className="form-group">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} disabled={loading || inviteLocked}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          
          {/* Gets email or name. */}
          <div className="form-group">
            <label>Email / Name</label>
            <input
              type="text"
              placeholder="Enter your email or name"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || inviteLocked}
            />
          </div>
          
          {/* Gets user password. */}
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          
          {/* Shows login options. */}
          {isLogin && (
            <div className="form-options">
              <label className="checkbox">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                /> 
                Remember me
              </label>
              <button type="button" className="forgot" onClick={() => navigate('/forgot-password')}>
                Forgot password?
              </button>
            </div>
          )}
          
          {/* Confirms signup password. */}
          {!isLogin && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          )}
          
          {/* Shows form error. */}
          {error && <div className="error-message">{error}</div>}
          
          {/* Submits login or signup. */}
          <button type="submit" className="login-btn" disabled={loading || inviteLoading}>
            {loading || inviteLoading ? 'Please wait...' : (isLogin ? 'Log in' : 'Sign up')}
          </button>
        </form>
        
        <div className="login-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              className="switch-btn"
              onClick={() => {
                // Switches form mode.
                setIsLogin(!isLogin);
                // Clears form values.
                setError('');
                setName('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setRole('user');
                setCompanyId('company-a');
                setInviteToken('');
                setInviteLocked(false);
              }}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
