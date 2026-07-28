import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Collection, CollectionRule, Resource } from '@/types';
import { useCreateCollection, useUpdateCollection } from '@/hooks/use-collections';
import { X, Plus, Trash2, FolderPlus, Sparkles, SlidersHorizontal, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollectionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection?: Collection | null;
  availableResources: Resource[];
}

const FIELD_OPTIONS = [
  { label: 'Resource Type', value: 'type' },
  { label: 'Tag', value: 'tag' },
  { label: 'Status', value: 'status' },
  { label: 'Release / Pub Year', value: 'year' },
  { label: 'Provider', value: 'provider' },
];

const OPERATOR_OPTIONS = [
  { label: 'Equals', value: 'equals' },
  { label: 'Contains', value: 'contains' },
  { label: 'Greater Than', value: 'greaterThan' },
  { label: 'Less Than', value: 'lessThan' },
];

const COLOR_PRESETS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-indigo-500',
];

export function CollectionBuilderModal({
  isOpen,
  onClose,
  collection,
  availableResources,
}: CollectionBuilderModalProps) {
  const { mutateAsync: createCollection, isPending: isCreating } = useCreateCollection();
  const { mutateAsync: updateCollection, isPending: isUpdating } = useUpdateCollection();

  const [title, setTitle] = useState(collection?.title || '');
  const [description, setDescription] = useState(collection?.description || '');
  const [isDynamic, setIsDynamic] = useState(collection?.isDynamic || false);
  const [color, setColor] = useState(collection?.color || COLOR_PRESETS[0]);
  const [rules, setRules] = useState<CollectionRule[]>(collection?.rules || [
    { field: 'type', operator: 'equals', value: 'movie' }
  ]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>(collection?.resourceIds || []);

  if (!isOpen) return null;

  const handleAddRule = () => {
    setRules([...rules, { field: 'tag', operator: 'equals', value: '' }]);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleRuleChange = (index: number, key: keyof CollectionRule, val: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [key]: val };
    setRules(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      if (collection) {
        await updateCollection({
          collectionId: collection.id,
          update: {
            title: title.trim(),
            description: description.trim(),
            isDynamic,
            color,
            rules: isDynamic ? rules : [],
            resourceIds: isDynamic ? [] : selectedResourceIds,
          }
        });
      } else {
        await createCollection({
          title: title.trim(),
          description: description.trim(),
          isDynamic,
          color,
          rules: isDynamic ? rules : [],
          resourceIds: isDynamic ? [] : selectedResourceIds,
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to save collection:", err);
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-overlay">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden gpu-accelerated"
        >
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <div className="flex items-center gap-2 font-bold text-base">
              <FolderPlus className="size-5 text-primary" />
              <span>{collection ? 'Edit Collection' : 'Create New Collection'}</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:bg-secondary">
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Favorite Sci-Fi Movies, Tech Books"
                className="w-full h-10 px-3 rounded-lg bg-secondary/30 border border-border/50 text-sm focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief summary of this collection..."
                className="w-full p-2.5 rounded-lg bg-secondary/30 border border-border/50 text-sm focus:border-primary outline-none resize-none"
              />
            </div>

            {/* Color Accent Picker */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Color Theme</label>
              <div className="flex gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`size-6 rounded-full ${c} border-2 ${color === c ? 'border-foreground scale-110' : 'border-transparent opacity-70'} transition-all`}
                  />
                ))}
              </div>
            </div>

            {/* Collection Type Selector (Manual vs Dynamic Smart Rules) */}
            <div className="pt-2 border-t border-border/20">
              <div className="flex items-center justify-between bg-secondary/20 p-3 rounded-xl border border-border/30">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Sparkles className="size-3.5 text-yellow-500" />
                    <span>Smart Dynamic Collection</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Automatically include resources based on rules</p>
                </div>
                <input
                  type="checkbox"
                  checked={isDynamic}
                  onChange={(e) => setIsDynamic(e.target.checked)}
                  className="size-4 accent-primary rounded cursor-pointer"
                />
              </div>
            </div>

            {isDynamic ? (
              <div className="space-y-3 bg-secondary/10 p-3 rounded-xl border border-border/30">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <SlidersHorizontal className="size-3" />
                    Dynamic Matching Rules
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="size-3" />
                    Add Rule
                  </button>
                </div>

                {rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={rule.field}
                      onChange={(e) => handleRuleChange(idx, 'field', e.target.value)}
                      className="h-8 px-2 rounded-md bg-secondary/40 border border-border/40 text-xs outline-none"
                    >
                      {FIELD_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>

                    <select
                      value={rule.operator}
                      onChange={(e) => handleRuleChange(idx, 'operator', e.target.value)}
                      className="h-8 px-2 rounded-md bg-secondary/40 border border-border/40 text-xs outline-none"
                    >
                      {OPERATOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>

                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) => handleRuleChange(idx, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 h-8 px-2 rounded-md bg-secondary/40 border border-border/40 text-xs outline-none"
                    />

                    {rules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded-md"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assign Resources</label>
                <div className="max-h-40 overflow-y-auto space-y-1 bg-secondary/20 p-2 rounded-lg border border-border/30">
                  {availableResources.map(r => {
                    const isSelected = selectedResourceIds.includes(r.id);
                    return (
                      <div
                        key={r.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedResourceIds(selectedResourceIds.filter(id => id !== r.id));
                          } else {
                            setSelectedResourceIds([...selectedResourceIds, r.id]);
                          }
                        }}
                        className={`flex items-center justify-between p-2 rounded-md text-xs cursor-pointer ${isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-secondary/40 text-muted-foreground'}`}
                      >
                        <span className="truncate">{r.title}</span>
                        {isSelected && <Check className="size-3 text-primary" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-border/20">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending || !title.trim()}>
                {isPending ? 'Saving...' : collection ? 'Update Collection' : 'Create Collection'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
