"use client";

import React, { useState } from 'react';
import { Resource, ResourceRelationship, RelationshipType } from '@/types';
import { useResourceRelationships, useRemoveRelationship } from '@/hooks/use-relationships';
import { useResources } from '@/hooks/use-resources';
import { RelationshipSelectorModal } from './relationship-selector-modal';
import { GitFork, Plus, Trash2, ArrowUpRight, ArrowDownLeft, Link2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RelationshipGraphCardProps {
  resource: Resource;
  onOpenResourceDetails?: (resource: Resource) => void;
}

const TYPE_LABELS: Record<RelationshipType, string> = {
  adaptation_of: 'Adaptation Of',
  sequel_to: 'Sequel To',
  prequel_to: 'Prequel To',
  repository_for: 'Repository For',
  article_for: 'Article For',
  author_of: 'Author Of',
  related_to: 'Related To',
};

const TYPE_COLORS: Record<RelationshipType, string> = {
  adaptation_of: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  sequel_to: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  prequel_to: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  repository_for: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  article_for: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  author_of: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  related_to: 'bg-secondary text-muted-foreground border-border/30',
};

export function RelationshipGraphCard({ resource, onOpenResourceDetails }: RelationshipGraphCardProps) {
  const { data: relsData, isLoading } = useResourceRelationships(resource.id);
  const { data: allResources } = useResources();
  const removeRelationshipMutation = useRemoveRelationship();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const relationships = relsData?.all || [];

  const handleRemove = async (e: React.MouseEvent, rel: ResourceRelationship) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this connection?")) {
      await removeRelationshipMutation.mutateAsync({
        relationshipId: rel.id,
        sourceId: rel.sourceResourceId,
        targetId: rel.targetResourceId,
      });
    }
  };

  return (
    <div className="space-y-3 pt-1">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitFork className="size-4 text-primary" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Connected Knowledge Graph ({relationships.length})
          </h4>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <Plus className="size-3.5" />
          <span>Connect</span>
        </button>
      </div>

      {/* Relationship Graph Grid */}
      {isLoading ? (
        <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">
          Loading graph connections...
        </div>
      ) : relationships.length === 0 ? (
        <div className="py-4 px-4 rounded-xl border border-dashed border-border/40 text-center space-y-1">
          <GitFork className="size-5 text-muted-foreground/50 mx-auto" />
          <p className="text-xs font-semibold text-muted-foreground">No graph connections yet</p>
          <p className="text-[10px] text-muted-foreground/60">
            Connect related movies, books, articles, or repositories to build your web.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {relationships.map((rel) => {
            const isOutgoing = rel.sourceResourceId === resource.id;
            const targetId = isOutgoing ? rel.targetResourceId : rel.sourceResourceId;
            const connectedResource = (allResources || []).find((r) => r.id === targetId);

            const badgeColor = TYPE_COLORS[rel.type] || TYPE_COLORS.related_to;
            const typeLabel = TYPE_LABELS[rel.type] || 'Related To';

            return (
              <div
                key={rel.id}
                onClick={() => connectedResource && onOpenResourceDetails && onOpenResourceDetails(connectedResource)}
                className="p-3 rounded-xl bg-secondary/20 border border-border/30 hover:border-border/60 transition-all flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Directional Indicator */}
                  <div className="p-1.5 rounded-md bg-secondary/40 text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                    {isOutgoing ? <ArrowUpRight className="size-3.5" /> : <ArrowDownLeft className="size-3.5" />}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                        {typeLabel}
                      </span>
                      {connectedResource?.type && (
                        <span className="text-[10px] text-muted-foreground/70 uppercase font-semibold">
                          ({connectedResource.type})
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {connectedResource ? connectedResource.title : 'Linked Resource'}
                    </p>

                    {rel.notes && (
                      <p className="text-[11px] text-muted-foreground/70 italic truncate">
                        "{rel.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleRemove(e, rel)}
                  className="p-1.5 rounded-md text-muted-foreground/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  title="Remove connection"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Relationship Selector Modal */}
      <RelationshipSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sourceResource={resource}
      />
    </div>
  );
}
