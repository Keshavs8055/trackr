"use client";

import React, { useRef, useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Resource } from "@/types";
import { ResourceCard } from "@/components/resource-card";

interface VirtualizedResourceFeedProps {
  resources: Resource[];
  onSelectResource: (resource: Resource) => void;
  columns?: number;
}

export function VirtualizedResourceFeed({
  resources,
  onSelectResource,
  columns = 1,
}: VirtualizedResourceFeedProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollElement, setScrollElement] = useState<Element | null>(null);

  useEffect(() => {
    if (parentRef.current) {
      const scrollParent = parentRef.current.closest(".overflow-y-auto") || parentRef.current.closest("main");
      setScrollElement(scrollParent);
    }
  }, []);

  // Group resources into rows based on column count
  const rows = React.useMemo(() => {
    const result: Resource[][] = [];
    const colCount = Math.max(1, columns);
    for (let i = 0; i < resources.length; i += colCount) {
      result.push(resources.slice(i, i + colCount));
    }
    return result;
  }, [resources, columns]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => 90, // Estimated height per row in pixels
    overscan: 5,
  });

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/40 rounded-2xl bg-secondary/10">
        <p className="text-sm font-medium text-muted-foreground">No resources match your filter criteria.</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="w-full">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowItems = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="pb-3"
            >
              {rowItems.map((resource, i) => (
                <div key={resource.id}>
                  <ResourceCard 
                    resource={resource} 
                    index={virtualRow.index * columns + i}
                    onOpenDetails={onSelectResource}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
