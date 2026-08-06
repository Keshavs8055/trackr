"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "@/services/firebase";
import { providerService } from "@/services/provider-service";

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
    let isMounted = true;

    // Safety timeout: Ensure loading transitions to completed state if auth takes too long
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 1500);

    // Check for demo mode session (set when user explicitly clicked "Try Demo Mode")
    const isDemoSession = typeof window !== "undefined" && localStorage.getItem("trackr_auth_demo") === "true";
    if (isDemoSession) {
      const mockUser = {
        uid: 'mock-user-id',
        displayName: 'Test User',
        email: 'test@trackr.app',
        photoURL: 'https://ui-avatars.com/api/?name=Test+User&background=random',
      };
      setUser(mockUser as any);
      setLoading(false);
      clearTimeout(safetyTimer);
      
      // Asynchronously load credentials for demo user
      try {
        providerService.initializeCredentials('mock-user-id');
      } catch (err) {
        console.warn("Credential initialization failed in demo mode:", err);
      }
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!isMounted) return;
        setUser(firebaseUser);
        setLoading(false);
        clearTimeout(safetyTimer);

        if (firebaseUser) {
          try {
            providerService.initializeCredentials(firebaseUser.uid);
          } catch (err) {
            console.warn("Error initializing credentials on auth state change:", err);
          }
        }
      });

      return () => {
        isMounted = false;
        clearTimeout(safetyTimer);
        unsubscribe();
      };
    } catch (e) {
      console.warn("Firebase Auth not initialized correctly. Falling back to homepage state.");
      if (isMounted) {
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    }
  }, []);

  const signInWithMock = () => {
    // @ts-ignore - Mock user for UI testing
    const mockUser = {
      uid: 'mock-user-id',
      displayName: 'Test User',
      email: 'test@trackr.app',
      photoURL: 'https://ui-avatars.com/api/?name=Test+User&background=random',
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("trackr_auth_demo", "true");
    }
    setUser(mockUser as any);
    try {
      providerService.initializeCredentials('mock-user-id');
    } catch (err) {
      console.warn("Error initializing demo credentials:", err);
    }
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      if (typeof window !== "undefined") {
        localStorage.removeItem("trackr_auth_demo");
      }
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      if (error.code === 'auth/invalid-api-key' || error.message?.includes('api key')) {
        console.warn("Using mock user because Firebase API keys are missing.");
        signInWithMock();
      } else {
        console.warn("Google sign-in failed. Falling back to offline mock mode.");
        signInWithMock();
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("trackr_auth_demo");
      }
      setUser(null);
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithMock, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
