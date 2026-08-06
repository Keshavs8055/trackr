import React from 'react';
import { Resource } from '@/types';
import { Film, BookOpen, Star, Calendar, Clock, User, Hash, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

interface MetadataSectionProps {
  resource: Resource;
  onRetry?: () => void;
  onRemoveDetails?: () => void;
  isRefreshing?: boolean;
}

export function MetadataSection({ resource, onRetry, onRemoveDetails, isRefreshing }: MetadataSectionProps) {
  const meta = resource.metadata || {};
  const hasMeta = Object.keys(meta).length > 0;

  if (!hasMeta) {
    if (resource.provider && resource.provider !== 'manual') {
      return (
        <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
              <AlertCircle className="size-3.5" />
              Provider Details Not Found
            </span>
            <span className="text-[10px] text-muted-foreground capitalize">
              Provider: {resource.provider}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Catalog details for "{resource.title}" could not be retrieved from {resource.provider}.
          </p>
          <div className="flex items-center gap-2 pt-1">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={isRefreshing}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`size-3 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>Retry Fetch</span>
              </button>
            )}
            {onRemoveDetails && (
              <button
                type="button"
                onClick={onRemoveDetails}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
              >
                <Trash2 className="size-3 text-rose-400" />
                <span>Remove Details Part</span>
              </button>
            )}
          </div>
        </div>
      );
    }
    return null;
  }

  const year = meta.year || meta.publishYear ? String(meta.year || meta.publishYear) : undefined;
  const runtime = meta.runtime ? String(meta.runtime) : undefined;
  const rating = meta.imdbRating ? String(meta.imdbRating) : undefined;
  const director = meta.director || meta.author ? String(meta.director || meta.author) : undefined;
  const overview = meta.overview || meta.description ? String(meta.overview || meta.description) : undefined;
  const genre = meta.genre ? String(meta.genre) : undefined;
  const isbn = meta.isbn ? String(meta.isbn) : undefined;

  return (
    <div className="space-y-3 p-3.5 rounded-xl bg-secondary/20 border border-border/30">
      <div className="flex items-center justify-between border-b border-border/20 pb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
          {resource.type === 'movie' || resource.type === 'tv' ? (
            <Film className="size-3" />
          ) : (
            <BookOpen className="size-3" />
          )}
          Provider Metadata ({resource.provider})
        </span>

        {rating ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold">
            <Star className="size-2.5 fill-amber-500" />
            {rating}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {year && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="size-3.5 flex-shrink-0" />
            <span className="truncate">{year}</span>
          </div>
        )}

        {runtime && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5 flex-shrink-0" />
            <span className="truncate">{runtime}</span>
          </div>
        )}

        {director && (
          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
            <User className="size-3.5 flex-shrink-0" />
            <span className="truncate">{director}</span>
          </div>
        )}

        {isbn && (
          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
            <Hash className="size-3.5 flex-shrink-0" />
            <span className="truncate">ISBN: {isbn}</span>
          </div>
        )}

        {genre && (
          <div className="col-span-2 pt-0.5">
            <span className="text-[10px] text-muted-foreground/80 bg-secondary/50 px-2 py-0.5 rounded">
              {genre}
            </span>
          </div>
        )}
      </div>

      {overview && (
        <p className="text-xs text-foreground/80 leading-relaxed pt-1 border-t border-border/20 line-clamp-4">
          {overview}
        </p>
      )}
    </div>
  );
}
