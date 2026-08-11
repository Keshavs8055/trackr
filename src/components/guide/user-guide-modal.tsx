"use client";

import React, { useState } from "react";
import { 
  X, 
  Plus, 
  Sparkles, 
  FileText, 
  Share2, 
  Download, 
  CheckCircle2, 
  HelpCircle,
  Command,
  Hash,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_STEPS = [
  {
    id: "quick-add",
    icon: Plus,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    badge: "Step 1",
    title: "Quick Add & Smart Categorization",
    subtitle: "Capture anything in seconds with ⌘K or '+'",
    content: (
      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
        <p>
          Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono text-[10px] border border-border">⌘K</kbd> (or <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono text-[10px] border border-border">Ctrl+K</kbd>) anywhere or tap the <span className="font-semibold text-foreground">+</span> button on mobile to add books, movies, articles, or custom links.
        </p>
        <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
            <Hash className="size-3.5 text-primary" />
            <span>Automatic Tags & Status Detection</span>
          </div>
          <p className="text-[11px]">
            Add <span className="text-primary font-medium">#tag</span> to auto-categorize items. Including status tags like <span className="text-emerald-500 font-medium">#read</span>, <span className="text-amber-500 font-medium">#watched</span>, or <span className="text-purple-500 font-medium">#planto</span> automatically updates resource lifecycle state!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "wiki-notes",
    icon: FileText,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    badge: "Step 2",
    title: "Wiki Notes & Interlinking",
    subtitle: "Connect your thoughts with [[Wiki-Links]]",
    content: (
      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
        <p>
          Each resource includes a full Markdown note workspace. Document key takeaways, quotes, or personal reviews.
        </p>
        <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
            <span className="font-mono text-primary font-bold text-xs">[[ ]]</span>
            <span>Bi-directional Knowledge Vault</span>
          </div>
          <p className="text-[11px]">
            Type <span className="font-mono text-foreground bg-secondary px-1 py-0.5 rounded border border-border">[[Resource Title]]</span> inside any note to link items together. Clicking a wiki link navigates directly to that resource!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "knowledge-graph",
    icon: Share2,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    badge: "Step 3",
    title: "Knowledge Graph & Relationships",
    subtitle: "Map connections across your library",
    content: (
      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
        <p>
          Link related items directly using custom relationship types like <span className="font-medium text-foreground">adaptation_of</span>, <span className="font-medium text-foreground">sequel_to</span>, or <span className="font-medium text-foreground">related_to</span>.
        </p>
        <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
            <Share2 className="size-3.5 text-emerald-500" />
            <span>Visual Graph View</span>
          </div>
          <p className="text-[11px]">
            Explore your connected web of resources visually on details pages to discover unexpected patterns in your knowledge archive.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "ai-privacy",
    icon: Sparkles,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    badge: "Step 4",
    title: "AI Power Tools & 100% Data Privacy",
    subtitle: "On-demand Gemini intelligence & offline backups",
    content: (
      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
        <p>
          Tap the <span className="font-semibold text-foreground">AI Actions</span> button in the header to run auto-tagging, similarity analysis, and natural language search powered by Gemini.
        </p>
        <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
            <Download className="size-3.5 text-amber-500" />
            <span>Full Data Ownership</span>
          </div>
          <p className="text-[11px]">
            Export your entire library anytime into a clean JSON backup via <span className="font-medium text-foreground">Export / Import Data</span> in the menu.
          </p>
        </div>
      </div>
    ),
  },
];

export function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const currentStep = GUIDE_STEPS[activeStep];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-guide-title"
    >
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col border border-border/60 bg-card rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/40 bg-secondary/10">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <HelpCircle className="size-5" />
            </div>
            <div>
              <h2 id="user-guide-title" className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                How to Use Trackr
              </h2>
              <p className="text-xs text-muted-foreground">
                Master your personal memory & resource vault
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close guide"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="flex items-center justify-between gap-1 p-2 bg-secondary/20 border-b border-border/30 overflow-x-auto no-scrollbar">
          {GUIDE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === activeStep;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-card text-foreground shadow-sm border border-border/50 font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{step.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Step Content Area */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${currentStep.color}`}>
                  <currentStep.icon className="size-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    {currentStep.badge} of {GUIDE_STEPS.length}
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    {currentStep.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {currentStep.subtitle}
                  </p>
                </div>
              </div>

              {currentStep.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border/40 bg-secondary/10 flex items-center justify-between gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Command className="size-3.5" />
            <span>Use ⌘K anytime to open Quick Add</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {activeStep < GUIDE_STEPS.length - 1 ? (
              <button
                onClick={() => setActiveStep(s => s + 1)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-98 transition-all"
              >
                <span>Next Step</span>
                <ArrowRight className="size-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-98 transition-all"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Start Archiving</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
