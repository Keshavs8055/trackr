import React from 'react';
import { ProviderStatus } from '@/types';
import { CheckCircle2, ShieldAlert, AlertTriangle, KeyRound, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProviderStatusBadgeProps {
  status: ProviderStatus;
  className?: string;
}

export function ProviderStatusBadge({ status, className }: ProviderStatusBadgeProps) {
  switch (status) {
    case 'CONNECTED':
      return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold", className)}>
          <CheckCircle2 className="size-2.5" />
          Connected
        </span>
      );
    case 'DISABLED':
      return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-semibold", className)}>
          <AlertTriangle className="size-2.5" />
          Disabled
        </span>
      );
    case 'INVALID_CREDENTIALS':
      return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-semibold", className)}>
          <KeyRound className="size-2.5" />
          Invalid Key
        </span>
      );
    case 'RATE_LIMITED':
      return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-semibold", className)}>
          <AlertTriangle className="size-2.5" />
          Rate Limited
        </span>
      );
    case 'UNAVAILABLE':
      return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium", className)}>
          <WifiOff className="size-2.5" />
          Unavailable
        </span>
      );
    case 'NOT_CONFIGURED':
    default:
      return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium", className)}>
          <ShieldAlert className="size-2.5" />
          Not Configured
        </span>
      );
  }
}
