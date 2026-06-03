"use client";

import { Item } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useTagAction } from "@/hooks/use-tag-action";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useDeleteItem, useUpdateItem, useCollections } from "@/hooks/use-items";
import { Trash, Edit2, Check, X, Loader2 } from "lucide-react";
import { formatTag, extractTags, cleanTitle, HASHTAG_REGEX } from "@/lib/parser";
import { useRouter } from "next/navigation";

export function ItemCard({ item, index }: { item: Item; index: number }) {
  const handleTagAction = useTagAction();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [editValue, setEditValue] = useState("");
  
  const { data: collections } = useCollections();
  const { mutateAsync: deleteItem, isPending: isDeleting } = useDeleteItem();
  const { mutateAsync: updateItem, isPending: isUpdating } = useUpdateItem();
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive collection tags
  const { collectionBadges, regularTags } = useMemo(() => {
    if (!item.tags) return { collectionBadges: [], regularTags: [] };
    const badges: { id: string, title: string, tag: string }[] = [];
    const regs: string[] = [];

    item.tags.forEach(tag => {
      const col = collections?.find(c => formatTag(c.title) === tag);
      if (col) {
        badges.push({ id: col.id, title: col.title, tag });
      } else {
        regs.push(tag);
      }
    });
    return { collectionBadges: badges, regularTags: regs };
  }, [item.tags, collections]);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tagsStr = item.tags ? item.tags.map(t => `#${t}`).join(' ') : "";
    setEditValue(`${item.title} ${tagsStr}`.trim());
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!editValue.trim() || isUpdating) return;

    const rawInput = editValue;
    const formattedTags = extractTags(editValue);
    const title = cleanTitle(editValue);

    try {
      await updateItem({ 
        id: item.id,
        title, 
        tags: formattedTags, 
        rawInput 
      });
      setIsEditing(false);
      setIsExpanded(false);
    } catch (error) {
      console.error("Failed to update", error);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConfirmingDelete) {
      await deleteItem(item.id);
    } else {
      setIsConfirmingDelete(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className="group cursor-pointer rounded-xl bg-transparent hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all duration-200"
      onClick={() => {
        if (!isEditing) setIsExpanded(!isExpanded);
      }}
    >
      {isEditing ? (
        <div className="px-4 py-3 flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <input
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave(e);
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isUpdating}
          />
          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsEditing(false)} disabled={isUpdating}>
            <X className="size-4" />
          </Button>
          <Button size="icon" className="h-8 w-8" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          </Button>
        </div>
      ) : (
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <h3 className="font-medium text-base truncate">{item.title}</h3>
          </div>
          
          <div className="flex gap-1.5 flex-shrink-0">
            {collectionBadges.map(badge => (
              <button
                key={badge.id}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/collections/${badge.id}`);
                }}
                className="text-[10px] font-bold text-blue-500 hover:text-blue-400 hover:bg-blue-500/20 bg-blue-500/10 px-2 py-1 rounded-md uppercase tracking-wider flex items-center transition-colors"
              >
                {badge.title}
              </button>
            ))}
            {regularTags.map(tag => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTagAction(tag);
                }}
                className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap bg-secondary/50 group-hover:bg-background px-2 py-1 rounded-md"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isExpanded && !isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 flex items-center gap-2 border-t border-border/50 pt-3 mt-1">
              {!isConfirmingDelete ? (
                <>
                  <Button size="sm" variant="secondary" onClick={startEditing} disabled={isDeleting}>
                    <Edit2 className="size-4 mr-2" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Trash className="size-4 mr-2" />}
                    Delete
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <span className="text-sm font-medium text-muted-foreground mr-auto">Are you sure?</span>
                  <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(false); }} disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Trash className="size-4 mr-2" />}
                    Confirm Delete
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
