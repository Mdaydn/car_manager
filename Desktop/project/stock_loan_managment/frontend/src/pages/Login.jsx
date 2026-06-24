import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Key, User as UserIcon, AlertTriangle } from 'lucide-react';

const Login = () => {
  const [usernameOrPhone, setUsernameOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrPhone || !password) {
      setErrorMsg('Please enter both your credentials.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await login(usernameOrPhone, password);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Invalid username/phone or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card auth-card glow-primary">
        <div className="auth-header">
          <div style={logoIconStyle}>S</div>
          <h1 className="auth-title" style={{ marginTop: '1rem' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Stock and Loan Movement System
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger">
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username or Phone Number</label>
            <div style={inputContainerStyle}>
              <UserIcon size={18} style={inputIconStyle} />
              <input
                type="text"
                className="form-control"
                style={inputWithIconStyle}
                placeholder="dieudonne or phone number"
                value={usernameOrPhone}
                onChange={(e) => setUsernameOrPhone(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={inputContainerStyle}>
              <Key size={18} style={inputIconStyle} />
              <input
                type="password"
                className="form-control"
                style={inputWithIconStyle}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', height: '46px' }}
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>

        <div style={footerStyle}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            New member? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Register Here</Link>
          </p>
        </div>

        <div style={helpCardStyle}>
          <span style={{ fontWeight: '600', color: 'var(--color-warning)', display: 'block', marginBottom: '0.25rem' }}>
            Default Admin Access:
          </span>
          <code style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-main)' }}>
            Username: dieudonne<br />
            Password: midmid@@
          </code>
        </div>
      </div>
    </div>
  );
};

const logoIconStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  backgroundColor: 'var(--color-primary)',
  boxShadow: '0 0 15px var(--color-primary-glow)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '800',
  fontSize: '1.75rem',
  color: 'white',
  margin: '0 auto',
};

const inputContainerStyle = {
  position: 'relative',
};

const inputIconStyle = {
  position: 'absolute',
  left: '1rem',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-muted)',
};

const inputWithIconStyle = {
  paddingLeft: '2.75rem',
};

const footerStyle = {
  marginTop: '2rem',
  textAlign: 'center',
};

const helpCardStyle = {
  marginTop: '1.5rem',
  padding: '0.75rem',
  background: 'rgba(245, 158, 11, 0.05)',
  border: '1px solid rgba(245, 158, 11, 0.15)',
  borderRadius: '8px',
  textAlign: 'left',
};

export default Login;
