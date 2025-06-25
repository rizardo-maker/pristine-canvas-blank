
# Collectify Manager - Tauri Desktop App

This document provides instructions for building and running the desktop version of Collectify Manager using Tauri.

## Prerequisites

1. **Install Rust**
   - Download and install from [rust-lang.org](https://www.rust-lang.org/tools/install)
   - Verify installation with: `rustc --version`

2. **Install Platform-specific Dependencies**

   **For Windows:**
   - Install Visual Studio 2019 Build Tools with "Desktop Development with C++" workload
   - Install WebView2 runtime (usually pre-installed on Windows 10/11)

   **For macOS:**
   - Install Xcode Command Line Tools: `xcode-select --install`
   - Install WebKit dependencies: `brew install webkit2png`

   **For Linux:**
   - Install required dependencies:
     ```
     sudo apt update
     sudo apt install libwebkit2gtk-4.0-dev \
         build-essential \
         curl \
         wget \
         libssl-dev \
         libgtk-3-dev \
         libayatana-appindicator3-dev \
         librsvg2-dev
     ```

## Development

1. **Install Node.js dependencies:**
   ```
   npm install
   ```

2. **Run in development mode:**
   ```
   npm run tauri:dev
   ```
   This will start the Vite development server and launch the Tauri application.

## Building for Production

1. **Build the desktop application:**
   ```
   npm run tauri:build
   ```

2. **Find the built application:**
   - Windows: `src-tauri/target/release/bundle/msi/`
   - macOS: `src-tauri/target/release/bundle/dmg/`
   - Linux: `src-tauri/target/release/bundle/deb/` or `src-tauri/target/release/bundle/appimage/`

## Troubleshooting

- **"Error: Failed to compile"**: Ensure Rust and build dependencies are correctly installed.
- **"Error: Failed to initialize WebView"**: Verify WebView2 is installed (Windows) or WebKit dependencies (Linux/macOS).
- **Build hangs**: Check system resources and Rust environment. Try with `--verbose` flag for more information.

## Data Storage

The desktop application stores data in:
- Windows: `%APPDATA%\com.collectify.manager\`
- macOS: `~/Library/Application Support/com.collectify.manager/`
- Linux: `~/.config/com.collectify.manager/`

## Features Specific to Desktop

- Offline access to all features
- Native notifications
- File system access for import/export
- Improved performance
