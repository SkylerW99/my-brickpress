//set up firebase authentication and export functions for signing in, signing out, and listening to auth state changes

import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getApps } from "firebase/app";

// Reuse the existing Firebase app (already initialized in firebase.js)
const app = getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Sign in with Google popup
export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

// Sign out
export const logOut = () => {
  return signOut(auth);
};

// Listen for auth state changes
// Returns an unsubscribe function
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { auth };
