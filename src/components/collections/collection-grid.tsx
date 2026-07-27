import React from 'react';
import { Collection, Resource } from '@/types';
import { CollectionService } from '@/services/collection-service';
import { Folder, Sparkles, Layers, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollectionGridProps {
  collections: Collection[];
  resources: Resource[];
  onSelectCollection: (collection: Collection) => void;
  onOpenCreateModal: () => void;
}

export function CollectionGrid({
  collections,
  resources,
  onSelectCollection,
  onOpenCreateModal,
}: CollectionGridProps) {
  if (collections.length === 0) {
    return (
      <div className="bg-secondary/10 border border-dashed border-border/40 rounded-xl p-6 text-center space-y-2">
        <Folder className="size-8 text-muted-foreground/40 mx-auto" />
        <h3 className="text-sm font-semibold text-foreground">No Collections Yet</h3>
        <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
          Organize your resources into custom collections or automated smart rule groups.
        </p>
        <button
          onClick={onOpenCreateModal}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all"
        >
          <span>Create Collection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
      {collections.map(col => {
        const itemCount = col.isDynamic 
          ? CollectionService.evaluateSmartCollectionRules(col, resources).length
          : (col.resourceIds?.length || col.itemIds?.length || 0);

        return (
          <div
            key={col.id}
            onClick={() => onSelectCollection(col)}
            className="group relative bg-secondary/20 hover:bg-secondary/35 border border-border/40 hover:border-border/70 rounded-xl p-3.5 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn("size-10 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0", col.color || 'bg-blue-500')}>
                {col.isDynamic ? <Sparkles className="size-5" /> : <Folder className="size-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {col.title}
                  </h4>
                  {col.isDynamic && (
                    <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Smart
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground/70 truncate">
                  {col.description || `${itemCount} items`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground/60 group-hover:text-foreground transition-colors">
              <span className="text-xs font-semibold">{itemCount}</span>
              <ChevronRight className="size-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
