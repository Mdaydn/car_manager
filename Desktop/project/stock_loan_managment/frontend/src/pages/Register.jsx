import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Phone, Key, AlignLeft, AlertTriangle } from 'lucide-react';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !username || !phone || !password) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await register(fullName, username, phone, password, 'member');
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card auth-card glow-primary">
        <div className="auth-header">
          <div style={logoIconStyle}>S</div>
          <h1 className="auth-title" style={{ marginTop: '1rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Register as a new System Member
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
            <label className="form-label">Full Name</label>
            <div style={inputContainerStyle}>
              <AlignLeft size={18} style={inputIconStyle} />
              <input
                type="text"
                className="form-control"
                style={inputWithIconStyle}
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={inputContainerStyle}>
              <User size={18} style={inputIconStyle} />
              <input
                type="text"
                className="form-control"
                style={inputWithIconStyle}
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div style={inputContainerStyle}>
              <Phone size={18} style={inputIconStyle} />
              <input
                type="text"
                className="form-control"
                style={inputWithIconStyle}
                placeholder="0788888888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                placeholder="Min 6 characters"
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
            style={{ width: '100%', marginTop: '1.25rem', height: '46px' }}
            disabled={loading}
          >
            {loading ? (
              <span>Registering...</span>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Register</span>
              </>
            )}
          </button>
        </form>

        <div style={footerStyle}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Log In</Link>
          </p>
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

export default Register;
