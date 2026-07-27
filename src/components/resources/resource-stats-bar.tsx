import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Resource } from '@/types';
import { Film, BookOpen, Tv, Globe, Code, Gamepad2, Mic, Settings, FileText, ChevronDown, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResourceStatsBarProps {
  resources: Resource[];
}

const TYPE_COLORS: Record<string, string> = {
  movie: 'bg-blue-500',
  book: 'bg-emerald-500',
  tv: 'bg-purple-500',
  article: 'bg-orange-500',
  website: 'bg-cyan-500',
  github: 'bg-slate-500',
  course: 'bg-indigo-500',
  podcast: 'bg-yellow-500',
  game: 'bg-red-500',
  tool: 'bg-pink-500',
  note: 'bg-zinc-500',
  custom: 'bg-teal-500',
};

const TYPE_ICONS: Record<string, React.FC<any>> = {
  movie: Film,
  book: BookOpen,
  tv: Tv,
  article: FileText,
  website: Globe,
  github: Code,
  course: BookOpen,
  podcast: Mic,
  game: Gamepad2,
  tool: Settings,
  note: FileText,
  custom: FileText,
};

export function ResourceStatsBar({ resources }: ResourceStatsBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const stats = useMemo(() => {
    const typeCount: Record<string, number> = {};
    const statusCount: Record<string, number> = {};

    // Calculate watch runtime and book pages metrics from metadata
    let totalRuntimeMinutes = 0;
    let totalBookPages = 0;

    resources.forEach(r => {
      // Type distribution
      typeCount[r.type] = (typeCount[r.type] || 0) + 1;
      
      // Status distribution
      const status = r.status || 'unspecified';
      statusCount[status] = (statusCount[status] || 0) + 1;

      // Extract metadata (supports providerMetadata or legacy metadata)
      const meta = r.providerMetadata?.metadata || r.metadata || {};
      
      if (r.type === 'movie' || r.type === 'tv') {
        const rawRuntime = meta.runtime;
        if (typeof rawRuntime === 'number') {
          totalRuntimeMinutes += rawRuntime;
        } else if (typeof rawRuntime === 'string') {
          const match = rawRuntime.match(/(\d+)/);
          if (match) {
            totalRuntimeMinutes += parseInt(match[1], 10);
          }
        }
      }

      if (r.type === 'book') {
        const rawPages = meta.pageCount || meta.pages || meta.numberOfPages;
        if (typeof rawPages === 'number') {
          totalBookPages += rawPages;
        } else if (typeof rawPages === 'string') {
          const parsed = parseInt(rawPages, 10);
          if (!isNaN(parsed)) {
            totalBookPages += parsed;
          }
        }
      }
    });

    // Type percentages for progress bar
    const totalItems = resources.length;
    const typePercentages = Object.entries(typeCount)
      .map(([type, count]) => ({
        type,
        count,
        percent: totalItems > 0 ? (count / totalItems) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Format watch runtime into hours/days
    let formattedRuntime = '';
    if (totalRuntimeMinutes > 0) {
      const hours = Math.floor(totalRuntimeMinutes / 60);
      const days = (hours / 24).toFixed(1);
      formattedRuntime = hours >= 24 ? `${hours}h (${days}d)` : `${hours}h`;
    }

    return {
      totalItems,
      typeCount,
      statusCount,
      typePercentages,
      totalRuntimeMinutes,
      formattedRuntime,
      totalBookPages,
    };
  }, [resources]);

  if (resources.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-secondary/20 border border-border/40 rounded-xl overflow-hidden mb-4"
    >
      <div 
        className="p-3.5 flex items-center justify-between cursor-pointer md:cursor-default"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BarChart2 className="size-4 text-primary" />
          <span>Archive Stats</span>
          <span className="text-muted-foreground text-xs font-normal">({stats.totalItems} items)</span>
        </div>
        <button className="md:hidden p-1 text-muted-foreground hover:bg-secondary rounded-md transition-colors">
          <ChevronDown className={cn("size-4 transition-transform", isExpanded ? "rotate-180" : "")} />
        </button>
      </div>

      {/* Visual Type Breakdown Bar (Always visible) */}
      <div className="px-4 pb-3">
        <div className="h-1.5 w-full rounded-full bg-secondary/50 flex overflow-hidden">
          {stats.typePercentages.map(({ type, percent }) => (
            <div 
              key={type}
              className={cn("h-full transition-all", TYPE_COLORS[type] || 'bg-gray-500')}
              style={{ width: `${percent}%` }}
              title={`${type}: ${percent.toFixed(1)}%`}
            />
          ))}
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out md:max-h-96",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0 md:opacity-100"
        )}
      >
        <div className="px-4 pb-4 border-t border-border/20 pt-4 bg-secondary/10 space-y-4">
          {/* Type Distribution */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">By Type</p>
            <div className="flex flex-wrap gap-2">
              {stats.typePercentages.map(({ type, count }) => {
                const Icon = TYPE_ICONS[type] || FileText;
                const textColor = TYPE_COLORS[type] ? TYPE_COLORS[type].replace('bg-', 'text-') : 'text-muted-foreground';
                return (
                  <div key={type} className="flex items-center gap-1.5 bg-secondary/40 px-2 py-1 rounded-md text-xs border border-border/30">
                    <Icon className={cn("size-3", textColor)} />
                    <span className="capitalize">{type}</span>
                    <span className="text-muted-foreground font-semibold ml-1">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Metrics (Runtime & Book Pages) */}
          {(stats.formattedRuntime || stats.totalBookPages > 0) && (
            <div className="grid grid-cols-2 gap-2 pb-1">
              {stats.formattedRuntime && (
                <div className="bg-secondary/40 p-2 rounded-lg border border-border/30 flex items-center gap-2">
                  <Film className="size-4 text-blue-400" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Watch Time</p>
                    <p className="text-xs font-bold text-foreground">{stats.formattedRuntime}</p>
                  </div>
                </div>
              )}
              {stats.totalBookPages > 0 && (
                <div className="bg-secondary/40 p-2 rounded-lg border border-border/30 flex items-center gap-2">
                  <BookOpen className="size-4 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Book Pages</p>
                    <p className="text-xs font-bold text-foreground">{stats.totalBookPages.toLocaleString()} pages</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Distribution */}
          <div className="border-t border-border/10 pt-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">By Status</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.statusCount).map(([status, count]) => (
                <div key={status} className="flex items-center gap-1.5 bg-secondary/40 px-2 py-1 rounded-md text-xs border border-border/30">
                  <span className="capitalize">{status}</span>
                  <span className="text-muted-foreground font-semibold ml-1">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
