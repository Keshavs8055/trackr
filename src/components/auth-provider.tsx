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
    console.log("[AuthProvider] Mounting AuthProvider. Setting up onAuthStateChanged listener.");

    try {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!isMounted) {
          console.log("[AuthProvider] onAuthStateChanged fired but component was already unmounted.");
          return;
        }
        
        console.log("[AuthProvider] Auth state changed. Active Firebase User:", firebaseUser ? {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified,
          isAnonymous: firebaseUser.isAnonymous,
        } : "GUEST/NULL");

        setUser(firebaseUser);
        setLoading(false);

        if (firebaseUser) {
          try {
            console.log("[AuthProvider] User detected, initializing secure credentials vault for UID:", firebaseUser.uid);
            providerService.initializeCredentials(firebaseUser.uid);
            console.log("[AuthProvider] Credentials vault initialization requested.");
          } catch (err) {
            console.error("[AuthProvider] Failed to initialize credentials vault on auth change:", err);
          }
        }
      });

      return () => {
        console.log("[AuthProvider] Unmounting AuthProvider. Cleaning up onAuthStateChanged listener.");
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      console.error("[AuthProvider] Critical: Failed to register onAuthStateChanged listener:", e);
      if (isMounted) {
        setLoading(false);
      }
    }
  }, []);

  const signInWithGoogle = async () => {
    console.log("[AuthProvider] signInWithGoogle invoked.");
    const provider = new GoogleAuthProvider();
    
    // Configure default custom parameters if any, or log scopes
    console.log("[AuthProvider] Initialized GoogleAuthProvider:", {
      providerId: provider.providerId,
      customParameters: provider.getCustomParameters(),
    });
    
    try {
      console.log("[AuthProvider] Executing signInWithPopup...");
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      console.log("[AuthProvider] signInWithPopup successfully completed.", {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        credentialProviderId: credential?.providerId,
      });
    } catch (error: any) {
      console.error("[AuthProvider] signInWithPopup failed. Detailed error report:");
      if (error && typeof error === "object") {
        console.error("- Error Code:", error.code);
        console.error("- Error Message:", error.message);
        console.error("- Error Name:", error.name);
        console.error("- Custom Data:", error.customData);
        console.error("- Stack Trace:", error.stack);
      } else {
        console.error("- Unknown error:", error);
      }
    }
  };

  const logout = async () => {
    console.log("[AuthProvider] logout invoked. Active user before logout:", user ? user.uid : "NONE");
    try {
      setUser(null);
      await signOut(auth);
      console.log("[AuthProvider] signOut successfully completed on Firebase.");
    } catch (error: any) {
      console.error("[AuthProvider] signOut failed. Detailed error:", {
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
      });
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
