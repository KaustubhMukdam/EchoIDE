// frontend/scripts/test-build.js
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 Testing EchoIDE build configuration...\n');

// Test 1: Check package.json
console.log('📋 Checking package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`✅ App Name: ${packageJson.name}`);
console.log(`✅ Version: ${packageJson.version}`);
console.log(`✅ Description: ${packageJson.description}`);
console.log(`✅ Author: ${packageJson.author.name}\n`);

// Test 2: Check required files
console.log('📁 Checking required files...');
const requiredFiles = [
  'public/electron.js',
  'public/preload.js',
  'public/icon-512x512.png',
  'public/manifest.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
  }
});

// Test 3: Check dependencies
console.log('\n📦 Checking dependencies...');
try {
  execSync('npm ls electron', { stdio: 'pipe' });
  console.log('✅ Electron installed');
} catch {
  console.log('❌ Electron not found');
}

try {
  execSync('npm ls electron-builder', { stdio: 'pipe' });
  console.log('✅ Electron Builder installed');
} catch {
  console.log('❌ Electron Builder not found');
}

console.log('\n🎯 Build configuration test completed!');
