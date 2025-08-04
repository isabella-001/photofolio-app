
'use client';

import { getFirebase, isFirebaseConfigured } from "@/lib/firebase";
import {
  collection,
  query,
  getDocs,
  addDoc,
  where,
  deleteDoc,
  doc,
  DocumentData,
  limit,
  updateDoc
} from "firebase/firestore";

export interface User {
    id: string;
    name: string;
    password?: string;
}

const DEFAULT_USERS: Omit<User, 'id'>[] = [
  { name: "isabella", password: "password123" },
  { name: "studio", password: "firebase" },
  { name: "star", password: "supernova" },
];

async function initializeDefaultUsers() {
    const { db } = getFirebase();
    if (!db) {
        console.warn("Database not available, skipping default user initialization.");
        return;
    }
    try {
        const usersCollection = collection(db, "users");
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
    }
}

// Call initialization once when the module is loaded.
if (isFirebaseConfigured) {
    initializeDefaultUsers();
}

export async function getUsers(): Promise<User[]> {
    const { db } = getFirebase();
    if (!db) {
        throw new Error("Firebase not initialized. Cannot fetch users.");
    }
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

export async function validateUser(name: string, password_provided: string): Promise<User | null> {
    if (!isFirebaseConfigured) {
        throw new Error("Firebase is not configured. Please add NEXT_PUBLIC_FIREBASE_* variables to your environment.");
    }
    const { db } = getFirebase();
    if (!db) {
        throw new Error("Could not connect to the database to validate user.");
    }

    try {
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
        throw new Error("A database error occurred during validation. Please check the connection and logs.");
    }
}


export async function addUser(newUser: Omit<User, 'id'>): Promise<{ success: boolean; message: string }> {
     if (!isFirebaseConfigured) {
        return { success: false, message: 'Firebase is not configured. Please add NEXT_PUBLIC_FIREBASE_* variables to your environment.' };
    }
    const { db } = getFirebase();
    if (!db) {
        return { success: false, message: 'Database connection not available.' };
    }
    if (!newUser.name || !newUser.password) {
        return { success: false, message: 'Name and password are required.' };
    }

    try {
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
    } catch (error) {
        console.error("Error adding user:", error);
        return { success: false, message: "A database error occurred while adding the user." };
    }
}


export async function removeUser(name: string): Promise<{ success: boolean; message?: string }> {
    const { db } = getFirebase();
    if (!db) return { success: false, message: "Database connection not available." };
    if (name.toLowerCase() === 'star') {
        return { success: false, message: "The 'star' user cannot be removed." };
    }

    try {
        const usersCollection = collection(db, "users");
        const q = query(usersCollection, where("name", "==", name.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, message: "User not found." };
        }

        const userDocRef = doc(db, "users", querySnapshot.docs[0].id);
        await deleteDoc(userDocRef);
        
        return { success: true };
    } catch (error) {
        console.error("Error removing user:", error);
        return { success: false, message: "A database error occurred while removing the user." };
    }
}

export async function updateUserPassword(
  name: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const { db } = getFirebase();
  if (!db) {
    return { success: false, message: "Database connection not available." };
  }

  try {
    const usersCollection = collection(db, "users");
    const q = query(usersCollection, where("name", "==", name.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: "User not found." };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.password !== oldPassword) {
      return { success: false, message: "Incorrect current password." };
    }

    const userDocRef = doc(db, "users", userDoc.id);
    await updateDoc(userDocRef, { password: newPassword });

    return { success: true, message: "Password updated successfully." };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      message: "An error occurred while updating the password.",
    };
  }
}
