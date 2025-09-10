import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // যদি admin পেজে থাকেন, তাহলে navbar show করবেন না
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav style={{ backgroundColor: '#333', padding: '10px', color: 'white' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
          <h2>Excel Bill Management</h2>
        </Link>
        
        <div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span>Hello, {user.name}</span>
              <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>Profile</Link>

              <Link to="/client-list" style={{ color: 'white', textDecoration: 'none', marginRight: '15px' }}>
  Client List
</Link>

              {user.role === 'admin' && (
                <Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>Admin Panel</Link>
              )}
              <button onClick={handleLogout} className="btn btn-danger">Logout</button>
            </div>
          ) : (
            <div>
              <Link to="/login" style={{ color: 'white', textDecoration: 'none', marginRight: '15px' }}>Login</Link>
              <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;