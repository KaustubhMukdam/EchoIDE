// frontend/src/App.js - Fixed Hook Structure
import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import CodeEditor from './components/CodeEditor';
import FileExplorer from './components/FileExplorer';
import FileTabs from './components/FileTabs';
import SettingsPanel from './components/SettingsPanel';
import SplashScreen from './components/SplashScreen';
import Terminal from './components/Terminal';
import ErrorBoundary from './components/ErrorBoundary';
import apiService from './services/api';
import './App.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState('.');
  const [settings, setSettings] = useState({
    theme: 'vs-dark',
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'on',
    minimap: true,
    autoSave: false,
    defaultModel: 'phi3.5:3.8b',
    language: 'english'
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('echoide-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...settings, ...parsedSettings });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('echoide-settings', JSON.stringify(settings));
  }, [settings]);

  // Keyboard shortcuts (separate useEffect)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + R - Run current file
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (getCurrentFile()) {
          setActiveTab('terminal');
          // Simulate running current file
          setTimeout(() => {
            if (window.terminalRef) {
              window.terminalRef.executeCommand('run');
            }
          }, 100);
        }
      }
      
      // F5 - Quick run
      if (e.key === 'F5') {
        e.preventDefault();
        handleQuickRun();
      }
      
      // Ctrl/Cmd + ` - Toggle terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setActiveTab(activeTab === 'terminal' ? 'editor' : 'terminal');
      }
      
      // Ctrl/Cmd + Shift + C - Toggle AI Chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setActiveTab('chat');
      }
      
      // Ctrl/Cmd + B - Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarVisible(!sidebarVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, sidebarVisible]); // Removed getCurrentFile from dependencies

  // Listen for Electron menu events (separate useEffect)
  useEffect(() => {
    // Check if we're in Electron
    if (window.electronAPI) {
      const handleMenuNewFile = () => handleNewTab();
      const handleMenuSaveFile = () => handleSaveCurrentFile();
      const handleMenuToggleSidebar = () => setSidebarVisible(!sidebarVisible);
      const handleMenuOpenAIChat = () => setActiveTab('chat');
      const handleMenuOpenTerminal = () => setActiveTab('terminal');
      
      const handleMenuOpenFile = async (event, filePath) => {
        if (filePath) {
          await openFileFromPath(filePath);
        } else {
          // Use dialog
          try {
            const selectedFile = await window.electronAPI.openFileDialog();
            if (selectedFile) {
              await openFileFromPath(selectedFile);
            }
          } catch (error) {
            console.error('Error opening file dialog:', error);
          }
        }
      };
      
      const handleMenuOpenFolder = async (event, folderPath) => {
        if (folderPath) {
          setCurrentWorkspace(folderPath);
        } else {
          // Use dialog
          try {
            const selectedFolder = await window.electronAPI.openFolderDialog();
            if (selectedFolder) {
              setCurrentWorkspace(selectedFolder);
            }
          } catch (error) {
            console.error('Error opening folder dialog:', error);
          }
        }
      };
      
      // Set up event listeners using the secure API
      window.electronAPI.onMenuAction(() => {
        // Handle general menu actions
      });
      
      window.electronAPI.onFileOpen(handleMenuOpenFile);
      window.electronAPI.onFolderOpen(handleMenuOpenFolder);
      
      // Cleanup function
      return () => {
        if (window.electronAPI.removeAllListeners) {
          window.electronAPI.removeAllListeners('menu-open-file');
          window.electronAPI.removeAllListeners('menu-open-folder');
        }
      };
    }
  }, [sidebarVisible]);

  const openFileFromPath = async (filePath) => {
    try {
      const fileContent = await apiService.readFile(filePath);
      const fileName = filePath.split(/[/\\]/).pop();
      const extension = '.' + fileName.split('.').pop().toLowerCase();
      
      const getLanguageFromExtension = (ext) => {
        const extensionMap = {
          '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript',
          '.ts': 'typescript', '.tsx': 'typescript',
          '.py': 'python', '.pyw': 'python',
          '.java': 'java',
          '.cpp': 'cpp', '.c': 'cpp', '.cc': 'cpp', '.cxx': 'cpp', '.h': 'cpp', '.hpp': 'cpp',
          '.cs': 'csharp',
          '.php': 'php', '.phtml': 'php',
          '.go': 'go',
          '.rs': 'rust',
          '.html': 'html', '.htm': 'html',
          '.css': 'css', '.scss': 'scss', '.sass': 'sass', '.less': 'less',
          '.json': 'json', '.jsonc': 'json',
          '.md': 'markdown', '.markdown': 'markdown',
          '.rb': 'ruby',
          '.sh': 'shell', '.bash': 'shell', '.zsh': 'shell',
          '.yml': 'yaml', '.yaml': 'yaml',
          '.xml': 'xml', '.xhtml': 'xml', '.xsl': 'xml',
          '.sql': 'sql',
          '.kt': 'kotlin',
          '.swift': 'swift',
          '.dart': 'dart',
          '.r': 'r',
          '.scala': 'scala',
          '.pl': 'perl',
          '.lua': 'lua',
          '.vim': 'vim',
          '.dockerfile': 'dockerfile',
          '.ini': 'ini',
          '.cfg': 'ini',
          '.conf': 'ini',
          '.toml': 'toml',
          '.txt': 'plaintext',
          '.log': 'plaintext',
          '.env': 'plaintext'
        };
        return extensionMap[ext] || 'plaintext';
      };
      
      const fileData = {
        id: filePath,
        path: filePath,
        name: fileName,
        content: fileContent.content,
        language: getLanguageFromExtension(extension),
        modified: false
      };
      
      // Check if file is already open
      const existingFile = openFiles.find(f => f.id === filePath);
      if (existingFile) {
        setActiveFileId(filePath);
      } else {
        setOpenFiles(prev => [...prev, fileData]);
        setActiveFileId(filePath);
      }
      
      setActiveTab('editor');
      
    } catch (error) {
      console.error('Error opening file:', error);
      alert(`Error opening file: ${error.message}`);
    }
  };

  const handleSaveCurrentFile = async () => {
    const currentFile = getCurrentFile();
    if (currentFile && currentFile.path) {
      try {
        await apiService.writeFile(currentFile.path, currentFile.content);
        handleFileSave({ ...currentFile, modified: false });
        console.log('File saved successfully');
      } catch (error) {
        console.error('Error saving file:', error);
        alert(`Error saving file: ${error.message}`);
      }
    }
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleFileSelect = (file) => {
    const fileId = file.path || `untitled-${Date.now()}`;
    const fileWithId = { ...file, id: fileId, modified: false };
    
    const existingFile = openFiles.find(f => f.id === fileId);
    if (existingFile) {
      setActiveFileId(fileId);
    } else {
      setOpenFiles(prev => [...prev, fileWithId]);
      setActiveFileId(fileId);
    }
    
    setActiveTab('editor');
  };

  const handleFileChange = (updatedFile) => {
    setOpenFiles(prev =>
      prev.map(file =>
        file.id === updatedFile.id ? updatedFile : file
      )
    );
  };

  const handleFileSave = (savedFile) => {
    setOpenFiles(prev =>
      prev.map(file =>
        file.id === savedFile.id ? { ...savedFile, modified: false } : file
      )
    );
  };

  const handleTabClick = (fileId) => {
    setActiveFileId(fileId);
    setActiveTab('editor');
  };

  const handleTabClose = (fileId) => {
    const fileToClose = openFiles.find(f => f.id === fileId);
    
    if (fileToClose?.modified) {
      const confirmClose = window.confirm(
        `File "${fileToClose.name}" has unsaved changes. Close anyway?`
      );
      if (!confirmClose) return;
    }
    
    const newOpenFiles = openFiles.filter(f => f.id !== fileId);
    setOpenFiles(newOpenFiles);
    
    if (activeFileId === fileId) {
      if (newOpenFiles.length > 0) {
        setActiveFileId(newOpenFiles[newOpenFiles.length - 1].id);
      } else {
        setActiveFileId(null);
      }
    }
  };

  const handleNewTab = () => {
    const newFileId = `untitled-${Date.now()}`;
    const newFile = {
      id: newFileId,
      name: 'untitled.js',
      content: '// New file\n',
      language: 'javascript',
      modified: false
    };
    
    setOpenFiles(prev => [...prev, newFile]);
    setActiveFileId(newFileId);
    setActiveTab('editor');
  };

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  const getCurrentFile = () => {
    return openFiles.find(f => f.id === activeFileId) || null;
  };

  // Quick actions
  const handleQuickRun = () => {
    const currentFile = getCurrentFile();
    if (currentFile && currentFile.path) {
      setActiveTab('terminal');
      // You could emit a terminal command here
    } else {
      alert('Please save the file first to run it.');
    }
  };

  const handleQuickAnalyze = () => {
    const currentFile = getCurrentFile();
    if (currentFile && currentFile.content.trim()) {
      // Could automatically open analysis panel or run analysis
      alert('Analysis feature - integrate with your existing code analysis!');
    } else {
      alert('No code to analyze. Please write some code first.');
    }
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <div className="app-header">
          <div className="header-left">
            <button 
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="sidebar-toggle"
              title="Toggle Sidebar (Ctrl+B)"
            >
              {sidebarVisible ? '⏪' : '⏩'}
            </button>
            <h1>🚀 EchoIDE</h1>
            {currentWorkspace !== '.' && (
              <span className="workspace-indicator">
                📁 {currentWorkspace.split(/[/\\]/).pop()}
              </span>
            )}
          </div>
          
          <div className="header-tabs">
            <button 
              className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
              title="Code Editor"
            >
              📝 Editor
            </button>
            <button 
              className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
              title="AI Chat Assistant"
            >
              💬 AI Chat
            </button>
            <button 
              className={`tab ${activeTab === 'terminal' ? 'active' : ''}`}
              onClick={() => setActiveTab('terminal')}
              title="Integrated Terminal"
            >
              🖥️ Terminal
            </button>
          </div>
          
          <div className="header-right">
            {getCurrentFile() && (
              <div className="quick-actions">
                <button onClick={handleQuickRun} className="quick-btn" title="Run Current File">
                  ▶️
                </button>
                <button onClick={handleQuickAnalyze} className="quick-btn" title="Analyze Code">
                  🔍
                </button>
              </div>
            )}
            
            <button 
              onClick={() => setShowSettings(true)}
              className="settings-btn"
              title="Settings"
            >
              ⚙️
            </button>
            <span className="status">
              {getCurrentFile()?.modified ? 'Modified' : 'Ready'} • 
              {openFiles.length} file{openFiles.length !== 1 ? 's' : ''} open
            </span>
          </div>
        </div>

        <div className="app-body">
          {sidebarVisible && (
            <div className="sidebar">
              <FileExplorer 
                onFileSelect={handleFileSelect}
                currentPath={currentWorkspace}
                onWorkspaceChange={setCurrentWorkspace}
              />
            </div>
          )}
          
          <div className="main-content">
            {activeTab === 'editor' && (
              <>
                {openFiles.length > 0 && (
                  <FileTabs
                    openFiles={openFiles}
                    activeFileId={activeFileId}
                    onTabClick={handleTabClick}
                    onTabClose={handleTabClose}
                    onNewTab={handleNewTab}
                  />
                )}
                <CodeEditor 
                  file={getCurrentFile()}
                  onFileChange={handleFileChange}
                  onFileSave={handleFileSave}
                  settings={settings}
                />
              </>
            )}
            
            {activeTab === 'chat' && (
              <ChatInterface defaultModel={settings.defaultModel} />
            )}
            
            {activeTab === 'terminal' && (
              <Terminal 
                currentWorkspace={currentWorkspace}
                currentFile={getCurrentFile()}
              />
            )}
          </div>
        </div>

        <div className="app-footer">
          <div className="footer-left">
            <span className="status-indicator">
              {getCurrentFile() ? (
                <>
                  📄 {getCurrentFile().name}
                  {getCurrentFile().modified && ' • Modified'}
                  {getCurrentFile().language && ` • ${getCurrentFile().language}`}
                  {getCurrentFile().path && ` • ${getCurrentFile().path}`}
                </>
              ) : (
                '📄 No file open'
              )}
            </span>
          </div>
          <div className="footer-center">
            <span className="workspace-info">
              📁 {currentWorkspace === '.' ? 'Default Workspace' : currentWorkspace}
            </span>
          </div>
          <div className="footer-right">
            <span className="app-info">
              EchoIDE v0.0.1 • {settings.theme} theme • 
              {activeTab === 'terminal' ? '🖥️ Terminal' : 
               activeTab === 'chat' ? '💬 AI Chat' : '📝 Editor'} • 
              ⚡ Real Execution
            </span>
          </div>
        </div>

        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
