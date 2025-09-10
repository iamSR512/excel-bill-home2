import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setUserData(data);
        } else {
          alert(data.message || 'প্রোফাইল লোড করতে সমস্যা হয়েছে');
        }
      } catch (error) {
        alert('প্রোফাইল লোড করতে সমস্যা হয়েছে');
        console.error('Profile fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  if (loading) return <div className="container">লোড হচ্ছে...</div>;
  if (!userData) return <div className="container">প্রোফাইল লোড করতে অক্ষম</div>;

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '50px auto' }}>
        <h2>প্রোফাইল</h2>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <strong>নাম:</strong> {userData.name}
          </div>
          <div style={{ marginBottom: '15px' }}>
            <strong>ইমেইল:</strong> {userData.email}
          </div>
          <div style={{ marginBottom: '15px' }}>
            <strong>ভূমিকা:</strong> {userData.role === 'admin' ? 'অ্যাডমিন' : 'ব্যবহারকারী'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;