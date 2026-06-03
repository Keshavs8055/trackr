"use client";

import * as React from "react";
import { Command } from "cmdk";
import { useAppStore } from "@/store/app-store";
import { useAddItem, useUserTags, useCollections } from "@/hooks/use-items";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { HASHTAG_REGEX, formatTag, extractTags, cleanTitle } from "@/lib/parser";

export function QuickAdd() {
  const { quickAddOpen, setQuickAddOpen } = useAppStore();
  const [inputValue, setInputValue] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  
  const { mutateAsync: addItem } = useAddItem();
  const globalTags = useUserTags();
  const { data: collections } = useCollections();
  
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

  const cursorIndex = typeof document !== 'undefined' ? (document.activeElement as HTMLInputElement)?.selectionStart || 0 : 0;
  const textBeforeCursor = inputValue.slice(0, cursorIndex);
  const currentWord = textBeforeCursor.split(' ').pop() || '';
  const isTypingTag = currentWord.startsWith('#');
  const searchTag = isTypingTag ? formatTag(currentWord) : '';

  const collectionTags = React.useMemo(() => {
    if (!collections) return [];
    return collections.map(c => formatTag(c.title));
  }, [collections]);

  const suggestedTags = React.useMemo(() => {
    if (!isTypingTag) return [];
    const extractedCurrently = (inputValue.match(HASHTAG_REGEX) || []).map(formatTag);
    // Combine global tags with dynamic collection tags
    const allPossibleTags = Array.from(new Set([...globalTags, ...collectionTags]));
    
    return allPossibleTags.filter(tag => 
      tag.includes(searchTag) && !extractedCurrently.includes(tag)
    ).slice(0, 5);
  }, [globalTags, collectionTags, searchTag, isTypingTag, inputValue]);

  const handleSelectTag = (tag: string) => {
    const words = inputValue.slice(0, cursorIndex).split(' ');
    words.pop();
    const beforePart = words.join(' ');
    const newText = `${beforePart ? beforePart + ' ' : ''}#${tag} ` + inputValue.slice(cursorIndex);
    setInputValue(newText);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!isTypingTag) {
        e.preventDefault();
        await handleSave();
      }
    } else if (e.key === ' ') {
      if (isTypingTag && searchTag.length > 0) {
        e.preventDefault();
        handleSelectTag(searchTag);
      }
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

  if (!quickAddOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-background/50 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={() => setQuickAddOpen(false)} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl mx-4">
        <Command 
          className="flex flex-col w-full h-full" 
          shouldFilter={false} // We handle filtering manually for tags
        >
          <div className="flex items-center px-4">
            <input
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Start typing... e.g. Interstellar #movies #watched"
              className="flex h-16 w-full bg-transparent outline-none placeholder:text-muted-foreground text-lg md:text-xl"
              disabled={isSaving}
            />
            {isSaving && <Loader2 className="size-5 animate-spin text-muted-foreground ml-2" />}
          </div>
          
          {isTypingTag && (
            <Command.List className="border-t max-h-[300px] overflow-y-auto p-2">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Suggested Tags</div>
              {suggestedTags.map((tag) => (
                <Command.Item
                  key={tag}
                  onSelect={() => handleSelectTag(tag)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground font-medium"
                >
                  <span className="text-muted-foreground">#</span>{tag}
                </Command.Item>
              ))}
              {suggestedTags.length === 0 && searchTag.length > 0 && (
                <Command.Item
                  onSelect={() => handleSelectTag(searchTag)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground font-medium"
                >
                  Create <span className="font-semibold text-primary">#{searchTag}</span>
                </Command.Item>
              )}
            </Command.List>
          )}

          {!isTypingTag && inputValue.trim().length > 0 && (
            <div className="p-2 border-t bg-secondary/30">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex justify-between items-center">
                <span>Press Enter to save</span>
                <div className="flex gap-1.5 flex-wrap">
                  {(inputValue.match(HASHTAG_REGEX) || []).map((t, i) => {
                    const tagRaw = formatTag(t);
                    const isListTag = collectionTags.includes(tagRaw);
                    return (
                      <span 
                        key={i} 
                        className={cn(
                          "px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider",
                          isListTag ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary"
                        )}
                      >
                        {tagRaw.toLowerCase()}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Command>
      </div>
    </div>
  );
}
