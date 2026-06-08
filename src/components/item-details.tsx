"use client";

import React, { useState, useEffect, useRef } from "react";
import { Item } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useUpdateItem, useDeleteItem } from "@/hooks/use-items";
import { X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { extractTags, cleanTitle } from "@/lib/parser";

interface ItemDetailsProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemDetails({ item, isOpen, onClose }: ItemDetailsProps) {
  const { mutateAsync: updateItem, isPending: isUpdating } = useUpdateItem();
  const { mutateAsync: deleteItem, isPending: isDeleting } = useDeleteItem();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [notesValue, setNotesValue] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Sync inputs on open or item change
  useEffect(() => {
    if (item) {
      const tagsStr = item.tags ? item.tags.map(t => `#${t}`).join(" ") : "";
      setEditValue(`${item.title} ${tagsStr}`.trim());
      setNotesValue(item.notes || "");
      setIsEditing(false);
      setIsConfirmingDelete(false);
    }
  }, [item, isOpen]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  if (!item) return null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editValue.trim() || isUpdating) return;

    const formattedTags = extractTags(editValue);
    const title = cleanTitle(editValue);

    try {
      await updateItem({
        id: item.id,
        title,
        tags: formattedTags,
        rawInput: editValue,
        notes: notesValue.trim() || undefined
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update item", err);
    }
  };

  const handleToggleArchive = async () => {
    try {
      await updateItem({
        id: item.id,
        archived: !item.archived
      });
      onClose();
    } catch (err) {
      console.error("Failed to archive/unarchive item", err);
    }
  };

  const handleDelete = async () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }
    try {
      await deleteItem(item.id);
      onClose();
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  const relativeDate = item.createdAt 
    ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) 
    : "";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs md:items-center p-0 md:p-4">
          {/* Backdrop Click */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0" 
            onClick={onClose} 
          />

          {/* Bottom Sheet Container */}
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg bg-card rounded-t-2xl md:rounded-2xl border border-border shadow-lg flex flex-col max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-border/30">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {isEditing ? "Edit item" : item.archived ? "Archived item" : "Archive detail"}
              </h2>
              <button 
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary active:scale-95 transition-all"
                aria-label="Close"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Title & Tags
                    </span>
                    <input
                      ref={editInputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="e.g. Flowers for Algernon #books #great"
                      className="w-full h-11 px-3 rounded-lg bg-secondary/30 border border-border/50 focus:border-primary focus:ring-0 outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Notes
                    </span>
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Add reflections, reminders, or details..."
                      rows={4}
                      className="w-full p-3 rounded-lg bg-secondary/30 border border-border/50 focus:border-primary focus:ring-0 outline-none transition-all text-sm resize-none"
                    />
                  </div>
                </form>
              ) : (
                <>
                  {/* Title & Tags */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground tracking-tight leading-snug">
                      {item.title}
                    </h3>
                    
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {item.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="text-xs font-semibold text-muted-foreground/80"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes / Details */}
                  {item.notes && (
                    <div className="bg-secondary/20 p-4 rounded-xl border border-border/30">
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {item.notes}
                      </p>
                    </div>
                  )}

                  {/* Metadata fields */}
                  <div className="text-[11px] text-muted-foreground/50 pt-2 border-t border-border/20">
                    Added {relativeDate}
                  </div>
                </>
              )}
            </div>

            {/* Bottom Actions Toolbar */}
            <div className="px-6 py-4 bg-secondary/10 border-t border-border/30 flex flex-col gap-2.5">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 h-10 rounded-lg text-xs"
                    onClick={() => setIsEditing(false)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1 h-10 rounded-lg text-xs font-semibold"
                    onClick={() => handleSave()}
                    disabled={isUpdating || !editValue.trim()}
                  >
                    {isUpdating ? (
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Check className="size-3.5 mr-1.5" />
                    )}
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 h-10 rounded-lg text-xs gap-1.5"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 h-10 rounded-lg text-xs gap-1.5"
                      onClick={handleToggleArchive}
                    >
                      {item.archived ? "Unarchive" : "Archive"}
                    </Button>
                  </div>

                  {isConfirmingDelete ? (
                    <div className="flex flex-col gap-2 p-2.5 bg-destructive/5 rounded-lg border border-destructive/15 mt-0.5">
                      <p className="text-[10px] text-destructive text-center font-medium">Delete item permanently?</p>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          className="flex-1 h-8 rounded text-[10px]"
                          onClick={() => setIsConfirmingDelete(false)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="flex-1 h-8 rounded text-[10px] font-semibold"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="size-3 animate-spin mr-1" />
                          ) : null}
                          Confirm
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="w-full h-10 rounded-lg text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                      onClick={handleDelete}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
