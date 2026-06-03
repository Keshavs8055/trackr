import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/components/auth-provider';
import { Item, Collection } from '@/types';

export function useItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['items', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
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
      item.tags?.forEach(tag => tagSet.add(tag));
    });
    
    return Array.from(tagSet).sort();
  }, [items]);
}

export function useCollections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['collections', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      const collectionsRef = collection(db, 'users', user.uid, 'collections');
      const q = query(collectionsRef);

      const snapshot = await getDocs(q);
      const collections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collection));
      
      return collections.sort((a, b) => b.createdAt - a.createdAt);
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAddCollection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (coll: Omit<Collection, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
      if (!user?.uid) throw new Error("Must be logged in to add collection");

      const newCollData = {
        ...coll,
        userId: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'collections'), newCollData);
      return { id: docRef.id, ...newCollData } as Collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}
