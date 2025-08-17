import React from 'react';
import LanguageSelector from './LanguageSelector';

const Logo: React.FC = () => {
  return (
    <div className="logo">
      <div className="logo-container">
        <img 
          src="/carbon-hub-logo-3.png" 
          alt="Carbon Hub Logo" 
          width={120} 
          height={75}
          className="logo-image"
        />
      </div>
      <LanguageSelector />
    </div>
  );
};

export default Logo; 