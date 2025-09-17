// frontend/public/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  
  // Menu event listeners
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-new-file', callback);
    ipcRenderer.on('menu-save-file', callback);
    ipcRenderer.on('menu-toggle-sidebar', callback);
    ipcRenderer.on('menu-find', callback);
    ipcRenderer.on('menu-open-ai-chat', callback);
  },
  
  // File path handlers
  onFileOpen: (callback) => ipcRenderer.on('menu-open-file', callback),
  onFolderOpen: (callback) => ipcRenderer.on('menu-open-folder', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // System info
  platform: process.platform,
  
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion')
});
