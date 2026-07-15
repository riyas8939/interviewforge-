import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { interviewAPI } from '../services/api';
import { FileText, Calendar, ChevronRight, BarChart2 } from 'lucide-react';

const History = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interviewAPI.getHistory()
      .then(res => {
        setInterviews(res.data);
      })
      .catch(err => {
        console.error("Failed to load interview history list", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh',
        backgroundColor: '#030712', color: '#F3F4F6'
      }}>
        <p>Loading historical reports...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content animate-fade-in">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#F3F4F6' }}>All Interview Logs</h1>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>
            Review past evaluation scores and download official panel PDFs.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '28px' }}>
          {interviews.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
              No past sessions recorded yet. Start a new interview to see logs here.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {interviews.map((int) => (
                <div 
                  key={int.id}
                  onClick={() => navigate(`/report/${int.id}`)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="history-row"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#8B5CF6'
                    }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>{int.role}</h4>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span>Style: {int.company_style}</span>
                        <span>•</span>
                        <span>Level: {int.experience}</span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {new Date(int.created_at).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: int.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: int.status === 'COMPLETED' ? '#10B981' : '#3B82F6'
                    }}>
                      {int.status === 'COMPLETED' ? `${Math.round(int.overall_score)}%` : 'In Progress'}
                    </span>
                    <ChevronRight size={18} color="#64748B" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <style>{`
          .history-row:hover {
            background-color: rgba(255, 255, 255, 0.05) !important;
            border-color: rgba(139, 92, 246, 0.25) !important;
            transform: translateX(4px);
          }
        `}</style>
      </div>
    </div>
  );
};

export default History;
