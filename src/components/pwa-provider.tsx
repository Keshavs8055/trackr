"use client";

import React, { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { useAuth } from '@/components/auth-provider';
import { db } from '@/services/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const setIsOnline = useAppStore((s) => s.setIsOnline);
  const setHasPendingWrites = useAppStore((s) => s.setHasPendingWrites);
  const setInstallPrompt = useAppStore((s) => s.setInstallPrompt);

  useEffect(() => {
    // 1. Service Worker registration
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => {
            console.log('PWA Service Worker registered successfully with scope:', reg.scope);
          })
          .catch((err) => {
            console.error('PWA Service Worker registration failed:', err);
          });
      });
    } else if ('serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
      // In development, we can still register it to test cache/installation, but usually with --experimental-https or similar
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('PWA Service Worker registered in Dev Mode:', reg.scope);
        })
        .catch((err) => {
          console.warn('PWA Service Worker dev registration skipped/failed:', err);
        });
    }

    // 2. Connection listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. PWA install prompt interception
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [setIsOnline, setInstallPrompt]);

  // 4. Firestore real-time snapshot sync status
  useEffect(() => {
    if (!user || user.uid === 'mock-user-id') {
      setHasPendingWrites(false);
      return;
    }

    try {
      const itemsRef = collection(db, 'users', user.uid, 'items');
      const q = query(itemsRef);

      // Listen with includeMetadataChanges: true to detect hasPendingWrites transitions
      const unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snapshot) => {
          setHasPendingWrites(snapshot.metadata.hasPendingWrites);
        },
        (error) => {
          console.error("Firestore onSnapshot error:", error);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up Firestore sync listener:", err);
    }
  }, [user, setHasPendingWrites]);

  return <>{children}</>;
}
