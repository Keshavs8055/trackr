import { initializeApp, getApps, getApp } from "firebase/app";
import { browserPopupRedirectResolver, getAuth, initializeAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = typeof window !== "undefined"
  ? initializeAuth(app, {
      popupRedirectResolver: browserPopupRedirectResolver,
    })
  : getAuth(app);

// Initialize Firestore with client-side offline persistence enabled
const db = typeof window !== "undefined"
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  : getFirestore(app);

if (typeof window !== "undefined") {
  console.log("[Firebase Config Audit] Client-side execution context detected.", {
    origin: window.location.origin,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
    hasApiKey: !!firebaseConfig.apiKey,
    apiKeyLength: firebaseConfig.apiKey ? firebaseConfig.apiKey.length : 0,
    apiKeyPreview: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 6)}...` : "NONE",
  });
} else {
  console.log("[Firebase Config Audit] Server-side (SSR) execution context detected.", {
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
    hasApiKey: !!firebaseConfig.apiKey,
    apiKeyLength: firebaseConfig.apiKey ? firebaseConfig.apiKey.length : 0,
  });
}

try {
  console.log("[Firebase Init] Initialized App instance name:", app.name);
  console.log("[Firebase Init] Initialized Auth instance successfully:", !!auth);
  console.log("[Firebase Init] Initialized Firestore Database instance successfully:", !!db);
} catch (error) {
  console.error("[Firebase Init] Error during verification logging:", error);
}

const storage = getStorage(app);

export { app, auth, db, storage };
