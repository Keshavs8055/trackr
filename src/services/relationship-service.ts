import { db } from '@/services/firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { ResourceRelationship } from '@/types';
import { EventBus } from '@/domain/events/event-bus';

export class RelationshipService {
  private static instance: RelationshipService;
  private inMemoryRelationships: ResourceRelationship[] = [];

  private constructor() {}

  public static getInstance(): RelationshipService {
    if (!RelationshipService.instance) {
      RelationshipService.instance = new RelationshipService();
    }
    return RelationshipService.instance;
  }

  public async addRelationship(
    userId: string,
    data: Omit<ResourceRelationship, 'id' | 'createdAt' | 'userId'>,
    sourceTitle?: string,
    targetTitle?: string
  ): Promise<ResourceRelationship> {
    const relationship: ResourceRelationship = {
      id: `rel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      sourceResourceId: data.sourceResourceId,
      targetResourceId: data.targetResourceId,
      type: data.type,
      notes: data.notes,
      createdAt: Date.now(),
    };

    if (userId === 'mock-user-id' || typeof window === 'undefined') {
      this.saveMockRelationship(relationship);
    } else {
      try {
        const relsRef = collection(db, 'users', userId, 'relationships');
        const docRef = await addDoc(relsRef, {
          sourceResourceId: relationship.sourceResourceId,
          targetResourceId: relationship.targetResourceId,
          type: relationship.type,
          notes: relationship.notes || null,
          createdAt: relationship.createdAt,
        });
        relationship.id = docRef.id;
      } catch (err) {
        console.warn("Firestore relationship write failed, storing locally:", err);
        this.saveMockRelationship(relationship);
      }
    }

    // Publish event to EventBus for Activity logging
    EventBus.getInstance().publish('StatusChanged', {
      userId,
      resourceId: relationship.sourceResourceId,
      resourceTitle: sourceTitle || 'Resource',
      oldStatus: 'unlinked',
      newStatus: `linked (${data.type})`,
    });

    return relationship;
  }

  public async removeRelationship(userId: string, relationshipId: string): Promise<void> {
    if (userId === 'mock-user-id' || typeof window === 'undefined') {
      this.deleteMockRelationship(relationshipId);
      return;
    }

    try {
      const docRef = doc(db, 'users', userId, 'relationships', relationshipId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Firestore relationship delete failed, removing locally:", err);
      this.deleteMockRelationship(relationshipId);
    }
  }

  public async getRelationshipsForResource(
    userId: string,
    resourceId: string
  ): Promise<{ outgoing: ResourceRelationship[]; incoming: ResourceRelationship[]; all: ResourceRelationship[] }> {
    if (userId === 'mock-user-id' || typeof window === 'undefined') {
      return this.getMockRelationships(resourceId);
    }

    try {
      const relsRef = collection(db, 'users', userId, 'relationships');
      
      // Outgoing: source = resourceId
      const qOutgoing = query(relsRef, where('sourceResourceId', '==', resourceId));
      const snapOutgoing = await getDocs(qOutgoing);
      const outgoing: ResourceRelationship[] = snapOutgoing.docs.map(d => ({
        id: d.id,
        userId,
        ...(d.data() as Omit<ResourceRelationship, 'id' | 'userId'>),
      }));

      // Incoming: target = resourceId
      const qIncoming = query(relsRef, where('targetResourceId', '==', resourceId));
      const snapIncoming = await getDocs(qIncoming);
      const incoming: ResourceRelationship[] = snapIncoming.docs.map(d => ({
        id: d.id,
        userId,
        ...(d.data() as Omit<ResourceRelationship, 'id' | 'userId'>),
      }));

      const seen = new Set<string>();
      const all: ResourceRelationship[] = [];

      [...outgoing, ...incoming].forEach(r => {
        if (!seen.has(r.id)) {
          seen.add(r.id);
          all.push(r);
        }
      });

      return { outgoing, incoming, all };
    } catch (err) {
      console.warn("Failed to fetch Firestore relationships, returning local fallback:", err);
      return this.getMockRelationships(resourceId);
    }
  }

  private saveMockRelationship(rel: ResourceRelationship): void {
    this.inMemoryRelationships.unshift(rel);
    if (typeof localStorage !== 'undefined') {
      const existingStr = localStorage.getItem('trackr_relationships') || '[]';
      try {
        const existing: ResourceRelationship[] = JSON.parse(existingStr);
        existing.unshift(rel);
        localStorage.setItem('trackr_relationships', JSON.stringify(existing));
      } catch (err) {
        console.error("Error saving mock relationship:", err);
      }
    }
  }

  private deleteMockRelationship(id: string): void {
    this.inMemoryRelationships = this.inMemoryRelationships.filter(r => r.id !== id);
    if (typeof localStorage !== 'undefined') {
      const existingStr = localStorage.getItem('trackr_relationships') || '[]';
      try {
        const existing: ResourceRelationship[] = JSON.parse(existingStr);
        const filtered = existing.filter(r => r.id !== id);
        localStorage.setItem('trackr_relationships', JSON.stringify(filtered));
      } catch (err) {
        console.error("Error deleting mock relationship:", err);
      }
    }
  }

  private getMockRelationships(resourceId: string): { outgoing: ResourceRelationship[]; incoming: ResourceRelationship[]; all: ResourceRelationship[] } {
    let list = this.inMemoryRelationships;
    if (typeof localStorage !== 'undefined') {
      const existingStr = localStorage.getItem('trackr_relationships') || '[]';
      try {
        const existing: ResourceRelationship[] = JSON.parse(existingStr);
        const combined = [...this.inMemoryRelationships, ...existing];
        const seen = new Set<string>();
        list = combined.filter(r => {
          if (seen.has(r.id)) return false;
          seen.add(r.id);
          return true;
        });
      } catch {}
    }

    const outgoing = list.filter(r => r.sourceResourceId === resourceId);
    const incoming = list.filter(r => r.targetResourceId === resourceId);
    const seen = new Set<string>();
    const all: ResourceRelationship[] = [];

    [...outgoing, ...incoming].forEach(r => {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        all.push(r);
      }
    });

    return { outgoing, incoming, all };
  }
}
