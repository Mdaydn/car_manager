import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Trash2, Check, AlertTriangle, X, ShieldAlert } from 'lucide-react';

const Members = () => {
  const { token, user, register, API_URL } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('');

  // Add User Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [addLoading, setAddLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!fullName || !username || !phone || !password) {
      setFeedback('Please fill out all fields.');
      setFeedbackType('danger');
      return;
    }

    if (password.length < 6) {
      setFeedback('Password must be at least 6 characters.');
      setFeedbackType('danger');
      return;
    }

    setAddLoading(true);
    setFeedback('');

    try {
      // Use the registration logic from AuthContext which handles token headers
      await register(fullName, username, phone, password, role);
      setFeedback('User account created successfully!');
      setFeedbackType('success');
      
      // Reset form fields
      setFullName('');
      setUsername('');
      setPhone('');
      setPassword('');
      setRole('member');
      setShowAddForm(false);
      
      fetchUsers();
    } catch (err) {
      setFeedback(err.message || 'Failed to create user account.');
      setFeedbackType('danger');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === user.id) {
      alert('You cannot delete yourself!');
      return;
    }

    if (!window.confirm('Are you sure you want to permanently delete this user? This will remove all their records.')) {
      return;
    }

    setFeedback('');
    try {
      const res = await fetch(`${API_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFeedback('User successfully removed.');
        setFeedbackType('success');
        fetchUsers();
      } else {
        setFeedback(data.message || 'Failed to remove user.');
        setFeedbackType('danger');
      }
    } catch (err) {
      setFeedback('Server connection error.');
      setFeedbackType('danger');
    }
  };

  const isAdmin = user.role === 'admin';

  if (loading) return <div style={loaderStyle}>Loading Members...</div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Members & Staff</h1>
          <p className="page-subtitle">Manage system users, contact info, and role privileges.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary no-print">
          {showAddForm ? <X size={18} /> : <UserPlus size={18} />}
          <span>{showAddForm ? 'Cancel' : 'Add User'}</span>
        </button>
      </div>

      {feedback && (
        <div className={`alert alert-${feedbackType}`}>
          {feedbackType === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span>{feedback}</span>
        </div>
      )}

      {/* Add User form */}
      {showAddForm && (
        <div className="glass-card glow-primary" style={{ marginBottom: '2rem', maxWidth: '600px' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>Create User Account</h3>
          <form onSubmit={handleAddUser}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  placeholder="e.g. johndoe"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 0781234567"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: '280px', marginTop: '0.5rem' }}>
              <label className="form-label">Assign Role Privilege</label>
              {isAdmin ? (
                <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="member">Member (Warehouse depositor)</option>
                  <option value="manager">Manager (Warehouse logging staff)</option>
                  <option value="admin">Admin (Approval & full control)</option>
                </select>
              ) : (
                <select className="form-control" value={role} disabled>
                  <option value="member">Member (Managers can only register members)</option>
                </select>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={addLoading}>
                {addLoading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users directory table */}
      <div className="glass-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined Date</th>
                {isAdmin && <th className="no-print" style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{u.fullName}</div>
                    {u._id === user.id && <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>Logged In User</div>}
                  </td>
                  <td>{u.username}</td>
                  <td>{u.phone}</td>
                  <td>
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                  </td>
                  <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td className="no-print" style={{ textAlign: 'right' }}>
                      {u._id !== user.id ? (
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="btn btn-danger"
                          style={{ padding: '0.4rem 0.6rem' }}
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Self
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const loaderStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '80vh',
  fontSize: '1.25rem',
  fontWeight: '600',
  color: 'var(--text-muted)'
};

export default Members;
