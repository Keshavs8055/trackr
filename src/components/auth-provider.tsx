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
  isResolvingRedirect: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleRedirect: () => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const REDIRECT_STORAGE_KEY = "trackr_pending_redirect";
const REDIRECT_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

const checkPendingRedirect = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const sessionFlag = sessionStorage.getItem(REDIRECT_STORAGE_KEY);
    const localFlag = localStorage.getItem(REDIRECT_STORAGE_KEY);
    if (sessionFlag === "true") return true;
    if (localFlag) {
      const timestamp = parseInt(localFlag, 10);
      if (!isNaN(timestamp) && Date.now() - timestamp < REDIRECT_MAX_AGE_MS) {
        return true;
      }
      localStorage.removeItem(REDIRECT_STORAGE_KEY);
    }
  } catch (e) {
    console.warn("[AuthProvider] Error reading redirect storage flags:", e);
  }
  return false;
};

const markPendingRedirect = () => {
  if (typeof window === "undefined") return;
  try {
    const nowStr = Date.now().toString();
    sessionStorage.setItem(REDIRECT_STORAGE_KEY, "true");
    localStorage.setItem(REDIRECT_STORAGE_KEY, nowStr);
  } catch (e) {
    console.warn("[AuthProvider] Error setting redirect storage flags:", e);
  }
};

const clearPendingRedirect = () => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
    localStorage.removeItem(REDIRECT_STORAGE_KEY);
  } catch (e) {
    console.warn("[AuthProvider] Error clearing redirect storage flags:", e);
  }
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isResolvingRedirect: false,
  signInWithGoogle: async () => {},
  signInWithGoogleRedirect: async () => {},
  logout: async () => {},
  authError: null,
  clearAuthError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isResolvingRedirect, setIsResolvingRedirect] = useState(() => checkPendingRedirect());
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

    const hadPendingRedirect = checkPendingRedirect();
    let redirectResolved = false;

    if (hadPendingRedirect && process.env.NODE_ENV !== "production") {
      console.log("[AuthProvider] Pending redirect detected. Holding loading state for resolution.");
    }

    // Process redirect result if returning from an OAuth redirect
    getRedirectResult(auth)
      .then((result) => {
        redirectResolved = true;
        clearPendingRedirect();
        if (!isMounted) return;
        setIsResolvingRedirect(false);

        if (result && result.user) {
          if (process.env.NODE_ENV !== "production") {
            console.log("[AuthProvider] getRedirectResult successfully authenticated user:", result.user.uid);
          }
          setUser(result.user);
          setLoading(false);
          try {
            providerService.initializeCredentials(result.user.uid);
          } catch (err) {
            console.error("[AuthProvider] Failed to initialize credentials vault on redirect:", err);
          }
        } else if (hadPendingRedirect) {
          if (process.env.NODE_ENV !== "production") {
            console.log("[AuthProvider] getRedirectResult returned no user session after redirect.");
          }
          // Do not force set user to null here if onAuthStateChanged hasn't finished
        }
      })
      .catch((error) => {
        redirectResolved = true;
        clearPendingRedirect();
        if (!isMounted) return;
        setIsResolvingRedirect(false);

        if (hadPendingRedirect) {
          console.error("[AuthProvider] getRedirectResult error during redirect resolution:", error?.code, error?.message);
          const errorCode = error?.code || "";
          if (errorCode === "auth/unauthorized-domain") {
            setAuthError("Unauthorized Domain: Please verify that this domain is added to Authorized Domains in the Firebase Console under Authentication -> Settings.");
          } else if (errorCode !== "auth/popup-closed-by-user" && errorCode !== "auth/cancelled-popup-request") {
            setAuthError(`Redirect sign-in failed: ${error?.message || "Unknown error"}`);
          }
          setLoading(false);
        } else if (process.env.NODE_ENV !== "production") {
          console.log("[AuthProvider] Handled cold-start getRedirectResult notice:", error?.code);
        }
      });

    try {
      // 1. Initial auth state listener
      const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
        if (!isMounted) return;
        
        if (process.env.NODE_ENV !== "production") {
          console.log("[AuthProvider] onAuthStateChanged resolved. User present:", !!firebaseUser);
        }

        if (firebaseUser) {
          setUser(firebaseUser);
          setLoading(false);
          setIsResolvingRedirect(false);
          clearPendingRedirect();

          try {
            providerService.initializeCredentials(firebaseUser.uid);
          } catch (err) {
            console.error("[AuthProvider] Failed to initialize credentials vault on auth change:", err);
          }
        } else {
          // If we are still actively waiting for a pending redirect result, don't flash null state yet
          if (!hadPendingRedirect || redirectResolved) {
            setUser(null);
            setLoading(false);
            setIsResolvingRedirect(false);
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

      // Safety timeout: if redirect resolution hangs for more than 8 seconds, unblock the UI
      let timeoutId: NodeJS.Timeout | null = null;
      if (hadPendingRedirect) {
        timeoutId = setTimeout(() => {
          if (isMounted && !redirectResolved) {
            console.warn("[AuthProvider] Redirect resolution timed out. Unblocking UI.");
            clearPendingRedirect();
            setIsResolvingRedirect(false);
            setLoading(false);
          }
        }, 8000);
      }

      return () => {
        if (process.env.NODE_ENV !== "production") {
          console.log("[AuthProvider] Unmounting AuthProvider listeners.");
        }
        isMounted = false;
        if (timeoutId) clearTimeout(timeoutId);
        unsubscribeAuth();
        unsubscribeToken();
      };
    } catch (e) {
      console.error("[AuthProvider] Critical: Failed to register auth state listeners:", e);
      queueMicrotask(() => {
        if (isMounted) {
          setLoading(false);
          setIsResolvingRedirect(false);
        }
      });
    }
  }, []);

  const signInWithGoogle = async () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[AuthProvider] signInWithGoogle invoked.");
    }
    setAuthError(null);

    // Network check for PWA/offline usability
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setAuthError("You are currently offline. An active internet connection is required to sign in.");
      return;
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      // In modern desktop and Android PWAs, popup auth works cleanly and avoids context loss.
      // We attempt popup first, gracefully falling back to redirect if the browser or platform blocks it.
      const result = await signInWithPopup(auth, provider);
      GoogleAuthProvider.credentialFromResult(result);
      if (process.env.NODE_ENV !== "production") {
        console.log("[AuthProvider] signInWithPopup successfully completed.");
      }
    } catch (error: unknown) {
      const authErr = error as { code?: string; message?: string };
      console.error("[AuthProvider] signInWithPopup error:", authErr?.code, authErr?.message);

      const errorCode = authErr?.code || "";
      const errorMessage = authErr?.message || "";

      if (errorCode === "auth/popup-blocked" || errorCode === "auth/cancelled-popup-request") {
        if (process.env.NODE_ENV !== "production") {
          console.log("[AuthProvider] Popup blocked or cancelled by browser. Falling back to redirect flow.");
        }
        return signInWithGoogleRedirect();
      } else if (errorCode === "auth/popup-closed-by-user") {
        setAuthError("Sign-in popup was closed before completion. Please try again.");
      } else if (errorCode === "auth/unauthorized-domain") {
        setAuthError("Unauthorized Domain: Please add this domain to the Authorized Domains list in the Firebase Console under Authentication -> Settings.");
      } else if (errorCode === "auth/network-request-failed") {
        setAuthError("Network connection error. Please verify your internet connection and try again.");
      } else {
        setAuthError(`Sign-in failed: ${errorMessage || "An unexpected authentication error occurred."}`);
      }
    }
  };

  const signInWithGoogleRedirect = async () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[AuthProvider] signInWithGoogleRedirect invoked.");
    }
    setAuthError(null);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setAuthError("You are currently offline. An active internet connection is required to sign in.");
      return;
    }

    setAuthError("Redirecting to Google Sign-In...");
    markPendingRedirect();

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      await signInWithRedirect(auth, provider);
    } catch (error: unknown) {
      clearPendingRedirect();
      const authErr = error as { code?: string; message?: string };
      console.error("[AuthProvider] signInWithRedirect error:", authErr?.code, authErr?.message);
      const errorCode = authErr?.code || "";
      if (errorCode === "auth/unauthorized-domain") {
        setAuthError("Unauthorized Domain: Please add this domain to the Authorized Domains list in the Firebase Console under Authentication -> Settings.");
      } else {
        setAuthError(`Redirect sign-in failed: ${authErr?.message || "Unknown error"}`);
      }
    }
  };

  const logout = async () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[AuthProvider] logout invoked.");
    }
    clearPendingRedirect();
    try {
      setUser(null);
      await signOut(auth);
    } catch (error: unknown) {
      const authErr = error as { code?: string; message?: string };
      console.error("[AuthProvider] signOut error:", authErr?.code, authErr?.message);
    } finally {
      setLoading(false);
      setIsResolvingRedirect(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isResolvingRedirect,
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
