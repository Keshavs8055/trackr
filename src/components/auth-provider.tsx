"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  onIdTokenChanged,
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

const REDIRECT_STORAGE_KEY = "trackr_pending_redirect";

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
      console.log("[AuthProvider] Mounting AuthProvider. Setting up auth listeners.");
    }

    const hadPendingRedirect = typeof window !== "undefined" && sessionStorage.getItem(REDIRECT_STORAGE_KEY) === "true";

    // Only process redirect result if a redirect was pending, or resolve silently without false error alerts
    getRedirectResult(auth)
      .then((result) => {
        if (!isMounted) return;
        if (hadPendingRedirect && typeof window !== "undefined") {
          sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
        }
        if (result && process.env.NODE_ENV !== "production") {
          console.log("[AuthProvider] getRedirectResult successfully returned user session:", result.user.uid);
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        if (hadPendingRedirect && typeof window !== "undefined") {
          sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
        }

        // Only surface errors to the user if a redirect was explicitly initiated
        if (hadPendingRedirect) {
          console.error("[AuthProvider] getRedirectResult error during active redirect:", error?.code, error?.message);
          const errorCode = error?.code || "";
          if (errorCode === "auth/unauthorized-domain") {
            setAuthError("Unauthorized Domain: Please verify that this domain is added to Authorized Domains in the Firebase Console under Authentication -> Settings.");
          } else if (errorCode !== "auth/popup-closed-by-user" && errorCode !== "auth/cancelled-popup-request") {
            setAuthError(`Redirect sign-in failed: ${error?.message || "Unknown error"}`);
          }
        } else if (process.env.NODE_ENV !== "production") {
          console.log("[AuthProvider] Silently handled cold-start getRedirectResult notice:", error?.code);
        }
      });

    try {
      // 1. Initial auth state listener
      const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
        if (!isMounted) return;
        
        if (process.env.NODE_ENV !== "production") {
          console.log("[AuthProvider] onAuthStateChanged resolved. User present:", !!firebaseUser);
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

      // 2. ID token refresh listener to keep background tokens and long-lived PWA sessions synchronized
      const unsubscribeToken = onIdTokenChanged(auth, (firebaseUser) => {
        if (!isMounted) return;
        if (firebaseUser) {
          setUser(firebaseUser);
        }
      });

      return () => {
        if (process.env.NODE_ENV !== "production") {
          console.log("[AuthProvider] Unmounting AuthProvider listeners.");
        }
        isMounted = false;
        unsubscribeAuth();
        unsubscribeToken();
      };
    } catch (e) {
      console.error("[AuthProvider] Critical: Failed to register auth state listeners:", e);
      if (isMounted) {
        setLoading(false);
      }
    }
  }, []);

  const signInWithGoogle = async () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[AuthProvider] signInWithGoogle invoked.");
    }
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    
    // In standalone PWA mode on mobile devices, popups are frequently detached/blocked.
    // Check if running in standalone mode:
    const isStandalone = typeof window !== "undefined" && (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    );

    if (isStandalone) {
      return signInWithGoogleRedirect();
    }

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

      if (errorCode === "auth/popup-blocked" || errorCode === "auth/cancelled-popup-request") {
        return signInWithGoogleRedirect();
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
    if (typeof window !== "undefined") {
      sessionStorage.setItem(REDIRECT_STORAGE_KEY, "true");
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
      }
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
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
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
