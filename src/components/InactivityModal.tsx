'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface InactivityModalProps {
  isOpen: boolean;
  onExtendSession: () => void;
  onClearData: () => void;
  timeRemaining: number;
}

const InactivityModal: React.FC<InactivityModalProps> = ({
  isOpen,
  onExtendSession,
  onClearData,
  timeRemaining
}) => {
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1000) {
          onClearData();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onClearData]);

  useEffect(() => {
    setCountdown(timeRemaining);
  }, [timeRemaining]);

  if (!isOpen) return null;

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    const totalTime = 10 * 60 * 1000; // 10 minutes
    return ((totalTime - countdown) / totalTime) * 100;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Session Timeout Warning</h2>
          <div className="countdown-container">
            <div className="countdown-timer">
              Time remaining: <span className="countdown-time">{formatTime(countdown)}</span>
            </div>
            <div className="countdown-progress">
              <div 
                className="countdown-progress-bar" 
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="modal-body">
          <div className="warning-icon">⚠️</div>
          <p className="modal-message">
            You've been inactive for 20 minutes. Your input data will be automatically deleted in{' '}
            <strong>{formatTime(countdown)}</strong> unless you choose to keep it longer.
          </p>
          
          <div className="modal-options">
            <p>What would you like to do?</p>
            <ul>
              <li><strong>Need more time:</strong> Keep your data and reset the timer</li>
              <li><strong>Clear all records:</strong> Delete all your input data now</li>
            </ul>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            onClick={onExtendSession}
            className="btn btn-primary modal-btn"
          >
            Need More Time
          </button>
          <button 
            onClick={onClearData}
            className="btn btn-secondary modal-btn"
          >
            Please Clear All Records
          </button>
        </div>

        <div className="modal-footer">
          <small>
            Note: Your input data is only kept for 20 minutes unless you choose to keep it longer. 
            All records will be deleted after 10 minutes of inactivity on this popup.
          </small>
        </div>
      </div>
    </div>
  );
};

export default InactivityModal; 