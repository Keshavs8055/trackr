import { useMutation, useQueryClient } from '@tanstack/react-query';
import { providerService } from '@/services/provider-service';
import { useUpdateResource } from './use-resources';
import { Resource } from '@/types';

export function useMetadataRefresh() {
  const queryClient = useQueryClient();
  const { mutateAsync: updateResource } = useUpdateResource();

  return useMutation({
    mutationFn: async (resource: Resource) => {
      const metadataUpdates = await providerService.refreshResourceMetadata(resource);
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
