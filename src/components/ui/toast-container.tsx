"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Check, Loader2 } from "lucide-react";
import { EventBus } from "@/domain/events/event-bus";
import { useUpdateResource } from "@/hooks/use-resources";
import { useQueryClient } from "@tanstack/react-query";

interface EnrichedToast {
  id: string;
  resourceId: string;
  resourceTitle: string;
  type: string;
  provider: string;
  providerId: string;
  image?: string;
  metadata: Record<string, any>;
  providerMetadata: any;
  tags?: string[];
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<EnrichedToast[]>([]);
  const { mutateAsync: updateResource } = useUpdateResource();
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = EventBus.getInstance().subscribe("MetadataMatchFound", (event) => {
      const payload = event.payload;
      setToasts((prev) => {
        // Deduplicate: replace any existing toast for the same resource
        const filtered = prev.filter((t) => t.resourceId !== payload.resourceId);
        return [...filtered, { id: event.id, ...payload }];
      });
    });
    return unsubscribe;
  }, []);

  const handleApply = async (toast: EnrichedToast) => {
    setApplyingId(toast.id);
    try {
      const finalTags = toast.tags && !toast.tags.includes(toast.type)
        ? [...toast.tags, toast.type]
        : toast.tags || [];

      await updateResource({
        id: toast.resourceId,
        provider: toast.provider,
        providerId: toast.providerId,
        image: toast.image,
        metadata: toast.metadata,
        providerMetadata: toast.providerMetadata,
        tags: finalTags,
      });

      queryClient.invalidateQueries({ queryKey: ["resources"] });

      EventBus.getInstance().publish("MetadataRefreshed", {
        resourceId: toast.resourceId,
        resourceTitle: toast.resourceTitle,
      });

      // Remove toast
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    } catch (err) {
      console.error("Failed to apply metadata enrichment:", err);
    } finally {
      setApplyingId(null);
    }
  };

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className="w-full pointer-events-auto bg-card/85 backdrop-blur-md border border-border/80 shadow-2xl rounded-xl p-4 flex gap-3.5 items-start relative overflow-hidden group gpu-accelerated"
          >
            {/* Left Accent Glow line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500/85" />
            
            {/* Thumbnail Poster */}
            {toast.image ? (
              <img
                src={toast.image}
                alt={toast.resourceTitle}
                className="w-11 h-16 rounded object-cover bg-secondary border border-border/40 shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-11 h-16 rounded bg-secondary flex items-center justify-center text-muted-foreground/30 flex-shrink-0 border border-border/40">
                <Sparkles className="size-5" />
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 min-w-0 pr-4">
              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block mb-0.5">
                {toast.type} Metadata Found
              </span>
              <h4 className="text-xs font-semibold text-foreground truncate mb-1">
                {toast.resourceTitle}
              </h4>
              <p className="text-[11px] text-muted-foreground leading-normal mb-3">
                Found matching catalog details. Would you like to enrich this resource?
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleApply(toast)}
                  disabled={applyingId !== null}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {applyingId === toast.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Check className="size-3" />
                  )}
                  <span>Apply</span>
                </button>
                <button
                  onClick={() => handleDismiss(toast.id)}
                  disabled={applyingId !== null}
                  className="px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary text-muted-foreground text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {/* Close Cross */}
            <button
              onClick={() => handleDismiss(toast.id)}
              disabled={applyingId !== null}
              className="absolute top-3 right-3 text-muted-foreground/40 hover:text-muted-foreground p-0.5 rounded-full hover:bg-secondary/40 transition-colors cursor-pointer"
              aria-label="Dismiss toast"
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
