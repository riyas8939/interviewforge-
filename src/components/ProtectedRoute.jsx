import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const verifyOrLogin = async () => {
      if (token) {
        try {
          await authAPI.getProfile();
          setAuthenticated(true);
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem('token');
        }
      }

      // Silent Auto-Login for Guest Mode (Bypasses Sign In page entirely)
      const guestEmail = 'guest@interviewforge.com';
      const guestPass = 'guestpass123';
      
      try {
        // Try registering guest user (will succeed on first launch, or throw error if already exists)
        try {
          await authAPI.register(guestEmail, guestPass, 'Forge Guest');
        } catch (regErr) {
          // Ignore unique constraint error if already registered
        }
        
        // Authenticate guest user
        const loginRes = await authAPI.login(guestEmail, guestPass);
        localStorage.setItem('token', loginRes.data.access_token);
        setAuthenticated(true);
      } catch (err) {
        console.error("Silent guest login failed", err);
      } finally {
        setLoading(false);
      }
    };

    verifyOrLogin();
  }, [token]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#090D1A',
        color: '#F8FAFC'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTopColor: '#3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px'
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <p>Configuring secure guest workspace...</p>
        </div>
      </div>
    );
  }

  // Fallback to render children directly (keeps user in workspace without login loops)
  return children;
};

export default ProtectedRoute;
