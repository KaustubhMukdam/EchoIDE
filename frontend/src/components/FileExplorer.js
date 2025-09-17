// frontend/src/components/FileExplorer.js - Updated with custom dialogs
import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import InputDialog from './InputDialog';
import './FileExplorer.css';

const FileExplorer = ({ onFileSelect, currentPath = '.', onWorkspaceChange }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set([currentPath]));
  const [pathHistory, setPathHistory] = useState([currentPath]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Dialog states
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath]);

  const loadFiles = async (path) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiService.listFiles(path);
      setFiles(response.files || []);
    } catch (err) {
      setError(`Error loading files: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const navigateToPath = (newPath) => {
    if (newPath !== pathHistory[currentIndex]) {
      const newHistory = pathHistory.slice(0, currentIndex + 1);
      newHistory.push(newPath);
      setPathHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
    }
    
    if (onWorkspaceChange) {
      onWorkspaceChange(newPath);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      if (onWorkspaceChange) {
        onWorkspaceChange(pathHistory[newIndex]);
      }
    }
  };

  const goForward = () => {
    if (currentIndex < pathHistory.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      if (onWorkspaceChange) {
        onWorkspaceChange(pathHistory[newIndex]);
      }
    }
  };

  const goUp = () => {
    const parentPath = currentPath.split(/[/\\]/).slice(0, -1).join('/') || '/';
    navigateToPath(parentPath);
  };

  const selectWorkspaceFolder = async () => {
    if (window.electronAPI) {
      try {
        const folderPath = await window.electronAPI.openFolderDialog();
        if (folderPath) {
          navigateToPath(folderPath);
        }
      } catch (error) {
        console.error('Error selecting folder:', error);
        setShowWorkspaceDialog(true);
      }
    } else {
      setShowWorkspaceDialog(true);
    }
  };

  const handleWorkspacePathSubmit = (path) => {
    setShowWorkspaceDialog(false);
    if (path && path !== currentPath) {
      navigateToPath(path);
    }
  };

  const getLanguageFromExtension = (ext) => {
    const extensionMap = {
      '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript',
      '.py': 'python', '.java': 'java', '.cpp': 'cpp', '.c': 'cpp', '.cc': 'cpp',
      '.cxx': 'cpp', '.cs': 'csharp', '.php': 'php', '.go': 'go', '.rs': 'rust',
      '.html': 'html', '.htm': 'html', '.css': 'css', '.scss': 'scss', '.sass': 'sass',
      '.json': 'json', '.md': 'markdown', '.rb': 'ruby', '.sh': 'shell', '.bash': 'shell',
      '.yml': 'yaml', '.yaml': 'yaml', '.xml': 'xml', '.kt': 'kotlin', '.swift': 'swift',
      '.dart': 'dart', '.r': 'r', '.scala': 'scala', '.sql': 'sql'
    };
    return extensionMap[ext] || 'plaintext';
  };

  const handleFileClick = async (file) => {
    if (file.is_directory) {
      navigateToPath(file.path);
    } else if (file.is_text_file) {
      try {
        const fileContent = await apiService.readFile(file.path);
        const fileData = {
          path: file.path,
          name: file.name,
          content: fileContent.content,
          language: getLanguageFromExtension(file.extension)
        };
        console.log(`Opening file: ${file.name} with language: ${fileData.language}`);
        onFileSelect(fileData);
      } catch (err) {
        console.error('Error reading file:', err);
        alert(`Error opening file: ${err.message}`);
      }
    }
  };

  const getFileIcon = (file) => {
    if (file.is_directory) return '📁';
    
    const iconMap = {
      '.js': '🟨', '.jsx': '⚛️', '.ts': '🔷', '.tsx': '⚛️', '.py': '🐍',
      '.java': '☕', '.cpp': '⚙️', '.c': '⚙️', '.cs': '🔵', '.php': '🐘',
      '.go': '🐹', '.rs': '🦀', '.html': '🌐', '.css': '🎨', '.json': '📋',
      '.md': '📝', '.txt': '📄', '.gitignore': '📄', '.env': '⚙️',
      '.yml': '📋', '.yaml': '📋', '.xml': '📄', '.sql': '🗄️',
      '.rb': '💎', '.sh': '🐚', '.bash': '🐚'
    };
    
    return iconMap[file.extension] || '📄';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const handleNewFileSubmit = async (fileName) => {
    setShowNewFileDialog(false);
    if (!fileName) return;
    
    // Detect language from extension
    const extension = '.' + fileName.split('.').pop()?.toLowerCase();
    const language = getLanguageFromExtension(extension);
    
    // Get template content based on file extension
    const getTemplate = (lang) => {
      const templates = {
        'python': '# Python file\nprint("Hello, World!")',
        'javascript': '// JavaScript file\nconsole.log("Hello, World!");',
        'html': '<!DOCTYPE html>\n<html>\n<head>\n    <title>New Page</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>',
        'css': '/* CSS file */\nbody {\n    margin: 0;\n    padding: 20px;\n}',
        'java': 'public class ' + fileName.replace('.java', '') + ' {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
        'cpp': '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}'
      };
      return templates[lang] || `// ${fileName}\n`;
    };
    
    try {
      const template = getTemplate(language);
      const filePath = currentPath === '.' ? fileName : `${currentPath}/${fileName}`;
      await apiService.writeFile(filePath, template);
      loadFiles(currentPath);
      
      // Auto-open the new file
      const fileData = {
        path: filePath,
        name: fileName,
        content: template,
        language: language
      };
      onFileSelect(fileData);
    } catch (err) {
      alert(`Error creating file: ${err.message}`);
    }
  };

  const handleNewFolderSubmit = async (folderName) => {
    setShowNewFolderDialog(false);
    if (!folderName) return;
    
    try {
      const folderPath = currentPath === '.' ? folderName : `${currentPath}/${folderName}`;
      await apiService.createDirectory(folderPath);
      loadFiles(currentPath);
    } catch (err) {
      alert(`Error creating folder: ${err.message}`);
    }
  };

  const refreshFiles = () => {
    loadFiles(currentPath);
  };

  if (loading) {
    return (
      <div className="file-explorer">
        <div className="loading">Loading files...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-explorer">
        <div className="error">{error}</div>
        <button onClick={refreshFiles} className="refresh-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <h3>Explorer</h3>
        <div className="explorer-actions">
          <button onClick={selectWorkspaceFolder} className="action-btn" title="Open Folder">
            📁+
          </button>
          <button onClick={() => setShowNewFileDialog(true)} className="action-btn" title="New File">
            📄+
          </button>
          <button onClick={() => setShowNewFolderDialog(true)} className="action-btn" title="New Folder">
            📁➕
          </button>
          <button onClick={refreshFiles} className="action-btn" title="Refresh">
            🔄
          </button>
        </div>
      </div>

      <div className="navigation-bar">
        <button 
          onClick={goBack} 
          disabled={currentIndex === 0}
          className="nav-btn"
          title="Back"
        >
          ⬅️
        </button>
        <button 
          onClick={goForward} 
          disabled={currentIndex >= pathHistory.length - 1}
          className="nav-btn"
          title="Forward"
        >
          ➡️
        </button>
        <button 
          onClick={goUp} 
          className="nav-btn"
          title="Up"
        >
          ⬆️
        </button>
      </div>

      <div className="current-path">
        📁 {currentPath}
      </div>

      <div className="files-list">
        {files.length === 0 ? (
          <div className="empty-folder">No files found</div>
        ) : (
          files.map((file, index) => (
            <div
              key={index}
              className={`file-item ${file.is_directory ? 'directory' : 'file'} ${
                file.is_text_file || file.is_directory ? 'clickable' : ''
              }`}
              onClick={() => handleFileClick(file)}
              title={`${file.path} ${file.is_text_file ? `(${getLanguageFromExtension(file.extension)})` : ''}`}
            >
              <div className="file-info">
                <span className="file-icon">{getFileIcon(file)}</span>
                <span className="file-name">{file.name}</span>
                {file.is_text_file && (
                  <span className="file-language">
                    {getLanguageFromExtension(file.extension)}
                  </span>
                )}
              </div>
              <div className="file-meta">
                {!file.is_directory && (
                  <span className="file-size">{formatFileSize(file.size)}</span>
                )}
                <span className="file-date">{formatDate(file.modified)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Dialogs */}
      <InputDialog
        isOpen={showNewFileDialog}
        title="Create New File"
        placeholder="Enter file name (e.g., main.py, app.js, index.html)"
        onConfirm={handleNewFileSubmit}
        onCancel={() => setShowNewFileDialog(false)}
      />

      <InputDialog
        isOpen={showNewFolderDialog}
        title="Create New Folder"
        placeholder="Enter folder name"
        onConfirm={handleNewFolderSubmit}
        onCancel={() => setShowNewFolderDialog(false)}
      />

      <InputDialog
        isOpen={showWorkspaceDialog}
        title="Open Workspace Folder"
        placeholder="Enter folder path"
        defaultValue={currentPath}
        onConfirm={handleWorkspacePathSubmit}
        onCancel={() => setShowWorkspaceDialog(false)}
      />
    </div>
  );
};

export default FileExplorer;
