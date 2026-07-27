"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProviderSearch } from "@/hooks/use-provider-search";
import { SearchResultCard } from "./search-result-card";
import { RESOURCE_TYPES, ResourceType, SearchResult } from "@/types";
import { Search, X, Loader2, Plus, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProviderSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: ResourceType;
  initialQuery?: string;
  onSelectResult: (result: SearchResult) => void;
  onManualCreate: (title: string, type: ResourceType) => void;
}

export function ProviderSearchModal({
  isOpen,
  onClose,
  initialType = RESOURCE_TYPES.MOVIE,
  initialQuery = "",
  onSelectResult,
  onManualCreate,
}: ProviderSearchModalProps) {
  const [selectedType, setSelectedType] = useState<ResourceType>(initialType);
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, debouncedQuery } = useProviderSearch(
    selectedType,
    queryInput,
    page
  );

  if (!isOpen) return null;

  const results = data?.results.results || [];
  const hasMore = data?.results.hasMore || false;
  const providerName = data?.providerName || "manual";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-xs md:items-center p-4 pt-12 md:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Search Online Metadata
              </h3>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary active:scale-95 transition-all"
              aria-label="Close"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>

          {/* Type Selector & Input */}
          <div className="p-4 space-y-3 border-b border-border/30 bg-secondary/10">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                RESOURCE_TYPES.MOVIE,
                RESOURCE_TYPES.BOOK,
                RESOURCE_TYPES.TV,
                RESOURCE_TYPES.NOTE,
              ].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedType(t);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all border ${
                    selectedType === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/40 text-muted-foreground border-transparent hover:bg-secondary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
              <input
                value={queryInput}
                onChange={(e) => {
                  setQueryInput(e.target.value);
                  setPage(1);
                }}
                placeholder={`Search ${selectedType} titles...`}
                className="w-full pl-9 pr-9 h-10 rounded-lg bg-secondary/40 border border-border/40 text-sm font-medium outline-none focus:border-primary/40 transition-all placeholder:text-muted-foreground/50"
                autoFocus
              />
              {queryInput && (
                <button
                  onClick={() => setQueryInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="p-4 overflow-y-auto space-y-2.5 flex-1 min-h-[220px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
                <Loader2 className="size-6 animate-spin" />
                <p className="text-xs">Searching {providerName}...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-xs font-medium text-destructive">
                  {(error as any)?.userMessage || "Search failed."}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  You can always create this resource manually.
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-10 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  {debouncedQuery ? "No online results found" : "Type to search metadata"}
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  {debouncedQuery
                    ? "Try adjusting search query or create manually below."
                    : "Enter keywords above to fetch online titles."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((res) => (
                  <SearchResultCard
                    key={`${res.provider}-${res.providerId}`}
                    result={res}
                    onSelect={(selected) => {
                      onSelectResult(selected);
                      onClose();
                    }}
                  />
                ))}

                {/* Pagination */}
                <div className="flex items-center justify-between pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 text-xs gap-1"
                  >
                    <ArrowLeft className="size-3" /> Prev
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasMore}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-8 text-xs gap-1"
                  >
                    Next <ArrowRight className="size-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Prominent Manual Creation Fallback (Never Blocked) */}
          <div className="p-3.5 bg-secondary/20 border-t border-border/30 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {queryInput.trim() ? `"${queryInput.trim()}"` : "Or create manually"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Always available offline without API key
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                onManualCreate(queryInput.trim(), selectedType);
                onClose();
              }}
              className="h-8 text-xs font-semibold gap-1 flex-shrink-0"
            >
              <Plus className="size-3.5" />
              <span>Create Manually</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
