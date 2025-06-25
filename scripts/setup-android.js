
const fs = require('fs');
const path = require('path');

// Create necessary directories and files for Android development
const setupAndroid = () => {
  console.log('🚀 Setting up Android development environment...');

  // Create android resources directory structure
  const resourceDirs = [
    'android/app/src/main/res/drawable',
    'android/app/src/main/res/mipmap-hdpi',
    'android/app/src/main/res/mipmap-mdpi',
    'android/app/src/main/res/mipmap-xhdpi',
    'android/app/src/main/res/mipmap-xxhdpi',
    'android/app/src/main/res/mipmap-xxxhdpi',
    'android/app/src/main/res/values',
    'android/app/src/main/res/xml'
  ];

  resourceDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });

  // Create network security config
  const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">192.168.1.1</domain>
    </domain-config>
</network-security-config>`;

  const networkConfigPath = path.join(process.cwd(), 'android/app/src/main/res/xml/network_security_config.xml');
  if (!fs.existsSync(networkConfigPath)) {
    fs.writeFileSync(networkConfigPath, networkSecurityConfig);
    console.log('✅ Created network security config');
  }

  // Create strings.xml
  const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Collectify Manager</string>
    <string name="title_activity_main">Collectify Manager</string>
    <string name="package_name">app.lovable.40f8d75ce7e44e8dbbb932582ca952ac</string>
    <string name="custom_url_scheme">app.lovable.40f8d75ce7e44e8dbbb932582ca952ac</string>
</resources>`;

  const stringsPath = path.join(process.cwd(), 'android/app/src/main/res/values/strings.xml');
  if (!fs.existsSync(stringsPath)) {
    fs.writeFileSync(stringsPath, stringsXml);
    console.log('✅ Created strings.xml');
  }

  console.log('🎉 Android setup completed!');
  console.log('\nNext steps:');
  console.log('1. Run: npx cap add android');
  console.log('2. Run: npx cap sync android');
  console.log('3. Run: npx cap open android');
};

setupAndroid();
