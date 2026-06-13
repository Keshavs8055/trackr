import React from "react";
import { Item } from "@/types";
import { useTagAction } from "@/hooks/use-tag-action";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: Item;
  index: number;
  onOpenDetails: (item: Item) => void;
}

export const ItemCard = React.memo(function ItemCard({ item, index, onOpenDetails }: ItemCardProps) {
  const handleTagAction = useTagAction();

  const formattedDate = item.createdAt 
    ? format(new Date(item.createdAt), "MMM d, yyyy") 
    : "";

  return (
    <div
      onClick={() => onOpenDetails(item)}
      className={cn(
        "group py-3 px-1 border-b border-border/40 hover:bg-secondary/20 transition-all duration-150 cursor-pointer flex justify-between items-start gap-4",
        item.archived && "opacity-55"
      )}
    >
      {/* Text Details Area (Left) */}
      <div className="flex-1 min-w-0 space-y-1">
        <h3 className="font-medium text-base text-foreground leading-snug tracking-tight group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        {/* Clean space-separated hashtag list */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-2.5">
            {item.tags.map(tag => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTagAction(tag);
                }}
                className="text-xs font-semibold text-muted-foreground/80 hover:text-primary transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date Stamp (Right) */}
      {formattedDate && (
        <span className="text-[11px] font-medium text-muted-foreground/50 whitespace-nowrap self-start mt-1">
          {formattedDate}
        </span>
      )}
    </div>
  );
});
