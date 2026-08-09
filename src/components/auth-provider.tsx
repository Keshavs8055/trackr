"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut } from "firebase/auth";
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
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      // Execute popup immediately without prior state delay to preserve user event gesture context
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google Auth Error Code:", error?.code);
      console.error("Google Auth Message:", error?.message);
      console.error("Google Auth Full Error:", error);

      // Automatic fallback if popup is blocked by browser restrictions
      if (error?.code === "auth/popup-blocked" || error?.code === "auth/cancelled-popup-request") {
        console.warn("[Auth] Popup blocked by browser. Falling back to signInWithRedirect...");
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError: any) {
          console.error("Google Auth Redirect Fallback Error:", redirectError);
        }
      }
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
