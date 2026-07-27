import React from 'react';
import { Resource } from '@/types';
import { BookOpen, Calendar, User } from 'lucide-react';

interface TypeCardProps {
  resource: Resource;
}

export function BookDetailsCard({ resource }: TypeCardProps) {
  const meta = (resource.providerMetadata?.metadata || resource.metadata || {}) as Record<string, any>;

  const author = meta.author || meta.authors || meta.Author;
  const pageCount = meta.pageCount || meta.pages || meta.numberOfPages;
  const publisher = meta.publisher;
  const publishYear = meta.publishYear || meta.publishedDate || meta.Year;
  const isbn = meta.isbn;
  const subjects = meta.subjects;

  return (
    <div className="bg-secondary/20 border border-border/40 rounded-xl p-4 space-y-3.5">
      <div className="flex items-center justify-between border-b border-border/20 pb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <BookOpen className="size-4" />
          <span>Book Details</span>
        </div>
        {Boolean(isbn) && (
          <span className="text-[10px] font-mono bg-secondary/50 px-2 py-0.5 rounded border border-border/30 text-muted-foreground">
            ISBN: {String(isbn)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {Boolean(author) && (
          <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
            <User className="size-3.5 text-primary/70" />
            <span>Author: <strong className="text-foreground">{Array.isArray(author) ? author.join(', ') : String(author)}</strong></span>
          </div>
        )}
        {Boolean(publishYear) && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="size-3.5 text-primary/70" />
            <span>Published: <strong className="text-foreground">{String(publishYear)}</strong></span>
          </div>
        )}
        {Boolean(pageCount) && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BookOpen className="size-3.5 text-primary/70" />
            <span>Pages: <strong className="text-foreground">{String(pageCount)}</strong></span>
          </div>
        )}
        {Boolean(publisher) && (
          <div className="col-span-2 text-xs text-muted-foreground">
            <span>Publisher: <strong className="text-foreground">{String(publisher)}</strong></span>
          </div>
        )}
      </div>

      {Array.isArray(subjects) && subjects.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {subjects.slice(0, 5).map((subj, idx) => (
            <span key={idx} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px] font-semibold">
              {String(subj)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
