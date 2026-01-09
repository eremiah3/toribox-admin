import React, { useState, useEffect } from 'react';

const API_BASE = 'https://toribox-api.onrender.com';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [page, limit]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch(
        `${API_BASE}/api/users/transaction/get?limit=${limit}&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error('Failed to fetch transactions');
      
      const data = await res.json();
      setTransactions(data.transaction?.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to load transactions: ' + err.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (transactionId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(
        `${API_BASE}/api/users/transaction/get/${transactionId}?limit=${limit}&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error('Failed to fetch transaction');
      
      const data = await res.json();
      setSelectedTransaction(data.transaction?.data || []);
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to load transaction details');
    }
  };

  if (loading) {
    return (
      <div className="section fade-in">
        <h1>Loading transactions...</h1>
      </div>
    );
  }

  return (
    <div className="section fade-in">
      <h1 style={{ fontSize: '2.8rem', margin: '2rem 0', color: 'var(--primary-color)', textAlign: 'center' }}>
        User Transactions
      </h1>

      {/* Transactions List */}
      <h2 style={{ margin: '2rem 0 1.5rem', fontSize: '2rem' }}>
        All Transactions ({transactions.length})
      </h2>

      {transactions.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '1.3rem', color: '#888', margin: '4rem 0' }}>
          No transactions found.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '2rem'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--primary-color)', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Transaction ID</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Amount</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '1rem' }}>{tx._id}</td>
                  <td style={{ padding: '1rem' }}>₦{tx.amount || 'N/A'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      backgroundColor: tx.status === 'completed' ? '#4caf50' : '#ff9800',
                      color: 'white',
                      fontSize: '0.9rem'
                    }}>
                      {tx.status || 'Unknown'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      className="btn"
                      onClick={() => handleViewDetails(tx._id)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedTransaction(null)}>
              ×
            </button>
            <h2>Transaction Details</h2>
            <div style={{ marginTop: '1.5rem' }}>
              {Array.isArray(selectedTransaction) ? (
                selectedTransaction.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <p><strong>Amount:</strong> ₦{item.amount || 'N/A'}</p>
                    <p><strong>Status:</strong> {item.status || 'Unknown'}</p>
                    <p><strong>Date:</strong> {new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  <p><strong>Amount:</strong> ₦{selectedTransaction.amount || 'N/A'}</p>
                  <p><strong>Status:</strong> {selectedTransaction.status || 'Unknown'}</p>
                  <p><strong>Date:</strong> {new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
        <button
          className="btn"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span style={{ padding: '0.5rem 1rem', fontSize: '1.1rem' }}>
          Page {page}
        </span>
        <button
          className="btn"
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(parseInt(e.target.value));
            setPage(1);
          }}
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid var(--primary-color)',
            cursor: 'pointer'
          }}
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>
    </div>
  );
};

export default Transactions;
