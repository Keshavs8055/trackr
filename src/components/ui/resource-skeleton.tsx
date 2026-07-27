import React from 'react';

export function ResourceSkeleton() {
  return (
    <div className="space-y-3 py-4 max-w-2xl mx-auto">
      {[1, 2, 3, 4, 5].map((i) => (
        <div 
          key={i} 
          className="py-3 px-1 border-b border-border/30 flex justify-between items-start gap-4 animate-pulse"
        >
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-secondary/60 rounded w-2/3"></div>
            <div className="flex gap-2">
              <div className="h-3 bg-secondary/40 rounded w-12"></div>
              <div className="h-3 bg-secondary/40 rounded w-16"></div>
            </div>
          </div>
          <div className="h-3 bg-secondary/40 rounded w-16 self-start mt-1"></div>
        </div>
      ))}
    </div>
  );
}
