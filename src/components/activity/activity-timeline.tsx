"use client";

import React from 'react';
import { useResourceActivities } from '@/hooks/use-activities';
import { ActivityAction, ResourceActivity } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Sparkles, ArrowRightLeft, RefreshCw, FileText, Trash2, Clock, History } from 'lucide-react';

interface ActivityTimelineProps {
  resourceId: string;
}

const ACTION_ICONS: Record<ActivityAction, React.ElementType> = {
  created: Sparkles,
  status_changed: ArrowRightLeft,
  metadata_refreshed: RefreshCw,
  note_added: FileText,
  relationship_added: Sparkles,
  deleted: Trash2,
};

const ACTION_COLORS: Record<ActivityAction, { text: string; bg: string; border: string }> = {
  created: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  status_changed: { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  metadata_refreshed: { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  note_added: { text: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' },
  relationship_added: { text: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
  deleted: { text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
};

function formatActionText(activity: ResourceActivity): string {
  const { action, payload } = activity;
  switch (action) {
    case 'created':
      return 'Created resource';
    case 'status_changed':
      if (payload?.oldStatus && payload?.newStatus) {
        return `Changed status from "${payload.oldStatus}" to "${payload.newStatus}"`;
      }
      return `Updated status to "${payload?.newStatus || 'new status'}"`;
    case 'metadata_refreshed':
      return `Refreshed metadata from ${payload?.provider || 'provider'}`;
    case 'note_added':
      return 'Updated notes';
    default:
      return 'Updated resource';
  }
}

export function ActivityTimeline({ resourceId }: ActivityTimelineProps) {
  const { data: activities, isLoading } = useResourceActivities(resourceId);

  if (isLoading) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground animate-pulse flex items-center justify-center gap-2">
        <Clock className="size-3.5 animate-spin" />
        <span>Loading activity history...</span>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="py-6 px-4 rounded-xl border border-dashed border-border/40 text-center space-y-1">
        <History className="size-5 text-muted-foreground/50 mx-auto" />
        <p className="text-xs font-semibold text-muted-foreground">No activities logged yet</p>
        <p className="text-[10px] text-muted-foreground/60">Status changes and updates will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center gap-2">
        <History className="size-4 text-primary" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Activity History ({activities.length})
        </h4>
      </div>

      <div className="relative pl-4 border-l border-border/40 space-y-4">
        {activities.map((act) => {
          const Icon = ACTION_ICONS[act.action] || History;
          const colors = ACTION_COLORS[act.action] || ACTION_COLORS.created;
          const timeAgo = formatDistanceToNow(new Date(act.timestamp), { addSuffix: true });

          return (
            <div key={act.id} className="relative flex items-start gap-3 group">
              {/* Timeline Node Icon */}
              <div className={`-left-[25px] relative z-10 p-1.5 rounded-full border shadow-xs ${colors.bg} ${colors.border} ${colors.text}`}>
                <Icon className="size-3.5" />
              </div>

              {/* Event Content */}
              <div className="flex-1 -mt-0.5 space-y-0.5">
                <p className="text-xs font-medium text-foreground leading-snug">
                  {formatActionText(act)}
                </p>
                <span className="text-[10px] font-semibold text-muted-foreground/60">
                  {timeAgo}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
