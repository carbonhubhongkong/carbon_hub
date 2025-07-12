import React from 'react';

interface StepperProps {
  currentStage: number;
  onStageClick: (stage: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ currentStage, onStageClick }) => {
  const stages = [
    { id: 1, title: 'Input Emission Factors', description: 'Add emission factor data' },
    { id: 2, title: 'Reporting Activity Data', description: 'Enter activity information' },
    { id: 3, title: 'Report', description: 'View and export reports' }
  ];

  return (
    <div className="stepper">
      <div className="stepper-container">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <div 
              className={`stepper-step ${currentStage === stage.id ? 'active' : ''} ${currentStage > stage.id ? 'completed' : ''}`}
              onClick={() => onStageClick(stage.id)}
            >
              <div className="stepper-circle">
                {currentStage > stage.id ? (
                  <span className="checkmark">✓</span>
                ) : (
                  <span className="step-number">{stage.id}</span>
                )}
              </div>
              <div className="stepper-content">
                <h3 className="stepper-title">{stage.title}</h3>
                <p className="stepper-description">{stage.description}</p>
              </div>
            </div>
            {index < stages.length - 1 && (
              <div className={`stepper-line ${currentStage > stage.id ? 'completed' : ''}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Stepper; 