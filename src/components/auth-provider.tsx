"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "@/services/firebase";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMock: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithMock: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If auth is not initialized correctly (e.g. mock keys), it might throw.
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase Auth not initialized correctly. Using mock state.");
      setLoading(false);
    }
  }, []);

  const signInWithMock = () => {
    // @ts-ignore - Mock user for UI testing
    setUser({
      uid: 'mock-user-id',
      displayName: 'Test User',
      email: 'test@trackr.app',
      photoURL: 'https://ui-avatars.com/api/?name=Test+User&background=random',
    });
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      if (error.code === 'auth/invalid-api-key' || error.message.includes('api key')) {
        console.warn("Using mock user because Firebase API keys are missing.");
        signInWithMock();
      } else {
        alert("Failed to sign in. Check console for details.");
      }
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithMock, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
