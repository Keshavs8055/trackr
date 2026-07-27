"use client";

import React, { useMemo } from 'react';
import { useResources } from '@/hooks/use-resources';
import { Link2, Search } from 'lucide-react';
import { Resource } from '@/types';

interface WikiLinkAutocompleteProps {
  searchTerm: string;
  onSelect: (resourceTitle: string) => void;
  onClose: () => void;
}

export function WikiLinkAutocomplete({ searchTerm, onSelect, onClose }: WikiLinkAutocompleteProps) {
  const { data: resources } = useResources();

  const filteredResources = useMemo(() => {
    if (!resources) return [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return resources.slice(0, 8);
    return resources.filter(r => r.title.toLowerCase().includes(term)).slice(0, 8);
  }, [resources, searchTerm]);

  if (filteredResources.length === 0) {
    return (
      <div className="absolute z-50 mt-1 w-64 bg-popover text-popover-foreground border border-border/60 rounded-xl shadow-xl p-3 text-xs text-muted-foreground">
        No resources found matching &quot;{searchTerm}&quot;
      </div>
    );
  }

  return (
    <div className="absolute z-50 mt-1 w-72 max-h-56 overflow-y-auto bg-popover text-popover-foreground border border-border/60 rounded-xl shadow-2xl p-1.5 space-y-1">
      <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/30">
        <span>Link to Resource</span>
        <Link2 className="size-3 text-primary" />
      </div>

      {filteredResources.map((res: Resource) => (
        <button
          key={res.id}
          type="button"
          onClick={() => onSelect(res.title)}
          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-accent flex items-center gap-2.5 transition-colors group"
        >
          <div className="size-6 rounded-md bg-secondary/80 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">
            <Link2 className="size-3" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate text-foreground leading-tight">
              {res.title}
            </p>
            <span className="text-[10px] text-muted-foreground capitalize">
              {res.type}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
