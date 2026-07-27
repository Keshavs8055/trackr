"use client";

import React, { useState, useRef } from 'react';
import { Bold, Italic, Heading, List, Quote, Code, Eye, Edit3, Link2 } from 'lucide-react';
import { WikiLinkAutocomplete } from './wiki-link-autocomplete';

interface MarkdownEditorProps {
  initialTitle?: string;
  initialContent?: string;
  onSave: (title: string, content: string) => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

export function MarkdownEditor({
  initialTitle = '',
  initialContent = '',
  onSave,
  onCancel,
  isSaving = false,
}: MarkdownEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);
  const [showWikiPopup, setShowWikiPopup] = useState(false);
  const [wikiSearchTerm, setWikiSearchTerm] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (prefix: string, suffix = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selectedText = text.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setContent(newText);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length + (selectedText ? 0 : 4));
    }, 0);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    const wikiMatch = textBeforeCursor.match(/\[\[([^\]]*)$/);

    if (wikiMatch) {
      setShowWikiPopup(true);
      setWikiSearchTerm(wikiMatch[1]);
    } else {
      setShowWikiPopup(false);
    }
  };

  const handleWikiSelect = (resourceTitle: string) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const cursorPos = el.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPos);
    const textAfterCursor = content.substring(cursorPos);

    const newBefore = textBeforeCursor.replace(/\[\[([^\]]*)$/, `[[${resourceTitle}]]`);
    setContent(newBefore + textAfterCursor);
    setShowWikiPopup(false);

    setTimeout(() => {
      el.focus();
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSave(title || 'Untitled Note', content);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-secondary/10 p-3.5 rounded-xl border border-border/40">
      {/* Note Title Input */}
      <input
        type="text"
        placeholder="Note Title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-sm font-bold bg-transparent border-b border-border/30 pb-1.5 focus:outline-hidden focus:border-primary placeholder:text-muted-foreground/50"
      />

      {/* Editor Controls Toolbar */}
      <div className="flex items-center justify-between gap-1 pb-1 border-b border-border/20">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => insertFormatting('**', '**')}
            title="Bold"
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bold className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*')}
            title="Italic"
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Italic className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('### ')}
            title="Heading"
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Heading className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('- ')}
            title="List"
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <List className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('> ')}
            title="Quote"
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Quote className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('```\n', '\n```')}
            title="Code Block"
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Code className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('[[', ']]')}
            title="Wiki Link"
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-[10px] font-bold"
          >
            <Link2 className="size-3.5" />
            <span>[[Wiki]]</span>
          </button>
        </div>

        {/* Live Preview Mode Toggle */}
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className="px-2 py-1 rounded-lg bg-secondary/80 text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          {isPreview ? <Edit3 className="size-3" /> : <Eye className="size-3" />}
          <span>{isPreview ? 'Edit' : 'Preview'}</span>
        </button>
      </div>

      {/* Editor Body or Live Preview */}
      <div className="relative">
        {isPreview ? (
          <div className="min-h-32 p-3 rounded-lg bg-background/50 border border-border/30 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
            {content.trim() ? (
              content.replace(/\[\[(.*?)\]\]/g, '🔗 [$1]')
            ) : (
              <span className="text-muted-foreground italic">Nothing to preview.</span>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            rows={5}
            placeholder="Write markdown note... (Type [[ to insert wiki links)"
            value={content}
            onChange={handleContentChange}
            className="w-full text-xs bg-background/50 p-2.5 rounded-lg border border-border/30 focus:outline-hidden focus:border-primary resize-y leading-relaxed font-mono"
          />
        )}

        {/* Wiki Link Autocomplete Popup */}
        {showWikiPopup && (
          <WikiLinkAutocomplete
            searchTerm={wikiSearchTerm}
            onSelect={handleWikiSelect}
            onClose={() => setShowWikiPopup(false)}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving || !content.trim()}
          className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Note'}
        </button>
      </div>
    </form>
  );
}
