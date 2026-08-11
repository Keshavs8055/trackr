"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  signOut 
} from "firebase/auth";
import { auth } from "@/services/firebase";
import { providerService } from "@/services/provider-service";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleRedirect: () => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithGoogleRedirect: async () => {},
  logout: async () => {},
  authError: null,
  clearAuthError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[AuthProvider] Clearing authentication error state.");
    }
    setAuthError(null);
  };

  useEffect(() => {
    let isMounted = true;
    if (process.env.NODE_ENV !== "production") {
      console.log("[AuthProvider] Mounting AuthProvider. Setting up onAuthStateChanged listener.");
    }

    // Check redirect result on mount to resolve pending sign-in redirects
    getRedirectResult(auth)
      .then((result) => {
        if (!isMounted) return;
        if (result && process.env.NODE_ENV !== "production") {
          console.log("[AuthProvider] getRedirectResult successfully returned user session.");
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("[AuthProvider] getRedirectResult error:", error?.code, error?.message);
        
        const errorCode = error?.code || "";
        if (errorCode === "auth/unauthorized-domain") {
          setAuthError("Unauthorized Domain: Please verify that this domain is added to Authorized Domains in the Firebase Console under Authentication -> Settings.");
        } else {
          setAuthError(`Redirect sign-in failed: ${error?.message || "Unknown error"}`);
        }
      });

    try {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!isMounted) return;
        
        if (process.env.NODE_ENV !== "production") {
          console.log("[AuthProvider] Auth state changed. User present:", !!firebaseUser);
        }

        setUser(firebaseUser);
        setLoading(false);

        if (firebaseUser) {
          try {
            providerService.initializeCredentials(firebaseUser.uid);
          } catch (err) {
            console.error("[AuthProvider] Failed to initialize credentials vault on auth change:", err);
          }
        }
      });

      return () => {
        if (process.env.NODE_ENV !== "production") {
          console.log("[AuthProvider] Unmounting AuthProvider.");
        }
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
    if (process.env.NODE_ENV !== "production") {
      console.log("[AuthProvider] signInWithGoogle (popup) invoked.");
    }
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      GoogleAuthProvider.credentialFromResult(result);
      if (process.env.NODE_ENV !== "production") {
        console.log("[AuthProvider] signInWithPopup successfully completed.");
      }
    } catch (error: any) {
      console.error("[AuthProvider] signInWithPopup error:", error?.code, error?.message);

      const errorCode = error?.code || "";
      const errorMessage = error?.message || "";

      if (errorCode === "auth/popup-blocked") {
        setAuthError("Popup blocked by browser. Automatically redirecting to Google Sign-In...");
        
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError: any) {
          console.error("[AuthProvider] signInWithRedirect fallback error:", redirectError?.code, redirectError?.message);
          setAuthError(`Redirect sign-in failed: ${redirectError?.message || "Unknown error"}`);
        }
      } else if (errorCode === "auth/popup-closed-by-user") {
        setAuthError("Sign-in popup was closed before completion. Please try again.");
      } else if (errorCode === "auth/unauthorized-domain") {
        setAuthError("Unauthorized Domain: Please add this domain to the Authorized Domains list in the Firebase Console under Authentication -> Settings.");
      } else {
        setAuthError(`Sign-in failed: ${errorMessage || "An unexpected authentication error occurred."}`);
      }
    }
  };

  const signInWithGoogleRedirect = async () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[AuthProvider] signInWithGoogleRedirect invoked.");
    }
    setAuthError("Redirecting to Google Sign-In...");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("[AuthProvider] signInWithRedirect error:", error?.code, error?.message);
      const errorCode = error?.code || "";
      if (errorCode === "auth/unauthorized-domain") {
        setAuthError("Unauthorized Domain: Please add this domain to the Authorized Domains list in the Firebase Console under Authentication -> Settings.");
      } else {
        setAuthError(`Redirect sign-in failed: ${error?.message || "Unknown error"}`);
      }
    }
  };

  const logout = async () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[AuthProvider] logout invoked.");
    }
    try {
      setUser(null);
      await signOut(auth);
    } catch (error: any) {
      console.error("[AuthProvider] signOut error:", error?.code, error?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signInWithGoogle, 
      signInWithGoogleRedirect, 
      logout, 
      authError, 
      clearAuthError 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
