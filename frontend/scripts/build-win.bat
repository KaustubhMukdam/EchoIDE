@echo off
echo 🚀 Building EchoIDE for Windows...
echo.

echo 🧹 Cleaning previous builds...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

echo ⚛️ Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ React build failed
    pause
    exit /b 1
)

echo ⚡ Building Windows installer...
call npx electron-builder --win
if %errorlevel% neq 0 (
    echo ❌ Electron build failed
    pause
    exit /b 1
)

echo.
echo 🎉 EchoIDE Windows build completed!
echo 📦 Check the "dist" folder for EchoIDE-0.0.1-win-x64.exe
pause
