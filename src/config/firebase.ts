
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator, goOffline, goOnline } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCiK5LoaTLGxgWQyBRShydqTwlDBAbPaD4",
  authDomain: "line-manager-app.firebaseapp.com",
  databaseURL: "https://line-manager-app-default-rtdb.firebaseio.com",
  projectId: "line-manager-app",
  storageBucket: "line-manager-app.firebasestorage.app",
  messagingSenderId: "1026229395798",
  appId: "1:1026229395798:web:529363db23144e919536f7",
  measurementId: "G-GRF0MF93X6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Realtime Database and get a reference to the service
export const realtimeDb = getDatabase(app);

// Configure offline persistence for better sync
if (typeof window !== 'undefined') {
  // Enable offline persistence for Realtime Database
  console.log('Configuring Firebase Realtime Database for offline persistence');
  
  // Monitor connection state
  window.addEventListener('online', () => {
    console.log('Device online - enabling Firebase sync');
    goOnline(realtimeDb);
  });
  
  window.addEventListener('offline', () => {
    console.log('Device offline - Firebase will cache changes locally');
    // Don't call goOffline() - let Firebase handle it automatically
  });
}

export default app;
