import React from 'react';
import LanguageSelector from './LanguageSelector';

const Logo: React.FC = () => {
  // Get base path for GitHub Pages
  const basePath = process.env.NODE_ENV === "production" ? "/carbon_hub" : "";
  
  return (
    <div className="logo">
      <div className="logo-container">
        <img 
          src={`${basePath}/carbon-hub-logo-3.png`}
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