"use client";

import React, { useState } from 'react';
import { Resource, ResourceRelationship, RelationshipType } from '@/types';
import { useResourceRelationships, useRemoveRelationship } from '@/hooks/use-relationships';
import { useResources } from '@/hooks/use-resources';
import { RelationshipSelectorModal } from './relationship-selector-modal';
import { GitFork, Plus, Trash2, ArrowUpRight, ArrowDownLeft, Link2, ExternalLink, Info, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showInfoBanner, setShowInfoBanner] = useState(false);

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
        <div className="flex items-center gap-1.5 min-w-0">
          <GitFork className="size-4 text-primary flex-shrink-0" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
            Connected Knowledge Graph ({relationships.length})
          </h4>
          <button
            type="button"
            onClick={() => setShowInfoBanner(!showInfoBanner)}
            className="p-1 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-secondary/60"
            title="How Knowledge Graph works"
            aria-label="Knowledge Graph info"
          >
            <Info className="size-3.5" />
          </button>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
        >
          <Plus className="size-3.5" />
          <span>Connect</span>
        </button>
      </div>

      {/* Small Responsive Helper Text */}
      <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
        Link books, movies, repositories, and articles to construct your personal bi-directional knowledge web.
      </p>

      {/* Interactive Info Banner */}
      <AnimatePresence>
        {showInfoBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs space-y-2 relative">
              <button
                onClick={() => setShowInfoBanner(false)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>

              <div className="flex items-center gap-1.5 font-bold text-primary text-[11px] uppercase tracking-wider">
                <Info className="size-3.5" />
                <span>How to use Knowledge Graph</span>
              </div>

              <ul className="space-y-1.5 text-[11px] text-foreground/80 pl-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Bi-directional links:</strong> Connecting items creates a linked network. Updating one reflects on both resources.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Relationship Types:</strong> Categorize connections as <em>Adaptation Of</em>, <em>Sequel To</em>, <em>Repository For</em>, <em>Article For</em>, <em>Author Of</em>, or <em>Related To</em>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Quick Navigation:</strong> Click any connected resource card to instantly navigate into its details modal.</span>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
