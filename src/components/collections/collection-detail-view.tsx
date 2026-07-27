import React, { useState } from 'react';
import { Collection, Resource } from '@/types';
import { CollectionService } from '@/services/collection-service';
import { ResourceCard } from '@/components/resource-card';
import { ArrowLeft, Sparkles, Folder, Settings2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeleteCollection } from '@/hooks/use-collections';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface CollectionDetailViewProps {
  collection: Collection;
  resources: Resource[];
  onBack: () => void;
  onOpenEditModal: (collection: Collection) => void;
  onOpenResourceDetails: (resource: Resource) => void;
}

export function CollectionDetailView({
  collection,
  resources,
  onBack,
  onOpenEditModal,
  onOpenResourceDetails,
}: CollectionDetailViewProps) {
  const { mutateAsync: deleteCollection, isPending: isDeleting } = useDeleteCollection();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const matchingResourceIds = collection.isDynamic 
    ? CollectionService.evaluateSmartCollectionRules(collection, resources)
    : (collection.resourceIds || collection.itemIds || []);

  const collectionResources = resources.filter(r => matchingResourceIds.includes(r.id));

  const handleConfirmDelete = async () => {
    try {
      await deleteCollection(collection.id);
      setShowConfirmDelete(false);
      onBack();
    } catch (err) {
      console.error("Failed to delete collection:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Navigation & Header */}
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to All Collections</span>
        </button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenEditModal(collection)} className="h-8 px-2 text-xs gap-1">
            <Settings2 className="size-3.5" />
            <span>Edit</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowConfirmDelete(true)} className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 gap-1">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Collection Title Banner */}
      <div className="bg-secondary/20 border border-border/40 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-lg flex items-center justify-center text-white ${collection.color || 'bg-blue-500'}`}>
            {collection.isDynamic ? <Sparkles className="size-5" /> : <Folder className="size-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">{collection.title}</h2>
              {collection.isDynamic && (
                <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Smart Rules
                </span>
              )}
            </div>
            {collection.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{collection.description}</p>
            )}
          </div>
        </div>
        <span className="text-xs font-semibold text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-md border border-border/30">
          {collectionResources.length} items
        </span>
      </div>

      {/* Collection Resource Items */}
      <div className="space-y-1 pt-2">
        {collectionResources.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No resources match this collection yet.
          </div>
        ) : (
          collectionResources.map((resource, i) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              index={i}
              onOpenDetails={onOpenResourceDetails}
            />
          ))
        )}
      </div>

      {/* Custom Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Delete Collection"
        description={`Are you sure you want to delete collection "${collection.title}"? Resources in this collection will not be deleted.`}
        confirmText="Delete Collection"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
      />
    </div>
  );
}
