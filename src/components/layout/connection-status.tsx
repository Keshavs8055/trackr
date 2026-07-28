"use client";

import React from "react";
import { useAppStore } from "@/store/app-store";
import { WifiOff, RefreshCw } from "lucide-react";

export function ConnectionStatus() {
  const isOnline = useAppStore((s) => s.isOnline);
  const hasPendingWrites = useAppStore((s) => s.hasPendingWrites);

  if (!isOnline) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-[9px] font-bold animate-pulse flex-shrink-0">
        <WifiOff className="size-2.5" />
        <span>Offline</span>
      </div>
    );
  }

  if (hasPendingWrites) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold flex-shrink-0">
        <RefreshCw className="size-2.5 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  return null;
}
