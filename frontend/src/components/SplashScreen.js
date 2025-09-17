// frontend/src/components/SplashScreen.js - Enhanced Branding Version
import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing EchoIDE...');
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const steps = [
      { message: '🚀 Starting EchoIDE...', duration: 800 },
      { message: '🤖 Loading AI Models...', duration: 1000 },
      { message: '⚙️ Setting up Code Editor...', duration: 800 },
      { message: '🖥️ Initializing Terminal...', duration: 600 },
      { message: '🔗 Connecting to Backend...', duration: 700 },
      { message: '✨ Ready to Code!', duration: 500 }
    ];

    let stepIndex = 0;
    let currentProgress = 0;

    const runStep = () => {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex];
        setStatus(step.message);
        setCurrentStep(stepIndex + 1);
        
        const targetProgress = ((stepIndex + 1) / steps.length) * 100;
        
        const progressInterval = setInterval(() => {
          currentProgress += 2;
          setProgress(Math.min(currentProgress, targetProgress));
          
          if (currentProgress >= targetProgress) {
            clearInterval(progressInterval);
            stepIndex++;
            
            if (stepIndex >= steps.length) {
              setTimeout(() => {
                onComplete();
              }, 500);
            } else {
              setTimeout(runStep, 200);
            }
          }
        }, 30);
      }
    };

    setTimeout(runStep, 300);
  }, [onComplete]);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo">
          <div className="logo-icon">
            <div className="logo-rocket">🚀</div>
            <div className="logo-ai-badge">AI</div>
          </div>
          <h1>EchoIDE</h1>
          <p className="tagline">AI-Powered Code Editor</p>
          <p className="version">Version 0.0.1</p>
        </div>
        
        <div className="splash-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="status-text">{status}</p>
          <p className="step-indicator">Step {currentStep} of 6</p>
        </div>
        
        <div className="splash-features">
          <div className="feature">✨ AI Code Completion</div>
          <div className="feature">🔍 Smart Code Analysis</div>
          <div className="feature">💬 Intelligent Chat Assistant</div>
          <div className="feature">🖥️ Integrated Terminal</div>
          <div className="feature">🚀 Real Code Execution</div>
          <div className="feature">🎨 Beautiful Dark Theme</div>
        </div>
        
        <div className="splash-footer">
          <p>Professional IDE • Built with ❤️</p>
          <p>Multi-language support • Real-time execution • Modern UI</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
