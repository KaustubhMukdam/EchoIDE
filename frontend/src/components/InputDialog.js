// frontend/src/components/InputDialog.js
import React, { useState, useEffect } from 'react';
import './InputDialog.css';

const InputDialog = ({ 
  isOpen, 
  title, 
  placeholder, 
  defaultValue = '', 
  onConfirm, 
  onCancel 
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
      setValue('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="input-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="dialog-content">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            autoFocus
            className="dialog-input"
          />
          
          <div className="dialog-buttons">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="confirm-btn" disabled={!value.trim()}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputDialog;
