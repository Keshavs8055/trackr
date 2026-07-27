import { db } from '@/services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ResourceNote } from '@/types';
import { EventBus } from '@/domain/events/event-bus';

export class NoteService {
  private static instance: NoteService;
  private inMemoryNotes: ResourceNote[] = [];

  private constructor() {}

  public static getInstance(): NoteService {
    if (!NoteService.instance) {
      NoteService.instance = new NoteService();
    }
    return NoteService.instance;
  }

  public parseWikiLinks(content: string): string[] {
    if (!content) return [];
    const regex = /\[\[(.*?)\]\]/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match[1] && match[1].trim()) {
        matches.add(match[1].trim());
      }
    }
    return Array.from(matches);
  }

  public async getNotes(userId: string, resourceId: string): Promise<ResourceNote[]> {
    if (userId === 'mock-user-id' || typeof window === 'undefined') {
      return this.getMockNotes(resourceId);
    }

    try {
      const notesRef = collection(db, 'users', userId, 'resources', resourceId, 'notes');
      const q = query(notesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return this.getMockNotes(resourceId);
      }

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<ResourceNote, 'id'>),
      }));
    } catch (err) {
      console.warn("Failed to fetch Firestore notes, falling back to local storage:", err);
      return this.getMockNotes(resourceId);
    }
  }

  public async addNote(
    userId: string,
    resourceId: string,
    title: string,
    content: string
  ): Promise<ResourceNote> {
    const wikiLinks = this.parseWikiLinks(content);
    const now = Date.now();

    const notePayload: Omit<ResourceNote, 'id'> = {
      resourceId,
      userId,
      title: title.trim() || 'Untitled Note',
      content,
      format: 'markdown',
      wikiLinks,
      createdAt: now,
      updatedAt: now,
    };

    let newNote: ResourceNote;

    if (userId === 'mock-user-id' || typeof window === 'undefined') {
      newNote = { id: `note_${now}_${Math.random().toString(36).substring(2, 6)}`, ...notePayload };
      this.saveMockNote(newNote);
    } else {
      try {
        const notesRef = collection(db, 'users', userId, 'resources', resourceId, 'notes');
        const docRef = await addDoc(notesRef, notePayload);
        newNote = { id: docRef.id, ...notePayload };
      } catch (err) {
        console.warn("Firestore addNote failed, saving locally:", err);
        newNote = { id: `note_${now}_${Math.random().toString(36).substring(2, 6)}`, ...notePayload };
        this.saveMockNote(newNote);
      }
    }

    // Emit event for activity logger
    EventBus.getInstance().publish('StatusChanged', {
      userId,
      resourceId,
      resourceTitle: title,
      oldStatus: 'editing',
      newStatus: 'note_added',
    });

    return newNote;
  }

  public async updateNote(
    userId: string,
    resourceId: string,
    noteId: string,
    updates: Partial<Pick<ResourceNote, 'title' | 'content'>>
  ): Promise<void> {
    const wikiLinks = updates.content !== undefined ? this.parseWikiLinks(updates.content) : undefined;
    const cleanUpdates = {
      ...(updates.title !== undefined ? { title: updates.title.trim() } : {}),
      ...(updates.content !== undefined ? { content: updates.content } : {}),
      ...(wikiLinks ? { wikiLinks } : {}),
      updatedAt: Date.now(),
    };

    if (userId === 'mock-user-id' || typeof window === 'undefined') {
      this.updateMockNote(noteId, cleanUpdates);
      return;
    }

    try {
      const noteRef = doc(db, 'users', userId, 'resources', resourceId, 'notes', noteId);
      await updateDoc(noteRef, cleanUpdates);
    } catch (err) {
      console.warn("Firestore updateNote failed, updating locally:", err);
      this.updateMockNote(noteId, cleanUpdates);
    }
  }

  public async deleteNote(
    userId: string,
    resourceId: string,
    noteId: string
  ): Promise<void> {
    if (userId === 'mock-user-id' || typeof window === 'undefined') {
      this.deleteMockNote(noteId);
      return;
    }

    try {
      const noteRef = doc(db, 'users', userId, 'resources', resourceId, 'notes', noteId);
      await deleteDoc(noteRef);
    } catch (err) {
      console.warn("Firestore deleteNote failed, deleting locally:", err);
      this.deleteMockNote(noteId);
    }
  }

  public async findBacklinks(userId: string, targetResourceTitle: string): Promise<ResourceNote[]> {
    if (!targetResourceTitle) return [];
    const allNotes = this.getAllMockNotes();
    const targetLower = targetResourceTitle.toLowerCase();

    return allNotes.filter(note => 
      note.wikiLinks?.some(link => link.toLowerCase() === targetLower)
    );
  }

  // --- Mock Storage Helpers ---

  private saveMockNote(note: ResourceNote): void {
    this.inMemoryNotes.unshift(note);
    if (typeof localStorage !== 'undefined') {
      const existingStr = localStorage.getItem('trackr_notes') || '[]';
      try {
        const existing: ResourceNote[] = JSON.parse(existingStr);
        existing.unshift(note);
        localStorage.setItem('trackr_notes', JSON.stringify(existing.slice(0, 300)));
      } catch (err) {
        console.error("Error saving mock note:", err);
      }
    }
  }

  private updateMockNote(noteId: string, updates: Partial<ResourceNote>): void {
    this.inMemoryNotes = this.inMemoryNotes.map(n => n.id === noteId ? { ...n, ...updates } : n);
    if (typeof localStorage !== 'undefined') {
      const existingStr = localStorage.getItem('trackr_notes') || '[]';
      try {
        const existing: ResourceNote[] = JSON.parse(existingStr);
        const updated = existing.map(n => n.id === noteId ? { ...n, ...updates } : n);
        localStorage.setItem('trackr_notes', JSON.stringify(updated));
      } catch (err) {
        console.error("Error updating mock note:", err);
      }
    }
  }

  private deleteMockNote(noteId: string): void {
    this.inMemoryNotes = this.inMemoryNotes.filter(n => n.id !== noteId);
    if (typeof localStorage !== 'undefined') {
      const existingStr = localStorage.getItem('trackr_notes') || '[]';
      try {
        const existing: ResourceNote[] = JSON.parse(existingStr);
        const filtered = existing.filter(n => n.id !== noteId);
        localStorage.setItem('trackr_notes', JSON.stringify(filtered));
      } catch (err) {
        console.error("Error deleting mock note:", err);
      }
    }
  }

  private getMockNotes(resourceId: string): ResourceNote[] {
    if (typeof localStorage === 'undefined') {
      return this.inMemoryNotes.filter(n => n.resourceId === resourceId);
    }
    const existingStr = localStorage.getItem('trackr_notes') || '[]';
    try {
      const existing: ResourceNote[] = JSON.parse(existingStr);
      const combined = [...this.inMemoryNotes, ...existing];
      // Deduplicate by ID
      const map = new Map<string, ResourceNote>();
      combined.forEach(n => map.set(n.id, n));
      return Array.from(map.values()).filter(n => n.resourceId === resourceId);
    } catch {
      return this.inMemoryNotes.filter(n => n.resourceId === resourceId);
    }
  }

  private getAllMockNotes(): ResourceNote[] {
    if (typeof localStorage === 'undefined') {
      return this.inMemoryNotes;
    }
    const existingStr = localStorage.getItem('trackr_notes') || '[]';
    try {
      const existing: ResourceNote[] = JSON.parse(existingStr);
      const combined = [...this.inMemoryNotes, ...existing];
      const map = new Map<string, ResourceNote>();
      combined.forEach(n => map.set(n.id, n));
      return Array.from(map.values());
    } catch {
      return this.inMemoryNotes;
    }
  }
}
