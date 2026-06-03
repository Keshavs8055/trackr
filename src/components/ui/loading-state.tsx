import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'h-screen' : 'h-64'}`}>
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}
