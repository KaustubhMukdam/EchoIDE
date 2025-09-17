// frontend/scripts/build.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting EchoIDE Build Process...\n');

// Step 1: Clean previous builds
console.log('🧹 Cleaning previous builds...');
try {
  if (fs.existsSync('build')) {
    fs.rmSync('build', { recursive: true, force: true });
  }
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  console.log('✅ Cleaned previous builds\n');
} catch (error) {
  console.log('⚠️ Warning: Could not clean all previous builds\n');
}

// Step 2: Build React app
console.log('⚛️ Building React application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ React build completed\n');
} catch (error) {
  console.error('❌ React build failed');
  process.exit(1);
}

// Step 3: Verify build files
console.log('🔍 Verifying build files...');
const requiredFiles = [
  'build/index.html',
  'build/static/js',
  'build/static/css'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`❌ Missing: ${file}`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('✅ All required build files present\n');
} else {
  console.error('❌ Build verification failed');
  process.exit(1);
}

// Step 4: Build Electron app
console.log('⚡ Building Electron application...');
try {
  const platform = process.platform;
  const buildCommand = platform === 'win32' ? 'electron-builder --win' :
                      platform === 'darwin' ? 'electron-builder --mac' :
                      'electron-builder --linux';
  
  execSync(buildCommand, { stdio: 'inherit' });
  console.log('✅ Electron build completed\n');
} catch (error) {
  console.error('❌ Electron build failed');
  process.exit(1);
}

console.log('🎉 EchoIDE build completed successfully!');
console.log('📦 Check the "dist" folder for your installers');
