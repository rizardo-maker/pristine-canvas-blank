
# Collectify Manager - Android Development with Tauri

This guide will help you set up Android development for the Collectify Manager app using Tauri.

## Prerequisites

1. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK and build tools
   - Set up Android Virtual Device (AVD) for testing

2. **Install Java Development Kit (JDK)**
   - Install JDK 11 or later
   - Set JAVA_HOME environment variable

3. **Install Android NDK**
   - Open Android Studio
   - Go to SDK Manager > SDK Tools
   - Install Android NDK (Side by side)

4. **Install Rust Android Targets**
   ```bash
   rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
   ```

## Environment Setup

### Windows
```cmd
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set NDK_HOME=%ANDROID_HOME%\ndk\[version]
set JAVA_HOME=C:\Program Files\Java\jdk-11.0.x
```

### macOS/Linux
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export NDK_HOME=$ANDROID_HOME/ndk/[version]
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

Add these to your shell profile (.bashrc, .zshrc, etc.)

## Development Commands

### Initialize Android Project
```bash
# First time setup
cargo tauri android init
```

### Development Mode
```bash
# Start development server
npm run dev

# In another terminal, run Android app
cargo tauri android dev
```

### Building for Production
```bash
# Build the web assets
npm run build

# Build Android APK
cargo tauri android build

# Build Android App Bundle (AAB) for Play Store
cargo tauri android build --target aab
```

## Device Testing

### Using Android Emulator
1. Open Android Studio
2. Start an AVD (Android Virtual Device)
3. Run `cargo tauri android dev`

### Using Physical Device
1. Enable Developer Options on your device
2. Enable USB Debugging
3. Connect device via USB
4. Run `cargo tauri android dev`

## Troubleshooting

### Common Issues

1. **"Android SDK not found"**
   - Verify ANDROID_HOME is set correctly
   - Install Android SDK via Android Studio

2. **"NDK not found"**
   - Install Android NDK via SDK Manager
   - Set NDK_HOME environment variable

3. **"Java not found"**
   - Install JDK 11 or later
   - Set JAVA_HOME environment variable

4. **Build failures**
   - Clean build: `cargo clean` then rebuild
   - Update Rust targets: `rustup update`
   - Check Android SDK and build tools versions

### Debugging
```bash
# View Android logs
adb logcat

# View Tauri logs with debug info
TAURI_DEBUG=true cargo tauri android dev
```

## App Distribution

### Google Play Store
1. Build release AAB: `cargo tauri android build --target aab --release`
2. Sign the AAB with your keystore
3. Upload to Google Play Console

### Direct Distribution
1. Build release APK: `cargo tauri android build --release`
2. Sign the APK with your keystore
3. Distribute directly to users

## Features Available on Android

- Native Android UI integration
- File system access (with permissions)
- Camera access
- Network operations
- Local notifications
- Offline functionality
- Hardware back button support

## Performance Tips

- Use `--release` flag for production builds
- Optimize images and assets
- Test on various Android versions and devices
- Use Android profiling tools for performance analysis

## Security Considerations

- Request only necessary permissions
- Validate all user inputs
- Use HTTPS for network requests
- Follow Android security best practices
