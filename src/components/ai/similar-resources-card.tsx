"use client";

import React, { useEffect, useState } from "react";
import { Resource } from "@/types";
import { useAIAssistant } from "@/hooks/use-ai-assistant";
import { Sparkles, Loader2, ChevronRight, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SimilarResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource;
  allResources: Resource[];
  onSelectResource?: (resource: Resource) => void;
}

export function SimilarResourcesModal({
  isOpen,
  onClose,
  resource,
  allResources,
  onSelectResource,
}: SimilarResourcesModalProps) {
  const { findSimilarResources, isAnalyzing, error } = useAIAssistant();
  const [similarItems, setSimilarItems] = useState<
    Array<{ resource: Resource; matchScore: number; reason: string }>
  >([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasLoaded(false);
      setSimilarItems([]);
      findSimilarResources(resource, allResources).then((results) => {
        setSimilarItems(results);
        setHasLoaded(true);
      });
    }
  }, [isOpen, resource.id]);

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
                Similar Items in Archive
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
              <span>Analyzing archive context...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {hasLoaded && !isAnalyzing && similarItems.length === 0 && (
            <p className="text-xs text-muted-foreground italic text-center py-6">
              No other items in your archive closely match this resource.
            </p>
          )}

          {hasLoaded && !isAnalyzing && similarItems.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {similarItems.map(({ resource: item, matchScore, reason }) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectResource?.(item);
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-border/40 transition-all cursor-pointer group flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {matchScore}% match
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      {typeof reason === 'string' ? reason : String(reason)}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
