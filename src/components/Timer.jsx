import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

const Timer = ({ initialMinutes = 5, onTimeUp }) => {
  const [seconds, setSeconds] = useState(initialMinutes * 60);

  useEffect(() => {
    // Reset timer when initialMinutes changes
    setSeconds(initialMinutes * 60);
  }, [initialMinutes]);

  useEffect(() => {
    if (seconds <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onTimeUp]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const isLowTime = seconds < 60;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 14px',
      backgroundColor: isLowTime ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      border: `1px solid ${isLowTime ? '#EF4444' : 'rgba(255, 255, 255, 0.08)'}`,
      color: isLowTime ? '#EF4444' : '#F8FAFC',
      fontSize: '14px',
      fontWeight: 700,
      transition: 'all 0.3s'
    }}>
      <Clock size={16} className={isLowTime ? 'animate-pulse' : ''} />
      <span>{formatTime(seconds)}</span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default Timer;
