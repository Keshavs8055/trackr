import React, { useState } from 'react';
import { Film, BookOpen, Tv, Globe, Code, Gamepad2, Mic, Settings, FileText } from 'lucide-react';
import { ResourceType } from '@/types';
import { cn } from '@/lib/utils';

interface ResourceImagePosterProps {
  src?: string;
  alt: string;
  type: ResourceType;
  className?: string;
  aspectRatio?: 'poster' | 'square' | 'wide' | 'auto';
}

const TYPE_ICONS: Record<string, React.FC<any>> = {
  movie: Film,
  book: BookOpen,
  tv: Tv,
  article: FileText,
  website: Globe,
  github: Code,
  course: BookOpen,
  podcast: Mic,
  game: Gamepad2,
  tool: Settings,
  note: FileText,
  custom: FileText,
};

const TYPE_GRADIENTS: Record<string, string> = {
  movie: 'from-blue-900/40 to-slate-900/80 text-blue-400',
  book: 'from-emerald-900/40 to-slate-900/80 text-emerald-400',
  tv: 'from-purple-900/40 to-slate-900/80 text-purple-400',
  article: 'from-orange-900/40 to-slate-900/80 text-orange-400',
  website: 'from-cyan-900/40 to-slate-900/80 text-cyan-400',
  github: 'from-slate-800/60 to-slate-950/90 text-slate-300',
  course: 'from-indigo-900/40 to-slate-900/80 text-indigo-400',
  podcast: 'from-yellow-900/40 to-slate-900/80 text-yellow-400',
  game: 'from-red-900/40 to-slate-900/80 text-red-400',
  tool: 'from-pink-900/40 to-slate-900/80 text-pink-400',
  note: 'from-zinc-800/40 to-zinc-950/80 text-zinc-400',
  custom: 'from-teal-900/40 to-slate-900/80 text-teal-400',
};

export const ResourceImagePoster = React.memo(function ResourceImagePoster({
  src,
  alt,
  type,
  className,
  aspectRatio = 'poster',
}: ResourceImagePosterProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const IconComponent = TYPE_ICONS[type] || FileText;
  const gradientClass = TYPE_GRADIENTS[type] || TYPE_GRADIENTS.custom;

  const aspectClass = {
    poster: 'aspect-[2/3]',
    square: 'aspect-square',
    wide: 'aspect-video',
    auto: '',
  }[aspectRatio];

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-md bg-gradient-to-br flex flex-col items-center justify-center border border-border/30 p-2 text-center select-none",
          gradientClass,
          aspectClass,
          className
        )}
      >
        <IconComponent className="size-8 mb-1.5 opacity-80" />
        <span className="text-[10px] font-bold tracking-widest uppercase opacity-60 line-clamp-1">{type}</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-md bg-secondary/30 border border-border/30", aspectClass, className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-secondary/60 animate-pulse flex items-center justify-center">
          <IconComponent className="size-6 text-muted-foreground/30 animate-bounce" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      />
    </div>
  );
});
