// frontend/src/components/CodeEditor.js
import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import apiService from '../services/api';
import './CodeEditor.css';

const CodeEditor = ({ file, onFileChange, onFileSave, settings }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [wordWrap, setWordWrap] = useState('on');
  const [theme, setTheme] = useState('vs-dark');
  const [autoSave, setAutoSave] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Enhanced language detection from file extension
  const getLanguageFromExtension = (filename) => {
    if (!filename) return 'javascript';
    
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap = {
      // JavaScript family
      'js': 'javascript', 'jsx': 'javascript', 'mjs': 'javascript',
      'ts': 'typescript', 'tsx': 'typescript',
      
      // Backend languages
      'py': 'python', 'pyw': 'python',
      'java': 'java',
      'cpp': 'cpp', 'c': 'cpp', 'cc': 'cpp', 'cxx': 'cpp', 'h': 'cpp', 'hpp': 'cpp',
      'cs': 'csharp',
      'php': 'php', 'phtml': 'php',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'kt': 'kotlin',
      'swift': 'swift',
      'scala': 'scala',
      'dart': 'dart',
      'r': 'r',
      'pl': 'perl',
      'lua': 'lua',
      
      // Web languages
      'html': 'html', 'htm': 'html',
      'css': 'css', 'scss': 'scss', 'sass': 'sass', 'less': 'less',
      
      // Data languages
      'json': 'json', 'jsonc': 'json',
      'xml': 'xml', 'xhtml': 'xml', 'xsl': 'xml',
      'yml': 'yaml', 'yaml': 'yaml',
      'toml': 'toml',
      'ini': 'ini', 'cfg': 'ini', 'conf': 'ini',
      'sql': 'sql',
      
      // Documentation
      'md': 'markdown', 'markdown': 'markdown',
      'txt': 'plaintext', 'log': 'plaintext',
      
      // Shell scripts
      'sh': 'shell', 'bash': 'shell', 'zsh': 'shell', 'fish': 'shell',
      'bat': 'bat', 'cmd': 'bat', 'ps1': 'powershell',
      
      // Others
      'dockerfile': 'dockerfile',
      'vim': 'vim',
      'env': 'plaintext'
    };
    
    return languageMap[ext] || 'plaintext';
  };

  // Get default code template based on language
  const getDefaultCodeTemplate = (lang) => {
    const templates = {
      'python': '# Python file\n# Start coding here...\n\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()',
      'javascript': '// JavaScript file\n// Start coding here...\n\nfunction hello() {\n    console.log("Hello, World!");\n}\n\nhello();',
      'typescript': '// TypeScript file\n// Start coding here...\n\nfunction hello(): void {\n    console.log("Hello, World!");\n}\n\nhello();',
      'java': '// Java file\n// Start coding here...\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
      'cpp': '// C++ file\n// Start coding here...\n\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
      'csharp': '// C# file\n// Start coding here...\n\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}',
      'go': '// Go file\n// Start coding here...\n\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
      'rust': '// Rust file\n// Start coding here...\n\nfn main() {\n    println!("Hello, World!");\n}',
      'html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>',
      'css': '/* CSS file */\n/* Start styling here... */\n\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}',
      'php': '<?php\n// PHP file\n// Start coding here...\n\necho "Hello, World!";\n?>',
      'ruby': '# Ruby file\n# Start coding here...\n\nputs "Hello, World!"'
    };
    
    return templates[lang] || `// ${lang.toUpperCase()} file\n// Start coding here...\n`;
  };

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'sql', label: 'SQL' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'shell', label: 'Shell' },
    { value: 'yaml', label: 'YAML' }
  ];

  const themes = [
    { value: 'vs-dark', label: 'Dark' },
    { value: 'vs-light', label: 'Light' },
    { value: 'hc-black', label: 'High Contrast' }
  ];

  useEffect(() => {
    if (file) {
      setCode(file.content || '');
      const detectedLanguage = getLanguageFromExtension(file.name || file.path);
      setLanguage(detectedLanguage);
      
      // Update Monaco editor language if editor is mounted
      if (editorRef.current) {
        const monaco = window.monaco;
        if (monaco) {
          const model = editorRef.current.getModel();
          if (model) {
            // Set the correct language
            monaco.editor.setModelLanguage(model, detectedLanguage);
            
            // Disable inappropriate validations based on language
            if (!['javascript', 'typescript'].includes(detectedLanguage)) {
              // Disable JS/TS validation for non-JS files
              monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: true,
              });
              monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: true,
              });
            }
            
            if (detectedLanguage !== 'json') {
              // Disable JSON validation for non-JSON files
              monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                validate: false
              });
            }
            
            if (detectedLanguage !== 'css') {
              // Disable CSS validation for non-CSS files
              monaco.languages.css.cssDefaults.setDiagnosticsOptions({
                validate: false
              });
            }
          }
        }
      }
    }
  }, [file]);

  useEffect(() => {
    // Apply settings
    if (settings) {
      setTheme(settings.theme || 'vs-dark');
      setShowMinimap(settings.minimap !== false);
      setWordWrap(settings.wordWrap || 'on');
      setAutoSave(settings.autoSave || false);
    }
  }, [settings]);

  useEffect(() => {
    if (autoSave && file && code !== (file.content || '')) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [code, autoSave, file]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Universal language setup - disable all inappropriate validations
    const setupLanguageValidation = (currentLanguage) => {
      // Disable TypeScript/JavaScript validation for non-JS files
      if (!['javascript', 'typescript'].includes(currentLanguage)) {
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: true,
          noSyntaxValidation: true,
        });
        
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: true,
          noSyntaxValidation: true,
        });
      }
      
      // Configure JSON validation only for JSON files
      if (currentLanguage !== 'json') {
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: false,
          allowComments: false,
          schemas: []
        });
      }
      
      // Set proper language for the model
      const model = editor.getModel();
      if (model && currentLanguage) {
        monaco.editor.setModelLanguage(model, currentLanguage);
      }
    };
    
    // Initial setup
    setupLanguageValidation(language);
    
    // Re-setup when language changes
    editor.onDidChangeModel(() => {
      setupLanguageValidation(language);
    });
    
    // Enhanced keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      handleCodeCompletion();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      setShowSearch(!showSearch);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      editor.getAction('editor.action.duplicateSelection').run();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK, () => {
      editor.getAction('editor.action.deleteLines').run();
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
      editor.getAction('editor.action.moveLinesUpAction').run();
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
      editor.getAction('editor.action.moveLinesDownAction').run();
    });

    // Language-specific auto-completion provider
    const provider = monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: async (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        try {
          // Pass the current language to ensure language-specific completion
          const response = await apiService.completeCode(textUntilPosition, textUntilPosition.length, language);
          return {
            suggestions: [{
              label: `AI Completion (${language})`,
              kind: monaco.languages.CompletionItemKind.Text,
              insertText: response.completion,
              documentation: `AI-generated ${language} completion`,
              detail: `Language: ${language}`
            }]
          };
        } catch (error) {
          console.error('Auto-completion error:', error);
          return { suggestions: [] };
        }
      }
    });

    return () => provider.dispose();
  };

  const handleCodeChange = (value) => {
    setCode(value || '');
    if (onFileChange) {
      onFileChange({ 
        ...file, 
        content: value || '', 
        modified: true,
        language: language // Update language in file object
      });
    }
  };

// In CodeEditor.js, update the handleLanguageChange function
const handleLanguageChange = (newLanguage) => {
  setLanguage(newLanguage);
  
  // Update file name extension based on language
  if (file && file.name.startsWith('untitled')) {
    const extensionMap = {
      'python': '.py',
      'javascript': '.js',
      'typescript': '.ts',
      'java': '.java',
      'cpp': '.cpp',
      'csharp': '.cs',
      'html': '.html',
      'css': '.css'
    };
    
    const newExtension = extensionMap[newLanguage] || '.txt';
    const newName = file.name.replace(/\.[^.]*$/, '') + newExtension;
    
    const template = getDefaultCodeTemplate(newLanguage);
    setCode(template);
    
    if (onFileChange) {
      onFileChange({
        ...file,
        name: newName,
        content: template,
        language: newLanguage,
        modified: true
      });
    }
  }
};


  const handleSave = async () => {
    if (file?.path) {
      try {
        await apiService.writeFile(file.path, code);
        if (onFileSave) {
          onFileSave({ ...file, modified: false });
        }
        console.log('File saved successfully');
      } catch (error) {
        console.error('Error saving file:', error);
        alert(`Error saving file: ${error.message}`);
      }
    }
  };

  const handleAnalyzeCode = async (analysisType) => {
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    setShowAnalysis(true);
    
    try {
      console.log(`Analyzing ${language} code with type: ${analysisType}`);
      const response = await apiService.analyzeCode(code, language, analysisType);
      setAnalysisResult(response.analysis);
    } catch (error) {
      setAnalysisResult(`Error analyzing code: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCodeCompletion = async () => {
    const editor = editorRef.current;
    if (!editor || isCompleting) return;

    setIsCompleting(true);
    const position = editor.getPosition();
    const model = editor.getModel();
    const offset = model.getOffsetAt(position);

    try {
      console.log(`Requesting code completion for language: ${language}`);
      
      // Ensure we pass the correct language
      const response = await apiService.completeCode(code, offset, language);
      const completion = response.completion;

      if (completion && completion.trim()) {
        editor.executeEdits('ai-code-completion', [{
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          },
          text: completion
        }]);
        
        // Move cursor to end of completion
        const lines = completion.split('\n');
        const endLine = position.lineNumber + lines.length - 1;
        const endColumn = lines.length > 1 ? lines[lines.length - 1].length + 1 : position.column + completion.length;
        
        editor.setPosition({ lineNumber: endLine, column: endColumn });
      }
    } catch (error) {
      console.error('Code completion error:', error);
      alert(`Code completion failed: ${error.message}`);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSearch = () => {
    const editor = editorRef.current;
    if (!editor || !searchQuery) return;

    editor.getAction('actions.find').run();
  };

  const formatCode = () => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.getAction('editor.action.formatDocument').run();
  };

  const analysisTypes = [
    { value: 'explain', label: 'Explain Code', icon: '📖' },
    { value: 'debug', label: 'Find Bugs', icon: '🐛' },
    { value: 'optimize', label: 'Optimize', icon: '⚡' },
    { value: 'review', label: 'Code Review', icon: '👁️' }
  ];

  const editorOptions = {
    minimap: { enabled: showMinimap },
    fontSize: settings?.fontSize || 14,
    wordWrap,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'all',
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    tabSize: settings?.tabSize || 2,
    insertSpaces: true,
    formatOnPaste: true,
    formatOnType: true,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    snippetSuggestions: 'top',
    parameterHints: { enabled: true },
    quickSuggestions: true,
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'always',
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: 'active',
      indentation: true
    }
  };

  return (
    <div className="code-editor">
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <select 
            value={language} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="language-selector"
            title="Select programming language"
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
          <span className="file-info">
            {file?.path || file?.name || 'untitled'}
            {file?.modified && ' ●'}
            <span className="language-indicator"> • {language}</span>
          </span>
        </div>
        
        <div className="toolbar-center">
          {showSearch && (
            <div className="search-box">
              <input
                type="text"
                placeholder="Search in file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input"
              />
              <button onClick={handleSearch} className="search-btn">🔍</button>
            </div>
          )}
        </div>
        
        <div className="toolbar-right">
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            className="theme-selector"
          >
            {themes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          
          <button onClick={formatCode} className="toolbar-btn" title="Format Code">
            🎨 Format
          </button>
          
          <button 
            onClick={() => setShowMinimap(!showMinimap)} 
            className={`toolbar-btn ${showMinimap ? 'active' : ''}`}
            title="Toggle Minimap"
          >
            🗺️ Map
          </button>
          
          <button 
            onClick={() => setWordWrap(wordWrap === 'on' ? 'off' : 'on')} 
            className={`toolbar-btn ${wordWrap === 'on' ? 'active' : ''}`}
            title="Toggle Word Wrap"
          >
            📄 Wrap
          </button>
          
          <label className="auto-save-toggle">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
            />
            Auto-save
          </label>

          <button onClick={handleSave} className="toolbar-btn save-btn" title="Save (Ctrl+S)">
            💾 Save
          </button>
          
          <button 
            onClick={handleCodeCompletion} 
            className="toolbar-btn completion-btn" 
            title={`AI Completion for ${language} (Ctrl+Space)`}
            disabled={isCompleting}
          >
            {isCompleting ? '⏳' : '✨'} Complete ({language})
          </button>
          
          <button 
            onClick={() => setShowSearch(!showSearch)} 
            className="toolbar-btn" 
            title="Search (Ctrl+F)"
          >
            🔍 Find
          </button>
          
          <button 
            onClick={() => setShowAnalysis(!showAnalysis)} 
            className="toolbar-btn"
            title="Toggle Analysis Panel"
          >
            🔍 Analyze
          </button>
        </div>
      </div>

      <div className="editor-container">
        <div className={`editor-main ${showAnalysis ? 'with-analysis' : ''}`}>
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme={theme}
            options={editorOptions}
          />
        </div>

        {showAnalysis && (
          <div className="analysis-panel">
            <div className="analysis-header">
              <h4>Code Analysis ({language})</h4>
              <button 
                onClick={() => setShowAnalysis(false)} 
                className="close-btn"
              >
                ✕
              </button>
            </div>
            
            <div className="analysis-controls">
              {analysisTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => handleAnalyzeCode(type.value)}
                  disabled={isAnalyzing}
                  className="analysis-btn"
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>

            <div className="analysis-result">
              {isAnalyzing ? (
                <div className="loading">Analyzing {language} code...</div>
              ) : (
                <pre>{analysisResult || `Select an analysis type above to analyze your ${language} code.`}</pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
