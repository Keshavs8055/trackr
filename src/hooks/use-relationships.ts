import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-provider';
import { RelationshipService } from '@/services/relationship-service';
import { RelationshipType } from '@/types';

export function useResourceRelationships(resourceId: string) {
  const { user } = useAuth();
  const userId = user?.uid || 'mock-user-id';

  return useQuery({
    queryKey: ['relationships', userId, resourceId],
    queryFn: async () => {
      if (!resourceId) return { outgoing: [], incoming: [], all: [] };
      return RelationshipService.getInstance().getRelationshipsForResource(userId, resourceId);
    },
    enabled: !!resourceId,
  });
}

export function useAddRelationship() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.uid || 'mock-user-id';

  return useMutation({
    mutationFn: async ({
      sourceResourceId,
      targetResourceId,
      type,
      notes,
      sourceTitle,
      targetTitle,
    }: {
      sourceResourceId: string;
      targetResourceId: string;
      type: RelationshipType;
      notes?: string;
      sourceTitle?: string;
      targetTitle?: string;
    }) => {
      return RelationshipService.getInstance().addRelationship(
        userId,
        { sourceResourceId, targetResourceId, type, notes },
        sourceTitle,
        targetTitle
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['relationships', userId, variables.sourceResourceId] });
      queryClient.invalidateQueries({ queryKey: ['relationships', userId, variables.targetResourceId] });
    },
  });
}

export function useRemoveRelationship() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.uid || 'mock-user-id';

  return useMutation({
    mutationFn: async ({ relationshipId, sourceId, targetId }: { relationshipId: string; sourceId: string; targetId: string }) => {
      return RelationshipService.getInstance().removeRelationship(userId, relationshipId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['relationships', userId, variables.sourceId] });
      queryClient.invalidateQueries({ queryKey: ['relationships', userId, variables.targetId] });
    },
  });
}
