import React, { useState, useEffect } from 'react';
import './Timer.css';

interface TimerProps {
  duration: number; // in milliseconds
  startTime?: string;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ duration, startTime, onTimeUp }) => {
  const [remainingTime, setRemainingTime] = useState(duration);
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    if (!startTime) return;

    const start = new Date(startTime).getTime();
    const endTime = start + duration;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      
      setRemainingTime(remaining);

      // Warning when 5 minutes left
      setIsWarning(remaining <= 5 * 60 * 1000 && remaining > 60 * 1000);
      
      // Critical when 1 minute left
      setIsCritical(remaining <= 60 * 1000 && remaining > 0);

      if (remaining === 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, startTime, onTimeUp]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return ((duration - remainingTime) / duration) * 100;
  };

  const getTimerClass = (): string => {
    let className = 'timer-display';
    if (isCritical) className += ' critical';
    else if (isWarning) className += ' warning';
    return className;
  };

  return (
    <div className="timer-container">
      <div className="timer-label">Tempo Restante:</div>
      <div className={getTimerClass()}>
        {formatTime(remainingTime)}
      </div>
      
      <div className="timer-progress">
        <div 
          className="timer-progress-bar"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
      
      {isWarning && !isCritical && (
        <div className="timer-warning">
          ⚠️ Menos de 5 minutos restantes!
        </div>
      )}
      
      {isCritical && (
        <div className="timer-critical">
          🚨 Menos de 1 minuto restante!
        </div>
      )}
    </div>
  );
};

export default Timer;
