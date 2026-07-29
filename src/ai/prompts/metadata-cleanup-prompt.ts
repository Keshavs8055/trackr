import { Resource } from '@/types';

export function buildMetadataCleanupPrompt(resource: Resource): string {
  return `You are a metadata sanitation expert.
Review the following resource and suggest clean title formatting, tag additions/deletions, or typos in notes.

RESOURCE:
- Title: ${resource.title}
- Type: ${resource.type}
- Current Tags: ${resource.tags.join(', ')}
- Notes: ${resource.notes || 'None'}

OUTPUT RULES:
Return ONLY a valid JSON object:
{
  "resourceId": "${resource.id}",
  "suggestedTitle": "Cleaned Title (or null if already clean)",
  "suggestedTagsToAdd": ["tag1"],
  "suggestedTagsToRemove": ["obsolete_tag"],
  "notesCorrection": "Corrected notes text (or null if no change needed)"
}`;
}
