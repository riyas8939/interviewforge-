import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { interviewAPI } from '../services/api';
import { Brain, Upload, FileText, BarChart, Cpu, CheckCircle2, Zap, Target, BookOpen, Layers } from 'lucide-react';

// ── palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:      '#F9FAFB',
  surface: '#FFFFFF',
  card:    '#F3F4F6',
  border:  'rgba(239, 68, 68, 0.08)',
  accent1: '#EF4444', // Red
  accent2: '#DC2626', // Crimson Red
  accent3: '#10B981', // Semantic Green
  text:    '#111827', // Slate Black
  muted:   '#4B5563', // Slate Grey
};

// ── tiny option chip ──────────────────────────────────────────────────────────
const Chip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      borderRadius: '10px',
      border: `1px solid ${active ? C.accent1 : C.border}`,
      background: active ? `${C.accent1}22` : 'rgba(255,255,255,0.03)',
      color: active ? '#C4B5FD' : C.muted,
      fontSize: '13px', fontWeight: active ? 600 : 400,
      cursor: 'pointer', transition: 'all 0.2s',
    }}
  >{label}</button>
);

const CompanyChip = ({ label, active, onClick, emoji }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 14px',
      borderRadius: '10px',
      border: `1px solid ${active ? C.accent2 : C.border}`,
      background: active ? `${C.accent2}18` : 'rgba(255,255,255,0.03)',
      color: active ? '#67E8F9' : C.muted,
      fontSize: '13px', fontWeight: active ? 600 : 400,
      cursor: 'pointer', transition: 'all 0.2s',
      display: 'flex', alignItems: 'center', gap: '6px',
    }}
  >{emoji} {label}</button>
);

// ── section header ────────────────────────────────────────────────────────────
const SectionTitle = ({ icon, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
    <div style={{
      background: `${C.accent1}22`, borderRadius: '8px',
      padding: '6px', display: 'flex',
    }}>{icon}</div>
    <span style={{ color: C.text, fontWeight: 700, fontSize: '15px' }}>{label}</span>
  </div>
);

// ── main ──────────────────────────────────────────────────────────────────────
const InterviewSetup = () => {
  const navigate = useNavigate();

  const [role,               setRole]               = useState('Software Engineer');
  const [companyStyle,       setCompanyStyle]       = useState('Google');
  const [experience,         setExperience]         = useState('Mid');
  const [difficulty,         setDifficulty]         = useState('Medium');
  const [programmingLanguage,setProgrammingLanguage] = useState('Python');
  const [numQuestions,       setNumQuestions]       = useState(5);

  const [resumeFile,  setResumeFile]  = useState(null);
  const [resumeText,  setResumeText]  = useState('');
  const [jdText,      setJdText]      = useState('');
  const [parsing,     setParsing]     = useState(false);
  const [matching,    setMatching]    = useState(false);
  const [parsedResume,setParsedResume]= useState(null);
  const [atsReport,   setAtsReport]   = useState(null);
  const [submitting,  setSubmitting]  = useState(false);

  // ── data arrays ─────────────────────────────────────────────────────────────
  const roles = [
    'AI Engineer','Software Engineer','Java Developer','Python Developer',
    'Frontend Developer','Backend Developer','Full Stack Developer',
    'Data Analyst','Data Scientist','DevOps Engineer','Cloud Engineer',
  ];
  const companies = [
    { label:'Google',    emoji:'🔵' },
    { label:'Amazon',    emoji:'🟠' },
    { label:'Microsoft', emoji:'🟦' },
    { label:'Meta',      emoji:'🟣' },
    { label:'Netflix',   emoji:'🔴' },
    { label:'OpenAI',    emoji:'⚫' },
    { label:'Startup',   emoji:'🚀' },
  ];
  const levels      = ['Entry','Mid','Senior','Lead'];
  const difficulties= ['Easy','Medium','Hard'];
  const languages   = ['Python','JavaScript','Java','C++','Go','TypeScript'];
  const qOptions    = [3, 5, 10, 15];

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeFile(file); setParsing(true);
    try {
      const res = await interviewAPI.parseResume(file);
      setParsedResume(res.data);
      setResumeText(res.data.text);
    } catch (err) {
      alert('Failed to parse PDF resume: ' + (err.response?.data?.detail || err.message));
    } finally { setParsing(false); }
  };

  const handleJdAnalyze = async () => {
    if (!resumeText) { alert('Upload your resume first.'); return; }
    if (!jdText.trim()) { alert('Paste a Job Description.'); return; }
    setMatching(true);
    try {
      const res = await interviewAPI.matchJd(resumeText, jdText);
      setAtsReport(res.data);
    } catch (err) {
      alert('ATS match failed: ' + (err.response?.data?.detail || err.message));
    } finally { setMatching(false); }
  };

  const handleStart = async () => {
    setSubmitting(true);
    try {
      const res = await interviewAPI.start({
        role,
        company_style: companyStyle,
        experience,
        difficulty,
        programming_language: programmingLanguage,
        num_questions: numQuestions,
        is_training_mode: true,   // ALWAYS training mode
        resume_text: resumeText || null,
        jd_text: jdText || null,
      });
      navigate(`/training/${res.data.id}`);
    } catch (err) {
      alert('Failed to start training session: ' + (err.response?.data?.detail || err.message));
    } finally { setSubmitting(false); }
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content" style={{ background: C.bg, overflowY: 'auto' }}>

        {/* ── page header ──────────────────────────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div style={{
              background: `linear-gradient(135deg,${C.accent1},${C.accent2})`,
              borderRadius: '12px', padding: '10px', display: 'flex',
              boxShadow: `0 0 24px ${C.accent1}44`
            }}>
              <Brain size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: C.text, margin: 0 }}>
                Training Session Setup
              </h1>
              <p style={{ color: C.muted, fontSize: '13px', margin: 0 }}>
                Configure your personalized AI training plan — hints, explanations, and progress tracking included.
              </p>
            </div>
          </div>

          {/* Feature badges */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
            {[
              { icon: '💡', label: '3-Level Hints' },
              { icon: '📚', label: 'Deep Explanations' },
              { icon: '📊', label: 'Live Progress' },
              { icon: '🗺️', label: 'Learning Roadmap' },
              { icon: '🏢', label: 'Company Questions' },
            ].map(f => (
              <div key={f.label} style={{
                background: `${C.accent1}12`,
                border: `1px solid ${C.accent1}25`,
                borderRadius: '20px', padding: '5px 14px',
                color: '#C4B5FD', fontSize: '12px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                {f.icon} {f.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>

          {/* ── LEFT CONFIG PANEL ─────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Role */}
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: '16px', padding: '24px'
            }}>
              <SectionTitle icon={<Target size={15} color={C.accent1} />} label="Target Role" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {roles.map(r => (
                  <Chip key={r} label={r} active={role === r} onClick={() => setRole(r)} />
                ))}
              </div>
            </div>

            {/* Company */}
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: '16px', padding: '24px'
            }}>
              <SectionTitle icon={<Layers size={15} color={C.accent2} />} label="Company Style" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {companies.map(c => (
                  <CompanyChip
                    key={c.label} label={c.label} emoji={c.emoji}
                    active={companyStyle === c.label}
                    onClick={() => setCompanyStyle(c.label)}
                  />
                ))}
              </div>
            </div>

            {/* Experience + Difficulty + Language */}
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: '16px', padding: '24px',
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px'
            }}>
              <div>
                <p style={{ color: C.muted, fontSize: '11px', fontWeight: 700, marginBottom: '10px', letterSpacing: '1px' }}>
                  EXPERIENCE
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {levels.map(l => (
                    <Chip key={l} label={l} active={experience === l} onClick={() => setExperience(l)} />
                  ))}
                </div>
              </div>
              <div>
                <p style={{ color: C.muted, fontSize: '11px', fontWeight: 700, marginBottom: '10px', letterSpacing: '1px' }}>
                  DIFFICULTY
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {difficulties.map(d => (
                    <Chip key={d} label={d} active={difficulty === d} onClick={() => setDifficulty(d)} />
                  ))}
                </div>
              </div>
              <div>
                <p style={{ color: C.muted, fontSize: '11px', fontWeight: 700, marginBottom: '10px', letterSpacing: '1px' }}>
                  LANGUAGE
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {languages.map(lang => (
                    <Chip key={lang} label={lang} active={programmingLanguage === lang} onClick={() => setProgrammingLanguage(lang)} />
                  ))}
                </div>
              </div>
            </div>

            {/* Number of questions */}
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: '16px', padding: '24px'
            }}>
              <SectionTitle icon={<BookOpen size={15} color={C.accent3} />} label="Number of Questions" />
              <div style={{ display: 'flex', gap: '12px' }}>
                {qOptions.map(q => (
                  <button
                    key={q}
                    onClick={() => setNumQuestions(q)}
                    style={{
                      flex: 1, padding: '16px', borderRadius: '12px',
                      border: `2px solid ${numQuestions === q ? C.accent3 : C.border}`,
                      background: numQuestions === q ? `${C.accent3}18` : 'rgba(255,255,255,0.03)',
                      color: numQuestions === q ? '#6EE7B7' : C.muted,
                      cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: '24px', fontWeight: 800, color: numQuestions === q ? C.accent3 : '#475569' }}>
                      {q}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>
                      {q === 3 ? 'Quick' : q === 5 ? 'Standard' : q === 10 ? 'Exhaustive' : 'Master'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ───────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>

            {/* Round types info card */}
            <div style={{
              background: `linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.08))`,
              border: `1px solid ${C.accent1}33`,
              borderRadius: '16px', padding: '20px'
            }}>
              <p style={{ color: '#C4B5FD', fontWeight: 700, fontSize: '13px', marginBottom: '14px' }}>
                🎓 TRAINING ROUNDS INCLUDED
              </p>
              {[
                { icon: '🔧', round: 'Technical',   desc: 'Concepts & System Design' },
                { icon: '🧩', round: 'Reasoning',   desc: 'Logic & Pattern Puzzles' },
                { icon: '🔢', round: 'Aptitude',    desc: 'Math & Probability' },
                { icon: '💻', round: 'Coding',      desc: 'Implementation Challenges' },
              ].map(r => (
                <div key={r.round} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 0',
                  borderBottom: `1px solid rgba(255,255,255,0.05)`
                }}>
                  <span style={{ fontSize: '18px' }}>{r.icon}</span>
                  <div>
                    <div style={{ color: C.text, fontSize: '13px', fontWeight: 600 }}>{r.round}</div>
                    <div style={{ color: C.muted, fontSize: '11px' }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resume Upload */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Upload size={15} color={C.accent2} />
                <span style={{ color: C.text, fontWeight: 700, fontSize: '14px' }}>Resume (Optional)</span>
              </div>
              <label style={{
                display: 'block',
                border: `2px dashed ${resumeFile ? C.accent3 : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px', padding: '20px', textAlign: 'center',
                cursor: 'pointer', background: resumeFile ? `${C.accent3}08` : 'transparent',
                transition: 'all 0.2s'
              }}>
                <input type="file" accept=".pdf" onChange={handleResumeUpload} style={{ display: 'none' }} />
                {parsing ? (
                  <p style={{ color: C.accent2, fontSize: '13px' }}>⏳ Parsing…</p>
                ) : resumeFile ? (
                  <div>
                    <CheckCircle2 size={22} color={C.accent3} style={{ margin: '0 auto 6px' }} />
                    <p style={{ color: C.accent3, fontSize: '12px', fontWeight: 600 }}>{resumeFile.name}</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={22} color={C.muted} style={{ margin: '0 auto 6px' }} />
                    <p style={{ color: C.muted, fontSize: '12px' }}>Click to upload PDF resume</p>
                  </div>
                )}
              </label>

              {parsedResume && (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ color: C.muted, fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>DETECTED SKILLS</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {parsedResume.skills.slice(0, 8).map((s, i) => (
                      <span key={i} style={{
                        background: `${C.accent2}14`, color: '#67E8F9',
                        border: `1px solid ${C.accent2}25`,
                        borderRadius: '6px', fontSize: '11px', padding: '3px 8px'
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* JD */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <FileText size={15} color={C.accent1} />
                <span style={{ color: C.text, fontWeight: 700, fontSize: '14px' }}>Job Description (Optional)</span>
              </div>
              <textarea
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                placeholder="Paste the job description here for ATS matching and contextual questions…"
                rows={4}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${C.border}`, borderRadius: '10px',
                  color: C.text, fontSize: '13px', padding: '12px',
                  resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
                }}
              />
              <button
                onClick={handleJdAnalyze}
                disabled={matching || parsing}
                style={{
                  width: '100%', marginTop: '10px', padding: '10px',
                  background: 'transparent',
                  border: `1px solid ${C.accent2}44`,
                  color: C.accent2, borderRadius: '10px',
                  fontSize: '13px', cursor: 'pointer', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <BarChart size={14} />
                {matching ? 'Analyzing…' : 'Analyze ATS Fit'}
              </button>

              {atsReport && (
                <div style={{
                  marginTop: '12px', background: `${C.accent1}0a`,
                  border: `1px solid ${C.accent1}22`, borderRadius: '10px', padding: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: C.muted, fontSize: '12px' }}>ATS Match</span>
                    <span style={{ color: C.accent1, fontWeight: 800, fontSize: '18px' }}>
                      {atsReport.ats_match_percentage}%
                    </span>
                  </div>
                  {atsReport.missing_technologies.length > 0 && (
                    <div>
                      <p style={{ color: C.muted, fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>MISSING SKILLS</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {atsReport.missing_technologies.map((t, i) => (
                          <span key={i} style={{
                            background: 'rgba(239,68,68,0.1)', color: '#F87171',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '6px', fontSize: '11px', padding: '3px 8px'
                          }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* START BUTTON */}
            <button
              onClick={handleStart}
              disabled={submitting}
              style={{
                width: '100%', padding: '18px',
                background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})`,
                border: 'none', borderRadius: '14px',
                color: '#fff', fontWeight: 800, fontSize: '16px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: `0 8px 32px ${C.accent1}44`,
                transition: 'all 0.2s',
              }}
            >
              {submitting ? (
                <>
                  <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Initializing…
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Start Training Session
                </>
              )}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* selected summary pill */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
              borderRadius: '12px', padding: '14px 16px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'
            }}>
              {[
                { label: 'Role',       value: role },
                { label: 'Company',    value: companyStyle },
                { label: 'Level',      value: experience },
                { label: 'Difficulty', value: difficulty },
                { label: 'Language',   value: programmingLanguage },
                { label: 'Questions',  value: numQuestions },
              ].map(s => (
                <div key={s.label}>
                  <span style={{ color: C.muted, fontSize: '10px', fontWeight: 700 }}>{s.label}: </span>
                  <span style={{ color: C.text, fontSize: '12px', fontWeight: 600 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;
