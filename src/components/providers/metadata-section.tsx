import React from 'react';
import { Resource } from '@/types';
import { Film, BookOpen, Star, Calendar, Clock, User, Hash } from 'lucide-react';

interface MetadataSectionProps {
  resource: Resource;
}

export function MetadataSection({ resource }: MetadataSectionProps) {
  const meta = resource.metadata || {};
  const hasMeta = Object.keys(meta).length > 0;

  if (!hasMeta && !resource.providerId) return null;

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
