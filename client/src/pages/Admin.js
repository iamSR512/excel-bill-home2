import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';
import { API_BASE_URL } from '../config';

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
        const response = await fetch(`${API_BASE_URL}/api/bills`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setBills(data.bills || data);
        } else {
          setError(data.message || 'Bills Data Loading Failed');
        }
      } catch (error) {
        setError('Bills Data Loading Failed');
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
      const response = await fetch(`${API_BASE_URL}/api/bills/${billId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // স্ট্যাটাস আপডেট করার পর বিলগুলি রিফ্রেশ করুন
        const updatedBills = bills.map(bill => 
          bill._id === billId ? { ...bill, status: newStatus } : bill
        );
        setBills(updatedBills);
        alert('Bill status updated successfully');
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (error) {
      alert('Failed to update status');
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
          <h2>Access Denied</h2>
          <p>You do not have permission to access the admin panel.</p>
          <button onClick={handleBack} className="btn btn-primary">Go Back to Home Page</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <h2>Admin Panel</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <h2>Admin Panel</h2>
          <p style={{ color: 'red' }}>{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Refresh
          </button>
          <button onClick={handleBack} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
            Go Back to Home Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Admin Panel</h1>
        <div>
          <button onClick={() => window.location.reload()} className="btn btn-secondary" style={{ marginRight: '10px' }}>
            Refresh
          </button>
          <button onClick={handleBack} className="btn btn-primary">Go Back to Home Page</button>
        </div>
      </div>
      
      {/* AdminPanel কম্পোনেন্ট ব্যবহার করুন */}
      <AdminPanel bills={bills} onStatusChange={handleStatusChange} />
    </div>
  );
};

export default Admin;