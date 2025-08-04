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

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

// This boolean flag can be used in your components to check if Firebase is configured.
export const isFirebaseConfigured = !!(
  firebaseConfig.projectId && firebaseConfig.apiKey
);

function initializeFirebase() {
  if (isFirebaseConfigured && !getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      storage = getStorage(app);
    } catch (e) {
      console.error("Failed to initialize Firebase", e);
    }
  } else if (getApps().length) {
    app = getApp();
    db = getFirestore(app);
    storage = getStorage(app);
  } else {
     console.warn("Firebase is not configured. Please create a .env file with your project credentials.");
  }
}

// Call initialization
initializeFirebase();

interface FirebaseServices {
    app: FirebaseApp | null;
    db: Firestore | null;
    storage: FirebaseStorage | null;
}

// Export a getter function to ensure services are initialized before use
export function getFirebase(): FirebaseServices {
    if (!app || !db || !storage) {
        initializeFirebase();
    }
    return { app, db, storage };
}

export { app, db, storage };
