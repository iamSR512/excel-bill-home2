import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';
import { API_BASE_URL } from '../config'; // config.js থেকে import করুন
const Admin = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // সরাসরি URL দিয়ে access করলে check করুন
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchBills = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/submit-bill`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setBills(data.bills || data);
        } else {
          setError(data.message || 'বিল ডেটা লোড করতে সমস্যা হয়েছে');
        }
      } catch (error) {
        setError('বিল ডেটা লোড করতে সমস্যা হয়েছে');
        console.error('Bills fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [user, navigate]);

  const handleStatusChange = async (billId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/submit-bill`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setBills(prev => prev.map(bill => 
          bill._id === billId ? { ...bill, status: newStatus } : bill
        ));
        alert('বিল স্ট্যাটাস আপডেট করা হয়েছে');
      } else {
        alert(data.message || 'স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে');
      console.error('Status update error:', error);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container">
        <div className="card">
          <h2>অ্যাক্সেস ডিনাইড</h2>
          <p>আপনার অ্যাডমিন প্যানেল অ্যাক্সেস করার অনুমতি নেই।</p>
          <button onClick={handleBack} className="btn btn-primary">হোম পেজে ফিরে যান</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <h2>অ্যাডমিন প্যানেল</h2>
          <p>লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <h2>অ্যাডমিন প্যানেল</h2>
          <p style={{ color: 'red' }}>{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            রিফ্রেশ করুন
          </button>
          <button onClick={handleBack} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
            হোম পেজে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>অ্যাডমিন প্যানেল</h1>
        <button onClick={handleBack} className="btn btn-primary">হোম পেজে ফিরে যান</button>
      </div>
      
      {/* AdminPanel কম্পোনেন্ট ব্যবহার করুন */}
      <AdminPanel bills={bills} onStatusChange={handleStatusChange} />
    </div>
  );
};

export default Admin;