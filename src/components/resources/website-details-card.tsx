import React from 'react';
import { Resource } from '@/types';
import { Clock, ExternalLink, Globe, Link2 } from 'lucide-react';

interface TypeCardProps {
  resource: Resource;
}

export function WebsiteDetailsCard({ resource }: TypeCardProps) {
  const meta = (resource.providerMetadata?.metadata || resource.metadata || {}) as Record<string, any>;

  const targetUrl = resource.url || meta.url || (resource.rawInput?.startsWith('http') ? resource.rawInput : undefined);

  let domain = meta.domain || meta.hostname;
  if (!domain && targetUrl) {
    try {
      domain = new URL(targetUrl).hostname.replace(/^www\./, '');
    } catch {
      domain = targetUrl;
    }
  }

  const readingTime = meta.readingTime || meta.readTime;
  const description = meta.description || meta.metaDescription;
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : undefined;

  return (
    <div className="bg-secondary/20 border border-border/40 rounded-xl p-4 space-y-3.5">
      <div className="flex items-center justify-between border-b border-border/20 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
          {faviconUrl ? (
            <img 
              src={faviconUrl} 
              alt="Favicon" 
              className="size-4 rounded-sm object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }} 
            />
          ) : (
            <Globe className="size-4" />
          )}
          <span>Link Resource</span>
        </div>

        {targetUrl && (
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-2.5 py-1 rounded-lg border border-cyan-500/30 transition-colors"
          >
            <span>Open Link</span>
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      {targetUrl && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest block">
            Target URL
          </span>
          <p className="text-xs font-mono text-foreground/80 break-all bg-background/50 p-2 rounded-lg border border-border/20">
            {targetUrl}
          </p>
        </div>
      )}

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
