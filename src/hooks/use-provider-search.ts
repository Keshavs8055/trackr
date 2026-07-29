import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { providerService } from '@/services/provider-service';
import { useAuth } from '@/components/auth-provider';
import { ResourceType } from '@/types';

export function useProviderSearch(type: ResourceType, rawQuery: string, page: number = 1) {
  const [debouncedQuery, setDebouncedQuery] = useState(rawQuery);
  const { user } = useAuth();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(rawQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [rawQuery]);

  const query = useQuery({
    queryKey: ['providerSearch', user?.uid, type, debouncedQuery, page],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length === 0) {
        return {
          providerName: 'manual',
          results: { results: [], page: 1, pageSize: 10, hasMore: false, totalResults: 0 },
        };
      }
      return providerService.search(user?.uid || 'mock-user-id', type, debouncedQuery, page);
    },
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    debouncedQuery,
  };
}
