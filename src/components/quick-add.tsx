"use client";

import * as React from "react";
import { Command } from "cmdk";
import { useAppStore } from "@/store/app-store";
import { useAddResource, useUserTags } from "@/hooks/use-resources";
import { providerManager } from "@/services/providers/provider-manager";
import { useProviderSearch } from "@/hooks/use-provider-search";
import { Loader2, X, Hash, CornerDownLeft, Sparkles, Globe, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HASHTAG_REGEX, formatTag, extractTags, cleanTitle, extractUrl } from "@/lib/parser";
import { PROVIDERS, RESERVED_TYPE_TAGS, RESOURCE_TYPES, ResourceType, SearchResult } from "@/types";

export function QuickAdd() {
  const { quickAddOpen, setQuickAddOpen } = useAppStore();
  const [inputValue, setInputValue] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isTypingTag, setIsTypingTag] = React.useState(false);
  const [searchTag, setSearchTag] = React.useState("");
  
  const { mutateAsync: addResource } = useAddResource();
  const globalTags = useUserTags();
  
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!quickAddOpen) {
      setInputValue("");
      setIsTypingTag(false);
      setSearchTag("");
    }
  }, [quickAddOpen]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setQuickAddOpen(!quickAddOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [quickAddOpen, setQuickAddOpen]);

  React.useEffect(() => {
    if (quickAddOpen) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [quickAddOpen]);

  const updateTypingState = (inputEl: HTMLInputElement | null) => {
    if (!inputEl) {
      setIsTypingTag(false);
      setSearchTag("");
      return;
    }
    const val = inputEl.value;
    const cursorIndex = inputEl.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursorIndex);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1] || "";
    const isTyping = currentWord.startsWith("#");
    const search = isTyping ? formatTag(currentWord) : "";
    
    setIsTypingTag(isTyping);
    setSearchTag(search);
  };

  const availableTags = React.useMemo(() => {
    const extractedCurrently = (inputValue.match(HASHTAG_REGEX) || []).map(formatTag);
    if (isTypingTag) {
      const extractedWithoutCurrent = extractedCurrently.filter(t => t !== searchTag);
      return globalTags.filter(tag => 
        tag.includes(searchTag) && !extractedWithoutCurrent.includes(tag)
      ).slice(0, 5);
    } else {
      return globalTags.filter(tag => !extractedCurrently.includes(tag)).slice(0, 8);
    }
  }, [globalTags, searchTag, isTypingTag, inputValue]);

  const handleSelectTag = (tag: string) => {
    if (!inputRef.current) return;
    const cursor = inputRef.current.selectionStart || 0;
    const beforePart = inputValue.slice(0, cursor);
    const afterPart = inputValue.slice(cursor);
    
    const words = beforePart.split(/\s+/);
    words.pop();
    
    const prefix = words.join(" ");
    const inserted = `${prefix ? prefix + " " : ""}#${tag} `;
    const newText = inserted + afterPart;
    
    setInputValue(newText);
    
    const newCursorPos = inserted.length;
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        updateTypingState(inputRef.current);
      }
    }, 10);
  };

  const handleAppendTag = (tag: string) => {
    const trimmed = inputValue.trim();
    const separator = trimmed ? " " : "";
    const newText = `${trimmed}${separator}#${tag} `;
    
    setInputValue(newText);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const len = newText.length;
        inputRef.current.setSelectionRange(len, len);
        updateTypingState(inputRef.current);
      }
    }, 10);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await handleSave();
    } else if (e.key === " ") {
      if (isTypingTag && searchTag.length > 0) {
        e.preventDefault();
        const tagToAssign = availableTags.length > 0 ? availableTags[0] : searchTag;
        handleSelectTag(tagToAssign);
      }
    } else if (e.key === "Escape") {
      setQuickAddOpen(false);
    }
  };

  const inferTypeFromTags = (tags: string[]): ResourceType => {
    for (const tag of tags) {
      if (RESERVED_TYPE_TAGS[tag]) {
        return RESERVED_TYPE_TAGS[tag];
      }
    }
    return RESOURCE_TYPES.NOTE;
  };

  const handleSave = async () => {
    if (!inputValue.trim() || isSaving) return;
    setIsSaving(true);
    
    const rawInput = inputValue;
    const detectedUrl = extractUrl(inputValue);
    let formattedTags = extractTags(inputValue);
    if (detectedUrl && !formattedTags.includes('link')) {
      formattedTags = [...formattedTags, 'link'];
    }
    const title = cleanTitle(inputValue);
    const inferredType = detectedUrl 
      ? (detectedUrl.includes('github.com') ? RESOURCE_TYPES.GITHUB : RESOURCE_TYPES.WEBSITE)
      : inferTypeFromTags(formattedTags);

    try {
      await addResource({ 
        title,
        type: inferredType,
        provider: PROVIDERS.MANUAL,
        tags: formattedTags, 
        url: detectedUrl || undefined,
        rawInput,
        metadata: detectedUrl ? { url: detectedUrl } : {},
      });
      setQuickAddOpen(false);
      setInputValue("");
    } catch (error) {
      console.error("Failed to save resource", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectProviderResult = async (result: SearchResult) => {
    setIsSaving(true);
    const formattedTags = extractTags(inputValue);
    const tags = Array.from(new Set([...formattedTags, result.type]));

    try {
      await addResource({
        title: result.title,
        type: result.type,
        provider: result.provider,
        providerId: result.providerId,
        image: result.image,
        tags,
        rawInput: inputValue || result.title,
        metadata: result.metadataPreview || {},
        metadataVersion: 1,
        metadataSource: { provider: String(result.provider), version: "2.0.0", schemaVersion: 1 },
      });
      setQuickAddOpen(false);
      setInputValue("");
    } catch (error) {
      console.error("Failed to create resource from provider", error);
    } finally {
      setIsSaving(false);
    }
  };

  const currentTags = React.useMemo(() => extractTags(inputValue), [inputValue]);
  const detectedUrl = React.useMemo(() => extractUrl(inputValue), [inputValue]);
  const currentType = React.useMemo(() => inferTypeFromTags(currentTags), [currentTags]);
  const cleanSearchQuery = React.useMemo(() => cleanTitle(inputValue), [inputValue]);

  const provider = React.useMemo(() => {
    return providerManager.getPrimaryProviderForType(currentType);
  }, [currentType]);

  const shouldSearch = React.useMemo(() => {
    return !!provider && cleanSearchQuery.trim().length > 0 && cleanSearchQuery !== "Untitled Memory";
  }, [provider, cleanSearchQuery]);

  const { data: searchData, isLoading: isSearchLoading, isError: isSearchError, error: searchError } = useProviderSearch(
    currentType,
    shouldSearch ? cleanSearchQuery : ""
  );

  const searchResults = React.useMemo(() => {
    return searchData?.results?.results || [];
  }, [searchData]);

  return (
    <>
      <AnimatePresence>
        {quickAddOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 backdrop-blur-overlay md:items-center p-4 pt-12 md:p-4 animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 gpu-accelerated" 
              onClick={() => setQuickAddOpen(false)} 
            />

            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden gpu-accelerated"
            >
              <Command className="flex flex-col w-full" shouldFilter={false}>
                <div className="flex items-center px-4 py-2 border-b border-border/30">
                  <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      updateTypingState(e.target);
                    }}
                    onKeyUp={(e) => {
                      updateTypingState(e.currentTarget);
                    }}
                    onSelect={(e) => {
                      updateTypingState(e.currentTarget);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Flowers for Algernon #books"
                    className="flex-1 h-12 bg-transparent outline-none border-none placeholder:text-muted-foreground/60 text-sm font-medium pr-3"
                    disabled={isSaving}
                    autoComplete="off"
                  />
                  
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground ml-2" />
                  ) : (
                    <button
                      onClick={() => setQuickAddOpen(false)}
                      className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary active:scale-95 transition-all flex-shrink-0"
                      aria-label="Close"
                    >
                      <X className="size-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                
                {detectedUrl && (
                  <div className="mx-3 my-2 p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="size-3.5 text-cyan-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block leading-none mb-0.5">
                          Link Resource Detected
                        </span>
                        <p className="text-xs font-mono text-muted-foreground truncate">
                          {detectedUrl}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold shrink-0">
                      #link
                    </span>
                  </div>
                )}

                {globalTags.length > 0 && (
                  <div className="border-b border-border/30 max-h-[160px] overflow-y-auto p-2 bg-secondary/5">
                    <div className="px-1 pb-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
                      <Hash className="size-2.5" /> {isTypingTag ? "Suggested Tags" : "Quick Add Tags"}
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-0.5">
                      {availableTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => isTypingTag ? handleSelectTag(tag) : handleAppendTag(tag)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-xs font-medium hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          #{tag}
                        </button>
                      ))}
                      {isTypingTag && availableTags.length === 0 && searchTag.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSelectTag(searchTag)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold"
                        >
                          Add: #{searchTag}
                        </button>
                      )}
                      {!isTypingTag && availableTags.length === 0 && (
                        <span className="text-[10px] text-muted-foreground/40 italic px-1">All tags assigned</span>
                      )}
                    </div>
                  </div>
                )}

                {shouldSearch && (
                  <div className="border-b border-border/30 max-h-[220px] overflow-y-auto p-3 space-y-2 bg-secondary/5">
                    <div className="px-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="size-2.5 text-primary" /> {provider?.displayName} Matches
                    </div>

                    {isSearchLoading ? (
                      <div className="flex items-center gap-2 py-3 px-1 text-xs text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin text-primary" />
                        <span>Searching online catalog...</span>
                      </div>
                    ) : isSearchError ? (
                      <p className="text-xs text-destructive/80 px-1 py-1">
                        Search failed: {(searchError as any)?.userMessage || "Check connection or credentials"}
                      </p>
                    ) : searchResults.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 italic px-1 py-1">
                        No matches found on {provider?.displayName}. Press Enter to save manually.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {searchResults.slice(0, 3).map((res) => (
                          <div
                            key={`${res.provider}-${res.providerId}`}
                            onClick={() => handleSelectProviderResult(res)}
                            className="flex items-center justify-between gap-3 p-2 rounded-lg bg-card hover:bg-primary/5 border border-border/40 hover:border-primary/20 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {res.image ? (
                                <img
                                  src={res.image}
                                  alt={res.title}
                                  className="size-8 rounded object-cover bg-secondary flex-shrink-0"
                                />
                              ) : (
                                <div className="size-8 rounded bg-secondary flex items-center justify-center text-muted-foreground/40 flex-shrink-0">
                                  <Sparkles className="size-3.5" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                  {res.title}
                                </p>
                                {res.subtitle && (
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {res.subtitle}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-primary group-hover:underline pr-1 flex-shrink-0">
                              + Add
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="px-4 py-2.5 bg-secondary/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/75">
                    {provider ? (
                      <>
                        <Sparkles className="size-3.5 text-primary animate-pulse" />
                        <span>Connected to {provider.displayName}</span>
                      </>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/50">Save as manual text memory</span>
                    )}
                  </div>
                  
                  {inputValue.trim().length > 0 && (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-primary text-primary-foreground font-semibold text-xs active:scale-95 transition-transform shadow-sm flex-shrink-0"
                    >
                      <span>Save</span>
                      <CornerDownLeft className="size-3.5 md:block hidden" />
                    </button>
                  )}
                </div>
              </Command>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
