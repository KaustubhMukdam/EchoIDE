// frontend/src/components/Terminal.js - Real Execution Version
import React, { useState, useRef, useEffect } from 'react';
import apiService from '../services/api';
import './Terminal.css';

const Terminal = ({ currentWorkspace, currentFile }) => {
  const [output, setOutput] = useState([]);
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Add welcome message
    setOutput([
      { type: 'system', content: '🚀 EchoIDE Terminal v2.0', timestamp: new Date() },
      { type: 'system', content: `📁 Working directory: ${currentWorkspace}`, timestamp: new Date() },
      { type: 'system', content: '💡 Type "help" for available commands', timestamp: new Date() },
      { type: 'prompt', content: '$', timestamp: new Date() }
    ]);
  }, [currentWorkspace]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const addOutput = (type, content) => {
    setOutput(prev => [...prev, { type, content, timestamp: new Date() }]);
  };

  const executeCommand = async (command) => {
    if (!command.trim()) return;

    // Add command to history
    setHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Add command to output
    addOutput('command', `$ ${command}`);
    setIsRunning(true);

    try {
      const args = command.trim().split(' ');
      const cmd = args[0].toLowerCase();

      switch (cmd) {
        case 'help':
          showHelp();
          break;
        case 'clear':
        case 'cls':
          setOutput([{ type: 'prompt', content: '$', timestamp: new Date() }]);
          break;
        case 'ls':
        case 'dir':
          await listFiles();
          break;
        case 'cd':
          changeDirectory(args[1]);
          break;
        case 'run':
          await runCurrentFile();
          break;
        case 'python':
        case 'node':
        case 'java':
        case 'g++':
        case 'gcc':
          await executeFile(cmd, args.slice(1));
          break;
        case 'cat':
        case 'type':
          await showFileContent(args[1]);
          break;
        default:
          addOutput('error', `Command not found: ${cmd}`);
          addOutput('info', 'Type "help" to see available commands');
      }
    } catch (error) {
      addOutput('error', `Error: ${error.message}`);
    } finally {
      setIsRunning(false);
      addOutput('prompt', '$');
    }
  };

  const showHelp = () => {
    const helpText = [
      '📋 Available Commands:',
      '  help          - Show this help message',
      '  clear/cls     - Clear terminal',
      '  ls/dir        - List files in current directory',
      '  cd <path>     - Change directory',
      '  cat <file>    - Show file content',
      '  run           - Run current file in editor',
      '  python <file> - Run Python file',
      '  node <file>   - Run JavaScript file',
      '  java <file>   - Compile and run Java file',
      '  g++ <file>    - Compile and run C++ file',
      '',
      '🎯 Examples:',
      '  run',
      '  python hello.py',
      '  node app.js',
      '  java HelloWorld.java'
    ];
    
    helpText.forEach(line => addOutput('info', line));
  };

  const listFiles = async () => {
    try {
      const response = await apiService.listFiles(currentWorkspace);
      const files = response.files || [];
      
      if (files.length === 0) {
        addOutput('info', 'No files found');
        return;
      }

      files.forEach(file => {
        const icon = file.is_directory ? '📁' : '📄';
        const size = file.is_directory ? '' : ` (${formatFileSize(file.size)})`;
        addOutput('info', `${icon} ${file.name}${size}`);
      });
    } catch (error) {
      addOutput('error', `Failed to list files: ${error.message}`);
    }
  };

  const runCurrentFile = async () => {
    if (!currentFile || !currentFile.path) {
      addOutput('error', 'No file is currently open in the editor');
      addOutput('info', 'Open a file in the editor first, then use "run" command');
      return;
    }

    const filename = currentFile.name;
    const ext = filename.split('.').pop()?.toLowerCase();
    
    // Map extensions to executors
    const executorMap = {
      'py': 'python',
      'js': 'node',
      'java': 'java',
      'cpp': 'g++',
      'c': 'gcc'
    };
    
    const executor = executorMap[ext];
    if (!executor) {
      addOutput('error', `Don't know how to run .${ext} files`);
      addOutput('info', 'Supported: .py, .js, .java, .cpp, .c');
      return;
    }

    await executeFile(executor, [filename]);
  };

  const executeFile = async (executor, args) => {
    if (args.length === 0 && executor !== 'run') {
      addOutput('error', `Usage: ${executor} <filename>`);
      return;
    }

    const filename = args[0] || (currentFile ? currentFile.name : null);
    if (!filename) {
      addOutput('error', 'No file specified');
      return;
    }

    try {
      // Call the execution API
      addOutput('info', `🚀 Executing ${filename} with ${executor}...`);
      
      const response = await apiService.executeCode(executor, filename, currentWorkspace);
      
      if (response.success) {
        if (response.stdout) {
          // Split output into lines and display each
          const outputLines = response.stdout.split('\n');
          outputLines.forEach(line => {
            if (line.trim()) {
              addOutput('output', line);
            }
          });
        }
        
        if (response.stderr && response.stderr.trim()) {
          const errorLines = response.stderr.split('\n');
          errorLines.forEach(line => {
            if (line.trim()) {
              addOutput('error', line);
            }
          });
        }
        
        addOutput('success', `✓ Execution completed in ${response.execution_time || 'unknown'}s (Exit code: ${response.exit_code || 0})`);
      } else {
        addOutput('error', `❌ Execution failed: ${response.error || 'Unknown error'}`);
        if (response.stderr) {
          const errorLines = response.stderr.split('\n');
          errorLines.forEach(line => {
            if (line.trim()) {
              addOutput('error', line);
            }
          });
        }
      }

    } catch (error) {
      addOutput('error', `❌ Execution failed: ${error.message}`);
      addOutput('info', '💡 Make sure the required runtime is installed on your system');
    }
  };

  const showFileContent = async (filename) => {
    if (!filename) {
      addOutput('error', 'Usage: cat <filename>');
      return;
    }

    try {
      const filePath = currentWorkspace === '.' ? filename : `${currentWorkspace}/${filename}`;
      const response = await apiService.readFile(filePath);
      const lines = response.content.split('\n');
      
      addOutput('info', `📄 ${filename}:`);
      lines.forEach((line, index) => {
        addOutput('code', `${(index + 1).toString().padStart(3)}: ${line}`);
      });
    } catch (error) {
      addOutput('error', `Failed to read file: ${error.message}`);
    }
  };

  const changeDirectory = (path) => {
    addOutput('info', `💡 To change workspace, use the folder icon in the Explorer panel`);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (!isRunning) {
        executeCommand(input);
        setInput('');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString();
  };

  return (
    <div className="terminal">
      <div className="terminal-header">
        <span className="terminal-title">🖥️ Terminal</span>
        <div className="terminal-controls">
          <button onClick={() => setOutput([{ type: 'prompt', content: '$', timestamp: new Date() }])} className="terminal-btn">
            🗑️ Clear
          </button>
          {currentFile && (
            <button onClick={() => executeCommand('run')} className="terminal-btn run-btn">
              ▶️ Run {currentFile.name}
            </button>
          )}
        </div>
      </div>
      
      <div className="terminal-output" ref={terminalRef}>
        {output.map((line, index) => (
          <div key={index} className={`terminal-line terminal-${line.type}`}>
            <span className="terminal-timestamp">{formatTimestamp(line.timestamp)}</span>
            <span className="terminal-content">{line.content}</span>
          </div>
        ))}
        
        {!isRunning && (
          <div className="terminal-input-line">
            <span className="terminal-prompt">$ </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="terminal-input"
              placeholder="Type a command..."
              disabled={isRunning}
              autoFocus
            />
          </div>
        )}
        
        {isRunning && (
          <div className="terminal-line terminal-info">
            <span className="terminal-content">⏳ Executing...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Terminal;
