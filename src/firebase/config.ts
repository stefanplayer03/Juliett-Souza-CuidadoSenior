import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Default demo / placeholder config fallback
const defaultConfig = {
  apiKey: firebaseConfig.apiKey || "AIzaSyDemoPlaceholderKey123456789",
  authDomain: firebaseConfig.authDomain || "cuidado-senior-demo.firebaseapp.com",
  projectId: firebaseConfig.projectId || "cuidado-senior-demo",
  storageBucket: firebaseConfig.storageBucket || "cuidado-senior-demo.appspot.com",
  messagingSenderId: firebaseConfig.messagingSenderId || "123456789012",
  appId: firebaseConfig.appId || "1:123456789012:web:demo123456789"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let isRealFirebase = false;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  auth = getAuth(app);
  
  const databaseId = (firebaseConfig as any).firestoreDatabaseId;
  if (databaseId && databaseId !== '(default)') {
    db = getFirestore(app, databaseId);
  } else {
    db = getFirestore(app);
  }
  
  storage = getStorage(app);
  isRealFirebase = true;
  console.log("Firebase activated successfully with project:", firebaseConfig.projectId);
} catch (err) {
  console.warn('Firebase init fallback mode activated:', err);
  app = !getApps().length ? initializeApp(defaultConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export const googleProvider = new GoogleAuthProvider();

export async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection verified.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Client is running in offline mode.");
    }
  }
}

export { app, auth, db, storage, isRealFirebase };
