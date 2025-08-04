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

function initializeFirebaseServices() {
    if (!isFirebaseConfigured) {
        console.warn("Firebase is not configured. Please create a .env file with your project credentials.");
        return { app: null, db: null, storage: null };
    }

    try {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        const db = getFirestore(app);
        const storage = getStorage(app);
        return { app, db, storage };
    } catch (e) {
        console.error("Failed to initialize Firebase", e);
        return { app: null, db: null, storage: null };
    }
}

const { app, db, storage } = initializeFirebaseServices();

interface FirebaseServices {
    app: FirebaseApp | null;
    db: Firestore | null;
    storage: FirebaseStorage | null;
}

export function getFirebase(): FirebaseServices {
    return { app, db, storage };
}

export { app, db, storage };
