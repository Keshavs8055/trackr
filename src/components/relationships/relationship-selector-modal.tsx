"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Resource, RelationshipType } from '@/types';
import { useResources } from '@/hooks/use-resources';
import { useAddRelationship } from '@/hooks/use-relationships';
import { X, Search, Link2, GitFork, BookOpen, Film, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RelationshipSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceResource: Resource;
}

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string; description: string }[] = [
  { value: 'adaptation_of', label: 'Adaptation Of', description: 'e.g. Movie based on a Book' },
  { value: 'sequel_to', label: 'Sequel To', description: 'e.g. Dune Part 2 sequel to Dune' },
  { value: 'prequel_to', label: 'Prequel To', description: 'e.g. The Hobbit prequel to Lord of the Rings' },
  { value: 'repository_for', label: 'Repository For', description: 'e.g. GitHub repo for a Course or Article' },
  { value: 'article_for', label: 'Article For', description: 'e.g. Review/article about a Movie or Tool' },
  { value: 'author_of', label: 'Author Of', description: 'e.g. Author or Creator connection' },
  { value: 'related_to', label: 'Related To', description: 'e.g. General thematic connection' },
];

export function RelationshipSelectorModal({ isOpen, onClose, sourceResource }: RelationshipSelectorModalProps) {
  const { data: resources } = useResources();
  const addRelationshipMutation = useAddRelationship();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<RelationshipType>('related_to');
  const [notes, setNotes] = useState('');

  // Exclude current resource from targets
  const availableTargets = (resources || []).filter(
    (r) => r.id !== sourceResource.id && r.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const selectedTargetResource = (resources || []).find((r) => r.id === selectedTargetId);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) return;

    await addRelationshipMutation.mutateAsync({
      sourceResourceId: sourceResource.id,
      targetResourceId: selectedTargetId,
      type: selectedType,
      notes: notes.trim() || undefined,
      sourceTitle: sourceResource.title,
      targetTitle: selectedTargetResource?.title,
    });

    // Reset & close
    setSelectedTargetId(null);
    setSearchQuery('');
    setNotes('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitFork className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Connect Resource
                </h3>
              </div>
              <button
                onClick={onClose}
                className="size-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Source Resource Context */}
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 text-xs">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
                  Source Resource
                </span>
                <span className="font-semibold text-foreground">{sourceResource.title}</span>
              </div>

              {/* Target Resource Picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  1. Pick Target Resource
                </label>

                <div className="relative">
                  <Search className="size-3.5 absolute left-3 top-3 text-muted-foreground/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search resources by title..."
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-secondary/20 border border-border/40 text-xs outline-none focus:border-primary/50"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {availableTargets.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 italic py-2 text-center">
                      No matching resources found.
                    </p>
                  ) : (
                    availableTargets.map((target) => {
                      const isSelected = selectedTargetId === target.id;
                      return (
                        <div
                          key={target.id}
                          onClick={() => setSelectedTargetId(target.id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                              : 'bg-secondary/15 border-border/20 hover:bg-secondary/40 text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="px-1.5 py-0.5 rounded bg-secondary/60 text-[10px] uppercase font-bold text-muted-foreground">
                              {target.type}
                            </span>
                            <span className="truncate">{target.title}</span>
                          </div>
                          {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Relationship Type Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  2. Relationship Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RELATIONSHIP_TYPES.map((rel) => {
                    const isSelected = selectedType === rel.value;
                    return (
                      <div
                        key={rel.value}
                        onClick={() => setSelectedType(rel.value)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                            : 'bg-secondary/15 border-border/20 hover:bg-secondary/35 text-muted-foreground'
                        }`}
                      >
                        <p className="font-bold text-xs">{rel.label}</p>
                        <p className="text-[10px] text-muted-foreground/70 leading-tight">{rel.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  3. Relationship Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 2021 Denis Villeneuve film adaptation"
                  className="w-full h-9 px-3 rounded-lg bg-secondary/20 border border-border/40 text-xs outline-none focus:border-primary/50"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="flex-1 h-9 rounded-lg text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedTargetId || addRelationshipMutation.isPending}
                  size="sm"
                  className="flex-1 h-9 rounded-lg text-xs font-semibold gap-1.5"
                >
                  {addRelationshipMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Link2 className="size-3.5" />
                  )}
                  <span>Connect Resources</span>
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
