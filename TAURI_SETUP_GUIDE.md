
# Collectify Manager - Tauri Desktop App Setup Guide

## Overview
This guide provides complete instructions for setting up and building the Collectify Manager desktop application using Tauri.

## Prerequisites

### 1. Node.js (v18 or later)
Download and install from: https://nodejs.org/

### 2. Rust (Latest Stable)
Install Rust using rustup:

**Windows:**
- Download from: https://rustup.rs/
- Run the installer and follow the prompts
- Restart your computer after installation

**macOS/Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### 3. System Dependencies

**Windows:**
- Install Visual Studio C++ Build Tools or Visual Studio Community 2019/2022
- Install Windows 11 SDK (or Windows 10 SDK)
- Install WebView2 Runtime (usually pre-installed on Windows 10/11)

**macOS:**
```bash
xcode-select --install
```

**Ubuntu/Debian:**
```bash
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

**Fedora:**
```bash
sudo dnf install webkit2gtk3-devel.x86_64 \
    openssl-devel \
    curl \
    wget \
    libappindicator-gtk3 \
    librsvg2-devel
```

## Quick Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Verify Tauri Setup
```bash
node scripts/setup-tauri.js
```

### Step 3: Verify Installation
```bash
npx tauri info
```

## Development Workflow

### Option 1: Two Terminal Approach (Recommended)

**Terminal 1 - Start Vite Dev Server:**
```bash
npm run dev
```
This starts the Vite development server on http://localhost:8080

**Terminal 2 - Start Tauri Dev:**
```bash
npx tauri dev
```
This opens the desktop application window with hot reload

### Option 2: Single Command
```bash
npx tauri dev
```
This automatically starts both the Vite server and Tauri application

## Building for Production

### Step 1: Build the Web Application
```bash
npm run build
```
This creates optimized web assets in the `dist/` folder

### Step 2: Build the Desktop Application
```bash
npx tauri build
```
This creates the desktop application installers

## Build Outputs

After successful build, you'll find installers in:

**Windows:**
- `src-tauri/target/release/bundle/msi/` - MSI installer
- `src-tauri/target/release/bundle/nsis/` - NSIS installer (if configured)

**macOS:**
- `src-tauri/target/release/bundle/dmg/` - DMG installer
- `src-tauri/target/release/bundle/macos/` - App bundle

**Linux:**
- `src-tauri/target/release/bundle/deb/` - DEB package
- `src-tauri/target/release/bundle/appimage/` - AppImage

## Available Commands

```bash
npm run dev          # Start Vite development server on port 8080
npm run build        # Build web application for production
npm run preview      # Preview production build locally
npx tauri dev        # Start Tauri in development mode
npx tauri build      # Build desktop application
npx tauri info       # Show system and Tauri information
```

## GitHub Integration

### Using Lovable's GitHub Integration

1. **In Lovable Editor:**
   - Click the GitHub button in the top right
   - Click "Connect to GitHub"
   - Authorize the Lovable GitHub App
   - Select your GitHub account/organization
   - Enter repository name: `collectify-manager`
   - Click "Create Repository"

2. **Automatic Sync:**
   - All changes in Lovable automatically sync to GitHub
   - Changes pushed to GitHub automatically sync to Lovable
   - This happens in real-time without manual pulls/pushes

### Manual Git Setup (Alternative)

If you prefer manual Git setup:

```bash
# Initialize git repository (if not already done)
git init

# Add remote origin
git remote add origin https://github.com/rizardo-maker/collectify-manager.git

# Add all files
git add .

# Commit initial version
git commit -m "Initial commit: Collectify Manager with Tauri support"

# Push to GitHub
git push -u origin main
```

### Recommended Workflow

1. **Development:**
   - Use Lovable for rapid development and prototyping
   - Changes automatically sync to GitHub

2. **Production Builds:**
   - Set up GitHub Actions for automated builds
   - Create releases with desktop app binaries

3. **Collaboration:**
   - Use GitHub for code reviews and pull requests
   - Continue development in Lovable with real-time sync

## Project Structure

```
collectify-manager/
├── src/                    # React application source
│   ├── components/         # React components
│   ├── pages/             # Application pages
│   ├── utils/             # Utility functions
│   └── main.tsx           # Application entry point
├── src-tauri/             # Tauri backend
│   ├── src/               # Rust source code
│   │   └── main.rs        # Tauri main file
│   ├── icons/             # Application icons
│   ├── Cargo.toml         # Rust dependencies
│   ├── tauri.conf.json    # Tauri configuration
│   └── build.rs           # Build script
├── scripts/               # Helper scripts
│   └── setup-tauri.js     # Tauri setup verification
├── dist/                  # Built web application
├── package.json           # Node.js dependencies
├── vite.config.ts         # Vite configuration
└── README.md              # Project documentation
```

## Features

### Desktop-Specific Features
- Offline access to all functionality
- Native file system operations
- Desktop notifications
- Native dialogs for file operations
- Improved performance over web version

### Supported Platforms
- Windows (x64)
- macOS (Intel & Apple Silicon)
- Linux (x64)

## Troubleshooting

### Common Issues

1. **"Rust not found" error:**
   ```bash
   # Verify Rust installation
   rustc --version
   cargo --version
   ```
   - Restart terminal after Rust installation
   - On Windows, restart computer

2. **"Failed to resolve dependencies" error:**
   ```bash
   # Clean Rust build cache
   cd src-tauri
   cargo clean
   cd ..
   
   # Remove target folder and rebuild
   rm -rf src-tauri/target
   npx tauri build
   ```

3. **"WebView2 not found" (Windows):**
   - Install WebView2 Runtime from Microsoft
   - Most Windows 11 systems have this pre-installed

4. **"Build tools not found" (Windows):**
   - Install Visual Studio Build Tools with C++ workload
   - Ensure Windows SDK is installed

5. **"Missing script: tauri" error:**
   - Ensure @tauri-apps/cli is installed: `npm list @tauri-apps/cli`
   - Use `npx tauri` commands instead of `npm run tauri`
   - Run `npm install` to ensure all dependencies are installed

6. **Port conflicts:**
   - Vite server runs on port 8080
   - If port is busy, kill the process or change port in `vite.config.ts`

7. **Permission errors (Linux/macOS):**
   - Ensure write permissions to project directory
   - Use `sudo` only if necessary for global installations

### Debug Mode

Enable detailed logging:

**Development:**
```bash
TAURI_DEBUG=true npx tauri dev
```

**Build:**
```bash
TAURI_DEBUG=true npx tauri build
```

### Getting Help

1. **Check Tauri documentation:** https://tauri.app/
2. **Verify system requirements:** `npx tauri info`
3. **Run setup script:** `node scripts/setup-tauri.js`
4. **Check GitHub Issues:** Look for similar problems in the repository

## Configuration

### Customizing the Application

**App Metadata:**
- Edit `productName` and `version` in `src-tauri/tauri.conf.json`
- Update bundle identifier: `com.collectify.manager`

**Window Settings:**
```json
{
  "windows": [{
    "title": "Collectify Manager",
    "width": 1400,
    "height": 900,
    "minWidth": 1000,
    "minHeight": 700,
    "center": true,
    "resizable": true
  }]
}
```

**App Icons:**
- Replace icons in `src-tauri/icons/`
- Supported formats: ICO (Windows), ICNS (macOS), PNG (Linux)

**Permissions:**
- Modify `allowlist` in `src-tauri/tauri.conf.json`
- Current permissions: file system, dialogs, notifications, window controls

## Next Steps

1. **Test Development Mode:**
   ```bash
   npm run dev
   npx tauri dev
   ```

2. **Test Production Build:**
   ```bash
   npm run build
   npx tauri build
   ```

3. **Upload to GitHub:**
   - Use Lovable's GitHub integration for automatic sync
   - Repository: https://github.com/rizardo-maker/collectify-manager.git

4. **Distribute Application:**
   - Create GitHub releases with built installers
   - Set up automated builds with GitHub Actions

## Support

For issues specific to this project:
- Check the GitHub repository: https://github.com/rizardo-maker/collectify-manager
- Review Tauri documentation: https://tauri.app/
- Join Tauri Discord community: https://discord.gg/tauri

For Lovable-specific questions:
- Visit: https://docs.lovable.dev/
- Join Discord: https://discord.com/channels/1119885301872070706/1280461670979993613
