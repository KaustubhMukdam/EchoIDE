@echo off 
cd /d "%%~dp0app"   
npx electron electron.js 
pause 
