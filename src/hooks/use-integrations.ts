import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerService } from '@/services/provider-service';
import { useAuth } from '@/components/auth-provider';
import { ProviderName } from '@/types';

export function useIntegrations() {
  return useQuery({
    queryKey: ['integrationsStatus'],
    queryFn: async () => {
      return providerService.getIntegrationsStatus();
    },
    staleTime: 60 * 1000,
  });
}

export function useConfigureProvider() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: ProviderName | string; apiKey: string }) => {
      if (!user?.uid) throw new Error("Must be logged in");
      return providerService.configureProvider(user.uid, provider, apiKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrationsStatus'] });
      queryClient.invalidateQueries({ queryKey: ['providerSearch'] });
    },
  });
}

export function useSetProviderEnabled() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ provider, enabled }: { provider: ProviderName | string; enabled: boolean }) => {
      if (!user?.uid) throw new Error("Must be logged in");
      return providerService.setProviderEnabled(user.uid, provider, enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrationsStatus'] });
      queryClient.invalidateQueries({ queryKey: ['providerSearch'] });
    },
  });
}

export function useDisconnectProvider() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (provider: ProviderName | string) => {
      if (!user?.uid) throw new Error("Must be logged in");
      return providerService.disconnectProvider(user.uid, provider);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrationsStatus'] });
      queryClient.invalidateQueries({ queryKey: ['providerSearch'] });
    },
  });
}
