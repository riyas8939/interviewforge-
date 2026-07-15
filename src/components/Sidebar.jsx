import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, LogOut, Brain, Cpu } from 'lucide-react';

const Sidebar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Active-check helpers
  const isActive  = (path) => location.pathname === path;
  const isTraining= location.pathname.startsWith('/training');
  const isSetup   = location.pathname === '/setup';

  const menuItems = [
    { name: 'Dashboard',          icon: LayoutDashboard, path: '/' },
    { name: 'New Training Session',icon: PlusCircle,      path: '/setup' },
    { name: 'History',             icon: History,         path: '/history' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div style={{
      width: '232px',
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid rgba(0, 0, 0, 0.06)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>

      {/* ── Brand ─────────────────────────────────────────── */}
      <div style={{
        padding: '22px 20px',
        display: 'flex', alignItems: 'center', gap: '12px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
          width: '36px', height: '36px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
          flexShrink: 0,
        }}>
          <Brain size={18} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: 0 }}>InterviewForge</h2>
          <span style={{ fontSize: '10px', color: '#EF4444', fontWeight: 700, letterSpacing: '0.08em' }}>
            AI TRAINING PLATFORM
          </span>
        </div>
      </div>

      {/* ── Mode badge ────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          borderRadius: '10px', padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '16px' }}>🎓</span>
          <div>
            <p style={{ color: '#B91C1C', fontSize: '12px', fontWeight: 700, margin: 0 }}>Training Mode</p>
            <p style={{ color: '#4B5563', fontSize: '10px', margin: 0 }}>Hints · Explanations · Roadmap</p>
          </div>
        </div>
      </div>

      {/* ── Nav links ─────────────────────────────────────── */}
      <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map((item) => {
          const Icon   = item.icon;
          const active = isActive(item.path) || (item.path === '/setup' && isTraining);
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        width: '100%', padding: '11px 14px',
        background: active
          ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))'
          : 'transparent',
        border: active ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid transparent',
        borderRadius: '10px',
        color: active ? '#B91C1C' : '#4B5563',
        fontSize: '13px', fontWeight: active ? 700 : 500,
        cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.2s',
      }}
            >
              <Icon size={17} />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* ── Footer ────────────────────────────────────────── */}
      <div style={{ padding: '14px 12px', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
        <div style={{
          padding: '10px 14px', marginBottom: '8px',
          background: 'rgba(0, 0, 0, 0.02)', borderRadius: '10px',
          border: '1px solid rgba(0, 0, 0, 0.04)',
        }}>
          <p style={{ color: '#475569', fontSize: '10px', fontWeight: 600, margin: '0 0 2px' }}>POWERED BY</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={13} color='#7C3AED' />
            <span style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 600 }}>Gemini AI + Demo Mode</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '10px 14px',
            background: 'transparent',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: '10px', color: '#EF4444',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            textAlign: 'left', transition: 'all 0.2s',
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
