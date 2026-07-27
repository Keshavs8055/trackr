import React from 'react';
import { SearchResult } from '@/types';
import { Plus, Image as ImageIcon } from 'lucide-react';

interface SearchResultCardProps {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
  isSelecting?: boolean;
}

export function SearchResultCard({ result, onSelect, isSelecting }: SearchResultCardProps) {
  return (
    <div
      onClick={() => onSelect(result)}
      className="group p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 border border-border/40 transition-all duration-150 cursor-pointer flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {result.image ? (
          <img
            src={result.image}
            alt={result.title}
            className="size-11 rounded-lg object-cover bg-secondary flex-shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="size-11 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0 text-muted-foreground/50">
            <ImageIcon className="size-5" />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {result.title}
            </h4>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1.5 py-0.2 rounded bg-secondary">
              {result.provider}
            </span>
          </div>

          {result.subtitle && (
            <p className="text-xs text-muted-foreground truncate">
              {result.subtitle}
            </p>
          )}
        </div>
      </div>

      <button
        disabled={isSelecting}
        className="h-8 px-2.5 rounded-lg bg-secondary/50 group-hover:bg-primary group-hover:text-primary-foreground text-xs font-semibold flex items-center gap-1 transition-all flex-shrink-0"
      >
        <Plus className="size-3.5" />
        <span>Select</span>
      </button>
    </div>
  );
}
