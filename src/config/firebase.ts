// Firebase configuration for React Native with fallback to mock
import { mockAuth, mockFirestore } from './mockFirebase';

let firebaseAuth: any;
let firebaseFirestore: any;
let isUsingMock = false;

try {
  // Try to import and use real Firebase
  const auth = require('@react-native-firebase/auth').default;
  const firestore = require('@react-native-firebase/firestore').default;
  const { initializeApp, getApps } = require('@react-native-firebase/app');
  
  // Initialize Firebase only if not already initialized
  if (getApps().length === 0) {
    const firebaseConfig = {
      apiKey: "demo-api-key-123456789",
      authDomain: "medilink-demo.firebaseapp.com",
      projectId: "medilink-demo",
      storageBucket: "medilink-demo.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:android:demo123456789"
    };
    
    initializeApp(firebaseConfig);
  }
  
  // Test if Firebase is properly initialized by trying to get the auth instance
  const authInstance = auth();
  firebaseAuth = auth;
  firebaseFirestore = firestore;
  console.log('Firebase initialized successfully');
} catch (error) {
  console.warn('Firebase initialization failed, using mock services:', error);
  // Fallback to mock services
  firebaseAuth = () => mockAuth;
  firebaseFirestore = () => mockFirestore;
  isUsingMock = true;
}

// Export Firebase services with fallback
export const auth = firebaseAuth;
export const firestore = firebaseFirestore;
export { isUsingMock };
