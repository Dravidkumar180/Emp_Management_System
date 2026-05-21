import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">🏢</div>
          <h1>EMP MANAGE</h1>
          <p>Enterprise Employee Management System</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            label="Email Address"
            icon="📧"
            disabled={loading}
          />
          
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Password"
            icon="🔒"
            disabled={loading}
          />
          
          {error && <div className="error-message">{error}</div>}
          
          <Button 
            type="submit" 
            variant="primary" 
            fullWidth
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        
        <div className="login-footer">
          <p className="demo-hint">Demo Credentials: Any email & password works</p>
          <p className="demo-hint">Try: admin@example.com / any password</p>
        </div>
      </div>
    </div>
  );
};

export default Login;