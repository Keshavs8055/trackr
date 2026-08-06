"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Resource } from "@/types";
import { ResourceCard } from "@/components/resource-card";

interface VirtualizedResourceFeedProps {
  resources: Resource[];
  onSelectResource: (resource: Resource) => void;
  columns?: number;
  className?: string;
}

export function VirtualizedResourceFeed({
  resources,
  onSelectResource,
  columns = 1,
  className = "",
}: VirtualizedResourceFeedProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollElement, setScrollElement] = useState<Element | Window | null>(null);

  useEffect(() => {
    if (parentRef.current) {
      const scrollParent =
        parentRef.current.closest(".overflow-y-auto") ||
        parentRef.current.closest("main") ||
        window;
      setScrollElement(scrollParent);
    }
  }, []);

  // Group resources into row chunks according to column count
  const rows = useMemo(() => {
    const result: Resource[][] = [];
    const colCount = Math.max(1, columns);
    for (let i = 0; i < resources.length; i += colCount) {
      result.push(resources.slice(i, i + colCount));
    }
    return result;
  }, [resources, columns]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElement as Element,
    estimateSize: () => 100, // Estimated height per row block in px
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
    <div ref={parentRef} className={`w-full ${className}`}>
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
                zIndex: rows.length - virtualRow.index,
              }}
              className="pb-3"
            >
              <div
                className={
                  columns > 1
                    ? `grid gap-3 ${
                        columns === 2
                          ? "grid-cols-1 sm:grid-cols-2"
                          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                      }`
                    : "space-y-3"
                }
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
