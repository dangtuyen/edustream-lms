import React, { useEffect, useState } from 'react';
import './CourseDetail.css';

export default function RevenueDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/revenue/instructor/revenue', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(reportData => {
        if (!reportData.message) setData(reportData);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <div className="status-message">Loading financial statistics ledger...</div>;
  if (!data) return <div className="status-message error">Failed to initialize revenue analysis pipeline.</div>;

  // Locate highest sales number vector to calibrate graph scale accurately
  const peakRevenueValue = Math.max(...data.chartData.map(c => c.revenue), 1);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Financial Ledger & Revenue Dashboard</h1>
        <p className="dashboard-subtitle">Track your platform commercial conversion indexes and wallet assets values.</p>
      </div>

      {/* Finance Analytics Grid Blocks */}
      <div className="revenue-stats-grid">
        <div className="stat-card-finance">
          <h4>Withdrawable Wallet Balance</h4>
          <div className="amount green">${data.summary.currentBalance}</div>
        </div>
        <div className="stat-card-finance">
          <h4>Lifetime Gross Revenue</h4>
          <div className="amount">${data.summary.lifetimeEarnings}</div>
        </div>
        <div className="stat-card-finance">
          <h4>Total Course Enrollments</h4>
          <div className="amount" style={{ color: 'var(--primary)' }}>{data.summary.totalSalesCount} Sales</div>
        </div>
      </div>

      {/* Pure Native Performance Bar Chart (No third-party packages dependency) */}
      <div className="chart-bar-visual-wrapper">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', fontWeight: '700' }}>📊 Sales Performance Breakdown by Program Matrix</h3>
        {data.chartData.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No standalone revenue vectors generated across your catalog assets yet.</p>
        ) : (
          data.chartData.map((chartItem, idx) => {
            const calculatedWidthPercentage = (chartItem.revenue / peakRevenueValue) * 100;
            return (
              <div key={idx} style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  <span>{chartItem.courseTitle} ({chartItem.sales} sales)</span>
                  <strong>${chartItem.revenue} USD</strong>
                </div>
                <div className="custom-bar-row">
                  <div className="bar-fill-node" style={{ width: `${Math.max(calculatedWidthPercentage, 2)}%` }}></div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Historical Logs Ledger Audit Matrix */}
      <div className="transaction-table-wrapper">
        <div className="chat-panel-header" style={{ borderBottom: '1px solid var(--border)' }}>📝 Historical Enrollment Ledger Records</div>
        <table className="table-node">
          <thead>
            <tr>
              <th>Date Stamp</th>
              <th>Student Profile</th>
              <th>Purchased Program Module</th>
              <th>Amount Transacted</th>
            </tr>
          </thead>
          <tbody>
            {data.transactions.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No purchase invoices logs filed yet.</td>
              </tr>
            ) : (
              data.transactions.map((tx) => (
                <tr key={tx._id}>
                  <td>{new Date(tx.enrolledAt).toLocaleDateString()}</td>
                  <td>
                    <strong>{tx.student?.name || 'Anonymous User'}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.student?.email}</div>
                  </td>
                  <td>{tx.course?.title || 'Removed Framework Asset'}</td>
                  <td style={{ fontWeight: '700', color: 'var(--success)' }}>${tx.amountPaid}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
