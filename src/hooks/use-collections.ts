import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CollectionService } from '@/services/collection-service';
import { Collection } from '@/types';
import { useAuth } from '@/components/auth-provider';

export function useCollections() {
  const { user } = useAuth();
  const userId = user?.uid || 'mock-user-id';

  return useQuery({
    queryKey: ['collections', userId],
    queryFn: () => CollectionService.getUserCollections(userId),
    enabled: !!userId,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.uid || 'mock-user-id';

  return useMutation({
    mutationFn: (data: Omit<Collection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => 
      CollectionService.createCollection(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', userId] });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.uid || 'mock-user-id';

  return useMutation({
    mutationFn: ({ collectionId, update }: { collectionId: string; update: Partial<Collection> }) => 
      CollectionService.updateCollection(userId, collectionId, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', userId] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.uid || 'mock-user-id';

  return useMutation({
    mutationFn: (collectionId: string) => 
      CollectionService.deleteCollection(userId, collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', userId] });
    },
  });
}
