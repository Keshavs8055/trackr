import { ProgressUnit, Resource, ResourceProgress, ResourceType, RESOURCE_TYPES } from '@/types';

export function getDefaultProgressUnit(type: ResourceType | string): ProgressUnit {
  switch (type) {
    case RESOURCE_TYPES.BOOK:
      return 'pages';
    case RESOURCE_TYPES.MOVIE:
    case RESOURCE_TYPES.TV:
    case RESOURCE_TYPES.PODCAST:
      return 'minutes';
    case RESOURCE_TYPES.COURSE:
      return 'episodes';
    default:
      return 'percent';
  }
}

export function calculateProgress(
  current: number,
  total?: number,
  unit: ProgressUnit = 'percent'
): ResourceProgress {
  const safeCurrent = Math.max(0, current);
  let percentage = 0;

  if (total && total > 0) {
    percentage = Math.min(100, Math.round((safeCurrent / total) * 100));
  } else if (unit === 'percent') {
    percentage = Math.min(100, safeCurrent);
  }

  return {
    current: safeCurrent,
    total: total && total > 0 ? total : undefined,
    unit,
    percentage,
    lastUpdated: Date.now(),
  };
}

export function updateResourceProgress(
  resource: Resource,
  current: number,
  total?: number,
  unit?: ProgressUnit
): Partial<Resource> {
  const effectiveUnit = unit || resource.progress?.unit || getDefaultProgressUnit(resource.type);
  const effectiveTotal = total !== undefined ? total : resource.progress?.total;

  const newProgress = calculateProgress(current, effectiveTotal, effectiveUnit);

  const updates: Partial<Resource> = {
    progress: newProgress,
    updatedAt: Date.now(),
  };

  // Auto-complete status if 100% finished
  if (newProgress.percentage === 100 && resource.status !== 'completed' && resource.status !== 'watched' && resource.status !== 'read') {
    updates.status = 'completed';
  }

  return updates;
}
