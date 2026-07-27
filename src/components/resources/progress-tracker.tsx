"use client";

import React, { useState } from 'react';
import { Resource, ProgressUnit } from '@/types';
import { calculateProgress, getDefaultProgressUnit, updateResourceProgress } from '@/domain/progress/progress-calculator';
import { useUpdateResource } from '@/hooks/use-resources';
import { Plus, CheckCircle2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProgressTrackerProps {
  resource: Resource;
  compact?: boolean;
}

export function ProgressTracker({ resource, compact = false }: ProgressTrackerProps) {
  const { mutateAsync: updateResource, isPending } = useUpdateResource();

  const progress = resource.progress || calculateProgress(
    0,
    undefined,
    getDefaultProgressUnit(resource.type)
  );

  const [currentVal, setCurrentVal] = useState<number>(progress.current);
  const [totalVal, setTotalVal] = useState<number | undefined>(progress.total);
  const [unitVal, setUnitVal] = useState<ProgressUnit>(progress.unit);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveProgress = async (newCurrent: number, newTotal?: number, newUnit?: ProgressUnit) => {
    const updates = updateResourceProgress(resource, newCurrent, newTotal, newUnit);
    try {
      await updateResource({
        id: resource.id,
        ...updates,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const handleIncrement = (amount: number) => {
    const nextVal = (progress.current || 0) + amount;
    const finalVal = progress.total ? Math.min(progress.total, nextVal) : nextVal;
    setCurrentVal(finalVal);
    handleSaveProgress(finalVal, progress.total, progress.unit);
  };

  const handleComplete = () => {
    const targetTotal = progress.total || (progress.unit === 'percent' ? 100 : progress.current);
    setCurrentVal(targetTotal);
    handleSaveProgress(targetTotal, targetTotal, progress.unit);
  };

  // Compact Mode (for Resource Cards)
  if (compact) {
    return (
      <div className="w-full space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
          <span>
            {progress.current} {progress.total ? `/ ${progress.total}` : ''} {progress.unit}
          </span>
          <span className="font-bold text-primary">{progress.percentage}%</span>
        </div>
        <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
    );
  }

  // Full Details Mode
  return (
    <div className="p-4 rounded-xl bg-secondary/20 border border-border/40 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="size-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Progress Tracking
          </h4>
        </div>
        <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
          {progress.percentage}% Done
        </span>
      </div>

      {/* Animated Progress Bar */}
      <div className="h-2.5 w-full bg-secondary/60 rounded-full overflow-hidden p-0.5 border border-border/30">
        <div
          className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 rounded-full shadow-xs"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      {/* Main Display & Quick Controls */}
      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
        <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <span className="font-bold text-sm text-primary">{progress.current}</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-muted-foreground">
            {progress.total || '∞'} {progress.unit}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleIncrement(1)}
            disabled={isPending}
            className="h-7 px-2.5 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/40 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
            title="Add +1"
          >
            <Plus className="size-3" />
            <span>+1</span>
          </button>

          <button
            onClick={() => handleIncrement(10)}
            disabled={isPending}
            className="h-7 px-2.5 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/40 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
            title="Add +10"
          >
            <Plus className="size-3" />
            <span>+10</span>
          </button>

          <Button
            size="sm"
            variant="outline"
            disabled={isPending || progress.percentage === 100}
            onClick={handleComplete}
            className="h-7 px-2.5 text-[11px] font-bold gap-1 rounded-lg border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
          >
            <CheckCircle2 className="size-3" />
            <span>Finish</span>
          </Button>
        </div>
      </div>

      {/* Editable Progress Inputs */}
      {isEditing ? (
        <div className="pt-2 border-t border-border/30 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] font-bold uppercase text-muted-foreground">Current</label>
              <input
                type="number"
                min="0"
                value={currentVal}
                onChange={(e) => setCurrentVal(parseInt(e.target.value) || 0)}
                className="w-full h-8 px-2 rounded bg-background border border-border/50 text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-muted-foreground">Total</label>
              <input
                type="number"
                min="1"
                value={totalVal || ''}
                onChange={(e) => setTotalVal(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Total"
                className="w-full h-8 px-2 rounded bg-background border border-border/50 text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-muted-foreground">Unit</label>
              <select
                value={unitVal}
                onChange={(e) => setUnitVal(e.target.value as ProgressUnit)}
                className="w-full h-8 px-1.5 rounded bg-background border border-border/50 text-xs outline-none capitalize"
              >
                <option value="pages">Pages</option>
                <option value="minutes">Minutes</option>
                <option value="episodes">Episodes</option>
                <option value="percent">Percent</option>
                <option value="items">Items</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveProgress(currentVal, totalVal, unitVal)}
              className="text-xs font-bold text-primary hover:underline"
            >
              Save Progress
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-1 flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Edit Goal / Total
          </button>
        </div>
      )}
    </div>
  );
}
