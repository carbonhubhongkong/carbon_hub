'use client';

import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Logo from '@/components/Logo';
import Stepper from '@/components/Stepper';
import Stage1 from '@/components/Stage1';
import Stage2 from '@/components/Stage2';
import Stage3 from '@/components/Stage3';
import InactivityModal from '@/components/InactivityModal';
import SessionManager from '@/lib/sessionManager';

export default function Home() {
  const [currentStage, setCurrentStage] = useState(1);
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTimeRemaining, setModalTimeRemaining] = useState(0);

  useEffect(() => {
    // Initialize session manager
    const manager = new SessionManager();
    setSessionManager(manager);

    // Set up callbacks
    manager.setInactivityWarningCallback(() => {
      setIsModalOpen(true);
      setModalTimeRemaining(manager.getModalTimeRemaining());
    });

    manager.setDataCleanupCallback(async () => {
      try {
        const response = await fetch('/api/clear-all-data', {
          method: 'DELETE',
        });
        
        if (response.ok) {
          console.log('Data cleared successfully');
          // Refresh the page to reset all forms
          window.location.reload();
        } else {
          console.error('Failed to clear data');
        }
      } catch (error) {
        console.error('Error clearing data:', error);
      }
    });

    // Cleanup on unmount
    return () => {
      manager.destroy();
    };
  }, []);

  useEffect(() => {
    if (isModalOpen && sessionManager) {
      const interval = setInterval(() => {
        setModalTimeRemaining(sessionManager.getModalTimeRemaining());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isModalOpen, sessionManager]);

  const handleStageClick = (stage: number) => {
    setCurrentStage(stage);
  };

  const handleNext = () => {
    if (currentStage < 3) {
      setCurrentStage(currentStage + 1);
    }
  };

  const handleExtendSession = () => {
    if (sessionManager) {
      sessionManager.extendSession();
      setIsModalOpen(false);
    }
  };

  const handleClearData = async () => {
    if (sessionManager) {
      sessionManager.cleanupData();
      setIsModalOpen(false);
    }
  };

  const renderCurrentStage = () => {
    switch (currentStage) {
      case 1:
        return <Stage1 onNext={handleNext} />;
      case 2:
        return <Stage2 onNext={handleNext} />;
      case 3:
        return <Stage3 />;
      default:
        return <Stage1 onNext={handleNext} />;
    }
  };

  return (
    <div className="app">
      <Toaster position="top-right" />
      <div className="container">
        <Logo />
        <Stepper currentStage={currentStage} onStageClick={handleStageClick} />
        <main className="main-content">
          {renderCurrentStage()}
        </main>
        
        {/* Data Retention Notice */}
        <div className="data-retention-notice">
          <p>
            <strong>Note:</strong> Your input data is only kept for 20 minutes unless you choose to keep it longer. 
            All records will be deleted after 10 minutes of inactivity on the retention popup.
          </p>
        </div>
      </div>

      {/* Inactivity Modal */}
      <InactivityModal
        isOpen={isModalOpen}
        onExtendSession={handleExtendSession}
        onClearData={handleClearData}
        timeRemaining={modalTimeRemaining}
      />
    </div>
  );
}
