// frontend/src/services/api.js
const API_BASE = 'http://127.0.0.1:8000';

class APIService {
  // AI Services
  async chat(message, model = 'phi3.5:3.8b', language = 'english', context = '', sessionId = 'default') {
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          model,
          language,
          context,
          session_id: sessionId
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  }

  async analyzeCode(code, language, analysisType) {
    try {
      const response = await fetch(`${API_BASE}/api/code/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          analysis_type: analysisType
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Analyze code API error:', error);
      throw error;
    }
  }

  async completeCode(code, cursorPosition, language = 'python') {
    try {
      console.log(`Requesting completion for language: ${language}`);
      const response = await fetch(`${API_BASE}/api/code/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          cursor_position: cursorPosition,
          language
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Complete code API error:', error);
      throw error;
    }
  }

  // File Services
  async listFiles(path = '.') {
    try {
      const response = await fetch(`${API_BASE}/api/files/list?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('List files API error:', error);
      throw error;
    }
  }

  async readFile(path) {
    try {
      const response = await fetch(`${API_BASE}/api/files/read?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Read file API error:', error);
      throw error;
    }
  }

  async writeFile(path, content) {
    try {
      const response = await fetch(`${API_BASE}/api/files/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          content
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Write file API error:', error);
      throw error;
    }
  }

  async deleteFile(path) {
    try {
      const response = await fetch(`${API_BASE}/api/files/delete?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Delete file API error:', error);
      throw error;
    }
  }

  // Project Services
  async openProject(projectPath) {
    try {
      const response = await fetch(`${API_BASE}/api/project/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_path: projectPath
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Open project API error:', error);
      throw error;
    }
  }

  async getProjectStructure(projectPath) {
    try {
      const response = await fetch(`${API_BASE}/api/project/structure?project_path=${encodeURIComponent(projectPath)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get project structure API error:', error);
      throw error;
    }
  }

  // Add to frontend/src/services/api.js

  async executeCode(executor, filename, workspace) {
    try {
      console.log(`Executing ${filename} with ${executor} in ${workspace}`);
      const response = await fetch(`${API_BASE}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executor,
          filename,
          workspace
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Execute code API error:', error);
      throw error;
    }
  }

  // Add this method to your api.js if it's missing

  async createDirectory(folderPath) {
    try {
      const response = await fetch(`${API_BASE}/api/files/create-directory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create directory API error:', error);
      throw error;
    }
  }

}


export default new APIService();
