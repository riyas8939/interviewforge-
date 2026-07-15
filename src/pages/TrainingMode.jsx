import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { interviewAPI, trainingAPI } from '../services/api';
import {
  Brain, Lightbulb, BookOpen, ChevronRight, ChevronLeft,
  CheckCircle, XCircle, BarChart2, RefreshCw, ExternalLink,
  Eye, EyeOff, Trophy, Target, Zap, AlertCircle, ArrowRight,
  Layers, Code2, Calculator, MessageSquare
} from 'lucide-react';

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  bg:       '#F9FAFB',
  surface:  '#FFFFFF',
  card:     '#F3F4F6',
  border:   'rgba(239, 68, 68, 0.08)',
  accent1:  '#EF4444',   // Red
  accent2:  '#DC2626',   // Crimson Red
  accent3:  '#10B981',   // Semantic Green
  warn:     '#F59E0B',
  danger:   '#EF4444',
  text:     '#111827',   // Slate Black
  muted:    '#4B5563',   // Slate Grey
};

const CATEGORY_ICONS = {
  Technical:     <Layers size={16} />,
  Coding:        <Code2  size={16} />,
  Reasoning:     <Brain  size={16} />,
  Aptitude:      <Calculator size={16} />,
  Behavioral:    <MessageSquare size={16} />,
  Communication: <MessageSquare size={16} />,
  Overall:       <Trophy size={16} />,
};
const CATEGORY_COLOR = {
  Technical:     '#EF4444', // Red
  Coding:        '#B91C1C', // Dark Red
  Reasoning:     '#DC2626', // Crimson Red
  Aptitude:      '#4B5563', // Slate Grey
  Behavioral:    '#10B981', // Green
  Communication: '#F87171', // Light Red
  Overall:       '#111827', // Slate Black
};

// ─── Tiny reusable components ─────────────────────────────────────────────────
const Badge = ({ label, color }) => (
  <span style={{
    background: `${color}22`, color, border: `1px solid ${color}44`,
    borderRadius: '6px', fontSize: '11px', fontWeight: 600,
    padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px'
  }}>
    {CATEGORY_ICONS[label] || null} {label}
  </span>
);

const Pill = ({ children, active, onClick, color = C.accent1 }) => (
  <button onClick={onClick} style={{
    background: active ? `${color}33` : 'transparent',
    color: active ? color : C.muted,
    border: `1px solid ${active ? color : C.border}`,
    borderRadius: '8px', padding: '6px 14px', fontSize: '13px',
    cursor: 'pointer', transition: 'all .2s', fontWeight: active ? 600 : 400,
  }}>{children}</button>
);

const ProgressBar = ({ pct, color = C.accent1 }) => (
  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
    <div style={{
      height: '100%', width: `${pct}%`, borderRadius: '99px',
      background: `linear-gradient(90deg, ${color}, ${color}99)`,
      transition: 'width 0.5s ease'
    }} />
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const TrainingMode = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading]   = useState(true);
  const [question, setQuestion] = useState(null);
  const [orderNum, setOrderNum] = useState(1);
  const [totalQ,   setTotalQ]   = useState(8);
  const [role,     setRole]     = useState('');
  const [finished, setFinished] = useState(false);

  // Answer state
  const [answer,    setAnswer]    = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback,  setFeedback]  = useState(null);
  const [evaluating,setEvaluating]= useState(false);

  // Hint system
  const [hintLevel,    setHintLevel]    = useState(0);
  const [hintData,     setHintData]     = useState(null);
  const [hintLoading,  setHintLoading]  = useState(false);
  const [showAnswer,   setShowAnswer]   = useState(false);

  // Explanation panel
  const [explanation,    setExplanation]    = useState(null);
  const [explLoading,    setExplLoading]    = useState(false);
  const [showExplPanel,  setShowExplPanel]  = useState(false);

  // Progress sidebar
  const [progress,     setProgress]     = useState(null);
  const [progressTab,  setProgressTab]  = useState('progress'); // progress | roadmap

  // ── load first question ──────────────────────────────────────────────────
  const loadQuestion = useCallback(async (num) => {
    setLoading(true);
    setAnswer(''); setSubmitted(false); setFeedback(null);
    setHintLevel(0); setHintData(null); setShowAnswer(false);
    setExplanation(null); setShowExplPanel(false);
    try {
      const res = await interviewAPI.generateQuestion(id, num);
      setQuestion(res.data);
      setOrderNum(num);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Fetch session meta to get role / totalQ
    interviewAPI.getHistory().then(res => {
      const session = (res.data || []).find(s => s.id === id);
      if (session) { setRole(session.role); setTotalQ(session.num_questions); }
    }).catch(() => {});
    loadQuestion(1);
  }, [id, loadQuestion]);

  // Refresh progress after answer submission
  const refreshProgress = useCallback(async () => {
    try {
      const res = await trainingAPI.getProgress(id);
      setProgress(res.data);
    } catch {}
  }, [id]);

  // ── submit answer ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setEvaluating(true);
    try {
      const res = await interviewAPI.submitAnswer(question.id, answer);
      const data = res.data;
      setFeedback(data);
      setSubmitted(true);
      refreshProgress();
    } catch (e) {
      alert('Evaluation failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setEvaluating(false);
    }
  };

  // ── get hint ─────────────────────────────────────────────────────────────
  const handleHint = async (level) => {
    if (hintLevel >= level) { setHintLevel(level); return; }
    setHintLoading(true);
    try {
      const res = await trainingAPI.getHint(id, question.id, level);
      setHintData(res.data);
      setHintLevel(level);
      if (level === 3) setShowAnswer(true);
    } catch (e) {
      console.error(e);
    } finally {
      setHintLoading(false);
    }
  };

  // ── get explanation ──────────────────────────────────────────────────────
  const handleExplanation = async () => {
    if (explanation) { setShowExplPanel(true); return; }
    setExplLoading(true);
    try {
      const res = await trainingAPI.getExplanation(id, question.id);
      setExplanation(res.data);
      setShowExplPanel(true);
    } catch {}
    finally { setExplLoading(false); }
  };

  // ── next question ────────────────────────────────────────────────────────
  const handleNext = () => {
    if (orderNum >= totalQ) { setFinished(true); return; }
    loadQuestion(orderNum + 1);
  };

  // ── category color from agent name ──────────────────────────────────────
  const catFromAgent = (agent = '') => {
    if (agent.includes('Coding'))        return 'Coding';
    if (agent.includes('Reasoning'))     return 'Reasoning';
    if (agent.includes('Aptitude'))      return 'Aptitude';
    if (agent.includes('Behavioral'))    return 'Behavioral';
    if (agent.includes('Communication')) return 'Communication';
    if (agent.includes('Hiring'))        return 'Overall';
    return 'Technical';
  };

  const scoreColor = (s) => s >= 80 ? C.accent3 : s >= 60 ? C.warn : C.danger;

  // ─── Finished screen ───────────────────────────────────────────────────
  if (finished) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-content" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{
            textAlign:'center', maxWidth:'520px',
            background: C.card, border:`1px solid ${C.border}`,
            borderRadius:'20px', padding:'52px 40px'
          }}>
            <div style={{ fontSize:'56px', marginBottom:'16px' }}>🎓</div>
            <h2 style={{ color: C.text, marginBottom:'8px', fontSize:'28px' }}>Training Complete!</h2>
            <p style={{ color: C.muted, marginBottom:'32px' }}>
              You've completed all {totalQ} training questions for <strong style={{ color: C.accent2 }}>{role}</strong>.
              Check your performance report below.
            </p>
            {progress && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'32px' }}>
                {[
                  { label:'Answered',   value:`${progress.answered}/${progress.total_questions}`, color: C.accent2 },
                  { label:'Correct',    value:`${progress.correct}`,  color: C.accent3 },
                  { label:'Completion', value:`${progress.completion_pct}%`, color: C.accent1 },
                  { label:'Weak Areas', value:`${progress.weak_areas.length}`, color: C.warn },
                ].map(m => (
                  <div key={m.label} style={{ background:C.surface, borderRadius:'12px', padding:'16px', border:`1px solid ${C.border}` }}>
                    <div style={{ color: m.color, fontSize:'24px', fontWeight:700 }}>{m.value}</div>
                    <div style={{ color: C.muted, fontSize:'12px', marginTop:'4px' }}>{m.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:'flex', gap:'12px', justifyContent:'center' }}>
              <button onClick={() => navigate(`/report/${id}`)} style={{
                background:`linear-gradient(135deg,${C.accent1},${C.accent2})`,
                color:'#fff', border:'none', borderRadius:'12px',
                padding:'12px 28px', fontWeight:600, cursor:'pointer', fontSize:'15px'
              }}>View Full Report</button>
              <button onClick={() => navigate('/setup')} style={{
                background:'transparent', color: C.muted, border:`1px solid ${C.border}`,
                borderRadius:'12px', padding:'12px 28px', cursor:'pointer', fontSize:'15px'
              }}>New Session</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading ───────────────────────────────────────────────────────────
  if (loading) return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{
            width:'48px', height:'48px', border:`3px solid ${C.accent1}22`,
            borderTopColor: C.accent1, borderRadius:'50%',
            animation:'spin 1s linear infinite', margin:'0 auto 16px'
          }} />
          <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
          <p style={{ color: C.muted }}>Loading question {orderNum}…</p>
        </div>
      </div>
    </div>
  );

  const cat   = catFromAgent(question?.interviewer_agent);
  const cColor = CATEGORY_COLOR[cat] || C.accent1;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content" style={{ padding:'24px', overflowY:'auto', background: C.bg }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{
              background:`linear-gradient(135deg,${C.accent1},${C.accent2})`,
              borderRadius:'10px', padding:'8px', display:'flex'
            }}>
              <Brain size={20} color="#fff" />
            </div>
            <div>
              <p style={{ color: C.muted, fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', margin:0 }}>
                Training Mode
              </p>
              <h2 style={{ color: C.text, margin:0, fontSize:'18px', fontWeight:700 }}>{role || 'Interview Training'}</h2>
            </div>
          </div>
          {/* Progress pill */}
          <div style={{
            background: C.card, border:`1px solid ${C.border}`, borderRadius:'10px',
            padding:'8px 16px', display:'flex', alignItems:'center', gap:'10px'
          }}>
            <Target size={14} color={C.accent2} />
            <span style={{ color: C.text, fontSize:'13px', fontWeight:600 }}>
              {orderNum} / {totalQ}
            </span>
            <div style={{ width:'80px' }}>
              <ProgressBar pct={(orderNum / totalQ) * 100} color={C.accent2} />
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'20px', alignItems:'start' }}>

          {/* ── LEFT: Question card ──────────────────────────────── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Question box */}
            <div style={{
              background: C.card, border:`1px solid ${cColor}44`,
              borderRadius:'16px', padding:'28px',
              boxShadow:`0 0 40px ${cColor}08`
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
                <Badge label={cat} color={cColor} />
                <Badge label={question?.difficulty || 'Medium'}
                  color={question?.difficulty === 'Hard' ? C.danger : question?.difficulty === 'Easy' ? C.accent3 : C.warn} />
                <span style={{ color: C.muted, fontSize:'12px', marginLeft:'auto' }}>
                  {question?.interviewer_agent}
                </span>
              </div>
              <p style={{ color: C.text, fontSize:'17px', lineHeight:'1.7', margin:0, fontWeight:500 }}>
                {question?.question_text}
              </p>

              {/* MCQ options if present */}
              {question?.options?.length > 0 && (
                <div style={{ marginTop:'20px', display:'flex', flexDirection:'column', gap:'10px' }}>
                  {question.options.map((opt, i) => (
                    <button key={i} onClick={() => setAnswer(opt)} style={{
                      background: answer === opt ? `${cColor}22` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${answer === opt ? cColor : C.border}`,
                      borderRadius:'10px', padding:'12px 16px', color: answer === opt ? cColor : C.text,
                      textAlign:'left', cursor:'pointer', fontSize:'14px', transition:'all .2s'
                    }}>
                      <strong style={{ marginRight:'8px' }}>{String.fromCharCode(65+i)}.</strong>{opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Hint system ──────────────────────────────────────── */}
            {!submitted && (
              <div style={{
                background: C.card, border:`1px solid ${C.border}`,
                borderRadius:'16px', padding:'20px'
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                  <Lightbulb size={16} color={C.warn} />
                  <span style={{ color: C.text, fontWeight:600, fontSize:'14px' }}>Hint System</span>
                  <span style={{ color: C.muted, fontSize:'12px' }}>— use wisely, costs learning points</span>
                </div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {[
                    { level:1, label:'🌫  Vague Hint', color:'#3B82F6' },
                    { level:2, label:'💡 Approach Hint', color: C.warn },
                    { level:3, label:'🔓 Reveal Answer', color: C.danger },
                  ].map(h => (
                    <button key={h.level} onClick={() => handleHint(h.level)} disabled={hintLoading}
                      style={{
                        background: hintLevel >= h.level ? `${h.color}22` : 'transparent',
                        border: `1px solid ${hintLevel >= h.level ? h.color : C.border}`,
                        color: hintLevel >= h.level ? h.color : C.muted,
                        borderRadius:'8px', padding:'7px 14px', fontSize:'13px',
                        cursor:'pointer', fontWeight: hintLevel >= h.level ? 600 : 400, transition:'all .2s'
                      }}>
                      {h.label}
                    </button>
                  ))}
                </div>

                {hintData && (
                  <div style={{
                    marginTop:'14px', background:'rgba(245,158,11,0.06)',
                    border:'1px solid rgba(245,158,11,0.2)', borderRadius:'10px', padding:'14px'
                  }}>
                    <p style={{ color: C.text, margin:0, fontSize:'14px', lineHeight:'1.6' }}>
                      {hintData.hint_text}
                    </p>
                    {hintData.explanation && (
                      <p style={{ color: C.muted, marginTop:'8px', fontSize:'13px', lineHeight:'1.6' }}>
                        {hintData.explanation}
                      </p>
                    )}
                    {showAnswer && hintData.correct_answer && (
                      <div style={{
                        marginTop:'12px', background:'rgba(239,68,68,0.08)',
                        border:'1px solid rgba(239,68,68,0.25)', borderRadius:'8px', padding:'12px'
                      }}>
                        <p style={{ color:'#F87171', fontSize:'12px', fontWeight:600, marginBottom:'4px' }}>
                          ✅ CORRECT ANSWER
                        </p>
                        <p style={{ color: C.text, margin:0, fontSize:'14px' }}>
                          {hintData.correct_answer}
                        </p>
                      </div>
                    )}
                    {hintData.resources?.length > 0 && (
                      <div style={{ marginTop:'10px', display:'flex', gap:'8px', flexWrap:'wrap' }}>
                        {hintData.resources.map((r,i) => (
                          <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{
                            color: C.accent2, fontSize:'12px', display:'flex', alignItems:'center', gap:'4px',
                            textDecoration:'none', background:'rgba(6,182,212,0.08)',
                            border:'1px solid rgba(6,182,212,0.2)', borderRadius:'6px', padding:'4px 10px'
                          }}>
                            <ExternalLink size={11} /> {r.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Answer area ──────────────────────────────────────── */}
            {!submitted ? (
              <div style={{
                background: C.card, border:`1px solid ${C.border}`,
                borderRadius:'16px', padding:'20px'
              }}>
                <label style={{ color: C.muted, fontSize:'12px', fontWeight:600, display:'block', marginBottom:'10px' }}>
                  YOUR ANSWER
                </label>
                {!question?.options?.length && (
                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="Type your answer here…"
                    rows={6}
                    style={{
                      width:'100%', background:'rgba(255,255,255,0.03)',
                      border:`1px solid ${C.border}`, borderRadius:'10px',
                      color: C.text, fontSize:'14px', lineHeight:'1.7',
                      padding:'14px', resize:'vertical', outline:'none', boxSizing:'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                )}
                <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'12px' }}>
                  <button onClick={handleExplanation} disabled={explLoading} style={{
                    background:'transparent', border:`1px solid ${C.accent2}44`,
                    color: C.accent2, borderRadius:'10px', padding:'10px 18px',
                    fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px'
                  }}>
                    <BookOpen size={14} />
                    {explLoading ? 'Loading…' : 'Learn Topic'}
                  </button>
                  <button onClick={handleSubmit} disabled={evaluating || !answer.trim()} style={{
                    background:`linear-gradient(135deg,${C.accent1},${C.accent2})`,
                    color:'#fff', border:'none', borderRadius:'10px',
                    padding:'10px 22px', fontWeight:600, fontSize:'14px',
                    cursor: evaluating || !answer.trim() ? 'not-allowed' : 'pointer',
                    opacity: evaluating || !answer.trim() ? 0.6 : 1,
                    display:'flex', alignItems:'center', gap:'6px'
                  }}>
                    {evaluating ? <><RefreshCw size={14} style={{ animation:'spin 1s linear infinite' }} /> Evaluating…</>
                      : <><Zap size={14} /> Submit Answer</>}
                  </button>
                </div>
              </div>
            ) : (
              /* ── Feedback card (Premium AI Coach) ──────────────────────────────────── */
              <div style={{
                background: C.card,
                border:`1px solid ${scoreColor((feedback?.overall_score || 0)*10)}44`,
                borderRadius:'16px', padding:'24px'
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                  {(feedback?.overall_score || 0) >= 7.0
                    ? <CheckCircle size={22} color={C.accent3} />
                    : <AlertCircle size={22} color={C.warn} />}
                  <h3 style={{ color: C.text, margin:0, fontSize:'16px' }}>AI Coach Assessment</h3>
                  <div style={{
                    marginLeft:'auto', background:`${scoreColor((feedback?.overall_score || 0)*10)}22`,
                    color: scoreColor((feedback?.overall_score || 0)*10),
                    borderRadius:'8px', padding:'4px 14px', fontWeight:700, fontSize:'20px', display:'flex', alignItems:'center', gap:'6px'
                  }}>
                    {feedback?.overall_score || 0}
                    <span style={{ fontSize:'12px', fontWeight:400, color:C.muted }}>/ 10</span>
                  </div>
                </div>
                {/* AI Summary */}
                <p style={{ color: C.text, fontSize:'14px', lineHeight:'1.6', marginBottom:'24px', opacity: 0.9 }}>
                  {feedback?.overall_feedback}
                </p>

                {/* Interviewer Impression */}
                {feedback?.interviewer_impression?.rating && (
                  <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${C.border}`, borderRadius:'12px', padding:'16px', marginBottom:'24px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                      <Target size={16} color={C.accent1} />
                      <span style={{ color: C.text, fontSize:'13px', fontWeight:600 }}>Interviewer Impression: <span style={{ color: C.accent1 }}>{feedback.interviewer_impression.rating}</span></span>
                    </div>
                    <p style={{ color: C.muted, margin:0, fontSize:'13px', lineHeight:'1.5' }}>{feedback.interviewer_impression.reason}</p>
                  </div>
                )}

                {/* Score Breakdown Grid */}
                <p style={{ color: C.muted, fontSize:'11px', fontWeight:600, marginBottom:'10px', textTransform:'uppercase', letterSpacing:'1px' }}>Score Breakdown</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px' }}>
                  {[
                    { label:'Technical',     value: feedback?.technical_depth || 0 },
                    { label:'Communication', value: feedback?.communication  || 0 },
                    { label:'Confidence',    value: feedback?.confidence || 0 },
                    { label:'Grammar',       value: feedback?.grammar_score || 0 },
                    { label:'Professional',  value: feedback?.professionalism_score || 0 },
                    { label:'Pacing',        value: feedback?.pacing_score || 0 },
                  ].map(m => (
                    <div key={m.label}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                        <span style={{ color: C.muted, fontSize:'12px' }}>{m.label}</span>
                        <span style={{ color: scoreColor(m.value * 10), fontSize:'12px', fontWeight:600 }}>{m.value}/10</span>
                      </div>
                      <ProgressBar pct={m.value * 10} color={scoreColor(m.value * 10)} />
                    </div>
                  ))}
                </div>

                {/* Performance Metrics */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'24px' }}>
                  <div style={{ background:'rgba(6, 182, 212, 0.05)', border:'1px solid rgba(6,182,212,0.2)', borderRadius:'10px', padding:'12px' }}>
                    <p style={{ color: C.accent2, fontSize:'11px', fontWeight:600, margin:'0 0 4px 0' }}>WORD COUNT</p>
                    <p style={{ color: C.text, margin:0, fontSize:'14px', fontWeight:500 }}>
                      {feedback?.actual_word_count || 0} words
                    </p>
                    <p style={{ color: C.muted, fontSize:'11px', margin:'4px 0 0 0' }}>
                      Ideal: {feedback?.ideal_word_count?.min || 100} - {feedback?.ideal_word_count?.max || 150} words
                    </p>
                  </div>
                  <div style={{ background:'rgba(245, 158, 11, 0.05)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'10px', padding:'12px' }}>
                    <p style={{ color: C.warn, fontSize:'11px', fontWeight:600, margin:'0 0 4px 0' }}>SPEAKING TIME</p>
                    <p style={{ color: C.text, margin:0, fontSize:'14px', fontWeight:500 }}>
                      ~{feedback?.actual_estimated_time || 0} sec
                    </p>
                    <p style={{ color: C.muted, fontSize:'11px', margin:'4px 0 0 0' }}>
                      Ideal: ~{feedback?.estimated_time_seconds || 60} sec {feedback?.filler_word_count > 0 && `(${feedback.filler_word_count} fillers)`}
                    </p>
                  </div>
                </div>

                {/* Checklists */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px' }}>
                  {feedback?.strengths?.length > 0 && (
                    <div style={{ background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'12px', padding:'14px' }}>
                      <p style={{ color:'#34D399', fontSize:'12px', fontWeight:600, margin:'0 0 8px 0', display:'flex', alignItems:'center', gap:'6px' }}><CheckCircle size={14}/> Strengths</p>
                      <ul style={{ margin:0, paddingLeft:'18px', color:C.text, fontSize:'13px', lineHeight:'1.5' }}>
                        {feedback.strengths.map((item, i) => <li key={i} style={{ marginBottom:'4px' }}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  {feedback?.weaknesses?.length > 0 && (
                    <div style={{ background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'12px', padding:'14px' }}>
                      <p style={{ color:'#F87171', fontSize:'12px', fontWeight:600, margin:'0 0 8px 0', display:'flex', alignItems:'center', gap:'6px' }}><XCircle size={14}/> Areas to Improve</p>
                      <ul style={{ margin:0, paddingLeft:'18px', color:C.text, fontSize:'13px', lineHeight:'1.5' }}>
                        {feedback.weaknesses.map((item, i) => <li key={i} style={{ marginBottom:'4px' }}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  {feedback?.missing_points?.length > 0 && (
                    <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${C.border}`, borderRadius:'12px', padding:'14px' }}>
                      <p style={{ color:C.muted, fontSize:'12px', fontWeight:600, margin:'0 0 8px 0', display:'flex', alignItems:'center', gap:'6px' }}><AlertCircle size={14}/> Missing Points</p>
                      <ul style={{ margin:0, paddingLeft:'18px', color:C.text, fontSize:'13px', lineHeight:'1.5' }}>
                        {feedback.missing_points.map((item, i) => <li key={i} style={{ marginBottom:'4px' }}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  {feedback?.priority_improvements?.length > 0 && (
                    <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'12px', padding:'14px' }}>
                      <p style={{ color:C.warn, fontSize:'12px', fontWeight:600, margin:'0 0 8px 0', display:'flex', alignItems:'center', gap:'6px' }}>🔥 Priority Improvements</p>
                      <ul style={{ margin:0, paddingLeft:'18px', color:C.text, fontSize:'13px', lineHeight:'1.5' }}>
                        {feedback.priority_improvements.map((item, i) => <li key={i} style={{ marginBottom:'4px' }}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                {/* How to Answer */}
                {feedback?.ideal_answer_structure && Object.keys(feedback.ideal_answer_structure).length > 0 && (
                  <div style={{ marginBottom:'24px' }}>
                    <p style={{ color: C.muted, fontSize:'11px', fontWeight:600, marginBottom:'10px', textTransform:'uppercase', letterSpacing:'1px' }}>
                      How to Answer: {feedback?.recommended_framework || 'Framework'}
                    </p>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {Object.entries(feedback.ideal_answer_structure).map(([step, desc]) => (
                        <div key={step} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${C.border}`, borderRadius:'8px', padding:'12px' }}>
                          <span style={{ color:C.accent1, fontWeight:600, fontSize:'12px', marginRight:'8px' }}>{step}:</span>
                          <span style={{ color:C.text, fontSize:'13px' }}>{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ideal Answer Example */}
                {feedback?.ideal_answer_example && (
                  <div style={{ background:'rgba(124,58,237,0.05)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:'12px', padding:'16px', marginBottom:'24px' }}>
                    <p style={{ color:C.accent1, fontSize:'11px', fontWeight:600, margin:'0 0 10px 0', display:'flex', alignItems:'center', gap:'6px' }}><Lightbulb size={14}/> IDEAL ANSWER EXAMPLE</p>
                    <p style={{ color:C.text, fontSize:'13px', lineHeight:'1.6', margin:0, fontStyle:'italic' }}>
                      "{feedback.ideal_answer_example}"
                    </p>
                  </div>
                )}

                {/* Tips */}
                {feedback?.tips?.length > 0 && (
                  <div style={{ marginBottom:'24px' }}>
                    <p style={{ color: C.muted, fontSize:'11px', fontWeight:600, marginBottom:'10px', textTransform:'uppercase', letterSpacing:'1px' }}>Tips for Next Time</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                      {feedback.tips.map((tip, i) => (
                        <span key={i} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, borderRadius:'100px', padding:'6px 14px', fontSize:'12px', color:C.text }}>
                          💡 {tip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up Question */}
                {feedback?.follow_up_question && (
                  <div style={{ background:C.surface, border:`1px solid ${C.accent2}44`, borderLeft:`4px solid ${C.accent2}`, borderRadius:'8px', padding:'16px', marginBottom:'24px' }}>
                    <p style={{ color:C.accent2, fontSize:'11px', fontWeight:600, margin:'0 0 8px 0', textTransform:'uppercase' }}>Follow-up Question</p>
                    <p style={{ color:C.text, fontSize:'14px', margin:0 }}>{feedback.follow_up_question}</p>
                  </div>
                )}

                <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px' }}>
                  <button onClick={handleExplanation} style={{
                    background:'transparent', border:`1px solid ${C.accent2}44`,
                    color: C.accent2, borderRadius:'10px', padding:'10px 18px',
                    fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px'
                  }}>
                    <BookOpen size={14} /> Topic Guide
                  </button>
                  <button onClick={handleNext} style={{
                    background:`linear-gradient(135deg,${C.accent1},${C.accent2})`,
                    color:'#fff', border:'none', borderRadius:'10px',
                    padding:'10px 22px', fontWeight:600, fontSize:'14px',
                    cursor:'pointer', display:'flex', alignItems:'center', gap:'6px'
                  }}>
                    {orderNum >= totalQ ? '🏁 Finish' : <>Next Question <ArrowRight size={14} /></>}
                  </button>
                </div>
              </div>
            )}

            {/* ── Explanation panel ─────────────────────────────────── */}
            {showExplPanel && explanation && (
              <div style={{
                background: C.card, border:`1px solid ${C.accent2}33`,
                borderRadius:'16px', padding:'24px'
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <BookOpen size={18} color={C.accent2} />
                    <h3 style={{ color: C.text, margin:0, fontSize:'16px' }}>
                      {explanation.topic || 'Concept Deep Dive'}
                    </h3>
                  </div>
                  <button onClick={() => setShowExplPanel(false)} style={{
                    background:'transparent', border:'none', color: C.muted, cursor:'pointer', fontSize:'18px'
                  }}>✕</button>
                </div>

                <p style={{ color: C.muted, fontSize:'14px', lineHeight:'1.7', marginBottom:'16px' }}>
                  {explanation.concept_overview}
                </p>

                {explanation.key_points?.length > 0 && (
                  <div style={{ marginBottom:'16px' }}>
                    <p style={{ color: C.accent2, fontSize:'12px', fontWeight:600, marginBottom:'8px' }}>KEY POINTS</p>
                    {explanation.key_points.map((pt, i) => (
                      <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'6px', alignItems:'start' }}>
                        <CheckCircle size={14} color={C.accent3} style={{ marginTop:'2px', flexShrink:0 }} />
                        <p style={{ color: C.text, fontSize:'13px', margin:0, lineHeight:'1.6' }}>{pt}</p>
                      </div>
                    ))}
                  </div>
                )}

                {explanation.example && (
                  <div style={{ background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:'10px', padding:'14px', marginBottom:'16px' }}>
                    <p style={{ color: C.accent1, fontSize:'12px', fontWeight:600, marginBottom:'6px' }}>💻 EXAMPLE</p>
                    <p style={{ color: C.text, fontSize:'13px', margin:0, lineHeight:'1.6' }}>{explanation.example}</p>
                  </div>
                )}

                {explanation.common_mistakes?.length > 0 && (
                  <div style={{ marginBottom:'16px' }}>
                    <p style={{ color: C.danger, fontSize:'12px', fontWeight:600, marginBottom:'8px' }}>⚠ COMMON MISTAKES</p>
                    {explanation.common_mistakes.map((m, i) => (
                      <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'6px', alignItems:'start' }}>
                        <XCircle size={14} color={C.danger} style={{ marginTop:'2px', flexShrink:0 }} />
                        <p style={{ color: C.muted, fontSize:'13px', margin:0 }}>{m}</p>
                      </div>
                    ))}
                  </div>
                )}

                {explanation.interview_tip && (
                  <div style={{ background:'rgba(6,182,212,0.07)', border:'1px solid rgba(6,182,212,0.2)', borderRadius:'10px', padding:'14px', marginBottom:'16px' }}>
                    <p style={{ color: C.accent2, fontSize:'12px', fontWeight:600, marginBottom:'6px' }}>🎯 INTERVIEW TIP</p>
                    <p style={{ color: C.text, fontSize:'13px', margin:0, lineHeight:'1.6' }}>{explanation.interview_tip}</p>
                  </div>
                )}

                {explanation.resources?.length > 0 && (
                  <div>
                    <p style={{ color: C.muted, fontSize:'12px', fontWeight:600, marginBottom:'8px' }}>RESOURCES</p>
                    <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                      {explanation.resources.map((r, i) => (
                        <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{
                          color: C.accent2, fontSize:'12px', display:'flex', alignItems:'center', gap:'4px',
                          textDecoration:'none', background:'rgba(6,182,212,0.08)',
                          border:'1px solid rgba(6,182,212,0.2)', borderRadius:'6px', padding:'5px 12px'
                        }}>
                          <ExternalLink size={11} /> {r.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Progress sidebar ──────────────────────────── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px', position:'sticky', top:'24px' }}>

            {/* Tab switcher */}
            <div style={{
              background: C.card, border:`1px solid ${C.border}`,
              borderRadius:'16px', padding:'16px'
            }}>
              <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
                <Pill active={progressTab==='progress'} onClick={() => { setProgressTab('progress'); refreshProgress(); }}>
                  📊 Progress
                </Pill>
                <Pill active={progressTab==='roadmap'} onClick={() => { setProgressTab('roadmap'); refreshProgress(); }}>
                  🗺 Roadmap
                </Pill>
              </div>

              {progressTab === 'progress' && (
                <div>
                  {progress ? (
                    <>
                      {/* Overall completion */}
                      <div style={{ marginBottom:'16px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                          <span style={{ color: C.muted, fontSize:'12px' }}>Completion</span>
                          <span style={{ color: C.accent2, fontSize:'12px', fontWeight:600 }}>
                            {progress.completion_pct}%
                          </span>
                        </div>
                        <ProgressBar pct={progress.completion_pct} color={C.accent2} />
                      </div>

                      {/* Stats row */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'16px' }}>
                        {[
                          { label:'Answered', value: progress.answered, color: C.accent2 },
                          { label:'Correct',  value: progress.correct,  color: C.accent3 },
                        ].map(m => (
                          <div key={m.label} style={{
                            background:'rgba(255,255,255,0.03)', borderRadius:'10px', padding:'12px',
                            border:`1px solid ${C.border}`, textAlign:'center'
                          }}>
                            <div style={{ color: m.color, fontSize:'22px', fontWeight:700 }}>{m.value}</div>
                            <div style={{ color: C.muted, fontSize:'11px' }}>{m.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Category scores */}
                      {Object.keys(progress.score_by_category).length > 0 && (
                        <div>
                          <p style={{ color: C.muted, fontSize:'11px', fontWeight:600, marginBottom:'10px' }}>BY CATEGORY</p>
                          {Object.entries(progress.score_by_category).map(([cat, score]) => (
                            <div key={cat} style={{ marginBottom:'10px' }}>
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                                <span style={{ color: C.text, fontSize:'12px', display:'flex', alignItems:'center', gap:'4px' }}>
                                  {CATEGORY_ICONS[cat]} {cat}
                                </span>
                                <span style={{ color: scoreColor(score), fontSize:'12px', fontWeight:600 }}>
                                  {score}
                                </span>
                              </div>
                              <ProgressBar pct={score} color={scoreColor(score)} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Weak / Strong */}
                      {progress.weak_areas.length > 0 && (
                        <div style={{ marginTop:'12px' }}>
                          <p style={{ color: C.danger, fontSize:'11px', fontWeight:600, marginBottom:'8px' }}>⚠ NEEDS FOCUS</p>
                          {progress.weak_areas.map(a => (
                            <div key={a} style={{
                              background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.15)',
                              borderRadius:'8px', padding:'6px 12px', marginBottom:'6px',
                              color:'#F87171', fontSize:'12px'
                            }}>{a}</div>
                          ))}
                        </div>
                      )}
                      {progress.strong_areas.length > 0 && (
                        <div style={{ marginTop:'12px' }}>
                          <p style={{ color: C.accent3, fontSize:'11px', fontWeight:600, marginBottom:'8px' }}>✅ STRONG AREAS</p>
                          {progress.strong_areas.map(a => (
                            <div key={a} style={{
                              background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.15)',
                              borderRadius:'8px', padding:'6px 12px', marginBottom:'6px',
                              color:'#34D399', fontSize:'12px'
                            }}>{a}</div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p style={{ color: C.muted, fontSize:'13px', textAlign:'center' }}>
                      Answer questions to see progress…
                    </p>
                  )}
                </div>
              )}

              {progressTab === 'roadmap' && (
                <div>
                  {progress?.recommended_topics?.length > 0 ? (
                    <>
                      <p style={{ color: C.muted, fontSize:'12px', marginBottom:'12px' }}>
                        Personalized study roadmap based on your weak areas:
                      </p>
                      {progress.recommended_topics.map((t, i) => (
                        <div key={i} style={{
                          display:'flex', gap:'10px', alignItems:'start',
                          background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.15)',
                          borderRadius:'10px', padding:'10px 12px', marginBottom:'8px'
                        }}>
                          <span style={{
                            background: C.accent1, color:'#fff', borderRadius:'50%',
                            width:'20px', height:'20px', display:'flex', alignItems:'center',
                            justifyContent:'center', fontSize:'11px', fontWeight:700, flexShrink:0
                          }}>{i + 1}</span>
                          <span style={{ color: C.text, fontSize:'13px', lineHeight:'1.5' }}>{t}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div style={{ textAlign:'center', padding:'24px 0' }}>
                      <Trophy size={32} color={C.accent3} style={{ marginBottom:'10px' }} />
                      <p style={{ color: C.text, fontSize:'14px', fontWeight:600 }}>Great progress!</p>
                      <p style={{ color: C.muted, fontSize:'13px' }}>
                        No weak areas detected yet. Keep answering!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick nav */}
            <div style={{
              background: C.card, border:`1px solid ${C.border}`,
              borderRadius:'16px', padding:'16px'
            }}>
              <p style={{ color: C.muted, fontSize:'11px', fontWeight:600, marginBottom:'10px' }}>NAVIGATION</p>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => orderNum > 1 && loadQuestion(orderNum - 1)}
                  disabled={orderNum <= 1}
                  style={{
                    flex:1, background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`,
                    color: orderNum <= 1 ? C.muted : C.text, borderRadius:'10px',
                    padding:'10px', cursor: orderNum <= 1 ? 'not-allowed' : 'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'13px'
                  }}>
                  <ChevronLeft size={14} /> Prev
                </button>
                <button onClick={handleNext}
                  style={{
                    flex:1, background:`${C.accent1}22`, border:`1px solid ${C.accent1}44`,
                    color: C.accent1, borderRadius:'10px',
                    padding:'10px', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'13px', fontWeight:600
                  }}>
                  {orderNum >= totalQ ? 'Finish' : 'Skip'} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingMode;
