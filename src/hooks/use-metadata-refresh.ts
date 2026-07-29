import { useMutation, useQueryClient } from '@tanstack/react-query';
import { providerService } from '@/services/provider-service';
import { useAuth } from '@/components/auth-provider';
import { useUpdateResource } from './use-resources';
import { Resource } from '@/types';

export function useMetadataRefresh() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { mutateAsync: updateResource } = useUpdateResource();

  return useMutation({
    mutationFn: async (resource: Resource) => {
      const metadataUpdates = await providerService.refreshResourceMetadata(
        user?.uid || 'mock-user-id',
        resource
      );
      await updateResource({
        id: resource.id,
        ...metadataUpdates,
      });
      return metadataUpdates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}
