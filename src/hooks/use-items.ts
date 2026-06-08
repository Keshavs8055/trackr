import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/components/auth-provider';
import { Item, Collection } from '@/types';

const DEFAULT_MOCK_ITEMS = [
  {
    id: "mock-item-1",
    userId: "mock-user-id",
    title: "Interstellar",
    tags: ["movies", "fav"],
    rawInput: "Interstellar #movies #fav",
    notes: "A beautiful sci-fi exploration of time and love.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    archived: false,
  },
  {
    id: "mock-item-2",
    userId: "mock-user-id",
    title: "Dune: Part Two",
    tags: ["movies", "scifi"],
    rawInput: "Dune: Part Two #movies #scifi",
    notes: "Visually stunning continuation of the desert saga.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    archived: false,
  },
  {
    id: "mock-item-3",
    userId: "mock-user-id",
    title: "Atomic Habits by James Clear",
    tags: ["books", "productivity"],
    rawInput: "Atomic Habits by James Clear #books #productivity",
    notes: "An easy way to build good habits and break bad ones.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    archived: false,
  },
  {
    id: "mock-item-4",
    userId: "mock-user-id",
    title: "Kyoto Tempura Spots",
    tags: ["travel", "food"],
    rawInput: "Kyoto Tempura Spots #travel #food",
    notes: "Amazing tempura in Gion district.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10, // 10 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    archived: false,
  },
  {
    id: "mock-item-5",
    userId: "mock-user-id",
    title: "Inception",
    tags: ["movies", "fav"],
    rawInput: "Inception #movies #fav",
    notes: "Mind-bending dream heist movie.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12, // 12 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    archived: true,
  }
];

export function useItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['items', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];

      if (user.uid === 'mock-user-id') {
        const stored = localStorage.getItem('mock-items');
        if (!stored) {
          localStorage.setItem('mock-items', JSON.stringify(DEFAULT_MOCK_ITEMS));
          return DEFAULT_MOCK_ITEMS;
        }
        return JSON.parse(stored) as Item[];
      }
      
      const itemsRef = collection(db, 'users', user.uid, 'items');
      const q = query(itemsRef);

      const snapshot = await getDocs(q);
      let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      
      items.sort((a, b) => b.createdAt - a.createdAt);

      return items;
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
      if (!user?.uid) throw new Error("Must be logged in to add item");

      const newItemData = {
        ...item,
        userId: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        archived: false,
      };

      if (user.uid === 'mock-user-id') {
        const stored = localStorage.getItem('mock-items');
        const items = stored ? JSON.parse(stored) : DEFAULT_MOCK_ITEMS;
        const newItem = { id: `mock-item-${Date.now()}`, ...newItemData } as Item;
        items.unshift(newItem);
        localStorage.setItem('mock-items', JSON.stringify(items));
        return newItem;
      }

      const docRef = await addDoc(collection(db, 'users', user.uid, 'items'), newItemData);
      return { id: docRef.id, ...newItemData } as Item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...update }: { id: string } & Partial<Item>) => {
      if (!user?.uid) throw new Error("Must be logged in");

      if (user.uid === 'mock-user-id') {
        const stored = localStorage.getItem('mock-items');
        const items: Item[] = stored ? JSON.parse(stored) : DEFAULT_MOCK_ITEMS;
        const updated = items.map(item => item.id === id ? { ...item, ...update, updatedAt: Date.now() } : item);
        localStorage.setItem('mock-items', JSON.stringify(updated));
        return;
      }

      const docRef = doc(db, 'users', user.uid, 'items', id);
      await updateDoc(docRef, { ...update, updatedAt: Date.now() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.uid) throw new Error("Must be logged in");

      if (user.uid === 'mock-user-id') {
        const stored = localStorage.getItem('mock-items');
        const items: Item[] = stored ? JSON.parse(stored) : DEFAULT_MOCK_ITEMS;
        const filtered = items.filter(item => item.id !== id);
        localStorage.setItem('mock-items', JSON.stringify(filtered));
        return;
      }

      await deleteDoc(doc(db, 'users', user.uid, 'items', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

// Helper hook to get all unique tags used by the user
export function useUserTags() {
  const { data: items } = useItems();
  
  return useMemo(() => {
    if (!items) return [];
    
    const tagSet = new Set<string>();
    items.forEach(item => {
      // Don't show tags from archived items in global list unless requested, or filter out
      if (!item.archived) {
        item.tags?.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet).sort();
  }, [items]);
}
