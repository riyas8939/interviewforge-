import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RadarChart from '../components/RadarChart';
import LineChart from '../components/LineChart';
import { interviewAPI, authAPI } from '../services/api';
import { 
  Award, 
  Calendar, 
  ChevronRight, 
  FileText, 
  Play, 
  Sparkles, 
  User 
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authAPI.getProfile(),
      interviewAPI.getHistory()
    ])
      .then(([profRes, intRes]) => {
        setProfile(profRes.data);
        setInterviews(intRes.data);
      })
      .catch(err => {
        console.error("Dashboard failed to load data", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#030712',
        color: '#F3F4F6'
      }}>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  // Calculate Metrics
  const totalInterviews = interviews.length;
  const completedInterviews = interviews.filter(i => i.status === 'COMPLETED');
  const avgScore = completedInterviews.length > 0 
    ? Math.round(completedInterviews.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / completedInterviews.length)
    : 0;

  // Radar Data (aggregate metrics averages)
  const averageMetrics = completedInterviews.length > 0 
    ? {
        Technical: completedInterviews.reduce((acc, curr) => acc + (curr.technical_score || 0), 0) / completedInterviews.length,
        Coding: completedInterviews.reduce((acc, curr) => acc + (curr.coding_score || 0), 0) / completedInterviews.length,
        Communication: completedInterviews.reduce((acc, curr) => acc + (curr.communication_score || 0), 0) / completedInterviews.length,
        Behavioral: completedInterviews.reduce((acc, curr) => acc + (curr.behavioral_score || 0), 0) / completedInterviews.length,
        Fit: completedInterviews.reduce((acc, curr) => acc + ((curr.technical_score + curr.behavioral_score)/2 || 0), 0) / completedInterviews.length
      }
    : { Technical: 0, Coding: 0, Communication: 0, Behavioral: 0, Fit: 0 };

  // Line Chart Data (recent scores in chronological order)
  const scoringTrend = [...completedInterviews]
    .reverse()
    .map(i => i.overall_score || 0)
    .slice(-5); // Get last 5 scores

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content animate-fade-in">
        {/* Welcome Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={16} color="#8B5CF6" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Training Platform Active
              </span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#F3F4F6' }}>
              Hello, {profile?.full_name || 'Candidate'}!
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>
              Review your training progress and start a new session with hints &amp; explanations.
            </p>
          </div>
          <button 
            onClick={() => navigate('/setup')} 
            className="btn-primary"
            style={{ padding: '14px 28px', fontSize: '15px' }}
          >
            <Play size={16} fill="white" />
            New Training Session
          </button>
        </div>

        {/* Stats Grid Cards */}
        <div className="grid-cols-3" style={{ marginBottom: '32px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>Total Sessions</span>
              <Award size={20} color="#3B82F6" />
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#F8FAFC', marginTop: '12px' }}>{totalInterviews}</h2>
            <span style={{ fontSize: '12px', color: '#64748B' }}>{completedInterviews.length} completed evaluation reports</span>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>Average Score</span>
              <Sparkles size={20} color="#06B6D4" />
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#F8FAFC', marginTop: '12px' }}>{avgScore}%</h2>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Across all completed agents round scoring</span>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>Hiring Fitness</span>
              <User size={20} color="#8B5CF6" />
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#F8FAFC', marginTop: '12px' }}>
              {avgScore >= 80 ? 'Hire' : (avgScore >= 60 ? 'Maybe Hire' : 'Training Needed')}
            </h2>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Overall panel average rating status</span>
          </div>
        </div>

        {/* Charts & Analytics Panel */}
        {totalInterviews > 0 ? (
          <div className="grid-cols-2" style={{ marginBottom: '32px' }}>
            {/* Skill Radar */}
            <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: '#F8FAFC' }}>Skills breakdown</h3>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RadarChart data={averageMetrics} />
              </div>
            </div>

            {/* Performance line trend */}
            <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: '#F8FAFC' }}>Scoring Trend (Recent 5 Sessions)</h3>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LineChart scores={scoringTrend} />
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', marginBottom: '32px' }}>
            <Sparkles size={40} color="#64748B" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#F8FAFC' }}>Welcome to InterviewForge!</h2>
            <p style={{ color: '#94A3B8', fontSize: '14px', maxWidth: '440px', margin: '8px auto 24px' }}>
              You haven't completed any mock interviews yet. Set up a session to assess your skills with the multi-agent AI panel.
            </p>
            <button onClick={() => navigate('/setup')} className="btn-primary">
              <Play size={16} fill="white" />
              Start Your First Interview
            </button>
          </div>
        )}

        {/* Recent Attempts History */}
        {totalInterviews > 0 && (
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: '#F8FAFC' }}>Recent Evaluation Reports</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {interviews.slice(0, 5).map((int) => (
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
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#3B82F6'
                    }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>{int.role}</h4>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span>Style: {int.company_style}</span>
                        <span>•</span>
                        <span>Level: {int.experience}</span>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: int.overall_score >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: int.overall_score >= 80 ? '#10B981' : '#F59E0B'
                      }}>
                        {int.overall_score ? `${Math.round(int.overall_score)}%` : 'In Progress'}
                      </span>
                    </div>
                    <ChevronRight size={18} color="#64748B" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`
        .history-row:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(59, 130, 246, 0.25) !important;
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
