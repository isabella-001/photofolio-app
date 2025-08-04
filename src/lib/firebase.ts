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

let app: FirebaseApp;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  // This check is crucial for Next.js to prevent re-initializing on every render.
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e) {
      console.error("Failed to initialize Firebase app", e);
    }
  } else {
    app = getApp();
  }

  if (app) {
    try {
      db = getFirestore(app);
      storage = getStorage(app);
    } catch (e) {
      console.error("Failed to initialize Firebase services", e);
    }
  }
}

interface FirebaseServices {
  app: FirebaseApp | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
}

// This function is the single source of truth for accessing Firebase services.
export function getFirebase(): FirebaseServices {
  // If db is not initialized, it means there's a configuration issue.
  // The isFirebaseConfigured check at the top level handles this.
  return { app: app!, db, storage };
}
