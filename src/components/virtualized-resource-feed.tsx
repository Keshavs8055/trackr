"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Resource } from "@/types";
import { ResourceCard } from "@/components/resource-card";
import { Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VirtualizedResourceFeedProps {
  resources: Resource[];
  onSelectResource: (resource: Resource) => void;
  columns?: number;
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isFetchingNextPage?: boolean;
}

export function VirtualizedResourceFeed({
  resources,
  onSelectResource,
  columns = 1,
  className = "",
  onLoadMore,
  hasMore = false,
  isFetchingNextPage = false,
}: VirtualizedResourceFeedProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
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

  // IntersectionObserver for infinite scrolling sentinel
  useEffect(() => {
    if (!sentinelRef.current || !onLoadMore || !hasMore || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      {
        root: scrollElement instanceof Element ? scrollElement : null,
        rootMargin: "300px", // Trigger 300px before reaching the exact bottom
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isFetchingNextPage, scrollElement]);

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

  if (resources.length === 0 && !isFetchingNextPage) {
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

      {/* Infinite Scroll Sentinel & Low-Network Loading Indicators */}
      <div ref={sentinelRef} className="pt-4 pb-8 flex flex-col items-center justify-center w-full min-h-[60px]">
        {isFetchingNextPage && (
          <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground animate-pulse py-3">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span>Loading more resources...</span>
          </div>
        )}

        {!isFetchingNextPage && hasMore && onLoadMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            className="text-xs font-semibold gap-1.5 h-9 px-4 rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary/60"
          >
            <ChevronDown className="size-3.5" />
            <span>Load More Items</span>
          </Button>
        )}
      </div>
    </div>
  );
}
