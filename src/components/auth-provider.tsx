"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "@/services/firebase";
import { providerService } from "@/services/provider-service";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
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

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log("Signed in successfully:", result.user);
    } catch (error: any) {
      console.error("CODE:", error?.code);
      console.error("MESSAGE:", error?.message);
      console.error("FULL ERROR:", error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
