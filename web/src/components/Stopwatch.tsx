import React, { useState, useEffect } from 'react';
import './Stopwatch.css';

interface StopwatchProps {
  startTime?: string;
}

const Stopwatch: React.FC<StopwatchProps> = ({ startTime }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    const start = new Date(startTime).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - start;
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

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

  return (
    <div className="stopwatch-container">
      <div className="stopwatch-label">Tempo Decorrido:</div>
      <div className="stopwatch-display">
        {formatTime(elapsedTime)}
      </div>
      
      <div className="stopwatch-indicator">
        <div className="pulse-dot"></div>
        <span>Cronometrando...</span>
      </div>
    </div>
  );
};

export default Stopwatch;
