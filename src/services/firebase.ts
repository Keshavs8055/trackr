import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY || "AIzaSyACo07xPXMMfG2XzEnPJMRJ2X62gCYIx94",
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN || "trackr-72842.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "trackr-72842",
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET || "trackr-72842.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID || "2562502585",
  appId: process.env.NEXT_PUBLIC_APP_ID || "1:2562502585:web:fe715d4049733b4f279068",
};
// const firebaseConfig = {
//   apiKey: "AIzaSyACo07xPXMMfG2XzEnPJMRJ2X62gCYIx94",
//   authDomain: "trackr-72842.firebaseapp.com",
//   projectId: "trackr-72842",
//   storageBucket: "trackr-72842.firebasestorage.app",
//   messagingSenderId: "2562502585",
//   appId: "1:2562502585:web:fe715d4049733b4f279068"
// };

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with client-side offline persistence enabled
const db = typeof window !== "undefined"
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  : getFirestore(app);

const storage = getStorage(app);

export { app, auth, db, storage };
