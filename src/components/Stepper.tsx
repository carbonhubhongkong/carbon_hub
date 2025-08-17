import React from 'react';
import { useTranslations } from 'next-intl';

interface StepperProps {
  currentStage: number;
  onStageClick: (stage: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ currentStage, onStageClick }) => {
  const t = useTranslations();
  
  const getStages = () => [
    { id: 1, title: t('navigation.stage1'), description: t('stage1.description') },
    { id: 2, title: t('navigation.stage2'), description: t('stage2.description') },
    { id: 3, title: t('navigation.stage3'), description: t('stage3.description') }
  ];

  const stages = getStages();

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