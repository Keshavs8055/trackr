import { ResourceType, RESOURCE_TYPES } from '@/types';

export interface StatusConfig {
  value: string;
  label: string;
  colorClass: string;
  bgClass: string;
}

export const LIFECYCLE_STATUS_WORKFLOWS: Partial<Record<ResourceType | 'default', StatusConfig[]>> = {
  [RESOURCE_TYPES.MOVIE]: [
    { value: 'wishlist', label: 'Wishlist', colorClass: 'text-amber-400', bgClass: 'bg-amber-400/10 border-amber-400/20' },
    { value: 'planned', label: 'Plan to Watch', colorClass: 'text-blue-400', bgClass: 'bg-blue-400/10 border-blue-400/20' },
    { value: 'watching', label: 'Watching', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-400/10 border-emerald-400/20' },
    { value: 'completed', label: 'Watched', colorClass: 'text-purple-400', bgClass: 'bg-purple-400/10 border-purple-400/20' },
    { value: 'dropped', label: 'Dropped', colorClass: 'text-rose-400', bgClass: 'bg-rose-400/10 border-rose-400/20' },
  ],
  [RESOURCE_TYPES.TV]: [
    { value: 'wishlist', label: 'Wishlist', colorClass: 'text-amber-400', bgClass: 'bg-amber-400/10 border-amber-400/20' },
    { value: 'planned', label: 'Plan to Watch', colorClass: 'text-blue-400', bgClass: 'bg-blue-400/10 border-blue-400/20' },
    { value: 'watching', label: 'Watching', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-400/10 border-emerald-400/20' },
    { value: 'completed', label: 'Watched', colorClass: 'text-purple-400', bgClass: 'bg-purple-400/10 border-purple-400/20' },
    { value: 'dropped', label: 'Dropped', colorClass: 'text-rose-400', bgClass: 'bg-rose-400/10 border-rose-400/20' },
  ],
  [RESOURCE_TYPES.BOOK]: [
    { value: 'wishlist', label: 'Wishlist', colorClass: 'text-amber-400', bgClass: 'bg-amber-400/10 border-amber-400/20' },
    { value: 'planned', label: 'Plan to Read', colorClass: 'text-blue-400', bgClass: 'bg-blue-400/10 border-blue-400/20' },
    { value: 'reading', label: 'Reading', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-400/10 border-emerald-400/20' },
    { value: 'completed', label: 'Read', colorClass: 'text-purple-400', bgClass: 'bg-purple-400/10 border-purple-400/20' },
    { value: 'dropped', label: 'Dropped', colorClass: 'text-rose-400', bgClass: 'bg-rose-400/10 border-rose-400/20' },
  ],
  [RESOURCE_TYPES.ARTICLE]: [
    { value: 'backlog', label: 'To Read', colorClass: 'text-slate-400', bgClass: 'bg-slate-400/10 border-slate-400/20' },
    { value: 'reading', label: 'Reading', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-400/10 border-emerald-400/20' },
    { value: 'completed', label: 'Read', colorClass: 'text-purple-400', bgClass: 'bg-purple-400/10 border-purple-400/20' },
    { value: 'archived', label: 'Archived', colorClass: 'text-zinc-400', bgClass: 'bg-zinc-400/10 border-zinc-400/20' },
  ],
  [RESOURCE_TYPES.WEBSITE]: [
    { value: 'backlog', label: 'Backlog', colorClass: 'text-slate-400', bgClass: 'bg-slate-400/10 border-slate-400/20' },
    { value: 'reading', label: 'Exploring', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-400/10 border-emerald-400/20' },
    { value: 'completed', label: 'Done', colorClass: 'text-purple-400', bgClass: 'bg-purple-400/10 border-purple-400/20' },
    { value: 'archived', label: 'Archived', colorClass: 'text-zinc-400', bgClass: 'bg-zinc-400/10 border-zinc-400/20' },
  ],
  [RESOURCE_TYPES.GITHUB]: [
    { value: 'backlog', label: 'To Check', colorClass: 'text-slate-400', bgClass: 'bg-slate-400/10 border-slate-400/20' },
    { value: 'reading', label: 'Exploring', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-400/10 border-emerald-400/20' },
    { value: 'completed', label: 'Evaluated', colorClass: 'text-purple-400', bgClass: 'bg-purple-400/10 border-purple-400/20' },
    { value: 'archived', label: 'Archived', colorClass: 'text-zinc-400', bgClass: 'bg-zinc-400/10 border-zinc-400/20' },
  ],
  default: [
    { value: 'backlog', label: 'Backlog', colorClass: 'text-slate-400', bgClass: 'bg-slate-400/10 border-slate-400/20' },
    { value: 'in_progress', label: 'In Progress', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-400/10 border-emerald-400/20' },
    { value: 'completed', label: 'Completed', colorClass: 'text-purple-400', bgClass: 'bg-purple-400/10 border-purple-400/20' },
    { value: 'archived', label: 'Archived', colorClass: 'text-zinc-400', bgClass: 'bg-zinc-400/10 border-zinc-400/20' },
  ],
};

export function getStatusesForType(type: ResourceType | string): StatusConfig[] {
  return LIFECYCLE_STATUS_WORKFLOWS[type as ResourceType] || LIFECYCLE_STATUS_WORKFLOWS.default || [];
}

export function getStatusConfig(type: ResourceType | string, status?: string): StatusConfig {
  const statuses = getStatusesForType(type);
  if (!status || typeof status !== 'string') return statuses[0];
  const safeStatus = status;
  return statuses.find(s => s.value.toLowerCase() === safeStatus.toLowerCase()) || {
    value: safeStatus,
    label: safeStatus.replace(/_/g, ' ').toUpperCase(),
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-secondary/40 border-border/40',
  };
}

export function getDefaultStatusForType(type: ResourceType | string): string {
  const statuses = getStatusesForType(type);
  return statuses[0].value;
}
