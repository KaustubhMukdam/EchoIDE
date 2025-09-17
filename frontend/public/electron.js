// frontend/public/electron.js
const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js') // Add preload script
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    titleBarStyle: 'default',
    frame: true,
    backgroundColor: '#1e1e1e'
  });

  // Load the app with better error handling
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  // Handle loading with retry logic for development
  if (isDev) {
    loadWithRetry(startUrl);
  } else {
    mainWindow.loadURL(startUrl);
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle navigation errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (isDev && errorCode === -102) {
      console.log('React dev server not ready, retrying...');
      setTimeout(() => {
        loadWithRetry(startUrl);
      }, 2000);
    }
  });

  // Create application menu
  createMenu();
  
  // Set up IPC handlers
  setupIPC();
}

function loadWithRetry(url, retries = 10) {
  mainWindow.loadURL(url).catch((error) => {
    if (retries > 0) {
      console.log(`Failed to load ${url}, retrying... (${retries} attempts left)`);
      setTimeout(() => {
        loadWithRetry(url, retries - 1);
      }, 2000);
    } else {
      dialog.showErrorBox(
        'Failed to Load EchoIDE',
        'Could not connect to the React development server.\n\nPlease make sure you run "npm run dev" instead of "npm run electron".'
      );
    }
  });
}

function setupIPC() {
  // Handle file dialogs
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Text Files', extensions: ['txt', 'md'] },
        { name: 'JavaScript', extensions: ['js', 'jsx'] },
        { name: 'Python', extensions: ['py'] },
        { name: 'TypeScript', extensions: ['ts', 'tsx'] },
        { name: 'Java', extensions: ['java'] },
        { name: 'C++', extensions: ['cpp', 'c', 'cc', 'cxx'] },
        { name: 'C#', extensions: ['cs'] },
        { name: 'HTML', extensions: ['html', 'htm'] },
        { name: 'CSS', extensions: ['css', 'scss', 'sass'] },
        { name: 'JSON', extensions: ['json'] }
      ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });
  
  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });
  
  ipcMain.handle('dialog:saveFile', async (event, options = {}) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: options.filters || [
        { name: 'All Files', extensions: ['*'] },
        { name: 'JavaScript', extensions: ['js'] },
        { name: 'Python', extensions: ['py'] },
        { name: 'TypeScript', extensions: ['ts'] },
        { name: 'HTML', extensions: ['html'] },
        { name: 'CSS', extensions: ['css'] },
        { name: 'JSON', extensions: ['json'] }
      ],
      defaultPath: options.defaultPath || 'untitled.txt'
    });
    
    if (!result.canceled) {
      return result.filePath;
    }
    return null;
  });
  
  // App version
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-new-file');
            }
          }
        },
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            if (!mainWindow) return;
            
            try {
              const filePath = await ipcMain.handle('dialog:openFile', async () => {
                const result = await dialog.showOpenDialog(mainWindow, {
                  properties: ['openFile'],
                  filters: [
                    { name: 'All Files', extensions: ['*'] },
                    { name: 'JavaScript', extensions: ['js', 'jsx'] },
                    { name: 'Python', extensions: ['py'] },
                    { name: 'TypeScript', extensions: ['ts', 'tsx'] },
                    { name: 'HTML', extensions: ['html', 'htm'] },
                    { name: 'CSS', extensions: ['css', 'scss'] },
                    { name: 'JSON', extensions: ['json'] }
                  ]
                });
                
                return !result.canceled && result.filePaths.length > 0 ? result.filePaths[0] : null;
              });
              
              const actualPath = await filePath();
              if (actualPath) {
                mainWindow.webContents.send('menu-open-file', actualPath);
              }
            } catch (error) {
              console.error('Error in open file dialog:', error);
            }
          }
        },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            if (!mainWindow) return;
            
            try {
              const folderPath = await ipcMain.handle('dialog:openFolder', async () => {
                const result = await dialog.showOpenDialog(mainWindow, {
                  properties: ['openDirectory']
                });
                
                return !result.canceled && result.filePaths.length > 0 ? result.filePaths[0] : null;
              });
              
              const actualPath = await folderPath();
              if (actualPath) {
                mainWindow.webContents.send('menu-open-folder', actualPath);
              }
            } catch (error) {
              console.error('Error in open folder dialog:', error);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-save-file');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'actualSize' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About EchoIDE',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About EchoIDE',
              message: 'EchoIDE v2.0',
              detail: 'AI-Powered Code Editor\nBuilt with React, Electron, and FastAPI'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event listeners
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    navigationEvent.preventDefault();
    shell.openExternal(navigationURL);
  });
});

// Prevent GPU crashes
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
