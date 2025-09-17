// frontend/src/components/SettingsPanel.js
import React, { useState, useEffect } from 'react';
import './SettingsPanel.css';

const SettingsPanel = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState({
    theme: 'vs-dark',
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'on',
    minimap: true,
    autoSave: false,
    defaultModel: 'phi3.5:3.8b',
    language: 'english',
    ...settings
  });

  const models = [
    'phi3.5:3.8b',
    'deepseek-coder:6.7b',
    'qwen2.5-coder:7b',
    'qwen2.5-coder:1.5b',
    'llama3:latest',
    'mistral:latest'
  ];

  const themes = [
    { value: 'vs-dark', label: 'Dark Theme' },
    { value: 'vs-light', label: 'Light Theme' },
    { value: 'hc-black', label: 'High Contrast' }
  ];

  useEffect(() => {
    setLocalSettings({ ...localSettings, ...settings });
  }, [settings]);

  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      theme: 'vs-dark',
      fontSize: 14,
      tabSize: 2,
      wordWrap: 'on',
      minimap: true,
      autoSave: false,
      defaultModel: 'phi3.5:3.8b',
      language: 'english'
    };
    setLocalSettings(defaultSettings);
    onSettingsChange(defaultSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h3>⚙️ Settings</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="settings-content">
          
          {/* Editor Settings */}
          <div className="settings-section">
            <h4>📝 Editor</h4>
            
            <div className="setting-item">
              <label>Theme</label>
              <select 
                value={localSettings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
              >
                {themes.map(theme => (
                  <option key={theme.value} value={theme.value}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-item">
              <label>Font Size</label>
              <input
                type="range"
                min="10"
                max="24"
                value={localSettings.fontSize}
                onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
              />
              <span className="setting-value">{localSettings.fontSize}px</span>
            </div>

            <div className="setting-item">
              <label>Tab Size</label>
              <input
                type="range"
                min="2"
                max="8"
                value={localSettings.tabSize}
                onChange={(e) => handleChange('tabSize', parseInt(e.target.value))}
              />
              <span className="setting-value">{localSettings.tabSize}</span>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.wordWrap === 'on'}
                  onChange={(e) => handleChange('wordWrap', e.target.checked ? 'on' : 'off')}
                />
                Word Wrap
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.minimap}
                  onChange={(e) => handleChange('minimap', e.target.checked)}
                />
                Show Minimap
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.autoSave}
                  onChange={(e) => handleChange('autoSave', e.target.checked)}
                />
                Auto Save
              </label>
            </div>
          </div>

          {/* AI Settings */}
          <div className="settings-section">
            <h4>🤖 AI Assistant</h4>
            
            <div className="setting-item">
              <label>Default Model</label>
              <select 
                value={localSettings.defaultModel}
                onChange={(e) => handleChange('defaultModel', e.target.value)}
              >
                {models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            <div className="setting-item">
              <label>Language</label>
              <select 
                value={localSettings.language}
                onChange={(e) => handleChange('language', e.target.value)}
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="chinese">Chinese</option>
                <option value="japanese">Japanese</option>
              </select>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="settings-section">
            <h4>⌨️ Keyboard Shortcuts</h4>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span className="shortcut-action">Save File</span>
                <span className="shortcut-keys">Ctrl+S</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-action">Code Completion</span>
                <span className="shortcut-keys">Ctrl+Space</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-action">Find in File</span>
                <span className="shortcut-keys">Ctrl+F</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-action">Duplicate Line</span>
                <span className="shortcut-keys">Ctrl+D</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-action">Delete Line</span>
                <span className="shortcut-keys">Ctrl+Shift+K</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-action">Move Line Up</span>
                <span className="shortcut-keys">Alt+↑</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-action">Move Line Down</span>
                <span className="shortcut-keys">Alt+↓</span>
              </div>
            </div>
          </div>

        </div>

        <div className="settings-footer">
          <button onClick={resetToDefaults} className="reset-btn">
            🔄 Reset to Defaults
          </button>
          <button onClick={onClose} className="save-btn">
            ✅ Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
