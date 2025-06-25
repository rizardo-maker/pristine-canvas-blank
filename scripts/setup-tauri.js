
#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Tauri for Collectify Manager...');

// Check if Rust is installed
function checkRust() {
  return new Promise((resolve) => {
    const rustCheck = spawn('rustc', ['--version'], { stdio: 'pipe' });
    rustCheck.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

// Check if Tauri CLI is available
function checkTauriCli() {
  return new Promise((resolve) => {
    const tauriCheck = spawn('npx', ['tauri', '--version'], { stdio: 'pipe', shell: true });
    tauriCheck.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function main() {
  // Check Rust installation
  const rustInstalled = await checkRust();
  if (!rustInstalled) {
    console.error('❌ Rust is not installed. Please install Rust from https://rustup.rs/');
    console.log('📋 Installation steps:');
    console.log('   1. Visit https://rustup.rs/');
    console.log('   2. Download and run the installer');
    console.log('   3. Restart your terminal/computer');
    console.log('   4. Run this setup script again');
    process.exit(1);
  }
  console.log('✅ Rust is installed');

  // Check Tauri CLI
  const tauriInstalled = await checkTauriCli();
  if (!tauriInstalled) {
    console.log('❌ Tauri CLI not found');
    console.log('💡 Please ensure @tauri-apps/cli is installed as a dev dependency');
    console.log('   This should have been installed automatically with npm install');
    process.exit(1);
  } else {
    console.log('✅ Tauri CLI is available');
  }

  console.log('🎉 Setup verification complete!');
  console.log('📝 Available commands:');
  console.log('   npm run dev          - Start Vite development server');
  console.log('   npx tauri dev        - Start Tauri development mode');
  console.log('   npm run build        - Build for production');
  console.log('   npx tauri build      - Build desktop application');
  console.log('');
  console.log('🚀 Quick start:');
  console.log('   1. Run "npm run dev" in one terminal');
  console.log('   2. Run "npx tauri dev" in another terminal');
}

main().catch(console.error);
