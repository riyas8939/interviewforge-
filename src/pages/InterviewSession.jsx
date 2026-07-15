import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Timer from '../components/Timer';
import CodeEditor from '../components/CodeEditor';
import useVoice from '../hooks/useVoice';
import { interviewAPI, codingAPI } from '../services/api';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Cpu, 
  ChevronRight, 
  HelpCircle,
  BarChart2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const InterviewSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Voice Controls
  const { supported, listening, transcript, setTranscript, startListening, stopListening, speak } = useVoice();
  const [voiceSynthesizeEnabled, setVoiceSynthesizeEnabled] = useState(true);
  
  // Session details state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [orderNum, setOrderNum] = useState(1);
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [interviewRole, setInterviewRole] = useState('Software Engineer');
  const [interviewLanguage, setInterviewLanguage] = useState('Python');
  
  // Follow up state
  const [activeFollowUpQuestion, setActiveFollowUpQuestion] = useState(null);
  const [followUpAnswerText, setFollowUpAnswerText] = useState('');
  const [isAnsweringFollowUp, setIsAnsweringFollowUp] = useState(false);
  const [cachedNextQuestion, setCachedNextQuestion] = useState(null);
  
  // Final summary navigation
  const [isFinished, setIsFinished] = useState(false);

  // Cheating Detection State
  const [cheatingFlags, setCheatingFlags] = useState([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const questionStartTimeRef = useRef(Date.now());

  // Cheating Detection Event Listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const next = prev + 1;
          setCheatingFlags(flags => {
            const cleanFlags = flags.filter(f => !f.startsWith("Tab switched"));
            return [...cleanFlags, `Tab switched: ${next} time(s)`];
          });
          return next;
        });
      }
    };

    const handlePaste = () => {
      setCheatingFlags(flags => {
        if (!flags.includes("Copy-paste detected")) {
          return [...flags, "Copy-paste detected"];
        }
        return flags;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  // Auto-speak question on load
  useEffect(() => {
    if (currentQuestion && voiceSynthesizeEnabled) {
      speak(currentQuestion.question_text);
    }
  }, [currentQuestion, voiceSynthesizeEnabled]);

  // Load first question
  useEffect(() => {
    setLoading(true);
    questionStartTimeRef.current = Date.now();
    // Generate initial question
    interviewAPI.generateQuestion(id, 1)
      .then(res => {
        setCurrentQuestion(res.data);
        setOrderNum(1);
      })
      .catch(err => {
        console.error("Failed to load question 1", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleStartListening = () => {
    startListening();
  };

  const handleStopListening = () => {
    stopListening();
    if (isAnsweringFollowUp) {
      setFollowUpAnswerText(prev => prev + transcript);
    } else {
      setAnswerText(prev => prev + transcript);
    }
  };

  const handleTimeUp = () => {
    alert("Time is up! Submitting current draft answer.");
    handleSubmitAnswer();
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;
    
    const isCoding = currentQuestion.question_type.toLowerCase() === 'coding';
    
    // Smooth Transition: If code was already run and next question cached
    if (isCoding && cachedNextQuestion) {
      if (cachedNextQuestion === "finished") {
        setIsFinished(true);
        setCurrentQuestion(null);
      } else {
        setCurrentQuestion(cachedNextQuestion);
        setOrderNum(cachedNextQuestion.order_num);
        setCachedNextQuestion(null);
        setAnswerText('');
        // Reset timers and cheat flags for the next round
        setCheatingFlags([]);
        setTabSwitchCount(0);
        questionStartTimeRef.current = Date.now();
      }
      return;
    }

    if (!isCoding && !answerText.trim() && !isAnsweringFollowUp) {
      alert("Please provide an answer before submitting.");
      return;
    }

    if (isCoding && !answerText) {
      alert("Please run your code first to verify against test cases in the sandbox!");
      return;
    }

    setEvaluating(true);
    try {
      const timeSpentSec = (Date.now() - questionStartTimeRef.current) / 1000;
      const isFast = !isCoding && answerText.split(" ").length > 30 && timeSpentSec < 6;
      
      let activeFlags = [...cheatingFlags];
      if (isFast) {
        activeFlags.push("Suspiciously fast response time");
      }

      let payloadAnswer = isAnsweringFollowUp ? followUpAnswerText : answerText;
      if (activeFlags.length > 0) {
        payloadAnswer += `\n\n[SYSTEM AUDIT WARNING - POTENTIAL USER MALPRACTICE DETECTED: ${activeFlags.join(', ')}]`;
      }

      if (isAnsweringFollowUp) {
        // Evaluate the follow-up answer combined with the base answer
        const combinedText = `Base Answer: ${answerText}\nFollow-up Answer: ${payloadAnswer}`;
        const res = await interviewAPI.submitAnswer(currentQuestion.id, combinedText);
        handlePostEvaluation(res.data);
      } else {
        const res = await interviewAPI.submitAnswer(currentQuestion.id, payloadAnswer);
        
        // Check if evaluator returned an intelligent follow-up question
        if (res.data.follow_up_question && res.data.follow_up_question.trim()) {
          setActiveFollowUpQuestion(res.data.follow_up_question);
          setIsAnsweringFollowUp(true);
          // Speak the follow up question
          if (voiceSynthesizeEnabled) {
            speak(res.data.follow_up_question);
          }
          setEvaluating(false);
          return;
        }
        
        handlePostEvaluation(res.data);
      }
    } catch (err) {
      alert("Evaluation failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setEvaluating(false);
    }
  };

  const handlePostEvaluation = (data) => {
    // Reset answers and cheat monitors for next question
    setAnswerText('');
    setFollowUpAnswerText('');
    setActiveFollowUpQuestion(null);
    setIsAnsweringFollowUp(false);
    setCheatingFlags([]);
    setTabSwitchCount(0);
    questionStartTimeRef.current = Date.now();
    
    if (data.next_question) {
      setCurrentQuestion(data.next_question);
      setOrderNum(data.next_question.order_num);
    } else {
      setIsFinished(true);
      setCurrentQuestion(null);
    }
  };

  const handleCodingSuccess = (result) => {
    // Monaco editor callback updates local answer buffer
    setAnswerText("[CODE EXECUTED AND SUBMITTED]");
    setCachedNextQuestion(result.next_question || "finished");
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh',
        backgroundColor: '#030712', color: '#F3F4F6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid rgba(6, 182, 212, 0.2)',
            borderTopColor: '#06B6D4', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p>Agent Panel generating question details...</p>
        </div>
      </div>
    );
  }

  const isCodingQuestion = currentQuestion?.question_type.toLowerCase() === 'coding';

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Session header controls */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '24px'
        }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Interview Session Workspace
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
              {isFinished ? 'Interview Completed' : `Round ${orderNum}: ${currentQuestion?.interviewer_agent}`}
            </h2>
          </div>

          {!isFinished && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Voice Synthesizer Toggle */}
              <button
                onClick={() => setVoiceSynthesizeEnabled(!voiceSynthesizeEnabled)}
                style={{
                  padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)', color: '#94A3B8', cursor: 'pointer'
                }}
                title={voiceSynthesizeEnabled ? "Disable AI speech" : "Enable AI speech"}
              >
                {voiceSynthesizeEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              <Timer initialMinutes={10} onTimeUp={handleTimeUp} />
            </div>
          )}
        </div>

        {/* Finished workspace view */}
        {isFinished && (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
            <Sparkles size={48} color="#10B981" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#F8FAFC' }}>All Agent Rounds Complete!</h2>
            <p style={{ color: '#94A3B8', fontSize: '15px', marginTop: '8px', marginBottom: '32px' }}>
              The multi-agent panel has finished evaluating your code submissions, communication style, technical depth, and behavior logic. The final hiring report is ready.
            </p>
            <button 
              onClick={() => navigate(`/report/${id}`)}
              className="btn-primary"
              style={{ padding: '14px 28px', fontSize: '15px' }}
            >
              <BarChart2 size={18} />
              View Evaluation Report
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Question Panel Workspace */}
        {currentQuestion && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isCodingQuestion ? '1fr 1.2fr' : '1fr',
            gap: '24px',
            flex: 1
          }}>
            {/* Left side: AI Agent Question Prompt */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#06B6D4'
                  }}>
                    <Cpu size={16} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                      {currentQuestion.interviewer_agent}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Active AI Interviewer</span>
                  </div>
                </div>

                <div style={{
                  padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '10px',
                  color: '#E2E8F0', fontSize: '15px', lineHeight: '1.6', flex: 1
                }}>
                  {currentQuestion.question_text}
                </div>

                {/* Follow up dialogue widget */}
                {activeFollowUpQuestion && (
                  <div style={{
                    padding: '16px', backgroundColor: 'rgba(139, 92, 246, 0.08)',
                    border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '10px',
                    color: '#E2E8F0', fontSize: '14px', marginTop: '10px'
                  }}>
                    <div style={{ color: '#8B5CF6', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Follow-up Question:
                    </div>
                    {activeFollowUpQuestion}
                  </div>
                )}
              </div>

              {/* Text Input Panel (Hidden during coding rounds unless answering follow-ups) */}
              {(!isCodingQuestion || isAnsweringFollowUp) && (
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">
                      {isAnsweringFollowUp ? 'Your Follow-up Answer' : 'Your Answer'}
                    </label>
                    
                    {supported && (
                      <button
                        onClick={listening ? handleStopListening : handleStartListening}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '6px 12px', border: 'none', borderRadius: '6px',
                          backgroundColor: listening ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: listening ? '#EF4444' : '#10B981', cursor: 'pointer',
                          fontSize: '12px', fontWeight: 600
                        }}
                      >
                        {listening ? <MicOff size={14} /> : <Mic size={14} />}
                        {listening ? 'Stop Recording' : 'Answer by Voice'}
                      </button>
                    )}
                  </div>

                  {currentQuestion.options && currentQuestion.options.length > 0 && !isAnsweringFollowUp ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '8px 0' }}>
                      {currentQuestion.options.map((opt, idx) => {
                        const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D
                        const isSelected = answerText.startsWith(optionLetter);
                        return (
                          <button
                            key={idx}
                            onClick={() => setAnswerText(`${optionLetter}. ${opt}`)}
                            className="glass-card"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '14px',
                              width: '100%',
                              padding: '16px 20px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              background: isSelected 
                                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))' 
                                : '#FFFFFF',
                              border: isSelected 
                                ? '1px solid rgba(239, 68, 68, 0.4)' 
                                : '1px solid rgba(0, 0, 0, 0.08)',
                              borderRadius: '12px',
                              transition: 'all 0.2s ease',
                              color: '#111827',
                            }}
                          >
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: isSelected ? '#EF4444' : 'rgba(0, 0, 0, 0.05)',
                              color: isSelected ? '#FFFFFF' : '#4B5563',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '13px',
                            }}>
                              {optionLetter}
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: isSelected ? 600 : 500 }}>
                              {opt}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <textarea
                      className="form-input"
                      rows="6"
                      placeholder={listening ? "Listening to speech input..." : "Type your technical details here..."}
                      value={isAnsweringFollowUp ? followUpAnswerText : answerText}
                      onChange={(e) => isAnsweringFollowUp ? setFollowUpAnswerText(e.target.value) : setAnswerText(e.target.value)}
                      style={{ resize: 'none', fontSize: '14px', lineHeight: '1.5' }}
                    />
                  )}

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={evaluating}
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                  >
                    <Send size={14} />
                    {evaluating ? 'AI Evaluating response...' : (isAnsweringFollowUp ? 'Submit Follow-up Response' : 'Submit Answer')}
                  </button>
                </div>
              )}
            </div>

            {/* Right side: Coding Workspace (Only visible for Coding questions) */}
            {isCodingQuestion && !isAnsweringFollowUp && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <CodeEditor
                  language={interviewLanguage || 'Python'}
                  questionId={currentQuestion.id}
                  onExecutionSuccess={handleCodingSuccess}
                />
                
                {/* Submit Coding round action */}
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={evaluating || !answerText}
                    className="btn-primary"
                    style={{ padding: '12px 30px' }}
                  >
                    {evaluating ? 'Submitting solution...' : 'Finalize Code & Proceed'}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewSession;
