import React from 'react';

export function EmptyState({ title, description }: { title: string, description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-3xl bg-secondary/20">
      <p className="text-lg font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}
