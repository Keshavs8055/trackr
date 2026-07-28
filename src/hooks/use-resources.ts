import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resourceService } from '@/services/resource-service';
import { useAuth } from '@/components/auth-provider';
import { Resource } from '@/types';
import { EventBus } from '@/domain/events/event-bus';

export function useResources() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['resources', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      return resourceService.getResources(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAddResource() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
      if (!user?.uid) throw new Error("Must be logged in to add resource");
      return resourceService.addResource(user.uid, resource);
    },
    onMutate: async (newResource) => {
      await queryClient.cancelQueries({ queryKey: ['resources', user?.uid] });
      const previousResources = queryClient.getQueryData<Resource[]>(['resources', user?.uid]);

      if (previousResources && user?.uid) {
        const optimisticResource: Resource = {
          id: `temp-${Date.now()}`,
          userId: user.uid,
          title: newResource.title,
          type: newResource.type || 'note',
          provider: newResource.provider || 'manual',
          tags: newResource.tags || [],
          metadata: newResource.metadata || {},
          rawInput: newResource.rawInput,
          notes: newResource.notes,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        queryClient.setQueryData<Resource[]>(['resources', user.uid], [optimisticResource, ...previousResources]);
      }

      return { previousResources };
    },
    onError: (_err, _newResource, context) => {
      if (context?.previousResources && user?.uid) {
        queryClient.setQueryData(['resources', user.uid], context.previousResources);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...update }: { id: string } & Partial<Resource>) => {
      if (!user?.uid) throw new Error("Must be logged in");
      const previousResources = queryClient.getQueryData<Resource[]>(['resources', user.uid]);
      const currentResource = previousResources?.find(r => r.id === id);

      await resourceService.updateResource(user.uid, id, update);

      // Emit domain events for activity logger
      if (update.status && currentResource?.status !== update.status) {
        EventBus.getInstance().publish('StatusChanged', {
          userId: user.uid,
          resourceId: id,
          resourceTitle: currentResource?.title || update.title,
          oldStatus: currentResource?.status || 'default',
          newStatus: update.status,
        });
      }
    },
    onMutate: async ({ id, ...update }) => {
      await queryClient.cancelQueries({ queryKey: ['resources', user?.uid] });
      const previousResources = queryClient.getQueryData<Resource[]>(['resources', user?.uid]);

      if (previousResources && user?.uid) {
        queryClient.setQueryData<Resource[]>(
          ['resources', user.uid],
          previousResources.map((res) => (res.id === id ? { ...res, ...update, updatedAt: Date.now() } : res))
        );
      }

      return { previousResources };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousResources && user?.uid) {
        queryClient.setQueryData(['resources', user.uid], context.previousResources);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.uid) throw new Error("Must be logged in");
      return resourceService.deleteResource(user.uid, id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['resources', user?.uid] });
      const previousResources = queryClient.getQueryData<Resource[]>(['resources', user?.uid]);

      if (previousResources && user?.uid) {
        queryClient.setQueryData<Resource[]>(
          ['resources', user.uid],
          previousResources.filter((res) => res.id !== id)
        );
      }

      return { previousResources };
    },
    onError: (_err, _id, context) => {
      if (context?.previousResources && user?.uid) {
        queryClient.setQueryData(['resources', user.uid], context.previousResources);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useUserTags() {
  const { data: resources } = useResources();
  
  return useMemo(() => {
    if (!resources) return [];
    
    const tagSet = new Set<string>();
    resources.forEach((res) => {
      res.tags?.forEach((tag) => tagSet.add(tag));
    });
    
    return Array.from(tagSet).sort();
  }, [resources]);
}

export function useFacetedTags(selectedTags: string[]) {
  const { data: resources } = useResources();
  
  return useMemo(() => {
    if (!resources) return [];
    
    const globalTagSet = new Set<string>();
    resources.forEach((res) => {
      res.tags?.forEach((tag) => globalTagSet.add(tag));
    });
    
    if (selectedTags.length === 0) {
      return Array.from(globalTagSet).sort();
    }
    
    const matchingResources = resources.filter((res) => 
      selectedTags.every((t) => res.tags?.includes(t))
    );
    
    const facetedTagSet = new Set<string>();
    matchingResources.forEach((res) => {
      res.tags?.forEach((tag) => facetedTagSet.add(tag));
    });
    
    selectedTags.forEach((tag) => facetedTagSet.add(tag));
    
    return Array.from(facetedTagSet).sort();
  }, [resources, selectedTags]);
}
