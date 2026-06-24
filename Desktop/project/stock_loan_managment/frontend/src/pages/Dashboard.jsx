import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Warehouse, 
  CircleDollarSign, 
  Users, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp,
  PlusCircle,
  TrendingDown,
  Check,
  X,
  Plus,
  Edit2
} from 'lucide-react';

const Dashboard = () => {
  const { user, token, API_URL } = useAuth();
  
  if (user?.role === 'admin') {
    return <AdminDashboard token={token} API_URL={API_URL} user={user} />;
  } else if (user?.role === 'manager') {
    return <ManagerDashboard token={token} API_URL={API_URL} user={user} />;
  } else {
    return <MemberDashboard token={token} API_URL={API_URL} user={user} />;
  }
};

/* ==========================================
   1. ADMIN DASHBOARD
   ========================================== */
const AdminDashboard = ({ token, API_URL, user }) => {
  const [stats, setStats] = useState(null);
  const [stockSummary, setStockSummary] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackType, setFeedbackType] = useState('');

  const fetchAdminData = async () => {
    try {
      // Fetch general stats and stock summary
      const statsRes = await fetch(`${API_URL}/reports/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
        setStockSummary(statsData.stockSummary);
      }

      // Fetch all loans to filter pending
      const loansRes = await fetch(`${API_URL}/loans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const loansData = await loansRes.json();
      if (loansData.success) {
        // Filter pending loans
        const pending = loansData.loans.filter(l => l.status === 'pending');
        
        // Enhance pending loans with member's current stored stock value to show on approval panel
        const enhancedPending = await Promise.all(pending.map(async (loan) => {
          const memberReportRes = await fetch(`${API_URL}/reports/member/${loan.user._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const memberReportData = await memberReportRes.json();
          return {
            ...loan,
            stockValue: memberReportData.success ? memberReportData.summary.totalStoredValue : 0,
            outstandingDebt: memberReportData.success ? memberReportData.summary.outstandingDebt : 0,
          };
        }));

        setPendingLoans(enhancedPending);
      }
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleLoanAction = async (loanId, action) => {
    setActionLoading(true);
    setFeedbackMsg('');
    try {
      const res = await fetch(`${API_URL}/loans/${loanId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg(`Loan successfully ${action}ed.`);
        setFeedbackType('success');
        fetchAdminData();
      } else {
        setFeedbackMsg(data.message || `Failed to ${action} loan.`);
        setFeedbackType('danger');
      }
    } catch (err) {
      setFeedbackMsg(`Network error occurred.`);
      setFeedbackType('danger');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={loaderStyle}>Loading Dashboard...</div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user.fullName}. System overview and approvals.</p>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`alert alert-${feedbackType}`}>
          {feedbackType === 'success' ? <Check size={18} /> : <X size={18} />}
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stat-grid">
        <div className="glass-card stat-card glow-primary">
          <div className="stat-icon stat-icon-blue">
            <Warehouse size={24} />
          </div>
          <div>
            <div className="stat-label">Warehouse Stock Value</div>
            <div className="stat-value">${stats?.totalWarehouseValue.toFixed(2)}</div>
          </div>
        </div>

        <div className="glass-card stat-card glow-success">
          <div className="stat-icon stat-icon-emerald">
            <CircleDollarSign size={24} />
          </div>
          <div>
            <div className="stat-label">Loans Outstanding</div>
            <div className="stat-value">${stats?.outstandingDebt.toFixed(2)}</div>
          </div>
        </div>

        <div className="glass-card stat-card glow-success">
          <div className="stat-icon stat-icon-blue">
            <Users size={24} />
          </div>
          <div>
            <div className="stat-label">Registered Members</div>
            <div className="stat-value">{stats?.memberCount}</div>
          </div>
        </div>

        <div className="glass-card stat-card glow-amber">
          <div className="stat-icon stat-icon-amber">
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-label">Pending Loan Requests</div>
            <div className="stat-value">{stats?.pendingLoanCount}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        {/* Left Column: Loan Approvals Panel */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} className="no-print" style={{ color: 'var(--color-warning)' }} />
            <span>Pending Loan Approvals</span>
          </h3>

          {pendingLoans.length === 0 ? (
            <div style={emptyStateStyle}>No pending loan requests currently.</div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Requested Amt</th>
                    <th>Member Stock Value</th>
                    <th>Member Debt</th>
                    <th>Max Limit (70%)</th>
                    <th className="no-print" style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLoans.map((loan) => {
                    const limit = loan.stockValue * 0.70;
                    const eligible = loan.amount <= (limit - loan.outstandingDebt);
                    return (
                      <tr key={loan._id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{loan.user.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{loan.user.phone}</div>
                        </td>
                        <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                          ${loan.amount.toFixed(2)}
                        </td>
                        <td>${loan.stockValue.toFixed(2)}</td>
                        <td style={{ color: loan.outstandingDebt > 0 ? 'var(--color-danger)' : 'var(--text-main)' }}>
                          ${loan.outstandingDebt.toFixed(2)}
                        </td>
                        <td>${limit.toFixed(2)}</td>
                        <td className="no-print" style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleLoanAction(loan._id, 'approve')}
                              className="btn btn-success"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                              disabled={actionLoading}
                              title={!eligible ? "Exceeds 70% of stored stock value minus existing debt!" : "Approve Loan"}
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleLoanAction(loan._id, 'reject')}
                              className="btn btn-danger"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                              disabled={actionLoading}
                            >
                              <X size={14} />
                              <span>Reject</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Inventory Summary */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>Warehouse Stock Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {stockSummary.map((item) => {
              const maxStockCapacity = 1000; // Visual scale factor
              const widthPct = Math.min((item.currentStock / maxStockCapacity) * 100, 100);
              return (
                <div key={item.productId} style={stockItemStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '600' }}>{item.productName}</span>
                    <span style={{ fontWeight: '700' }}>{item.currentStock} Units</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${widthPct}%`, 
                        backgroundColor: 'var(--color-primary)',
                        boxShadow: '0 0 8px var(--color-primary-glow)' 
                      }} 
                    />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Est. Value: ${item.value.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==========================================
   2. MANAGER DASHBOARD
   ========================================== */
const ManagerDashboard = ({ token, API_URL, user }) => {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for recording deposit/withdrawal
  const [showOpModal, setShowOpModal] = useState(false);
  const [opType, setOpType] = useState('deposit'); // 'deposit' or 'withdraw'
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [modalFeedback, setModalFeedback] = useState('');
  const [modalFeedbackType, setModalFeedbackType] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchManagerData = async () => {
    try {
      const statsRes = await fetch(`${API_URL}/reports/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      const prodRes = await fetch(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const prodData = await prodRes.json();
      if (prodData.success) {
        setProducts(prodData.products);
      }

      const usersRes = await fetch(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersData.success) {
        // Only keep members
        setMembers(usersData.users.filter(u => u.role === 'member'));
      }
    } catch (error) {
      console.error('Error fetching manager dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
  }, []);

  const openOpModal = (type) => {
    setOpType(type);
    setSelectedMember('');
    setSelectedProduct('');
    setQuantity('');
    setModalFeedback('');
    setShowOpModal(true);
  };

  const handleOpSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember || !selectedProduct || !quantity) {
      setModalFeedback('Please fill in all fields.');
      setModalFeedbackType('danger');
      return;
    }

    setActionLoading(true);
    setModalFeedback('');

    try {
      const endpoint = opType === 'deposit' ? 'deposit' : 'withdraw';
      const res = await fetch(`${API_URL}/storage/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user: selectedMember,
          product: selectedProduct,
          quantity: parseFloat(quantity)
        })
      });
      const data = await res.json();
      if (data.success) {
        setModalFeedback(`${opType === 'deposit' ? 'Deposit' : 'Withdrawal'} successfully recorded!`);
        setModalFeedbackType('success');
        setQuantity('');
        fetchManagerData();
        setTimeout(() => setShowOpModal(false), 1500);
      } else {
        setModalFeedback(data.message || 'Operation failed.');
        setModalFeedbackType('danger');
      }
    } catch (err) {
      setModalFeedback('Server connection error.');
      setModalFeedbackType('danger');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={loaderStyle}>Loading Dashboard...</div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manager Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user.fullName}. Manage warehouse stock and deposits.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }} className="no-print">
          <button onClick={() => openOpModal('deposit')} className="btn btn-success">
            <ArrowUpRight size={18} />
            <span>Record Deposit</span>
          </button>
          <button onClick={() => openOpModal('withdraw')} className="btn btn-danger">
            <ArrowDownLeft size={18} />
            <span>Record Withdrawal</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stat-grid">
        <div className="glass-card stat-card glow-primary">
          <div className="stat-icon stat-icon-blue">
            <Warehouse size={24} />
          </div>
          <div>
            <div className="stat-label">Warehouse Stock Value</div>
            <div className="stat-value">${stats?.totalWarehouseValue.toFixed(2)}</div>
          </div>
        </div>

        <div className="glass-card stat-card glow-success">
          <div className="stat-icon stat-icon-emerald">
            <Users size={24} />
          </div>
          <div>
            <div className="stat-label">Active Members</div>
            <div className="stat-value">{stats?.memberCount}</div>
          </div>
        </div>

        <div className="glass-card stat-card glow-primary">
          <div className="stat-icon stat-icon-blue">
            <CircleDollarSign size={24} />
          </div>
          <div>
            <div className="stat-label">Active Loan Book Value</div>
            <div className="stat-value">${stats?.outstandingDebt.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        {/* Left Column: Product Price List */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>Products Pricing</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price Per Unit</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: '600' }}>{p.productName}</td>
                    <td style={{ fontWeight: '700', color: 'var(--color-success)' }}>
                      ${p.pricePerUnit.toFixed(2)} / unit
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Quick Stats info */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem' }}>Warehouse Actions</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Record community stock movements directly. Ensure you verify physical goods counts before logging a deposit.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="no-print">
            <button onClick={() => openOpModal('deposit')} className="btn btn-success" style={{ width: '100%' }}>
              <PlusCircle size={18} />
              <span>Record New Deposit</span>
            </button>
            <button onClick={() => openOpModal('withdraw')} className="btn btn-danger" style={{ width: '100%' }}>
              <ArrowDownLeft size={18} />
              <span>Record New Withdrawal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Record Operation Modal */}
      {showOpModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {opType === 'deposit' ? 'Record Product Deposit' : 'Record Product Withdrawal'}
              </h3>
              <button className="modal-close" onClick={() => setShowOpModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleOpSubmit}>
              <div className="modal-body">
                {modalFeedback && (
                  <div className={`alert alert-${modalFeedbackType}`}>
                    {modalFeedbackType === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
                    <span>{modalFeedback}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Select Member</label>
                  <select
                    className="form-control"
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Member --</option>
                    {members.map(m => (
                      <option key={m._id} value={m._id}>{m.fullName} ({m.phone})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Product</label>
                  <select
                    className="form-control"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.productName} (${p.pricePerUnit.toFixed(2)}/u)</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Enter quantity (e.g. 50)"
                    className="form-control"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOpModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={opType === 'deposit' ? 'btn btn-success' : 'btn btn-danger'} disabled={actionLoading}>
                  {actionLoading ? 'Recording...' : 'Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================
   3. MEMBER DASHBOARD
   ========================================== */
const MemberDashboard = ({ token, API_URL, user }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanFeedback, setLoanFeedback] = useState('');
  const [loanFeedbackType, setLoanFeedbackType] = useState('');
  const [requesting, setRequesting] = useState(false);

  const fetchMemberReport = async () => {
    try {
      const res = await fetch(`${API_URL}/reports/member/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReport(data);
      }
    } catch (error) {
      console.error('Error fetching member report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberReport();
  }, []);

  const handleLoanRequest = async (e) => {
    e.preventDefault();
    if (!loanAmount || parseFloat(loanAmount) <= 0) {
      setLoanFeedback('Please specify a valid loan amount.');
      setLoanFeedbackType('danger');
      return;
    }

    setRequesting(true);
    setLoanFeedback('');

    try {
      const res = await fetch(`${API_URL}/loans/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(loanAmount) })
      });
      const data = await res.json();
      if (data.success) {
        setLoanFeedback('Loan request submitted successfully! Pending approval.');
        setLoanFeedbackType('success');
        setLoanAmount('');
        fetchMemberReport();
        setTimeout(() => setShowLoanModal(false), 2000);
      } else {
        setLoanFeedback(data.message || 'Loan request failed.');
        setLoanFeedbackType('danger');
      }
    } catch (err) {
      setLoanFeedback('Network communication error.');
      setLoanFeedbackType('danger');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <div style={loaderStyle}>Loading Dashboard...</div>;

  const summary = report?.summary;
  const stockLevels = report?.stockLevels || [];

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user.fullName}. Member Portal.</p>
        </div>
        <div className="no-print">
          <button onClick={() => setShowLoanModal(true)} className="btn btn-primary">
            <Plus size={18} />
            <span>Request Loan</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stat-grid">
        <div className="glass-card stat-card glow-success">
          <div className="stat-icon stat-icon-emerald">
            <Warehouse size={24} />
          </div>
          <div>
            <div className="stat-label">Total Stored Value</div>
            <div className="stat-value">${summary?.totalStoredValue.toFixed(2)}</div>
          </div>
        </div>

        <div className="glass-card stat-card glow-danger">
          <div className="stat-icon stat-icon-danger">
            <CircleDollarSign size={24} />
          </div>
          <div>
            <div className="stat-label">Outstanding Loan Debt</div>
            <div className="stat-value">${summary?.outstandingDebt.toFixed(2)}</div>
          </div>
        </div>

        <div className="glass-card stat-card glow-primary">
          <div className="stat-icon stat-icon-blue">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-label">Available Credit (70% Max)</div>
            <div className="stat-value">${summary?.availableCredit.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        {/* Left Column: Member Stock Balances */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>My Stored Products</h3>
          {stockLevels.length === 0 ? (
            <div style={emptyStateStyle}>No products currently deposited in the warehouse.</div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Deposited Qty</th>
                    <th>Withdrawn Qty</th>
                    <th>Current Stock Balance</th>
                    <th>Estimated Value</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLevels.map((s) => (
                    <tr key={s.productId}>
                      <td style={{ fontWeight: '600' }}>{s.productName}</td>
                      <td>{s.deposited}</td>
                      <td>{s.withdrawn}</td>
                      <td style={{ fontWeight: '700', color: s.currentStock > 0 ? 'var(--color-success)' : 'var(--text-muted)' }}>
                        {s.currentStock} Units
                      </td>
                      <td style={{ fontWeight: '700' }}>${s.currentValue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Loan Qualification Box */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>Credit Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Total Stock Assets:</span>
              <strong style={{ float: 'right' }}>${summary?.totalStoredValue.toFixed(2)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Credit Borrowing Limit (70%):</span>
              <strong style={{ float: 'right', color: 'var(--color-success)' }}>${summary?.maxCreditLimit.toFixed(2)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Existing Debt:</span>
              <strong style={{ float: 'right', color: 'var(--color-danger)' }}>${summary?.outstandingDebt.toFixed(2)}</strong>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '0.5rem 0' }} />
            <div>
              <span style={{ fontWeight: '600' }}>Remaining Credit Limit:</span>
              <strong style={{ float: 'right', color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                ${summary?.availableCredit.toFixed(2)}
              </strong>
            </div>

            <button
              onClick={() => setShowLoanModal(true)}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={summary?.availableCredit <= 0}
            >
              <span>Request A Loan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loan Request Modal */}
      {showLoanModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Request a Loan</h3>
              <button className="modal-close" onClick={() => setShowLoanModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleLoanRequest}>
              <div className="modal-body">
                {loanFeedback && (
                  <div className={`alert alert-${loanFeedbackType}`}>
                    {loanFeedbackType === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
                    <span>{loanFeedback}</span>
                  </div>
                )}

                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.15)', fontSize: '0.85rem' }}>
                  Your maximum eligible credit limit is <strong>${summary?.maxCreditLimit.toFixed(2)}</strong> (70% of stored stock).
                  Minus your outstanding debt of <strong>${summary?.outstandingDebt.toFixed(2)}</strong>, your available credit is{' '}
                  <strong style={{ color: 'var(--color-success)' }}>${summary?.availableCredit.toFixed(2)}</strong>.
                </div>

                <div className="form-group">
                  <label className="form-label">Loan Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={summary?.availableCredit}
                    placeholder="Enter amount to borrow"
                    className="form-control"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLoanModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={requesting || summary?.availableCredit <= 0}>
                  {requesting ? 'Submitting...' : 'Request Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Common layout inline styles
const loaderStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '80vh',
  fontSize: '1.25rem',
  fontWeight: '600',
  color: 'var(--text-muted)'
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '3rem',
  color: 'var(--text-muted)',
  background: 'rgba(255, 255, 255, 0.01)',
  borderRadius: '12px',
  border: '1px dashed var(--border-light)'
};

const stockItemStyle = {
  padding: '0.25rem 0',
};

export default Dashboard;
