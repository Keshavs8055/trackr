import { useMemo, useEffect } from 'react';
import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { resourceService } from '@/services/resource-service';
import { useAuth } from '@/components/auth-provider';
import { Resource } from '@/types';
import { EventBus } from '@/domain/events/event-bus';
import { indexedDBCache } from '@/cache/indexed-db-cache';

export function usePaginatedResources(pageSize = 15) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Instantaneous cold start hydration from IndexedDB for paginated queries
  useEffect(() => {
    if (!user?.uid) return;
    const currentData = queryClient.getQueryData(['resources-paginated', user.uid]);
    if (!currentData) {
      indexedDBCache.getCachedResources().then((cached) => {
        if (cached && cached.length > 0) {
          queryClient.setQueryData(['resources-paginated', user.uid], (existing: any) => {
            if (existing) return existing;
            return {
              pages: [{
                resources: cached,
                lastDocSnapshot: null,
                hasMore: true
              }],
              pageParams: [null]
            };
          });
        }
      });
    }
  }, [user?.uid, queryClient]);

  const infiniteQuery = useInfiniteQuery({
    queryKey: ['resources-paginated', user?.uid],
    queryFn: async ({ pageParam }: { pageParam?: any }) => {
      if (!user?.uid) return { resources: [], lastDocSnapshot: null, hasMore: false };
      const res = await resourceService.getResourcesPaginated(user.uid, pageSize, pageParam as any);
      if (res.resources && res.resources.length > 0) {
        indexedDBCache.cacheResources(res.resources).catch(() => {});
      }
      return res;
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? (lastPage.lastDocSnapshot || null) : undefined),
    initialPageParam: null as any,
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const allResources = useMemo(() => {
    if (!infiniteQuery.data?.pages) return [];
    const flattened: Resource[] = [];
    const seen = new Set<string>();
    
    for (const page of infiniteQuery.data.pages) {
      for (const res of page.resources) {
        if (!seen.has(res.id)) {
          seen.add(res.id);
          flattened.push(res);
        }
      }
    }
    return flattened;
  }, [infiniteQuery.data]);

  return {
    ...infiniteQuery,
    resources: allResources,
    data: allResources,
  };
}

export function useResources() {
  return usePaginatedResources(15);
}

export function useAddResource() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
      if (!user?.uid) throw new Error("Must be logged in to add resource");
      const created = await resourceService.addResource(user.uid, resource);
      if (created) {
        indexedDBCache.cacheResource(created).catch(() => {});
      }
      return created;
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
      queryClient.invalidateQueries({ queryKey: ['resources-paginated'] });
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

      if (currentResource) {
        indexedDBCache.cacheResource({ ...currentResource, ...update, updatedAt: Date.now() }).catch(() => {});
      }

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
          previousResources.map((res) => {
            if (res.id === id) {
              const updatedRes = { ...res, ...update, updatedAt: Date.now() };
              if (update.notes === undefined) delete updatedRes.notes;
              return updatedRes;
            }
            return res;
          })
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
      queryClient.invalidateQueries({ queryKey: ['resources-paginated'] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.uid) throw new Error("Must be logged in");
      await resourceService.deleteResource(user.uid, id);
      indexedDBCache.removeResource(id).catch(() => {});
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
      queryClient.invalidateQueries({ queryKey: ['resources-paginated'] });
    },
  });
}

import { getStatusSynonymTags, normalizeTag } from '@/lib/parser';

export function useUserTags() {
  const { data: resources } = useResources();
  
  return useMemo(() => {
    if (!resources) return [];
    
    const tagSet = new Set<string>();
    resources.forEach((res) => {
      res.tags?.forEach((tag) => tagSet.add(normalizeTag(tag)));
      if (res.status) {
        const synonyms = getStatusSynonymTags(res.status);
        if (synonyms.length > 0) tagSet.add(normalizeTag(synonyms[0]));
      }
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
      res.tags?.forEach((tag) => globalTagSet.add(normalizeTag(tag)));
      if (res.status) {
        const synonyms = getStatusSynonymTags(res.status);
        if (synonyms.length > 0) globalTagSet.add(normalizeTag(synonyms[0]));
      }
    });
    
    if (selectedTags.length === 0) {
      return Array.from(globalTagSet).sort();
    }
    
    const matchingResources = resources.filter((res) => 
      selectedTags.every((selectedTag) => {
        const normSelected = normalizeTag(selectedTag);
        const hasDirectTag = res.tags?.some((t) => normalizeTag(t) === normSelected);
        if (hasDirectTag) return true;
        const statusSynonyms = getStatusSynonymTags(res.status);
        return statusSynonyms.some((syn) => normalizeTag(syn) === normSelected);
      })
    );
    
    const facetedTagSet = new Set<string>();
    matchingResources.forEach((res) => {
      res.tags?.forEach((tag) => facetedTagSet.add(normalizeTag(tag)));
      if (res.status) {
        const synonyms = getStatusSynonymTags(res.status);
        if (synonyms.length > 0) facetedTagSet.add(normalizeTag(synonyms[0]));
      }
    });
    
    selectedTags.forEach((tag) => facetedTagSet.add(normalizeTag(tag)));
    
    return Array.from(facetedTagSet).sort();
  }, [resources, selectedTags]);
}
