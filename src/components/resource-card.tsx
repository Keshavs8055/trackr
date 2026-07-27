import React from "react";
import { Resource } from "@/types";
import { useTagAction } from "@/hooks/use-tag-action";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ResourceImagePoster } from "@/components/resources/resource-image-poster";
import { StatusBadge } from "@/components/resources/status-badge";
import { ProgressTracker } from "@/components/resources/progress-tracker";
import { Film, BookOpen, Tv, FileText, Globe, GraduationCap, Code2, Wrench, Radio, Gamepad2, StickyNote, Box } from "lucide-react";

interface ResourceCardProps {
  resource: Resource;
  index: number;
  onOpenDetails: (resource: Resource) => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  movie: Film,
  book: BookOpen,
  tv: Tv,
  article: FileText,
  website: Globe,
  course: GraduationCap,
  github: Code2,
  tool: Wrench,
  podcast: Radio,
  game: Gamepad2,
  note: StickyNote,
  custom: Box,
};

export const ResourceCard = React.memo(function ResourceCard({ resource, index, onOpenDetails }: ResourceCardProps) {
  const handleTagAction = useTagAction();

  const formattedDate = resource.createdAt 
    ? format(new Date(resource.createdAt), "MMM d, yyyy") 
    : "";

  const IconComponent = TYPE_ICONS[resource.type] || StickyNote;

  return (
    <div
      onClick={() => onOpenDetails(resource)}
      className="group py-3 px-1 border-b border-border/40 hover:bg-secondary/20 transition-all duration-150 cursor-pointer flex justify-between items-start gap-4"
    >
      {/* Text Details Area (Left) */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          {resource.type && resource.type !== 'note' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary/50 text-[10px] font-semibold text-muted-foreground/80 capitalize">
              <IconComponent className="size-3" />
              {resource.type}
            </span>
          )}
          <StatusBadge resource={resource} compact />
          <h3 className="font-medium text-base text-foreground leading-snug tracking-tight group-hover:text-primary transition-colors">
            {resource.title}
          </h3>
        </div>

        {/* Compact Progress Bar if active */}
        {resource.progress && resource.progress.percentage > 0 && (
          <div className="max-w-xs pt-0.5">
            <ProgressTracker resource={resource} compact />
          </div>
        )}

        {/* Clean space-separated hashtag list */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-2.5 pt-0.5">
            {resource.tags.map(tag => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTagAction(tag);
                }}
                className="text-xs font-semibold text-muted-foreground/80 hover:text-primary transition-colors py-1 px-1 -my-1 rounded-sm"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Image Poster Thumbnail if present */}
      {resource.image && (
        <div className="w-10 h-14 flex-shrink-0 self-center">
          <ResourceImagePoster 
            src={resource.image} 
            alt={resource.title} 
            type={resource.type} 
            aspectRatio="poster"
            className="w-full h-full object-cover shadow-sm"
          />
        </div>
      )}

      {/* Date Stamp (Right) */}
      {formattedDate && (
        <span className="text-[11px] font-medium text-muted-foreground/50 whitespace-nowrap self-start mt-1">
          {formattedDate}
        </span>
      )}
    </div>
  );
});
