"use client";

import React, { useState } from 'react';
import { Sparkles, Tag, GitFork, Wrench, RefreshCw, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIActionPopoverProps {
  onAutoTag: () => void;
  onFindSimilar: () => void;
  onCleanMetadata: () => void;
  onEnhanceMetadata: () => void;
  isAnalyzing?: boolean;
}

export function AIActionPopover({
  onAutoTag,
  onFindSimilar,
  onCleanMetadata,
  onEnhanceMetadata,
  isAnalyzing = false,
}: AIActionPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (actionFn: () => void) => {
    setIsOpen(false);
    actionFn();
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        disabled={isAnalyzing}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="h-8 px-2.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 border border-purple-500/20"
        title="AI Assistant Actions"
      >
        <Sparkles className={`size-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
        <span>AI Actions</span>
        <ChevronDown className="size-3 text-purple-400/70" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-1 z-50 w-52 py-1 bg-card border border-border/80 rounded-xl shadow-xl backdrop-blur-md overflow-hidden"
            >
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/30 flex items-center gap-1.5">
                <Sparkles className="size-3 text-purple-400" />
                <span>On-Demand AI Tools</span>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => handleAction(onAutoTag)}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-secondary/60 flex items-center gap-2 transition-colors"
                >
                  <Tag className="size-3.5 text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold">Auto-Tag Resource</div>
                    <div className="text-[10px] text-muted-foreground truncate">Suggest tags using archive taxonomy</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(onFindSimilar)}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-secondary/60 flex items-center gap-2 transition-colors"
                >
                  <GitFork className="size-3.5 text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold">Find Similar in Archive</div>
                    <div className="text-[10px] text-muted-foreground truncate">Discover related items in your library</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(onCleanMetadata)}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-secondary/60 flex items-center gap-2 transition-colors"
                >
                  <Wrench className="size-3.5 text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold">Clean & Normalize Tags</div>
                    <div className="text-[10px] text-muted-foreground truncate">Standardize tags & formatting</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(onEnhanceMetadata)}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-secondary/60 flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="size-3.5 text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold">Enhance Provider Metadata</div>
                    <div className="text-[10px] text-muted-foreground truncate">Fetch latest provider details</div>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
