
'use client';

import { getFirebase } from "@/lib/firebase";
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
  updateDoc,
  writeBatch
} from "firebase/firestore";
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export interface User {
    id: string;
    name: string;
    passwordHash?: string;
}

// This function should only be called in a secure, server-like environment
// if you were to deploy this for real production. For this sample, we are
// simplifying by having it run on the client, but this is not recommended
// for real applications.
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
            const DEFAULT_USERS = [
              { name: "isabella", password: "password123" },
              { name: "studio", password: "firebase" },
              { name: "star", password: "supernova" },
            ];

            const batch = writeBatch(db);

            for (const user of DEFAULT_USERS) {
                const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
                const userRef = doc(usersCollection);
                 batch.set(userRef, {
                    name: user.name.toLowerCase(),
                    passwordHash: passwordHash
                });
            }
            await batch.commit();
            console.log("Default users created successfully.");
        }
    } catch (error) {
        console.error("Error initializing default users:", error);
    }
}

// Call initialization once when the module is loaded.
// This is safe because Firestore writeBatch is idempotent.
// If this were a real production app, this logic would ideally be in a
// backend deployment script or a secure cloud function.
getFirebase().db && initializeDefaultUsers();


export async function getUsers(): Promise<User[]> {
    const { db } = getFirebase();
    if (!db) {
        throw new Error("Firebase not initialized. Cannot fetch users.");
    }
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    return usersSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as User));
}

export async function validateUser(name: string, password_provided: string): Promise<User | null> {
    const { db } = getFirebase();
    if (!db) {
        throw new Error("Could not connect to the database to validate user.");
    }

    try {
        const usersCollection = collection(db, "users");
        const q = query(usersCollection, where("name", "==", name.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log(`User '${name}' not found.`);
            return null; // User not found
        }
        
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as DocumentData;
        const passwordHash = userData.passwordHash;

        if (!passwordHash) {
            // This case handles legacy users that might have been created without a hash.
            // In a real app, you would force a password reset here.
            console.warn(`User '${name}' does not have a password hash.`);
            return null;
        }

        const passwordMatches = await bcrypt.compare(password_provided, passwordHash);

        if (passwordMatches) {
            return { id: userDoc.id, name: userData.name };
        } else {
            return null; // Password incorrect
        }
    } catch (error) {
        console.error("Error during user validation:", error);
        throw new Error("A database error occurred during validation. Please check the connection and logs.");
    }
}


export async function addUser(newUser: {name: string, password?: string}): Promise<{ success: boolean; message: string }> {
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
        
        const passwordHash = await bcrypt.hash(newUser.password, SALT_ROUNDS);

        await addDoc(collection(db, "users"), {
            name: newUser.name.toLowerCase(),
            passwordHash: passwordHash,
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
    
    if (!userData.passwordHash) {
        return { success: false, message: "Cannot change password for a user without a hashed password." };
    }
    
    const passwordMatches = await bcrypt.compare(oldPassword, userData.passwordHash);

    if (!passwordMatches) {
      return { success: false, message: "Incorrect current password." };
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const userDocRef = doc(db, "users", userDoc.id);
    await updateDoc(userDocRef, { passwordHash: newPasswordHash });

    return { success: true, message: "Password updated successfully." };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      message: "An error occurred while updating the password.",
    };
  }
}
