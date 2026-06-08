"use client";

import * as React from "react";
import { Command } from "cmdk";
import { useAppStore } from "@/store/app-store";
import { useAddItem, useUserTags } from "@/hooks/use-items";
import { Loader2, X, Hash, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { HASHTAG_REGEX, formatTag, extractTags, cleanTitle } from "@/lib/parser";

export function QuickAdd() {
  const { quickAddOpen, setQuickAddOpen } = useAppStore();
  const [inputValue, setInputValue] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  
  const { mutateAsync: addItem } = useAddItem();
  const globalTags = useUserTags();
  
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut (Cmd+K or Ctrl+K) to toggle
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

  // Autofocus input when modal opens
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

  // Extract cursor and tag typing state
  const getCursorAndTagState = () => {
    if (!inputRef.current) return { isTypingTag: false, searchTag: "", cursorIndex: 0 };
    const cursorIndex = inputRef.current.selectionStart || 0;
    const textBeforeCursor = inputValue.slice(0, cursorIndex);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1] || "";
    const isTypingTag = currentWord.startsWith("#");
    const searchTag = isTypingTag ? formatTag(currentWord) : "";
    return { isTypingTag, searchTag, cursorIndex };
  };

  const { isTypingTag, searchTag } = getCursorAndTagState();

  const suggestedTags = React.useMemo(() => {
    if (!isTypingTag) return [];
    const extractedCurrently = (inputValue.match(HASHTAG_REGEX) || []).map(formatTag);
    
    return globalTags.filter(tag => 
      tag.includes(searchTag) && !extractedCurrently.includes(tag)
    ).slice(0, 5);
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
      }
    }, 10);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (!isTypingTag) {
        e.preventDefault();
        await handleSave();
      }
    } else if (e.key === " ") {
      if (isTypingTag && searchTag.length > 0) {
        e.preventDefault();
        handleSelectTag(searchTag);
      }
    } else if (e.key === "Escape") {
      setQuickAddOpen(false);
    }
  };

  const handleSave = async () => {
    if (!inputValue.trim() || isSaving) return;
    setIsSaving(true);
    
    const rawInput = inputValue;
    const formattedTags = extractTags(inputValue);
    const title = cleanTitle(inputValue);

    try {
      await addItem({ 
        title, 
        tags: formattedTags, 
        rawInput 
      });
      setQuickAddOpen(false);
      setInputValue("");
    } catch (error) {
      console.error("Failed to save", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {quickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-xs md:items-center p-0 md:p-4">
          {/* Backdrop Click */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0" 
            onClick={() => setQuickAddOpen(false)} 
          />

          {/* Quick Add Modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg bg-card border-t border-x border-border md:border md:rounded-2xl rounded-t-2xl shadow-xl flex flex-col overflow-hidden pb-safe"
          >
            <Command className="flex flex-col w-full" shouldFilter={false}>
              {/* Input row */}
              <div className="flex items-center px-4 py-2 border-b border-border/30">
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Flowers for Algernon #books #great"
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
              
              {/* Suggested Tags (Autotargets) */}
              {isTypingTag && (
                <div className="border-b border-border/30 max-h-[160px] overflow-y-auto p-2 bg-secondary/5">
                  <div className="px-1 pb-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
                    <Hash className="size-2.5" /> Suggested Tags
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-0.5">
                    {suggestedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleSelectTag(tag)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-xs font-medium hover:bg-primary/10 hover:text-primary transition-all"
                      >
                        #{tag}
                      </button>
                    ))}
                    {suggestedTags.length === 0 && searchTag.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSelectTag(searchTag)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold"
                      >
                        Add: #{searchTag}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Statusbar / Submit indicator */}
              <div className="px-4 py-2.5 bg-secondary/5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0 flex flex-wrap gap-1.5">
                  {(inputValue.match(HASHTAG_REGEX) || []).map((t, i) => (
                    <span 
                      key={i} 
                      className="text-[10px] font-semibold text-muted-foreground/80"
                    >
                      {formatTag(t)}
                    </span>
                  ))}
                  {inputValue.trim().length === 0 && (
                    <span className="text-[10px] text-muted-foreground/50">
                      Type name, then hashtags starting with #.
                    </span>
                  )}
                </div>
                
                {inputValue.trim().length > 0 && !isTypingTag && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-2.5 h-7 rounded bg-primary text-primary-foreground font-semibold text-[10px] active:scale-95 transition-transform"
                  >
                    <span>Save</span>
                    <CornerDownLeft className="size-3" />
                  </button>
                )}
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
