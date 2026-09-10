import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  browserLocalPersistence, 
  browserPopupRedirectResolver, 
  getAuth, 
  indexedDBLocalPersistence, 
  initializeAuth 
} from "firebase/auth";
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY || "mock-api-key-for-build-prerender",
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN || "mock-auth-domain",
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "mock-project-id",
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET || "mock-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID || "mock-sender-id",
  appId: process.env.NEXT_PUBLIC_APP_ID || "mock-app-id",
};

// Initialize Firebase app singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth with indexedDBLocalPersistence as primary
// so the session is durable across PWA cold starts, tab switches, and Safari ITP sweeps,
// falling back to browserLocalPersistence (localStorage) if IndexedDB is restricted.
let auth: ReturnType<typeof getAuth>;
if (typeof window !== "undefined") {
  try {
    auth = initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    auth = getAuth(app);
  }
} else {
  auth = getAuth(app);
}

// Initialize Firestore with client-side offline persistence enabled
let db: ReturnType<typeof getFirestore>;
if (typeof window !== "undefined") {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    db = getFirestore(app);
  }
} else {
  db = getFirestore(app);
}

if (process.env.NODE_ENV !== "production") {
  if (typeof window !== "undefined") {
    console.log("[Firebase Config Audit] Client-side execution context detected.", {
      origin: window.location.origin,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      hasApiKey: !!firebaseConfig.apiKey,
    });
  } else {
    console.log("[Firebase Config Audit] Server-side (SSR) execution context detected.", {
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      hasApiKey: !!firebaseConfig.apiKey,
    });
  }

  try {
    console.log("[Firebase Init] Initialized App instance name:", app.name);
    console.log("[Firebase Init] Initialized Auth instance successfully:", !!auth);
    console.log("[Firebase Init] Initialized Firestore Database instance successfully:", !!db);
  } catch (error) {
    console.error("[Firebase Init] Error during verification logging:", error);
  }
}

const storage = getStorage(app);

export { app, auth, db, storage };
