"use client";

import React, { useState } from 'react';
import { useResourceNotes, useAddNote, useDeleteNote, useResourceBacklinks } from '@/hooks/use-notes';
import { MarkdownEditor } from './markdown-editor';
import { FileText, Plus, Trash2, Link2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ResourceNote } from '@/types';

interface ResourceNotesTabProps {
  resourceId: string;
  resourceTitle: string;
}

export function ResourceNotesTab({ resourceId, resourceTitle }: ResourceNotesTabProps) {
  const { data: notes, isLoading } = useResourceNotes(resourceId);
  const { data: backlinks } = useResourceBacklinks(resourceTitle);
  const addNoteMutation = useAddNote();
  const deleteNoteMutation = useDeleteNote();

  const [isAdding, setIsAdding] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const toggleExpand = (noteId: string) => {
    setExpandedNotes(prev => ({ ...prev, [noteId]: !prev[noteId] }));
  };

  const handleSaveNote = async (title: string, content: string) => {
    await addNoteMutation.mutateAsync({ resourceId, title, content });
    setIsAdding(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      await deleteNoteMutation.mutateAsync({ resourceId, noteId });
    }
  };

  return (
    <div className="space-y-4 pt-1">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Notes & Wiki ({notes?.length || 0})
          </h4>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <Plus className="size-3.5" />
            <span>New Note</span>
          </button>
        )}
      </div>

      {/* Backlinks Section */}
      {backlinks && backlinks.length > 0 && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
            <Link2 className="size-3.5" />
            <span>Backlinks ({backlinks.length})</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            This resource is referenced in notes across your archive:
          </p>
          <div className="space-y-1 pt-1">
            {backlinks.map(b => (
              <div key={b.id} className="text-xs p-1.5 rounded-lg bg-background/50 border border-border/20 flex items-center justify-between">
                <span className="font-semibold text-foreground truncate">{b.title}</span>
                <span className="text-[10px] text-muted-foreground/60">{formatDistanceToNow(new Date(b.createdAt), { addSuffix: true })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note Creation Editor */}
      {isAdding && (
        <MarkdownEditor
          onSave={handleSaveNote}
          onCancel={() => setIsAdding(false)}
          isSaving={addNoteMutation.isPending}
        />
      )}

      {/* Notes List */}
      {isLoading ? (
        <div className="py-6 text-center text-xs text-muted-foreground animate-pulse flex items-center justify-center gap-2">
          <Clock className="size-3.5 animate-spin" />
          <span>Loading notes...</span>
        </div>
      ) : !notes || notes.length === 0 ? (
        !isAdding && (
          <div className="py-6 px-4 rounded-xl border border-dashed border-border/40 text-center space-y-1">
            <FileText className="size-5 text-muted-foreground/50 mx-auto" />
            <p className="text-xs font-semibold text-muted-foreground">No notes added yet</p>
            <p className="text-[10px] text-muted-foreground/60">Create notes with rich markdown and [[Resource Title]] links.</p>
          </div>
        )
      ) : (
        <div className="space-y-2.5">
          {notes.map((note: ResourceNote) => {
            const isExpanded = expandedNotes[note.id] !== false; // Default expanded
            const timeAgo = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true });

            return (
              <div
                key={note.id}
                className="p-3 rounded-xl bg-secondary/20 border border-border/30 space-y-2 hover:border-border/50 transition-colors"
              >
                {/* Note Header */}
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(note.id)}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-foreground truncate">
                      {note.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 shrink-0">
                      {timeAgo}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="p-1 rounded-md text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <button type="button" className="p-1 text-muted-foreground">
                      {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Note Content */}
                {isExpanded && (
                  <div className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap pt-1 border-t border-border/20">
                    {note.content}

                    {/* Wiki Links Badges */}
                    {note.wikiLinks && note.wikiLinks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {note.wikiLinks.map((link, idx) => (
                          <span
                            key={`${note.id}-wiki-${link || 'empty'}-${idx}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold"
                          >
                            <Link2 className="size-2.5" />
                            <span>[[{link}]]</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
