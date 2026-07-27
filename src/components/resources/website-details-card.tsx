import React from 'react';
import { Resource } from '@/types';
import { Clock, ExternalLink, Globe } from 'lucide-react';

interface TypeCardProps {
  resource: Resource;
}

export function WebsiteDetailsCard({ resource }: TypeCardProps) {
  const meta = (resource.providerMetadata?.metadata || resource.metadata || {}) as Record<string, any>;

  const domain = meta.domain || meta.hostname || (resource.rawInput ? (resource.rawInput.startsWith('http') ? new URL(resource.rawInput).hostname : resource.rawInput) : undefined);
  const readingTime = meta.readingTime || meta.readTime;
  const description = meta.description || meta.metaDescription;
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : undefined;

  return (
    <div className="bg-secondary/20 border border-border/40 rounded-xl p-4 space-y-3.5">
      <div className="flex items-center justify-between border-b border-border/20 pb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
          {faviconUrl ? (
            <img 
              src={faviconUrl} 
              alt="Favicon" 
              className="size-4 rounded-sm object-contain"
              onError={(e) => {
                // Hide broken favicon image and fallback
                (e.target as HTMLElement).style.display = 'none';
              }} 
            />
          ) : (
            <Globe className="size-4" />
          )}
          <span>Web Resource</span>
        </div>
        {Boolean(domain) && (
          <span className="flex items-center gap-1 text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">
            <ExternalLink className="size-3" />
            {String(domain)}
          </span>
        )}
      </div>

      {Boolean(readingTime) && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5 text-cyan-400" />
          <span>Est. Reading Time: <strong className="text-foreground">{String(readingTime)} min</strong></span>
        </div>
      )}

      {Boolean(description) && (
        <div className="text-xs text-muted-foreground/90 bg-secondary/30 p-2.5 rounded-lg border border-border/20 leading-relaxed">
          {String(description)}
        </div>
      )}
    </div>
  );
}
