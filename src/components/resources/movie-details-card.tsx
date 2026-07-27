import React from 'react';
import { Resource } from '@/types';
import { Star, Clock, Calendar, User, Film } from 'lucide-react';

interface TypeCardProps {
  resource: Resource;
}

export function MovieDetailsCard({ resource }: TypeCardProps) {
  const meta = (resource.providerMetadata?.metadata || resource.metadata || {}) as Record<string, any>;
  
  const year = meta.year || meta.Year;
  const runtime = meta.runtime || meta.Runtime;
  const director = meta.director || meta.Director;
  const actors = meta.actors || meta.Actors;
  const genre = meta.genre || meta.Genre;
  const overview = meta.overview || meta.Plot;
  const imdbRating = meta.imdbRating;

  return (
    <div className="bg-secondary/20 border border-border/40 rounded-xl p-4 space-y-3.5">
      <div className="flex items-center justify-between border-b border-border/20 pb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
          <Film className="size-4" />
          <span>Movie Details</span>
        </div>
        {Boolean(imdbRating) && (
          <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-2 py-0.5 rounded-full text-xs font-bold">
            <Star className="size-3 fill-yellow-500" />
            <span>{String(imdbRating)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {Boolean(year) && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="size-3.5 text-primary/70" />
            <span>Year: <strong className="text-foreground">{String(year)}</strong></span>
          </div>
        )}
        {Boolean(runtime) && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5 text-primary/70" />
            <span>Runtime: <strong className="text-foreground">{String(runtime)}</strong></span>
          </div>
        )}
        {Boolean(director) && (
          <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
            <User className="size-3.5 text-primary/70" />
            <span>Director: <strong className="text-foreground">{String(director)}</strong></span>
          </div>
        )}
      </div>

      {Boolean(genre) && (
        <div className="flex flex-wrap gap-1 pt-1">
          {String(genre).split(',').map((g, idx) => (
            <span key={idx} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md text-[10px] font-semibold">
              {g.trim()}
            </span>
          ))}
        </div>
      )}

      {Boolean(actors) && (
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground/80">Cast: </span>
          {String(actors)}
        </div>
      )}

      {Boolean(overview) && (
        <div className="text-xs text-muted-foreground/90 bg-secondary/30 p-2.5 rounded-lg border border-border/20 italic leading-relaxed">
          "{String(overview)}"
        </div>
      )}
    </div>
  );
}
