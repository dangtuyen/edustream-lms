import React, { useState } from 'react';
import './CourseDetail.css';
import { useNotification } from '../../App.jsx';
import { API_BASE_URL } from '../../config/api';

export default function CheckoutModal({ course, onClose, onPaymentSuccess }) {
  const [cardData, setCardData] = useState({ cardNumber: '', cardExpiry: '', cvv: '' });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const { showNotification } = useNotification();

  // Auto-format card numbers: chèn dấu cách sau mỗi 4 chữ số
  const handleCardNumberChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const parts = [];
    
    for (let i = 0; i < rawValue.length; i += 4) {
      parts.push(rawValue.substring(i, i + 4));
    }
    
    setCardData({
      ...cardData,
      cardNumber: parts.join(' ')
    });
  };

  const handleExpiryChange = (e) => {
    let rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue.length > 2) {
      rawValue = `${rawValue.substring(0, 2)}/${rawValue.substring(2, 4)}`;
    }
    
    setCardData({
      ...cardData,
      cardExpiry: rawValue
    });
  };

  // Standard digit validation logic for CVV numbers
  const handleCvvChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setCardData({
      ...cardData,
      cvv: rawValue
    });
  };

  const handlePayAction = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    const cleanCardNumber = cardData.cardNumber.replace(/\s/g, '');

    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      setError('You are not logged in. Please log in to your student account to make a payment.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/revenue/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: course._id,
          cardNumber: cleanCardNumber,
          cardExpiry: cardData.cardExpiry,
          cvv: cardData.cvv
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Transaction authorization declined.');

      showNotification('Payment approved! Welcome to the classroom.');
      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
      <div className="auth-card" style={{ maxWidth: '420px', padding: '2rem' }}>
        <div className="auth-header-block" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800' }}>🔒 Sandbox Secure Checkout</h2>
          <p style={{ fontSize: '0.85rem' }}>Test Mode Environment. Standard logic applies.</p>
        </div>

        <div style={{ padding: '0.85rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', color: '#1e40af', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          💰 Tuition Fee: <strong>${course.price} USD</strong> for <strong>"{course.title}"</strong>
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#60a5fa' }}>💡 Hint: Numbers starting with '5000' simulate banks processor decline.</div>
        </div>

        {error && <div className="auth-error" style={{ fontSize: '0.85rem', padding: '0.5rem' }}>{error}</div>}

        <form onSubmit={handlePayAction}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem' }}>Simulation Card Number</label>
            <input 
              type="text" 
              placeholder="4000 1234 5678 9010" 
              maxLength="19"
              value={cardData.cardNumber} 
              onChange={handleCardNumberChange} 
              required 
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem' }}>Expiry (MM/YY)</label>
              <input 
                type="text" 
                placeholder="12/28" 
                maxLength="5" // MM/YY
                value={cardData.cardExpiry} 
                onChange={handleExpiryChange} 
                required 
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem' }}>CVV Security Code</label>
              <input 
                type="text"
                placeholder="123" 
                maxLength="3" 
                value={cardData.cvv} 
                onChange={handleCvvChange} 
                required 
                style={{ WebkitTextSecurity: 'disc' }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn-secondary" style={{ flexGrow: 1 }} onClick={onClose} disabled={processing}>Cancel</button>
            <button type="submit" className="btn-submit" style={{ flexGrow: 2, marginTop: 0 }} disabled={processing}>
              {processing ? 'Authorizing Check...' : 'Authorize Test Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
