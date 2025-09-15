import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';
import { API_BASE_URL } from '../config';

const Admin = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchBills();
  }, [user, navigate]);

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bills`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBills(data.bills);
      } else {
        setError(data.message || 'বিল ডেটা লোড করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      setError('বিল ডেটা লোড করতে সমস্যা হয়েছে: ' + error.message);
      console.error('Bills fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (billId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bills/${billId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update the local state
        setBills(prevBills => 
          prevBills.map(bill => 
            bill._id === billId ? { ...bill, status: newStatus } : bill
          )
        );
        alert('বিল স্ট্যাটাস আপডেট করা হয়েছে');
      } else {
        alert(data.message || 'স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে');
      console.error('Status update error:', error);
    }
  };

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
          <button onClick={fetchBills} className="btn btn-primary">
            আবার试试 করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>অ্যাডমিন প্যানেল</h1>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          হোম পেজে ফিরে যান
        </button>
      </div>
      
      <AdminPanel bills={bills} onStatusChange={handleStatusChange} />
    </div>
  );
};

export default Admin;