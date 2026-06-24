import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Printer, Download, BookOpen, AlertTriangle, CircleDollarSign } from 'lucide-react';

const Reports = () => {
  const { token, user, API_URL } = useAuth();
  const [adminReport, setAdminReport] = useState(null);
  const [memberReport, setMemberReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [membersOverview, setMembersOverview] = useState([]);

  const isAdmin = user.role === 'admin';

  const fetchReports = async () => {
    try {
      if (isAdmin) {
        // Fetch Admin Dashboard stats (stock levels + metrics)
        const res = await fetch(`${API_URL}/reports/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setAdminReport(data);
        }

        // Fetch all members list and get statements for each to compile an overview table
        const usersRes = await fetch(`${API_URL}/auth/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        if (usersData.success) {
          const membersList = usersData.users.filter(u => u.role === 'member');
          const enhancedMembers = await Promise.all(
            membersList.map(async (m) => {
              const statementRes = await fetch(`${API_URL}/reports/member/${m._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const statementData = await statementRes.json();
              return {
                _id: m._id,
                fullName: m.fullName,
                phone: m.phone,
                stockValue: statementData.success ? statementData.summary.totalStoredValue : 0,
                debt: statementData.success ? statementData.summary.outstandingDebt : 0,
                credit: statementData.success ? statementData.summary.availableCredit : 0,
              };
            })
          );
          setMembersOverview(enhancedMembers);
        }
      } else {
        // Fetch Member Report
        const res = await fetch(`${API_URL}/reports/member/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setMemberReport(data);
        }
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div style={loaderStyle}>Compiling Reports...</div>;

  return (
    <div className="main-content">
      {/* Header (hidden in print) */}
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Financial & Inventory Reports</h1>
          <p className="page-subtitle">Print-ready statements and warehouse audits.</p>
        </div>
        <button onClick={handlePrint} className="btn btn-primary">
          <Printer size={18} />
          <span>Print Report</span>
        </button>
      </div>

      {/* ==========================================
         A. ADMIN REPORT LAYOUT
         ========================================== */}
      {isAdmin && adminReport && (
        <div style={reportContainerStyle}>
          {/* Printable Report Header */}
          <div className="print-header" style={printHeaderStyle}>
            <h2>Warehouse Stock & Credit Risk Report</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Report compiled on: {new Date().toLocaleString()} | Administrator: {user.fullName}
            </div>
            <hr style={hrStyle} />
          </div>

          {/* Section 1: Warehouse Stock Summary */}
          <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
            <h3 style={sectionTitleStyle}>1. Warehouse Inventory Levels</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Price Per Unit ($)</th>
                    <th>Current Quantity Stored</th>
                    <th>Estimated Market Value</th>
                  </tr>
                </thead>
                <tbody>
                  {adminReport.stockSummary.map((item) => (
                    <tr key={item.productId}>
                      <td style={{ fontWeight: '600' }}>{item.productName}</td>
                      <td>${item.pricePerUnit.toFixed(2)}</td>
                      <td style={{ fontWeight: '700' }}>{item.currentStock} Units</td>
                      <td style={{ fontWeight: '700', color: 'var(--color-success)' }}>
                        ${item.value.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid var(--border-light)' }}>
                    <td colSpan="3" style={{ fontWeight: '700', textAlign: 'right' }}>Total Inventory Asset Value:</td>
                    <td style={{ fontWeight: '800', color: 'var(--color-success)', fontSize: '1.1rem' }}>
                      ${adminReport.stats.totalWarehouseValue.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Member Balance Ledger */}
          <div className="glass-card">
            <h3 style={sectionTitleStyle}>2. Member Stock Assets & Borrowing Status</h3>
            {membersOverview.length === 0 ? (
              <div style={emptyStateStyle}>No members registered in the ledger.</div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Member Name</th>
                      <th>Phone Number</th>
                      <th>Stored Assets Value</th>
                      <th>Outstanding Debt</th>
                      <th>Remaining Credit (70% Cap)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membersOverview.map((m) => (
                      <tr key={m._id}>
                        <td style={{ fontWeight: '600' }}>{m.fullName}</td>
                        <td>{m.phone}</td>
                        <td style={{ fontWeight: '600', color: 'var(--color-success)' }}>
                          ${m.stockValue.toFixed(2)}
                        </td>
                        <td style={{ fontWeight: '600', color: m.debt > 0 ? 'var(--color-danger)' : 'var(--text-main)' }}>
                          ${m.debt.toFixed(2)}
                        </td>
                        <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                          ${m.credit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid var(--border-light)' }}>
                      <td colSpan="3" style={{ fontWeight: '700', textAlign: 'right' }}>Total System Active Credit Book Value:</td>
                      <td colSpan="2" style={{ fontWeight: '800', color: 'var(--color-danger)', fontSize: '1.1rem' }}>
                        ${adminReport.stats.outstandingDebt.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
         B. MEMBER STATEMENT LAYOUT
         ========================================== */}
      {!isAdmin && memberReport && (
        <div style={reportContainerStyle}>
          {/* Printable Statement Header */}
          <div className="print-header" style={printHeaderStyle}>
            <h2>Personal Transaction Ledger & Balance Statement</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Statement Compiled: {new Date().toLocaleString()} | Account Holder: {user.fullName}
            </div>
            <hr style={hrStyle} />
          </div>

          {/* Quick Metrics (Print-friendly format) */}
          <div style={printMetricsRowStyle}>
            <div style={printMetricCardStyle}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Warehouse Stored Assets</span>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--color-success)' }}>
                ${memberReport.summary.totalStoredValue.toFixed(2)}
              </strong>
            </div>
            <div style={printMetricCardStyle}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Outstanding Debt</span>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--color-danger)' }}>
                ${memberReport.summary.outstandingDebt.toFixed(2)}
              </strong>
            </div>
            <div style={printMetricCardStyle}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remaining Credit capacity</span>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--color-primary)' }}>
                ${memberReport.summary.availableCredit.toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Stock Balances */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3 style={sectionTitleStyle}>Warehouse Stock Inventory Balance</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Deposited Qty</th>
                    <th>Withdrawn Qty</th>
                    <th>Remaining Balance</th>
                    <th>Current Value</th>
                  </tr>
                </thead>
                <tbody>
                  {memberReport.stockLevels.map((s) => (
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
          </div>

          {/* Deposits & Withdrawals History */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3 style={sectionTitleStyle}>Historical Deposit & Withdrawal Log</h3>
            {memberReport.deposits.length === 0 && memberReport.withdrawals.length === 0 ? (
              <div style={emptyStateStyle}>No transaction logs.</div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Product</th>
                      <th>Quantity Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Combine deposits and withdrawals, sort by date */}
                    {[
                      ...memberReport.deposits.map(d => ({ ...d, type: 'deposit' })),
                      ...memberReport.withdrawals.map(w => ({ ...w, type: 'withdrawal' }))
                    ]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((log) => (
                        <tr key={log._id}>
                          <td>{new Date(log.date).toLocaleString()}</td>
                          <td>
                            <span style={{
                              fontWeight: '700',
                              color: log.type === 'deposit' ? 'var(--color-success)' : 'var(--color-danger)'
                            }}>
                              {log.type.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontWeight: '600' }}>{log.product?.productName || 'Removed Product'}</td>
                          <td style={{
                            fontWeight: '700',
                            color: log.type === 'deposit' ? 'var(--color-success)' : 'var(--color-danger)'
                          }}>
                            {log.type === 'deposit' ? '+' : '-'}{log.quantity} Units
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Loan Ledger */}
          <div className="glass-card">
            <h3 style={sectionTitleStyle}>Loan Account Statements & Repayments</h3>
            {memberReport.loans.length === 0 ? (
              <div style={emptyStateStyle}>No loan history records.</div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Request Date</th>
                      <th>Principal Borrowed</th>
                      <th>Current Loan Status</th>
                      <th>Total Payments Made</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberReport.loans.map((l) => {
                      // Sum payments for this loan
                      const loanPayments = memberReport.payments.filter(p => p.loan._id === l._id);
                      const totalPaid = loanPayments.reduce((sum, p) => sum + p.amountPaid, 0);
                      return (
                        <tr key={l._id}>
                          <td>{new Date(l.date).toLocaleDateString()}</td>
                          <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                            ${l.amount.toFixed(2)}
                          </td>
                          <td>
                            <span className={`badge badge-${l.status}`}>{l.status}</span>
                          </td>
                          <td style={{ fontWeight: '700', color: 'var(--color-success)' }}>
                            ${totalPaid.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Inline layout styles
const printHeaderStyle = {
  marginBottom: '1.5rem',
};

const hrStyle = {
  border: 'none',
  borderTop: '2px solid var(--border-light)',
  marginTop: '1rem',
  marginBottom: '1.5rem',
};

const sectionTitleStyle = {
  fontSize: '1.15rem',
  marginBottom: '1rem',
};

const printMetricsRowStyle = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '2rem',
  flexWrap: 'wrap',
};

const printMetricCardStyle = {
  flex: 1,
  minWidth: '180px',
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid var(--border-light)',
  padding: '1rem',
  borderRadius: '8px',
};

const reportContainerStyle = {
  maxWidth: '1000px',
  margin: '0 auto',
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

export default Reports;
