import { useQuery } from '@tanstack/react-query';
import { ActivityService } from '@/services/activity-service';
import { useAuth } from '@/components/auth-provider';

export function useResourceActivities(resourceId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['resource-activities', user?.uid, resourceId],
    queryFn: async () => {
      if (!user?.uid || !resourceId) return [];
      return ActivityService.getInstance().getResourceActivities(user.uid, resourceId);
    },
    enabled: !!user?.uid && !!resourceId,
    staleTime: 30 * 1000,
  });
}

export function useUserActivities(limitCount = 25) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-activities', user?.uid, limitCount],
    queryFn: async () => {
      if (!user?.uid) return [];
      return ActivityService.getInstance().getUserActivities(user.uid, limitCount);
    },
    enabled: !!user?.uid,
    staleTime: 30 * 1000,
  });
}
