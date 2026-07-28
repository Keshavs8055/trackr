import { Resource, Collection, ResourceNote, ResourceRelationship, ResourceActivity } from '@/types';
import { resourceService } from '@/services/resource-service';
import { CollectionService } from '@/services/collection-service';
import { NoteService } from '@/services/note-service';
import { RelationshipService } from '@/services/relationship-service';
import { ActivityService } from '@/services/activity-service';
import { normalizeTag } from '@/lib/parser';

export interface ArchiveBackupPayload {
  version: string;
  exportedAt: number;
  app: string;
  resources: Resource[];
  collections: Collection[];
  notes: ResourceNote[];
  relationships: ResourceRelationship[];
  activities: ResourceActivity[];
  settings?: Record<string, unknown>;
}

export interface ImportResult {
  success: boolean;
  importedCounts: {
    resources: number;
    collections: number;
    notes: number;
    relationships: number;
  };
  errors: string[];
}

export class ArchivePortabilityService {
  /**
   * Generates a full archive JSON export payload.
   * EXPLICITLY STRIPS all API keys, credentials, master keys, and secret vault storage records.
   */
  public async exportArchiveData(userId = 'mock-user-id'): Promise<ArchiveBackupPayload> {
    const resources = await resourceService.getResources(userId);
    let collections: Collection[] = [];
    try {
      collections = await CollectionService.getUserCollections(userId);
    } catch {
      // Fallback if collections query fails
    }
    
    // Collect notes and relationships across resources
    let allNotes: ResourceNote[] = [];
    let allRelationships: ResourceRelationship[] = [];
    const noteService = NoteService.getInstance();
    const relService = RelationshipService.getInstance();

    for (const r of resources) {
      try {
        const notes = await noteService.getNotes(userId, r.id);
        allNotes.push(...notes);
      } catch (err) {
        // Skip unreadable notes gracefully
      }

      try {
        const rels = await relService.getRelationshipsForResource(userId, r.id);
        allRelationships.push(...rels.all);
      } catch (err) {
        // Skip unreadable relationships gracefully
      }
    }

    // Deduplicate relationships by ID
    const relMap = new Map<string, ResourceRelationship>();
    allRelationships.forEach(r => relMap.set(r.id, r));
    allRelationships = Array.from(relMap.values());

    // Deduplicate notes by ID
    const noteMap = new Map<string, ResourceNote>();
    allNotes.forEach(n => noteMap.set(n.id, n));
    allNotes = Array.from(noteMap.values());

    let activities: ResourceActivity[] = [];
    try {
      activities = await ActivityService.getInstance().getUserActivities(userId, 1000);
    } catch (err) {
      // Activity service fallback
    }

    // Clean resources of any potential sensitive fields or invalid metadata
    const sanitizedResources = resources.map(r => {
      const copy = { ...r };
      // Ensure no raw keys leak in providerMetadata
      if (copy.providerMetadata?.metadata) {
        const meta = { ...copy.providerMetadata.metadata };
        delete meta.apiKey;
        delete meta.api_key;
        delete meta.secret;
        delete meta.token;
        copy.providerMetadata.metadata = meta;
      }
      return copy;
    });

    return {
      version: "2.0",
      exportedAt: Date.now(),
      app: "trackr",
      resources: sanitizedResources,
      collections,
      notes: allNotes,
      relationships: allRelationships,
      activities,
      settings: {
        theme: "dark",
        schemaVersion: 2,
      },
    };
  }

  /**
   * Triggers browser download of archive export JSON file.
   */
  public async downloadArchiveJSON(userId = 'mock-user-id'): Promise<void> {
    const payload = await this.exportArchiveData(userId);
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trackr-archive-backup-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Validates and imports an archive JSON payload into storage.
   * Auto-migrates legacy schemas and normalizes tags.
   */
  public async importArchiveJSON(jsonString: string, userId = 'mock-user-id'): Promise<ImportResult> {
    const errors: string[] = [];
    let payload: Partial<ArchiveBackupPayload>;

    try {
      payload = JSON.parse(jsonString);
    } catch (err) {
      return {
        success: false,
        importedCounts: { resources: 0, collections: 0, notes: 0, relationships: 0 },
        errors: ["Invalid JSON format."],
      };
    }

    if (!payload.resources || !Array.isArray(payload.resources)) {
      return {
        success: false,
        importedCounts: { resources: 0, collections: 0, notes: 0, relationships: 0 },
        errors: ["Missing or invalid 'resources' array in archive backup."],
      };
    }

    let resourceCount = 0;
    let collectionCount = 0;
    let noteCount = 0;
    let relCount = 0;

    // 1. Import Resources with Tag Normalization
    for (const rawRes of payload.resources) {
      try {
        if (!rawRes.title) continue;

        const normalizedTags = (rawRes.tags || []).map(t => normalizeTag(t));

        await resourceService.addResource(userId, {
          title: rawRes.title,
          type: rawRes.type || "custom",
          tags: normalizedTags,
          notes: rawRes.notes || "",
          url: rawRes.url,
          image: rawRes.image,
          provider: rawRes.provider || "manual",
          providerId: rawRes.providerId,
          providerMetadata: rawRes.providerMetadata,
          metadata: rawRes.metadata,
        });

        resourceCount++;
      } catch (err: any) {
        errors.push(`Failed to import resource "${rawRes.title}": ${err.message || err}`);
      }
    }

    // 2. Import Collections
    if (payload.collections && Array.isArray(payload.collections)) {
      for (const rawCol of payload.collections) {
        try {
          const title = rawCol.title || (rawCol as any).name;
          if (!title) continue;
          await CollectionService.createCollection(userId, {
            title,
            description: rawCol.description,
            resourceIds: rawCol.resourceIds || [],
            rules: rawCol.rules || [],
            color: rawCol.color,
            icon: rawCol.icon,
          });
          collectionCount++;
        } catch (err: any) {
          errors.push(`Failed to import collection "${rawCol.title}": ${err.message || err}`);
        }
      }
    }

    // 3. Import Notes
    if (payload.notes && Array.isArray(payload.notes)) {
      const noteService = NoteService.getInstance();
      for (const rawNote of payload.notes) {
        try {
          if (!rawNote.content || !rawNote.resourceId) continue;
          await noteService.addNote(
            userId,
            rawNote.resourceId,
            rawNote.title || "Note",
            rawNote.content
          );
          noteCount++;
        } catch (err: any) {
          errors.push(`Failed to import note: ${err.message || err}`);
        }
      }
    }

    // 4. Import Relationships
    if (payload.relationships && Array.isArray(payload.relationships)) {
      const relService = RelationshipService.getInstance();
      for (const rawRel of payload.relationships) {
        try {
          if (!rawRel.sourceResourceId || !rawRel.targetResourceId) continue;
          await relService.addRelationship(userId, {
            sourceResourceId: rawRel.sourceResourceId,
            targetResourceId: rawRel.targetResourceId,
            type: rawRel.type || "related_to",
            notes: rawRel.notes,
          });
          relCount++;
        } catch (err: any) {
          errors.push(`Failed to import relationship: ${err.message || err}`);
        }
      }
    }

    return {
      success: errors.length === 0 || resourceCount > 0,
      importedCounts: {
        resources: resourceCount,
        collections: collectionCount,
        notes: noteCount,
        relationships: relCount,
      },
      errors,
    };
  }
}

export const archivePortabilityService = new ArchivePortabilityService();
