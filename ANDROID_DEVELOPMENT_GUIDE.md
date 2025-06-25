
# Android APK Development Guide with Capacitor

This guide will help you build an Android APK from your Lovable project using Capacitor.

## Prerequisites

Before you start, make sure you have:

1. **Node.js** (version 16 or higher)
2. **Android Studio** installed
3. **Java Development Kit (JDK)** 8 or higher
4. **Android SDK** (installed with Android Studio)
5. **Git** installed

## Step-by-Step Setup

### 1. Export Your Project from Lovable

1. Click the "Export to GitHub" button in your Lovable project
2. Create a new GitHub repository or select an existing one
3. Wait for the export to complete

### 2. Clone and Setup Local Development

```bash
# Clone your repository
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name

# Install dependencies
npm install

# Build the project
npm run build
```

### 3. Initialize Capacitor

```bash
# Initialize Capacitor (if not already done)
npx cap init

# Add Android platform
npx cap add android

# Sync the web assets to the native project
npx cap sync android
```

### 4. Configure Android Studio

1. Open Android Studio
2. Open the `android` folder from your project directory
3. Wait for Gradle sync to complete
4. Make sure you have the required SDK versions installed

### 5. Set Up Android Environment Variables

Add these to your system environment variables:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 6. Building the APK

#### For Debug APK (Development):

```bash
# Option 1: Using Capacitor CLI
npx cap run android

# Option 2: Using Android Studio
# Open android folder in Android Studio
# Go to Build > Build Bundle(s) / APK(s) > Build APK(s)
```

#### For Release APK (Production):

1. **Generate Signing Key:**
```bash
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

2. **Configure signing in `android/app/build.gradle`:**
```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

3. **Create `android/gradle.properties`:**
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=****
MYAPP_RELEASE_KEY_PASSWORD=****
```

4. **Build Release APK:**
```bash
cd android
./gradlew assembleRelease
```

### 7. Finding Your APK

- **Debug APK:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK:** `android/app/build/outputs/apk/release/app-release.apk`

## Common Issues and Solutions

### Issue 1: IndexedDB Version Error
Your app uses IndexedDB for local authentication. If you see version errors:

```javascript
// The error occurs because the database version is outdated
// Solution: Clear app data or increment the database version
```

### Issue 2: Network Security
For HTTP requests in production, update `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>
```

### Issue 3: Permissions
Add required permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Testing Your APK

1. **Install on Device:**
```bash
adb install path/to/your/app.apk
```

2. **Test on Emulator:**
   - Open Android Studio
   - Start an emulator
   - Drag and drop the APK file onto the emulator

## App Store Deployment

1. **Prepare for Google Play:**
   - Create app bundle: `./gradlew bundleRelease`
   - Upload AAB file to Google Play Console
   - Fill in store listing details
   - Submit for review

2. **Required Assets:**
   - App icon (512x512 px)
   - Feature graphic (1024x500 px)
   - Screenshots (phone and tablet)
   - Privacy policy URL

## Development Workflow

1. Make changes in Lovable
2. Export to GitHub
3. Pull changes locally: `git pull`
4. Build: `npm run build`
5. Sync: `npx cap sync android`
6. Test: `npx cap run android`

## Useful Commands

```bash
# Update Capacitor
npm install @capacitor/cli@latest @capacitor/core@latest @capacitor/android@latest

# Clean and rebuild
npx cap sync android --clean

# Open in Android Studio
npx cap open android

# Check Capacitor status
npx cap doctor

# List connected devices
adb devices
```

## Support

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/studio)
- [Lovable Documentation](https://docs.lovable.dev)

Remember to always test your APK thoroughly before distributing it!
