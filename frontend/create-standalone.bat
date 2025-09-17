@echo off
echo 🚀 Creating EchoIDE Standalone...

echo 📦 Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo 📁 Creating standalone folder...
if exist "EchoIDE-Standalone" rmdir /s /q "EchoIDE-Standalone"
mkdir "EchoIDE-Standalone"

echo 📋 Copying built app...
xcopy /E /I build EchoIDE-Standalone\app

echo 📋 Copying electron files...
copy public\preload.js "EchoIDE-Standalone\app\"
copy public\icon-256x256.png "EchoIDE-Standalone\app\icon.png"

echo 🔧 Creating production electron.js...
(
echo const { app, BrowserWindow, Menu, dialog } = require('electron'^);
echo const path = require('path'^);
echo.
echo let mainWindow;
echo.
echo function createWindow(^) {
echo   mainWindow = new BrowserWindow({
echo     width: 1400, height: 900,
echo     webPreferences: {
echo       nodeIntegration: false,
echo       contextIsolation: true,
echo       preload: path.join(__dirname, 'preload.js'^)
echo     },
echo     icon: path.join(__dirname, 'icon.png'^),
echo     backgroundColor: '#1e1e1e'
echo   }^);
echo.
echo   mainWindow.loadFile(path.join(__dirname, 'index.html'^)^);
echo   mainWindow.once('ready-to-show', (^) =^> mainWindow.show(^)^);
echo }
echo.
echo app.whenReady(^).then(createWindow^);
echo app.on('window-all-closed', (^) =^> process.platform !== 'darwin' ^&^& app.quit(^)^);
) > "EchoIDE-Standalone\app\electron.js"

echo 🔧 Creating package.json...
(
echo {
echo   "name": "echoide-standalone",
echo   "version": "0.0.1",
echo   "main": "electron.js",
echo   "description": "EchoIDE - AI-Powered Code Editor"
echo }
) > "EchoIDE-Standalone\app\package.json"

echo 🔧 Installing electron locally...
cd "EchoIDE-Standalone\app"
call npm install electron --save-dev

echo 🚀 Creating launcher...
cd..
(
echo @echo off
echo cd /d "%%~dp0app"
echo npx electron electron.js
echo pause
) > "EchoIDE-Standalone\EchoIDE.bat"

cd..

echo ✅ EchoIDE Standalone created successfully!
echo 📂 Go to "EchoIDE-Standalone" folder
echo 🚀 Double-click "EchoIDE.bat" to run EchoIDE!
echo.
echo 📦 You can zip the "EchoIDE-Standalone" folder to distribute!
pause
