'use client';

// In a real application, this would be a database call.
// Storing users like this is for demonstration purposes only and is not secure.
const USERS_KEY = 'photoFolioUsers';

const DEFAULT_USERS: User[] = [
  { name: "isabella", password: "password123" },
  { name: "studio", password: "firebase" },
  { name: "star", password: "supernova" },
];

export interface User {
    name: string;
    password?: string;
}

const isBrowser = typeof window !== 'undefined';

export function getUsers(): User[] {
    if (!isBrowser) {
        return []; // Return empty array on server to avoid hydration mismatch
    }
    try {
        const usersJson = localStorage.getItem(USERS_KEY);
        if (usersJson) {
            return JSON.parse(usersJson);
        } else {
            // Initialize with default users if none are found
            localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
            return DEFAULT_USERS;
        }
    } catch (e) {
        console.error("Couldn't use localStorage to get users", e);
        // Fallback to default users in case of error
        return DEFAULT_USERS;
    }
}

function saveUsers(users: User[]) {
    if (!isBrowser) {
        return;
    }
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
        console.error("Couldn't use localStorage to save users", e);
    }
}

export function addUser(newUser: User): { success: boolean, message: string } {
    if (!newUser.name || !newUser.password) {
        return { success: false, message: 'Name and password are required.' };
    }
    
    const users = getUsers();
    if (users.find(u => u.name.toLowerCase() === newUser.name.toLowerCase())) {
        return { success: false, message: 'A user with this name already exists.' };
    }

    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    return { success: true, message: 'Signup successful!' };
}

export function removeUser(name: string): { success: boolean } {
    if (!isBrowser) {
        return { success: false };
    }
    if (name.toLowerCase() === 'star') {
        console.warn("Attempted to remove the protected 'star' user.");
        return { success: false };
    }
    let users = getUsers();
    const initialLength = users.length;
    users = users.filter(u => u.name.toLowerCase() !== name.toLowerCase());

    if (users.length < initialLength) {
        saveUsers(users);
        return { success: true };
    }
    return { success: false };
}
