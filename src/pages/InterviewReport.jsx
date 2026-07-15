import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { interviewAPI } from '../services/api';
import { 
  Download, 
  ChevronLeft, 
  Award, 
  FileText, 
  Sparkles, 
  ThumbsUp, 
  AlertTriangle,
  Compass,
  ArrowRight
} from 'lucide-react';

const InterviewReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We load the list of interviews and find the matching one
    interviewAPI.getHistory()
      .then(res => {
        const item = res.data.find(i => i.id === id);
        setInterview(item);
      })
      .catch(err => {
        console.error("Failed to load interview report details", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleDownloadPdf = () => {
    const url = interviewAPI.downloadPdfUrl(id);
    // Open in new tab or trigger direct download window
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh',
        backgroundColor: '#030712', color: '#F3F4F6'
      }}>
        <p>Compiling scoring logs and generating report statistics...</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-content animate-fade-in" style={{ textAlign: 'center', padding: '60px' }}>
          <AlertTriangle size={48} color="#EF4444" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ color: '#F3F4F6' }}>Evaluation Report Not Found</h2>
          <button onClick={() => navigate('/')} className="btn-secondary" style={{ marginTop: '20px' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Parse custom learning roadmap JSON
  let roadmapData = { weak_topics: [], roadmap: [] };
  try {
    if (interview.learning_roadmap) {
      roadmapData = JSON.parse(interview.learning_roadmap);
    }
  } catch (e) {
    console.error("Failed to parse learning roadmap data", e);
  }

  // Score styling config
  const isHire = interview.hiring_decision === 'Hire';
  const isMaybe = interview.hiring_decision === 'Maybe Hire';
  const recColor = isHire ? '#10B981' : (isMaybe ? '#F59E0B' : '#EF4444');
  const recBg = isHire ? 'rgba(16, 185, 129, 0.1)' : (isMaybe ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)');

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content animate-fade-in">
        {/* Back and PDF action */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '32px'
        }}>
          <button 
            onClick={() => navigate('/')} 
            className="btn-secondary"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
          >
            <ChevronLeft size={16} />
            Back to Dashboard
          </button>
          
          <button 
            onClick={handleDownloadPdf}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '13px' }}
          >
            <Download size={14} />
            Download PDF Report
          </button>
        </div>

        {/* Title details */}
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Evaluation Report
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
            {interview.role} Interview Feedback
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '14px', marginTop: '4px' }}>
            Compiled evaluation scores from the multi-agent AI panel (Company Style: {interview.company_style}).
          </p>
        </div>

        {/* Panel decision recommendation banner */}
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          padding: '24px 30px',
          backgroundColor: recBg,
          border: `1px solid ${recColor}40`,
          borderRadius: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            backgroundColor: recColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', flexShrink: 0
          }}>
            <Award size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC' }}>
              Final Panel Recommendation: <font color={recColor}>{interview.hiring_decision || 'N/A'}</font>
            </h2>
            <p style={{ color: '#E2E8F0', fontSize: '14px', marginTop: '6px', lineHeight: '1.5' }}>
              {interview.hiring_reasoning}
            </p>
          </div>
        </div>

        {/* Scoring list metrics grid */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC', marginBottom: '16px' }}>Performance Metrics</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '16px'
          }} className="scores-grid">
            {[
              { label: 'Overall Score', val: interview.overall_score, col: '#3B82F6' },
              { label: 'Technical Depth', val: interview.technical_score, col: '#06B6D4' },
              { label: 'Coding Capability', val: interview.coding_score, col: '#10B981' },
              { label: 'Communication', val: interview.communication_score, col: '#8B5CF6' },
              { label: 'Behavioral & Fit', val: interview.behavioral_score, col: '#EC4899' }
            ].map((score, i) => (
              <div key={i} className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>{score.label}</span>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: score.col, marginTop: '8px' }}>
                  {score.val ? `${Math.round(score.val)}%` : 'N/A'}
                </h2>
              </div>
            ))}
          </div>
        </div>

        <div className="grid-cols-2" style={{ marginBottom: '32px' }}>
          {/* Left: Summary and details */}
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC', marginBottom: '8px' }}>Executive Summary</h3>
              <p style={{ color: '#E2E8F0', fontSize: '14px', lineHeight: '1.6' }}>
                {interview.summary || 'Summary not compiled.'}
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC', marginBottom: '8px' }}>Key Strengths</h3>
              <p style={{ color: '#E2E8F0', fontSize: '13px', lineHeight: '1.5' }}>
                {interview.strengths || 'Strengths details not parsed.'}
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC', marginBottom: '8px' }}>Areas to Improve</h3>
              <p style={{ color: '#E2E8F0', fontSize: '13px', lineHeight: '1.5' }}>
                {interview.weaknesses || 'Weaknesses details not parsed.'}
              </p>
            </div>
          </div>

          {/* Right: Custom Learning Roadmap */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} color="#8B5CF6" />
              Custom Learning Roadmap
            </h3>

            {roadmapData.roadmap && roadmapData.roadmap.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {roadmapData.roadmap.map((step, idx) => (
                  <div 
                    key={idx}
                    style={{
                      padding: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px'
                    }}
                  >
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        backgroundColor: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '10px'
                      }}>{idx + 1}</span>
                      {step.step}
                    </h4>
                    
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>
                      <span>Resource: <b style={{ color: '#8B5CF6' }}>{step.resource}</b></span>
                    </div>

                    <div style={{ 
                      fontSize: '12px', color: '#E2E8F0', marginTop: '6px',
                      padding: '8px 12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px'
                    }}>
                      <b>Practice Question:</b> {step.practice_question}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748B', fontSize: '13px' }}>
                Custom learning steps not generated.
              </p>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .scores-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 500px) {
          .scores-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InterviewReport;
