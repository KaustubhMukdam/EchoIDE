// frontend/src/components/ChatInterface.js
import React, { useState, useRef, useEffect } from 'react';
import apiService from '../services/api';
import './ChatInterface.css';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('phi3.5:3.8b');
  const [sessionId] = useState('chat_session_' + Date.now());
  const messagesEndRef = useRef(null);

  const models = [
    'phi3.5:3.8b',
    'deepseek-coder:6.7b',
    'qwen2.5-coder:7b',
    'qwen2.5-coder:1.5b',
    'llama3:latest',
    'mistral:latest'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // In ChatInterface.js, add better error handling
const handleSendMessage = async () => {
  if (!inputValue.trim() || isLoading) return;

  const userMessage = {
    id: Date.now(),
    type: 'user',
    content: inputValue,
    timestamp: new Date().toLocaleTimeString()
  };

  setMessages(prev => [...prev, userMessage]);
  setInputValue('');
  setIsLoading(true);

  try {
    // Add a timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    const response = await apiService.chat(
      inputValue,
      selectedModel,
      'english',
      'You are helping with coding tasks. Be helpful and provide code examples when appropriate.',
      sessionId
    );

    clearTimeout(timeoutId);

    const aiMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: response.response || response.message || 'No response received',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, aiMessage]);
  } catch (error) {
    let errorMessage = 'Sorry, I encountered an error. ';
    
    if (error.message.includes('timeout')) {
      errorMessage += 'The request timed out. The AI model might be busy or not responding.';
    } else if (error.message.includes('500')) {
      errorMessage += 'The AI service is temporarily unavailable. Please check if Ollama is running and the model is loaded.';
    } else {
      errorMessage += `Error: ${error.message}`;
    }

    const errorMsg = {
      id: Date.now() + 1,
      type: 'error',
      content: errorMessage,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, errorMsg]);
  } finally {
    setIsLoading(false);
  }
};


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h3>AI Assistant</h3>
        <div className="chat-controls">
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="model-selector"
          >
            {models.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
          <button onClick={clearChat} className="clear-btn">Clear</button>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h4>Welcome to EchoIDE AI Assistant!</h4>
            <p>Ask me anything about coding, get help with your projects, or just chat!</p>
          </div>
        )}
        
        {messages.map(message => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-header">
              <span className="message-type">
                {message.type === 'user' ? '🧑‍💻 You' : message.type === 'assistant' ? '🤖 AI' : '❌ Error'}
              </span>
              <span className="message-time">{message.timestamp}</span>
            </div>
            <div className="message-content">
              <pre>{message.content}</pre>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-header">
              <span className="message-type">🤖 AI</span>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here... (Enter to send, Shift+Enter for new line)"
          className="message-input"
          rows={3}
          disabled={isLoading}
        />
        <button 
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
          className="send-btn"
        >
          {isLoading ? '⏳' : '📤 Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
