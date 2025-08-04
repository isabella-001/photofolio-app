import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = !!(
  firebaseConfig.projectId && firebaseConfig.apiKey
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

function initializeFirebase() {
  if (!isFirebaseConfigured) {
    console.error("Firebase is not configured. Please check your environment variables.");
    return;
  }
  
  if (getApps().length === 0) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e) {
      console.error("Failed to initialize Firebase app", e);
      return;
    }
  } else {
    app = getApp();
  }

  try {
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (e) {
    console.error("Failed to initialize Firebase services", e);
    db = null;
    storage = null;
  }
}

// Initialize on module load
initializeFirebase();

interface FirebaseServices {
  app: FirebaseApp | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
}

export function getFirebase(): FirebaseServices {
  return { app, db, storage };
}
