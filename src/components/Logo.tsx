import React from 'react';
import LanguageSelector from './LanguageSelector';

const Logo: React.FC = () => {
  return (
    <div className="logo">
      <div className="logo-container">
        <img 
          src="/carbon-hub-logo.png" 
          alt="Carbon Hub Logo" 
          width={75} 
          height={75}
          className="logo-image"
        />
      </div>
      <LanguageSelector />
    </div>
  );
};

export default Logo; 