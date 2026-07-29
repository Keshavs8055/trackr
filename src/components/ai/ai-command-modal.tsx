"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAIAssistant } from "@/hooks/use-ai-assistant";
import { Resource, NLQueryResult, AIDuplicateGroup } from "@/types";
import {
  Sparkles,
  Search,
  X,
  Loader2,
  FolderPlus,
  CopyCheck,
  Tag,
  BrainCircuit,
  ArrowRight,
  AlertCircle,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AICommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  allResources: Resource[];
  onSelectResource?: (resource: Resource) => void;
  onCreateCollection?: (collection: any) => void;
}

export function AICommandModal({
  isOpen,
  onClose,
  allResources,
  onSelectResource,
  onCreateCollection,
}: AICommandModalProps) {
  const {
    naturalLanguageQuery,
    generateSmartCollection,
    detectDuplicates,
    isAnalyzing,
    error,
  } = useAIAssistant();

  const [activeMode, setActiveMode] = useState<"nl_search" | "smart_collection" | "duplicates">("nl_search");
  const [queryInput, setQueryInput] = useState("");
  const [nlResult, setNlResult] = useState<NLQueryResult | null>(null);
  const [duplicates, setDuplicates] = useState<AIDuplicateGroup[]>([]);
  const [duplicateLoaded, setDuplicateLoaded] = useState(false);

  // Global Cmd+Shift+K Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleExecuteNLQuery = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!queryInput.trim() || isAnalyzing) return;
    const result = await naturalLanguageQuery(queryInput.trim(), allResources);
    setNlResult(result);
  };

  const handleGenerateCollection = async () => {
    if (!queryInput.trim() || isAnalyzing) return;
    const collectionData = await generateSmartCollection(queryInput.trim(), allResources);
    if (collectionData) {
      onCreateCollection?.(collectionData);
      onClose();
    }
  };

  const handleDetectDuplicates = async () => {
    const dupGroups = await detectDuplicates(allResources);
    setDuplicates(dupGroups);
    setDuplicateLoaded(true);
  };

  const resourceMap = new Map(allResources.map((r) => [r.id, r]));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 bg-black/50 backdrop-blur-overlay p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          className="relative z-10 w-full max-w-2xl bg-card rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header & Modes */}
          <div className="px-5 py-4 border-b border-border/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-purple-400" />
                <h2 className="text-sm font-semibold text-foreground tracking-tight">
                  Trackr AI Intelligence Assistant
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border/40 text-xs font-semibold">
              <button
                onClick={() => setActiveMode("nl_search")}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeMode === "nl_search"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BrainCircuit className="size-3.5 text-purple-400" />
                <span>Natural Search</span>
              </button>
              <button
                onClick={() => setActiveMode("smart_collection")}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeMode === "smart_collection"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FolderPlus className="size-3.5 text-blue-400" />
                <span>Smart Collection</span>
              </button>
              <button
                onClick={() => {
                  setActiveMode("duplicates");
                  if (!duplicateLoaded) handleDetectDuplicates();
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeMode === "duplicates"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CopyCheck className="size-3.5 text-amber-400" />
                <span>Duplicate Audit</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="size-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Natural Search Mode */}
            {activeMode === "nl_search" && (
              <div className="space-y-4">
                <form onSubmit={handleExecuteNLQuery} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      placeholder='Ask in natural language e.g. "Find unread sci-fi books from the 90s"...'
                      className="w-full h-9 pl-9 pr-3 rounded-xl bg-secondary/30 border border-border/50 text-xs text-foreground outline-none focus:border-purple-500/60"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isAnalyzing || !queryInput.trim()}
                    className="h-9 px-4 text-xs font-semibold gap-1.5"
                  >
                    {isAnalyzing ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                    Query
                  </Button>
                </form>

                {nlResult && (
                  <div className="space-y-3 pt-2">
                    {/* Intent & Confidence Header */}
                    <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <BrainCircuit className="size-4 text-purple-400" />
                          Intent: {nlResult.intent}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                          {Math.round((nlResult.confidence || 0.9) * 100)}% Confidence
                        </span>
                      </div>
                      <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                        {nlResult.answer}
                      </p>
                      <div className="pt-1 text-[11px] text-muted-foreground/80 leading-relaxed border-t border-purple-500/10">
                        <span className="font-semibold text-muted-foreground">AI Reasoning:</span>{" "}
                        {nlResult.reasoning}
                      </div>
                    </div>

                    {/* Matching Items List */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground">
                        Matching Items ({nlResult.matchingResourceIds.length})
                      </h4>
                      {nlResult.matchingResourceIds.map((id) => {
                        const item = resourceMap.get(id);
                        if (!item) return null;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              onSelectResource?.(item);
                              onClose();
                            }}
                            className="p-3 rounded-xl bg-secondary/20 hover:bg-secondary/50 border border-border/40 transition-all cursor-pointer flex items-center justify-between group"
                          >
                            <div className="space-y-0.5">
                              <h5 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                {item.title}
                              </h5>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span className="uppercase font-mono">{item.type}</span>
                                <span>•</span>
                                <span>{(item.tags || []).map((t) => `#${t}`).join(", ")}</span>
                              </div>
                            </div>
                            <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Smart Collection Mode */}
            {activeMode === "smart_collection" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Describe Smart Collection Criteria
                  </label>
                  <input
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    placeholder='e.g. "Dystopian sci-fi movies and books to complete this summer"...'
                    className="w-full h-9 px-3 rounded-xl bg-secondary/30 border border-border/50 text-xs text-foreground outline-none focus:border-blue-500/60"
                  />
                </div>

                <Button
                  disabled={isAnalyzing || !queryInput.trim()}
                  onClick={handleGenerateCollection}
                  className="w-full h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-500 gap-2"
                >
                  {isAnalyzing ? <Loader2 className="size-3.5 animate-spin" /> : <FolderPlus className="size-3.5" />}
                  Generate Collection Rules
                </Button>
              </div>
            )}

            {/* Duplicates Mode */}
            {activeMode === "duplicates" && (
              <div className="space-y-3">
                {isAnalyzing ? (
                  <div className="flex justify-center py-8 text-xs text-muted-foreground gap-2">
                    <Loader2 className="size-4 animate-spin text-amber-400" />
                    <span>Auditing catalog for duplicate entries...</span>
                  </div>
                ) : duplicates.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">
                    No duplicate entries detected in your archive.
                  </p>
                ) : (
                  duplicates.map((group, idx) => {
                    const primary = resourceMap.get(group.primaryResourceId);
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">
                            Duplicate Group #{idx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-amber-400">
                            {Math.round(group.confidence * 100)}% Confidence
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{group.reason}</p>
                        {primary && (
                          <div className="text-xs font-semibold text-foreground pt-1">
                            Primary: {primary.title} ({primary.type})
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
