"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && !isLoading) {
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose, onConfirm]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-sm bg-card border border-border/50 rounded-2xl shadow-xl p-5 space-y-4 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  variant === 'destructive' 
                    ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                    : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{title}</h3>
                  <p className="text-xs text-muted-foreground/80 leading-normal mt-0.5">{description}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground transition-all flex-shrink-0"
                aria-label="Close"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
                className="h-9 px-3.5 text-xs font-semibold rounded-xl border border-border/50 hover:bg-secondary"
              >
                {cancelText}
              </Button>
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                size="sm"
                onClick={onConfirm}
                disabled={isLoading}
                className="h-9 px-4 text-xs font-bold rounded-xl gap-1.5 shadow-xs"
              >
                {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                <span>{confirmText}</span>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
