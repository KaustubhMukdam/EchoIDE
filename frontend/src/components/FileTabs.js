// frontend/src/components/FileTabs.js
import React from 'react';
import './FileTabs.css';

const FileTabs = ({ openFiles, activeFileId, onTabClick, onTabClose, onNewTab }) => {
  const getFileIcon = (file) => {
    if (!file.name) return '📄';
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    const iconMap = {
      'js': '🟨',
      'jsx': '⚛️',
      'ts': '🔷',
      'tsx': '⚛️',
      'py': '🐍',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'cs': '🔵',
      'php': '🐘',
      'go': '🐹',
      'rs': '🦀',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'md': '📝',
      'txt': '📄'
    };
    
    return iconMap[extension] || '📄';
  };

  const handleTabClose = (e, fileId) => {
    e.stopPropagation();
    onTabClose(fileId);
  };

  return (
    <div className="file-tabs">
      <div className="tabs-container">
        {openFiles.map(file => (
          <div
            key={file.id}
            className={`tab ${activeFileId === file.id ? 'active' : ''} ${file.modified ? 'modified' : ''}`}
            onClick={() => onTabClick(file.id)}
            title={file.path || file.name}
          >
            <span className="tab-icon">{getFileIcon(file)}</span>
            <span className="tab-name">{file.name || 'untitled'}</span>
            {file.modified && <span className="modified-indicator">●</span>}
            <button
              className="tab-close"
              onClick={(e) => handleTabClose(e, file.id)}
              title="Close file"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      
      <div className="tabs-actions">
        <button
          className="new-tab-btn"
          onClick={onNewTab}
          title="New File"
        >
          ➕
        </button>
      </div>
    </div>
  );
};

export default FileTabs;
