"use client";

import React, { useState, useEffect, useRef } from "react";
import { Resource, RESOURCE_TYPES, ResourceType } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useUpdateResource, useDeleteResource } from "@/hooks/use-resources";
import { useMetadataRefresh } from "@/hooks/use-metadata-refresh";
import { MetadataSection } from "./providers/metadata-section";
import { ResourceImagePoster } from "./resources/resource-image-poster";
import { MovieDetailsCard } from "./resources/movie-details-card";
import { BookDetailsCard } from "./resources/book-details-card";
import { GithubDetailsCard } from "./resources/github-details-card";
import { WebsiteDetailsCard } from "./resources/website-details-card";
import { X, Check, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { extractTags, cleanTitle } from "@/lib/parser";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "./resources/status-badge";
import { ProgressTracker } from "./resources/progress-tracker";
import { ActivityTimeline } from "./activity/activity-timeline";
import { ResourceNotesTab } from "./notes/resource-notes-tab";

interface ResourceDetailsProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ResourceDetails({ resource, isOpen, onClose }: ResourceDetailsProps) {
  const { mutateAsync: updateResource, isPending: isUpdating } = useUpdateResource();
  const { mutateAsync: deleteResource, isPending: isDeleting } = useDeleteResource();
  const { mutateAsync: refreshMetadata, isPending: isRefreshing } = useMetadataRefresh();

  const [activeResource, setActiveResource] = useState<Resource | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [notesValue, setNotesValue] = useState("");
  const [typeValue, setTypeValue] = useState<ResourceType>(RESOURCE_TYPES.NOTE);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resource) {
      setActiveResource(resource);
    }
  }, [resource]);

  useEffect(() => {
    if (activeResource && isOpen) {
      const tagsStr = activeResource.tags ? activeResource.tags.map(t => `#${t}`).join(" ") : "";
      setEditValue(`${activeResource.title} ${tagsStr}`.trim());
      setNotesValue(activeResource.notes || "");
      setTypeValue(activeResource.type || RESOURCE_TYPES.NOTE);
      setIsEditing(false);
      setIsConfirmingDelete(false);
    }
  }, [activeResource, isOpen]);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  if (!activeResource) return null;

  const handleNotesChange = (val: string) => {
    const words = val.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 50) {
      setNotesValue(val);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editValue.trim() || isUpdating || !activeResource) return;

    const formattedTags = extractTags(editValue);
    const title = cleanTitle(editValue);

    try {
      await updateResource({
        id: activeResource.id,
        title,
        type: typeValue,
        tags: formattedTags,
        rawInput: editValue,
        notes: notesValue.trim() || undefined
      });
      setActiveResource(prev => prev ? {
        ...prev,
        title,
        type: typeValue,
        tags: formattedTags,
        rawInput: editValue,
        notes: notesValue.trim() || undefined
      } : null);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update resource", err);
    }
  };

  const handleManualRefresh = async () => {
    if (!activeResource || isRefreshing) return;
    setActionError(null);
    try {
      const updates = await refreshMetadata(activeResource);
      setActiveResource(prev => prev ? { ...prev, ...updates } : null);
    } catch (err: any) {
      setActionError(err?.userMessage || "Failed to refresh metadata.");
      setTimeout(() => setActionError(null), 3500);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeResource) return;
    try {
      await deleteResource(activeResource.id);
      setIsConfirmingDelete(false);
      onClose();
    } catch (err) {
      console.error("Failed to delete resource", err);
    }
  };

  const relativeDate = activeResource.createdAt 
    ? formatDistanceToNow(new Date(activeResource.createdAt), { addSuffix: true }) 
    : "";

  const isExternalProvider = activeResource.provider && activeResource.provider !== "manual";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs md:items-center p-0 md:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0" 
            onClick={onClose} 
          />

          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg bg-card rounded-t-2xl md:rounded-2xl border border-border shadow-lg flex flex-col max-h-[80vh] overflow-hidden"
          >
            <div className="px-5 py-4 flex items-center justify-between border-b border-border/30">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {isEditing ? "Edit resource" : "Resource detail"}
              </h2>
              <button 
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary active:scale-95 transition-all"
                aria-label="Close"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {actionError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="size-4 flex-shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

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
                      placeholder="e.g. Flowers for Algernon #books"
                      className="w-full h-11 px-3 rounded-lg bg-secondary/30 border border-border/50 focus:border-primary focus:ring-0 outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Resource Type
                    </span>
                    <select
                      value={typeValue}
                      onChange={(e) => setTypeValue(e.target.value as ResourceType)}
                      className="w-full h-10 px-3 rounded-lg bg-secondary/30 border border-border/50 text-sm font-medium outline-none capitalize"
                    >
                      {Object.values(RESOURCE_TYPES).map((t) => (
                        <option key={t} value={t} className="bg-card text-foreground">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Notes (Optional)
                      </span>
                    </div>
                    <textarea
                      value={notesValue}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder="Add reflections, reminders, or details..."
                      rows={4}
                      className="w-full p-3 rounded-lg bg-secondary/30 border border-border/50 focus:border-primary focus:ring-0 outline-none transition-all text-sm resize-none"
                    />
                  </div>
                </form>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-secondary text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {activeResource.type || 'note'}
                        </span>
                        <StatusBadge resource={activeResource} />
                      </div>

                      {isExternalProvider && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isRefreshing}
                          onClick={handleManualRefresh}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-primary gap-1"
                        >
                          <RefreshCw className={`size-3 ${isRefreshing ? "animate-spin" : ""}`} />
                          <span>Refresh Metadata</span>
                        </Button>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-foreground tracking-tight leading-snug">
                      {activeResource.title}
                    </h3>
                    
                    {activeResource.tags && activeResource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {activeResource.tags.map(tag => (
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

                  {/* Dedicated Progress Tracker */}
                  <ProgressTracker resource={activeResource} />

                  {/* Resource Poster / Artwork */}
                  {activeResource.image && (
                    <div className="w-full max-h-64 flex justify-center py-2 bg-secondary/10 rounded-xl border border-border/20">
                      <ResourceImagePoster
                        src={activeResource.image}
                        alt={activeResource.title}
                        type={activeResource.type}
                        aspectRatio="poster"
                        className="max-h-60 w-auto shadow-md"
                      />
                    </div>
                  )}

                  {/* Render Structured Provider Metadata */}
                  <MetadataSection resource={activeResource} />

                  {/* Render Type-Specific Detail Renderer Card */}
                  {activeResource.type === 'movie' && <MovieDetailsCard resource={activeResource} />}
                  {activeResource.type === 'book' && <BookDetailsCard resource={activeResource} />}
                  {activeResource.type === 'github' && <GithubDetailsCard resource={activeResource} />}
                  {activeResource.type === 'website' && <WebsiteDetailsCard resource={activeResource} />}

                  {activeResource.notes && (
                    <div className="bg-secondary/20 p-4 rounded-xl border border-border/30">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                        Personal Notes
                      </span>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {activeResource.notes}
                      </p>
                    </div>
                  )}

                  {/* Multi-Notes & Wiki-Link Engine */}
                  <ResourceNotesTab resourceId={activeResource.id} resourceTitle={activeResource.title} />

                  {/* Event-Sourced Activity Timeline */}
                  <ActivityTimeline resourceId={activeResource.id} />

                  <div className="text-[11px] text-muted-foreground/50 pt-2 border-t border-border/20">
                    Added {relativeDate}
                  </div>
                </>
              )}
            </div>

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
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full h-10 rounded-lg text-xs gap-1.5"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full h-10 rounded-lg text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                    onClick={() => setIsConfirmingDelete(true)}
                  >
                    Delete Resource
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isConfirmingDelete}
        title="Delete Resource"
        description={`Are you sure you want to delete "${activeResource?.title}"? This action cannot be undone.`}
        confirmText="Delete Resource"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsConfirmingDelete(false)}
      />
    </AnimatePresence>
  );
}
