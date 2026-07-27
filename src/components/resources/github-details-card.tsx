import React from 'react';
import { Resource } from '@/types';
import { Star, GitFork, AlertCircle, Code, BadgeCheck } from 'lucide-react';

interface TypeCardProps {
  resource: Resource;
}

export function GithubDetailsCard({ resource }: TypeCardProps) {
  const meta = (resource.providerMetadata?.metadata || resource.metadata || {}) as Record<string, any>;

  const stars = meta.stars ?? meta.stargazers_count;
  const forks = meta.forks ?? meta.forks_count;
  const openIssues = meta.openIssues ?? meta.open_issues_count;
  const language = meta.language;
  const license = meta.license;
  const lastCommit = meta.lastCommit || meta.pushed_at;

  return (
    <div className="bg-secondary/20 border border-border/40 rounded-xl p-4 space-y-3.5">
      <div className="flex items-center justify-between border-b border-border/20 pb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Code className="size-4" />
          <span>Repository Info</span>
        </div>
        {Boolean(language) && (
          <span className="bg-slate-700/50 text-slate-200 border border-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
            {String(language)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {stars !== undefined && (
          <div className="bg-secondary/40 p-2 rounded-lg border border-border/30">
            <div className="flex items-center justify-center gap-1 text-yellow-400 mb-0.5">
              <Star className="size-3.5 fill-yellow-400" />
              <span className="text-xs font-bold text-foreground">{String(stars)}</span>
            </div>
            <span className="text-[9px] text-muted-foreground uppercase font-semibold">Stars</span>
          </div>
        )}
        {forks !== undefined && (
          <div className="bg-secondary/40 p-2 rounded-lg border border-border/30">
            <div className="flex items-center justify-center gap-1 text-blue-400 mb-0.5">
              <GitFork className="size-3.5" />
              <span className="text-xs font-bold text-foreground">{String(forks)}</span>
            </div>
            <span className="text-[9px] text-muted-foreground uppercase font-semibold">Forks</span>
          </div>
        )}
        {openIssues !== undefined && (
          <div className="bg-secondary/40 p-2 rounded-lg border border-border/30">
            <div className="flex items-center justify-center gap-1 text-orange-400 mb-0.5">
              <AlertCircle className="size-3.5" />
              <span className="text-xs font-bold text-foreground">{String(openIssues)}</span>
            </div>
            <span className="text-[9px] text-muted-foreground uppercase font-semibold">Issues</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        {Boolean(license) && (
          <div className="flex items-center gap-1">
            <BadgeCheck className="size-3.5 text-slate-400" />
            <span>License: <strong className="text-foreground">{String(license)}</strong></span>
          </div>
        )}
        {Boolean(lastCommit) && (
          <div className="flex items-center gap-1 text-[11px]">
            <span>Pushed: <strong className="text-foreground">{new Date(String(lastCommit)).toLocaleDateString()}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
