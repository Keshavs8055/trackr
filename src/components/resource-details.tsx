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
import { extractTags, cleanTitle, extractStatusFromTags } from "@/lib/parser";
import { getStatusesForType } from "@/domain/status/status-lifecycles";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "./resources/status-badge";
import { ActivityTimeline } from "./activity/activity-timeline";
import { ResourceNotesTab } from "./notes/resource-notes-tab";
import { RelationshipGraphCard } from "./relationships/relationship-graph-card";
import { AIActionPopover } from "./ai/ai-action-popover";
import { AutoTagModal } from "./ai/auto-tag-modal";
import { SimilarResourcesModal } from "./ai/similar-resources-card";
import { useResources, useUserTags } from "@/hooks/use-resources";


interface ResourceDetailsProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ResourceDetails({ resource, isOpen, onClose }: ResourceDetailsProps) {
  const { mutateAsync: updateResource, isPending: isUpdating } = useUpdateResource();
  const { mutateAsync: deleteResource, isPending: isDeleting } = useDeleteResource();
  const { mutateAsync: refreshMetadata, isPending: isRefreshing } = useMetadataRefresh();
  const { data: allResources } = useResources();
  const allTags = useUserTags();

  const [activeResource, setActiveResource] = useState<Resource | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [notesValue, setNotesValue] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [statusValue, setStatusValue] = useState("");
  const [typeValue, setTypeValue] = useState<ResourceType>(RESOURCE_TYPES.NOTE);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAutoTagOpen, setIsAutoTagOpen] = useState(false);
  const [isSimilarModalOpen, setIsSimilarModalOpen] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  const sanitizeResource = (res: Resource | null): Resource | null => {
    if (!res) return null;
    return {
      ...res,
      title: typeof res.title === 'string' ? res.title : String(res.title || 'Untitled Resource'),
      notes: typeof res.notes === 'string' ? res.notes : undefined,
      url: typeof res.url === 'string' ? res.url : undefined,
      status: typeof res.status === 'string' ? res.status : undefined,
      type: typeof res.type === 'string' ? res.type : RESOURCE_TYPES.NOTE,
      image: typeof res.image === 'string' ? res.image : undefined,
      tags: Array.isArray(res.tags)
        ? res.tags
            .filter(t => typeof t === 'string' || (t && typeof t === 'object' && 'name' in t))
            .map(t => (typeof t === 'string' ? t : (t as any).name || String(t)))
        : [],
    };
  };

  useEffect(() => {
    if (resource) {
      setActiveResource(sanitizeResource(resource));
    }
  }, [resource]);

  useEffect(() => {
    if (activeResource && isOpen) {
      const tagsStr = activeResource.tags ? activeResource.tags.map(t => `#${t}`).join(" ") : "";
      setEditValue(`${activeResource.title} ${tagsStr}`.trim());
      setNotesValue(activeResource.notes || "");
      setUrlValue(activeResource.url || "");
      setStatusValue(activeResource.status || "");
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

  const handleEditValueChange = (val: string) => {
    setEditValue(val);
    const tags = extractTags(val);
    const derived = extractStatusFromTags(tags, typeValue);
    if (derived) {
      setStatusValue(derived);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editValue.trim() || isUpdating || !activeResource) return;

    const formattedTags = extractTags(editValue);
    const title = cleanTitle(editValue);
    const derivedStatus = extractStatusFromTags(formattedTags, typeValue) || statusValue;

    try {
      await updateResource({
        id: activeResource.id,
        title,
        type: typeValue,
        status: derivedStatus,
        tags: formattedTags,
        rawInput: editValue,
        notes: notesValue.trim() || undefined,
        url: urlValue.trim() || undefined,
      });
      setActiveResource(prev => prev ? {
        ...prev,
        title,
        type: typeValue,
        status: derivedStatus,
        tags: formattedTags,
        rawInput: editValue,
        notes: notesValue.trim() || undefined,
        url: urlValue.trim() || undefined,
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

  const handleApplyAutoTags = async (newTags: string[]) => {
    if (!activeResource) return;
    try {
      await updateResource({
        id: activeResource.id,
        tags: newTags,
      });
      setActiveResource((prev) => (prev ? { ...prev, tags: newTags } : null));
    } catch (err) {
      console.error("Failed to apply auto-tags:", err);
    }
  };

  const handleCleanMetadataAction = async () => {
    if (!activeResource) return;
    try {
      const cleanTags = (activeResource.tags || []).map((t) => t.trim().toLowerCase());
      const uniqueTags = Array.from(new Set(cleanTags));
      await updateResource({
        id: activeResource.id,
        tags: uniqueTags,
      });
      setActiveResource((prev) => (prev ? { ...prev, tags: uniqueTags } : null));
    } catch (err) {
      console.error("Failed to clean metadata tags:", err);
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
    <div key={activeResource.id}>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-overlay md:items-center p-0 md:p-4">
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 gpu-accelerated" 
            onClick={onClose} 
          />
        </AnimatePresence>
        <AnimatePresence>
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg bg-card rounded-t-2xl md:rounded-2xl border border-border shadow-lg flex flex-col max-h-[80vh] overflow-hidden gpu-accelerated"
          >
            <div className="px-5 py-4 flex items-center justify-between border-b border-border/30">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {isEditing ? "Edit resource" : "Resource detail"}
              </h2>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <AIActionPopover
                    onAutoTag={() => setIsAutoTagOpen(true)}
                    onFindSimilar={() => setIsSimilarModalOpen(true)}
                    onCleanMetadata={handleCleanMetadataAction}
                    onEnhanceMetadata={handleManualRefresh}
                    isAnalyzing={isRefreshing}
                  />
                )}
                <button 
                  onClick={onClose}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary active:scale-95 transition-all"
                  aria-label="Close"
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              </div>
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
                      Title & Tags (Text-First Hashtags)
                    </span>
                    <input
                      ref={editInputRef}
                      value={editValue}
                      onChange={(e) => handleEditValueChange(e.target.value)}
                      placeholder="e.g. Flowers for Algernon #books #wishlist"
                      className="w-full h-11 px-3 rounded-lg bg-secondary/30 border border-border/50 focus:border-primary focus:ring-0 outline-none transition-all text-sm font-medium"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Tip: Tags like <code className="text-primary font-mono">#wishlist</code>, <code className="text-primary font-mono">#watching</code>, <code className="text-primary font-mono">#reading</code>, <code className="text-primary font-mono">#read</code>, <code className="text-primary font-mono">#planto</code>, <code className="text-primary font-mono">#dropped</code> automatically update status.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Status (Secondary)
                      </span>
                      <select
                        value={statusValue}
                        onChange={(e) => setStatusValue(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-secondary/30 border border-border/50 text-sm font-medium outline-none capitalize"
                      >
                        {getStatusesForType(typeValue).map((s) => (
                          <option key={s.value} value={s.value} className="bg-card text-foreground">
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {(activeResource.url !== undefined || typeValue === 'website' || typeValue === 'article' || typeValue === 'github') && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        URL Link (Optional)
                      </span>
                      <input
                        value={urlValue}
                        onChange={(e) => setUrlValue(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full h-10 px-3 rounded-lg bg-secondary/30 border border-border/50 focus:border-primary focus:ring-0 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  )}

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
                        {activeResource.tags.map((tag, idx) => {
                          const tagStr = typeof tag === 'string' ? tag : (tag && typeof tag === 'object' && 'name' in tag ? (tag as any).name : String(tag || ''));
                          if (!tagStr) return null;
                          return (
                            <span 
                              key={`${activeResource.id}-tag-${tagStr}-${idx}`} 
                              className="text-xs font-semibold text-muted-foreground/80"
                            >
                              #{tagStr}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

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

                  {typeof activeResource.notes === 'string' && activeResource.notes.trim() !== '' && (
                    <div className="bg-secondary/20 p-4 rounded-xl border border-border/30">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                        Personal Notes
                      </span>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {activeResource.notes}
                      </p>
                    </div>
                  )}



                  {/* Knowledge Graph Connections */}
                  <RelationshipGraphCard resource={activeResource} onOpenResourceDetails={(r) => setActiveResource(r)} />


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
          </AnimatePresence>
        </div>
      )}

      {/* On-Demand AI Auto-Tag Modal */}
      {activeResource && (
        <AutoTagModal
          isOpen={isAutoTagOpen}
          onClose={() => setIsAutoTagOpen(false)}
          resource={activeResource}
          existingWorkspaceTags={allTags || []}
          onApplyTags={handleApplyAutoTags}
        />
      )}

      {/* On-Demand AI Similar Resources Modal */}
      {activeResource && (
        <SimilarResourcesModal
          isOpen={isSimilarModalOpen}
          onClose={() => setIsSimilarModalOpen(false)}
          resource={activeResource}
          allResources={allResources || []}
          onSelectResource={(r) => setActiveResource(r)}
        />
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
    </div>
  );
}
