import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CircleDollarSign, Calendar, Check, X, AlertTriangle, Plus, Search } from 'lucide-react';

const Loans = () => {
  const { token, user, API_URL } = useAuth();
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMember, setFilterMember] = useState('');
  const [members, setMembers] = useState([]);

  // States for recording repayment
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [payFeedback, setPayFeedback] = useState('');
  const [payFeedbackType, setPayFeedbackType] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  // States for loan request (for member quick-access or manager on behalf)
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequestUser, setSelectedRequestUser] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [reqFeedback, setReqFeedback] = useState('');
  const [reqFeedbackType, setReqFeedbackType] = useState('');
  const [reqLoading, setReqLoading] = useState(false);

  const isStaff = user.role === 'admin' || user.role === 'manager';
  const isAdmin = user.role === 'admin';

  const fetchData = async () => {
    try {
      // 1. Fetch Loans
      const loansRes = await fetch(`${API_URL}/loans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const loansData = await loansRes.json();
      if (loansData.success) {
        setLoans(loansData.loans);
      }

      // 2. Fetch Members (Staff only, for filters and loan requests)
      if (isStaff) {
        const usersRes = await fetch(`${API_URL}/auth/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        if (usersData.success) {
          setMembers(usersData.users.filter(u => u.role === 'member'));
        }
      }

      // 3. Fetch Payments
      // Since backend doesn't have a global get payments, we'll fetch them individually or sum them up.
      // Wait, we can fetch payments by iterating over loans or we can make a query. Let's look at the payments list:
      // Members can query report/member to get their payments.
      // For staff, we can query reports/dashboard which returns recent activities, or we can fetch a specific user's payments.
      // Let's implement a payment history logs section: since payments are associated with loans, we can fetch payments
      // dynamically for the selected loan, or we can write a simple endpoint or fetch individual statements.
      // Let's make it so when clicking on a loan, you can view its payment history. This is very clean and standard!
    } catch (err) {
      console.error('Error fetching loans data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLoanAction = async (loanId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this loan request?`)) return;
    try {
      const res = await fetch(`${API_URL}/loans/${loanId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert(`Loan successfully ${action}ed.`);
        fetchData();
      } else {
        alert(data.message || `Failed to ${action} loan.`);
      }
    } catch (err) {
      alert('Network error.');
    }
  };

  const openPayModal = (loan) => {
    setSelectedLoan(loan);
    setRepayAmount('');
    setPayFeedback('');
    setShowPayModal(true);
  };

  const handleRepaySubmit = async (e) => {
    e.preventDefault();
    if (!repayAmount || parseFloat(repayAmount) <= 0) {
      setPayFeedback('Please specify a valid payment amount.');
      setPayFeedbackType('danger');
      return;
    }

    setPayLoading(true);
    setPayFeedback('');

    try {
      const res = await fetch(`${API_URL}/loans/${selectedLoan._id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amountPaid: parseFloat(repayAmount) })
      });
      const data = await res.json();
      if (data.success) {
        setPayFeedback('Repayment successfully recorded!');
        setPayFeedbackType('success');
        fetchData();
        setTimeout(() => setShowPayModal(false), 1500);
      } else {
        setPayFeedback(data.message || 'Payment failed.');
        setPayFeedbackType('danger');
      }
    } catch (err) {
      setPayFeedback('Server connection error.');
      setPayFeedbackType('danger');
    } finally {
      setPayLoading(false);
    }
  };

  const openRequestModal = () => {
    setSelectedRequestUser(user.role === 'member' ? user.id : '');
    setRequestAmount('');
    setReqFeedback('');
    setShowRequestModal(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    const targetUserId = user.role === 'member' ? user.id : selectedRequestUser;
    
    if (!targetUserId || !requestAmount || parseFloat(requestAmount) <= 0) {
      setReqFeedback('Please fill out all fields.');
      setReqFeedbackType('danger');
      return;
    }

    setReqLoading(true);
    setReqFeedback('');

    try {
      const res = await fetch(`${API_URL}/loans/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: targetUserId,
          amount: parseFloat(requestAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        setReqFeedback('Loan request submitted successfully! Pending approval.');
        setReqFeedbackType('success');
        fetchData();
        setTimeout(() => setShowRequestModal(false), 2000);
      } else {
        setReqFeedback(data.message || 'Loan request failed.');
        setReqFeedbackType('danger');
      }
    } catch (err) {
      setReqFeedback('Server connection error.');
      setReqFeedbackType('danger');
    } finally {
      setReqLoading(false);
    }
  };

  // Filter loans
  const filteredLoans = loans.filter((l) => {
    if (!filterMember) return true;
    return l.user?._id === filterMember;
  });

  if (loading) return <div style={loaderStyle}>Loading Loans...</div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Loans & Repayments</h1>
          <p className="page-subtitle">Track borrowing requests, credit eligibility, and outstanding balances.</p>
        </div>
        <button onClick={openRequestModal} className="btn btn-primary no-print">
          <Plus size={18} />
          <span>Request Loan</span>
        </button>
      </div>

      {/* Filters Bar */}
      {isStaff && (
        <div style={filterBarContainerStyle} className="no-print">
          <div style={filterLabelStyle}>
            <Search size={18} />
            <span>Filter by Member:</span>
          </div>
          <select
            className="form-control"
            style={{ width: '220px', background: 'rgba(15, 23, 42, 0.4)' }}
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

      {/* Loans List */}
      <div className="glass-card">
        {filteredLoans.length === 0 ? (
          <div style={emptyStateStyle}>No loans records found.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Request Date</th>
                  {isStaff && <th>Member</th>}
                  <th>Loan Amount</th>
                  <th>Remaining Debt</th>
                  <th>Status</th>
                  <th>Approved By</th>
                  <th className="no-print" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((l) => (
                  <tr key={l._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                        <span>{new Date(l.date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    {isStaff && (
                      <td>
                        <div style={{ fontWeight: '600' }}>{l.user?.fullName || 'Removed User'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.user?.phone}</div>
                      </td>
                    )}
                    <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                      ${l.amount.toFixed(2)}
                    </td>
                    <td style={{ fontWeight: '700', color: l.remainingBalance > 0 ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                      ${l.remainingBalance?.toFixed(2) || '0.00'}
                    </td>
                    <td>
                      <span className={`badge badge-${l.status}`}>{l.status}</span>
                    </td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {l.approvedBy?.fullName || 'N/A'}
                    </td>
                    <td className="no-print" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {/* Admin Approvals */}
                        {isAdmin && l.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleLoanAction(l._id, 'approve')}
                              className="btn btn-success"
                              style={actionBtnStyle}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleLoanAction(l._id, 'reject')}
                              className="btn btn-danger"
                              style={actionBtnStyle}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {/* Repayments (Staff only on active approved loans) */}
                        {isStaff && l.status === 'approved' && l.remainingBalance > 0 && (
                          <button
                            onClick={() => openPayModal(l)}
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            <CircleDollarSign size={14} />
                            <span>Repay</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Repayment Modal */}
      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Record Repayment</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleRepaySubmit}>
              <div className="modal-body">
                {payFeedback && (
                  <div className={`alert alert-${payFeedbackType}`}>
                    {payFeedbackType === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
                    <span>{payFeedback}</span>
                  </div>
                )}

                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Member: <strong>{selectedLoan?.user?.fullName}</strong><br />
                  Total Loan Amount: <strong>${selectedLoan?.amount.toFixed(2)}</strong><br />
                  Remaining Balance: <strong style={{ color: 'var(--color-danger)' }}>${selectedLoan?.remainingBalance.toFixed(2)}</strong>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedLoan?.remainingBalance}
                    placeholder="Enter amount paid"
                    className="form-control"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={payLoading}>
                  {payLoading ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Loan Modal */}
      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Submit Loan Request</h3>
              <button className="modal-close" onClick={() => setShowRequestModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleRequestSubmit}>
              <div className="modal-body">
                {reqFeedback && (
                  <div className={`alert alert-${reqFeedbackType}`}>
                    {reqFeedbackType === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
                    <span>{reqFeedback}</span>
                  </div>
                )}

                {user.role !== 'member' ? (
                  <div className="form-group">
                    <label className="form-label">Select Member</label>
                    <select
                      className="form-control"
                      value={selectedRequestUser}
                      onChange={(e) => setSelectedRequestUser(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Member --</option>
                      {members.map(m => (
                        <option key={m._id} value={m._id}>{m.fullName} ({m.phone})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ marginBottom: '1rem', fontSize: '0.9rem', padding: '0.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                    Loan requests are subject to the community warehouse stock validation rule (max loan balance $\le$ 70% of stored stock asset value).
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Borrow Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="Enter amount to borrow"
                    className="form-control"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRequestModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={reqLoading}>
                  {reqLoading ? 'Submitting...' : 'Request Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const filterBarContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '1.5rem',
};

const filterLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.95rem',
  color: 'var(--text-muted)',
};

const actionBtnStyle = {
  padding: '0.4rem 0.8rem',
  fontSize: '0.8rem',
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

const emptyStateStyle = {
  textAlign: 'center',
  padding: '3rem',
  color: 'var(--text-muted)',
  background: 'rgba(255, 255, 255, 0.01)',
  borderRadius: '12px',
  border: '1px dashed var(--border-light)'
};

export default Loans;
