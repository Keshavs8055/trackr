import React from "react";
import { Resource } from "@/types";
import { useTagAction } from "@/hooks/use-tag-action";
import { format } from "date-fns";
import { StatusBadge } from "@/components/resources/status-badge";
import { Film, BookOpen, Tv, FileText, Globe, GraduationCap, Code2, Wrench, Radio, Gamepad2, StickyNote, Box, ExternalLink } from "lucide-react";

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
      className="w-full group py-2 my-2 px-1 border-b border-border/40 hover:bg-secondary/20 transition-all duration-150 cursor-pointer flex justify-between items-start gap-4 "
    >
      {/* Text Details Area (Left) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 ">
          <div className="flex flex-col w-full"> 
            <h3 className="font-medium pt-2 text-base text-foreground leading-snug tracking-tight group-hover:text-primary transition-colors flex items-center gap-1.5">
              <span>{resource.title}</span>
              {resource.type && resource.type !== 'note' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary/50 text-[10px] font-semibold text-muted-foreground/80 capitalize">
                  <IconComponent className="size-3" />
                  {resource.type}
                </span>
              )}
            
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Open Link"
                  className="text-muted-foreground hover:text-cyan-400 p-0.5 rounded transition-colors inline-flex"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </h3>

            {/* Clean space-separated hashtag list */}
            <div className="flex flex-wrap py-2">
              {resource.tags && resource.tags.length > 0 && (
                resource.tags.map((tag, idx) => {
                  const tagStr = typeof tag === 'string' ? tag : (tag && typeof tag === 'object' && 'name' in tag ? (tag as any).name : String(tag || ''));
                  if (!tagStr) return null;
                  return (
                    <button
                      key={`${resource.id}-tag-${tagStr}-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTagAction(tagStr);
                      }}
                      className="text-xs font-semibold text-muted-foreground/80 hover:text-primary transition-colors py-1 px-1 -my-1 rounded-sm"
                    >
                      #{tagStr}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      <StatusBadge resource={resource} compact />
    </div>
  );
});
