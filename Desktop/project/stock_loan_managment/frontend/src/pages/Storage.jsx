import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight, ArrowDownLeft, Calendar, Search, User as UserIcon } from 'lucide-react';

const Storage = () => {
  const { token, user, API_URL } = useAuth();
  const [activeTab, setActiveTab] = useState('deposits'); // 'deposits' or 'withdrawals'
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMember, setFilterMember] = useState('');
  const [members, setMembers] = useState([]);

  const fetchData = async () => {
    try {
      const depRes = await fetch(`${API_URL}/storage/deposits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const depData = await depRes.json();
      if (depData.success) {
        setDeposits(depData.deposits);
      }

      const withRes = await fetch(`${API_URL}/storage/withdrawals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const withData = await withRes.json();
      if (withData.success) {
        setWithdrawals(withData.withdrawals);
      }

      // Fetch member profiles for filter list (managers/admins only)
      if (user.role === 'admin' || user.role === 'manager') {
        const usersRes = await fetch(`${API_URL}/auth/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        if (usersData.success) {
          setMembers(usersData.users.filter(u => u.role === 'member'));
        }
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isStaff = user.role === 'admin' || user.role === 'manager';

  // Apply filters
  const filteredDeposits = deposits.filter((d) => {
    if (!filterMember) return true;
    return d.user?._id === filterMember;
  });

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (!filterMember) return true;
    return w.user?._id === filterMember;
  });

  if (loading) return <div style={loaderStyle}>Loading Storage Logs...</div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Warehouse Stock Logs</h1>
          <p className="page-subtitle">Historical records of deposits and withdrawals.</p>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div style={controlsRowStyle} className="no-print">
        <div style={tabContainerStyle}>
          <button
            onClick={() => setActiveTab('deposits')}
            style={activeTab === 'deposits' ? activeTabStyle : tabStyle}
          >
            <ArrowUpRight size={18} style={{ color: 'var(--color-success)' }} />
            <span>Deposits Log</span>
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            style={activeTab === 'withdrawals' ? activeTabStyle : tabStyle}
          >
            <ArrowDownLeft size={18} style={{ color: 'var(--color-danger)' }} />
            <span>Withdrawals Log</span>
          </button>
        </div>

        {isStaff && (
          <div style={filterContainerStyle}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-control"
              style={filterSelectStyle}
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
            >
              <option value="">-- All Members --</option>
              {members.map(m => (
                <option key={m._id} value={m._id}>{m.fullName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="glass-card">
        {activeTab === 'deposits' ? (
          filteredDeposits.length === 0 ? (
            <div style={emptyStateStyle}>No deposit logs found.</div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    {isStaff && <th>Member</th>}
                    <th>Product</th>
                    <th>Quantity Stored</th>
                    <th>Price Per Unit</th>
                    <th>Calculated Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeposits.map((d) => (
                    <tr key={d._id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: 'none' }}>
                        <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                        <span>{new Date(d.date).toLocaleString()}</span>
                      </td>
                      {isStaff && (
                        <td>
                          <div style={{ fontWeight: '600' }}>{d.user?.fullName || 'Removed User'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.user?.phone}</div>
                        </td>
                      )}
                      <td style={{ fontWeight: '600' }}>{d.product?.productName || 'Removed Product'}</td>
                      <td style={{ fontWeight: '700', color: 'var(--color-success)' }}>+{d.quantity} units</td>
                      <td>${d.product?.pricePerUnit.toFixed(2) || 'N/A'}</td>
                      <td style={{ fontWeight: '700' }}>${d.totalValue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredWithdrawals.length === 0 ? (
            <div style={emptyStateStyle}>No withdrawal logs found.</div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    {isStaff && <th>Member</th>}
                    <th>Product</th>
                    <th>Quantity Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map((w) => (
                    <tr key={w._id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: 'none' }}>
                        <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                        <span>{new Date(w.date).toLocaleString()}</span>
                      </td>
                      {isStaff && (
                        <td>
                          <div style={{ fontWeight: '600' }}>{w.user?.fullName || 'Removed User'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.user?.phone}</div>
                        </td>
                      )}
                      <td style={{ fontWeight: '600' }}>{w.product?.productName || 'Removed Product'}</td>
                      <td style={{ fontWeight: '700', color: 'var(--color-danger)' }}>-{w.quantity} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};

// Styles for tabs and logs layout
const controlsRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem',
  marginBottom: '2rem',
};

const tabContainerStyle = {
  display: 'flex',
  gap: '0.5rem',
  background: 'rgba(15, 23, 42, 0.4)',
  padding: '0.35rem',
  borderRadius: '10px',
  border: '1px solid var(--border-light)',
};

const tabStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  borderRadius: '7px',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  fontWeight: '600',
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'var(--transition-smooth)',
};

const activeTabStyle = {
  ...tabStyle,
  color: 'var(--text-main)',
  background: 'rgba(30, 41, 59, 0.8)',
};

const filterContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  background: 'rgba(15, 23, 42, 0.4)',
  padding: '0.2rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--border-light)',
};

const filterSelectStyle = {
  background: 'transparent',
  border: 'none',
  padding: '0.4rem 2rem 0.4rem 0.4rem',
  boxShadow: 'none',
  width: '180px',
};

const loaderStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '80vh',
  fontSize: '1.25rem',
  fontWeight: '600',
  color: 'var(--text-muted)',
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '3rem',
  color: 'var(--text-muted)',
  background: 'rgba(255, 255, 255, 0.01)',
  borderRadius: '12px',
  border: '1px dashed var(--border-light)',
};

export default Storage;
