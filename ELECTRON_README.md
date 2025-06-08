
# Converting to Desktop Application with Electron

This guide will help you convert the Finance web application to a desktop application using Electron.

## Prerequisites

1. Install Node.js and npm
   - Download Node.js from [https://nodejs.org/](https://nodejs.org/)
   - Choose the LTS (Long Term Support) version
   - Run the installer and follow the instructions
   - Verify installation by opening Command Prompt and typing:
     ```
     node -v
     npm -v
     ```

2. Clone or download this project to your computer

## Setting Up Electron

1. Open Command Prompt or Terminal in the project folder

2. Install dependencies:
   ```
   npm install
   ```

3. Install Electron and related packages:
   ```
   npm install electron electron-builder concurrently --save-dev
   ```

## Development

To run the app in development mode:

```
npm run electron:dev
```

This will start the Vite dev server and launch the Electron application.

## Building the Desktop Application

To build the distributable version:

```
npm run electron:build
```

This will create the desktop application in the `release` folder.

## Using the Default Login

Use these credentials to access the application:
- Email: sudhenreddym12345@gmail.com
- Password: surya1983

## Data Synchronization Between Devices

Important notes about data sync:

1. Data is stored locally on each device using IndexedDB
2. Using the same login credentials on multiple devices does NOT automatically sync data between them
3. Each device maintains its own local database
4. The sync status indicator shows when data was last saved locally on THIS device

To view the same data across devices, you would need to implement a backend server with a database, which is beyond the scope of this Electron conversion.
