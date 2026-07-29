"use client";

import React, { useState, useEffect } from "react";
import { Resource } from "@/types";
import { useAIAssistant } from "@/hooks/use-ai-assistant";
import { Sparkles, Loader2, Check, X, Tag, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface AutoTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource;
  existingWorkspaceTags: string[];
  onApplyTags: (tags: string[]) => Promise<void>;
}

export function AutoTagModal({
  isOpen,
  onClose,
  resource,
  existingWorkspaceTags,
  onApplyTags,
}: AutoTagModalProps) {
  const { generateAutoTags, isAnalyzing, error } = useAIAssistant();
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasLoaded(false);
      setSuggestedTags([]);
      setSelectedTags([]);
      generateAutoTags(resource, existingWorkspaceTags)
        .then((tags) => {
          // Filter out tags that the resource already has
          const currentSet = new Set((resource.tags || []).map((t) => t.toLowerCase()));
          const newSuggestions = tags.filter((t) => !currentSet.has(t.toLowerCase()));
          setSuggestedTags(newSuggestions);
          setSelectedTags(newSuggestions);
          setHasLoaded(true);
        })
        .catch(() => setHasLoaded(true));
    }
  }, [isOpen, resource.id]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleConfirm = async () => {
    if (selectedTags.length === 0) {
      onClose();
      return;
    }
    setIsApplying(true);
    try {
      // Merge current resource tags with newly approved selected tags (retaining all user tags)
      const existing = resource.tags || [];
      const merged = Array.from(new Set([...existing, ...selectedTags]));
      await onApplyTags(merged);
      onClose();
    } catch (err) {
      console.error("Failed to apply auto-tags:", err);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-overlay">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden space-y-4 p-5"
        >
          <div className="flex items-center justify-between border-b border-border/30 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-foreground">
                AI Tag Suggestions
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {isAnalyzing && (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
              <Loader2 className="size-4 animate-spin text-purple-400" />
              <span>Matching taxonomy & generating suggestions...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {hasLoaded && !isAnalyzing && suggestedTags.length === 0 && (
            <div className="py-6 text-center space-y-1">
              <Tag className="size-5 text-muted-foreground/50 mx-auto" />
              <p className="text-xs text-muted-foreground">No new tags suggested.</p>
              <p className="text-[11px] text-muted-foreground/60">
                This resource already matches your existing workspace taxonomy.
              </p>
            </div>
          )}

          {hasLoaded && !isAnalyzing && suggestedTags.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Select the suggested tags you would like to add to <span className="font-semibold text-foreground">{resource.title}</span>:
              </p>

              <div className="flex flex-wrap gap-2 py-2">
                {suggestedTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  const isExistingWorkspaceTag = existingWorkspaceTags.includes(tag);

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                        isSelected
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          : "bg-secondary/30 text-muted-foreground border-border/30 hover:border-border/60"
                      }`}
                    >
                      <span>#{tag}</span>
                      {isExistingWorkspaceTag && (
                        <span className="text-[9px] px-1 rounded bg-secondary text-muted-foreground/70 uppercase">
                          existing
                        </span>
                      )}
                      {isSelected && <Check className="size-3 text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            {suggestedTags.length > 0 && (
              <Button
                size="sm"
                disabled={isApplying || selectedTags.length === 0}
                onClick={handleConfirm}
                className="h-9 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
              >
                {isApplying ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Add {selectedTags.length} Tag{selectedTags.length === 1 ? "" : "s"}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
