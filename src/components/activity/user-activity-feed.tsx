"use client";

import React from 'react';
import { useUserActivities } from '@/hooks/use-activities';
import { formatDistanceToNow } from 'date-fns';
import { ActivityAction, ResourceActivity } from '@/types';
import { Activity, X, Sparkles, ArrowRightLeft, TrendingUp, RefreshCw, FileText, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserActivityFeedProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACTION_ICONS: Record<ActivityAction, React.ElementType> = {
  created: Sparkles,
  status_changed: ArrowRightLeft,
  progress_updated: TrendingUp,
  metadata_refreshed: RefreshCw,
  note_added: FileText,
  relationship_added: Sparkles,
  deleted: Trash2,
};

function formatActionTitle(act: ResourceActivity): string {
  const title = act.resourceTitle ? `"${act.resourceTitle}"` : 'a resource';
  switch (act.action) {
    case 'created':
      return `Created ${title}`;
    case 'status_changed':
      return `Updated status for ${title}`;
    case 'progress_updated':
      return `Updated progress for ${title}`;
    case 'metadata_refreshed':
      return `Refreshed metadata for ${title}`;
    default:
      return `Updated ${title}`;
  }
}

export function UserActivityFeed({ isOpen, onClose }: UserActivityFeedProps) {
  const { data: activities, isLoading } = useUserActivities(30);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative z-10 w-full max-w-md bg-card border-l border-border/50 h-full shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">
                  Recent Activity Log
                </h3>
              </div>
              <button
                onClick={onClose}
                className="size-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                  Loading global activities...
                </div>
              ) : !activities || activities.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No recent activities recorded yet.
                </div>
              ) : (
                activities.map((act) => {
                  const Icon = ACTION_ICONS[act.action] || Activity;
                  const timeAgo = formatDistanceToNow(new Date(act.timestamp), { addSuffix: true });

                  return (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl bg-secondary/20 border border-border/30 flex items-start gap-3 hover:bg-secondary/40 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary flex-shrink-0">
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-xs font-semibold text-foreground leading-snug">
                          {formatActionTitle(act)}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {timeAgo}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
