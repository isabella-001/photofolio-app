'use client';

import { db } from "@/lib/firebase";
import {
  collection,
  query,
  getDocs,
  addDoc,
  where,
  deleteDoc,
  doc,
  DocumentData,
  limit
} from "firebase/firestore";

export interface User {
    id: string;
    name: string;
    password?: string; // In a real app, this would be hashed.
}

const DEFAULT_USERS: Omit<User, 'id'>[] = [
  { name: "isabella", password: "password123" },
  { name: "studio", password: "firebase" },
  { name: "star", password: "supernova" },
];

/**
 * Initializes default users if the 'users' collection is empty.
 * This is a one-time operation for a new database.
 */
async function initializeDefaultUsers() {
    if (!db) return;
    try {
        const usersCollection = collection(db, "users");
        // Check for any document. Using limit(1) is efficient.
        const snapshot = await getDocs(query(usersCollection, limit(1)));
        if (snapshot.empty) {
            console.log("No users found in Firestore. Initializing default users...");
            const promises = DEFAULT_USERS.map(user => 
                addDoc(usersCollection, {
                    name: user.name.toLowerCase(),
                    password: user.password
                })
            );
            await Promise.all(promises);
        }
    } catch (error) {
        console.error("Error initializing default users:", error);
        // Re-throw as a standard error to be caught by callers
        throw new Error("Could not initialize default users in the database.");
    }
}

/**
 * Fetches all users from Firestore.
 */
export async function getUsers(): Promise<User[]> {
    if (!db) {
        console.error("Firebase not initialized. Cannot fetch users.");
        return [];
    }
    // Ensure defaults are created if the app is started for the first time.
    await initializeDefaultUsers();
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

/**
 * Validates a user's credentials against Firestore.
 */
export async function validateUser(name: string, password_provided: string): Promise<User | null> {
    if (!db) return null;
    
    try {
        // Ensure defaults are available on first login attempt.
        await initializeDefaultUsers();

        const usersCollection = collection(db, "users");
        const q = query(usersCollection, where("name", "==", name.toLowerCase()));
        
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null; // User not found
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as DocumentData;

        if (userData.password === password_provided) {
            return { id: userDoc.id, name: userData.name, password: userData.password };
        }

        return null; // Password incorrect
    } catch (error) {
        console.error("Error during user validation:", error);
        throw new Error("Could not connect to the database to validate user.");
    }
}

/**
 * Adds a new user to Firestore.
 */
export async function addUser(newUser: Omit<User, 'id'>): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database connection not available.' };
    }
    if (!newUser.name || !newUser.password) {
        return { success: false, message: 'Name and password are required.' };
    }

    const usersCollection = collection(db, "users");
    const q = query(usersCollection, where("name", "==", newUser.name.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        return { success: false, message: 'A user with this name already exists.' };
    }
    
    await addDoc(collection(db, "users"), {
        name: newUser.name.toLowerCase(),
        password: newUser.password
    });

    return { success: true, message: 'Signup successful!' };
}

/**
 * Removes a user from Firestore by name.
 */
export async function removeUser(name: string): Promise<{ success: boolean }> {
    if (!db) return { success: false };
    if (name.toLowerCase() === 'star') {
        console.warn("Attempted to remove the protected 'star' user.");
        return { success: false };
    }

    const usersCollection = collection(db, "users");
    const q = query(usersCollection, where("name", "==", name.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return { success: false }; // User not found
    }

    const userDocRef = doc(db, "users", querySnapshot.docs[0].id);
    await deleteDoc(userDocRef);
    
    return { success: true };
}
