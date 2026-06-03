"use client";

import { Plus, Library, Loader2, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCollections, useAddCollection, useItems } from "@/hooks/use-items";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CollectionsPage() {
  const { data: collections, isLoading: colLoading } = useCollections();
  const { data: items, isLoading: itemsLoading } = useItems();
  const isLoading = colLoading || itemsLoading;
  const { mutateAsync: addCollection, isPending } = useAddCollection();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleSaveCollection = async () => {
    if (newTitle.trim().length > 0) {
      await addCollection({ title: newTitle.trim(), itemIds: [] });
      setNewTitle("");
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground mt-1">Organize your memories into curated lists.</p>
        </div>
        {!isAdding && (
          <Button className="gap-2" onClick={() => setIsAdding(true)} disabled={isPending}>
            <Plus className="size-4" />
            New Collection
          </Button>
        )}
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 p-4 bg-secondary/30 rounded-xl border border-border/50 mb-6">
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCollection();
                  if (e.key === 'Escape') setIsAdding(false);
                }}
                placeholder="Collection name (e.g., Favorites)"
                className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground"
                disabled={isPending}
              />
              <Button size="icon" variant="ghost" onClick={() => setIsAdding(false)} disabled={isPending}>
                <X className="size-4" />
              </Button>
              <Button size="icon" onClick={handleSaveCollection} disabled={isPending || !newTitle.trim()}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : !collections || collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-3xl bg-secondary/20">
          <Library className="size-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold">No Collections Yet</h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2 mb-6">
            Group your favorite movies, reading lists, or travel memories into collections.
          </p>
          <Button variant="outline" onClick={() => setIsAdding(true)}>Create your first collection</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col, i) => {
            const normalizedTitle = col.title.replace(/^#/, '').trim().toLowerCase().replace(/\s+/g, '-');
            const itemCount = items ? items.filter(item => 
              item.tags?.includes(normalizedTitle) || col.itemIds?.includes(item.id)
            ).length : 0;
            
            return (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => router.push(`/collections/${col.id}`)}
                className="group cursor-pointer rounded-xl p-5 border border-transparent bg-secondary/20 hover:bg-secondary/40 hover:border-border/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-background rounded-lg shadow-sm">
                    <Library className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{col.title}</h3>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
