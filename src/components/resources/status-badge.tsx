"use client";

import React, { useState } from 'react';
import { Resource } from '@/types';
import { getStatusConfig, getStatusesForType } from '@/domain/status/status-lifecycles';
import { useUpdateResource } from '@/hooks/use-resources';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusBadgeProps {
  resource: Resource;
  compact?: boolean;
}

export const StatusBadge = React.memo(function StatusBadge({ resource, compact = false }: StatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { mutateAsync: updateResource, isPending } = useUpdateResource();

  const currentStatus = getStatusConfig(resource.type, resource.status);
  const availableStatuses = getStatusesForType(resource.type);

  const handleSelectStatus = async (statusValue: string) => {
    setIsOpen(false);
    if (statusValue === resource.status) return;

    try {
      await updateResource({
        id: resource.id,
        status: statusValue,
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        disabled={isPending}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center gap-1 font-semibold rounded-full border transition-all hover:scale-105 active:scale-95 ${
          compact
            ? 'px-2 py-0.5 text-[10px]'
            : 'px-2.5 py-1 text-xs'
        } ${currentStatus.bgClass} ${currentStatus.colorClass}`}
      >
        <span>{currentStatus.label}</span>
        <ChevronDown className={compact ? 'size-2.5' : 'size-3'} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click listener */}
            <div
              className="fixed inset-0 z-30"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />

            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 mt-1 z-40 w-36 py-1 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden backdrop-blur-md"
            >
              <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/20">
                Change Status
              </div>
              {availableStatuses.map((item) => {
                const isSelected = item.value.toLowerCase() === (resource.status || '').toLowerCase();
                return (
                  <button
                    key={item.value}
                    onClick={() => handleSelectStatus(item.value)}
                    className={`w-full px-2.5 py-1.5 text-left text-xs font-medium flex items-center justify-between hover:bg-secondary/40 transition-colors ${item.colorClass}`}
                  >
                    <span>{item.label}</span>
                    {isSelected && <Check className="size-3 text-primary" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});
