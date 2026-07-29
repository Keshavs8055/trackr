import { Resource } from '@/types';

export function buildAutoTagPrompt(resource: Partial<Resource>, existingWorkspaceTags: string[] = []): string {
  const existingTagsStr = existingWorkspaceTags.length > 0 ? existingWorkspaceTags.join(', ') : 'none';
  
  // Extract minimal key metadata to save tokens
  const metaObj = resource.providerMetadata?.metadata || resource.metadata;
  const minimalMeta = metaObj ? {
    genre: (metaObj as any).genre,
    director: (metaObj as any).director,
    author: (metaObj as any).author,
    year: (metaObj as any).year || (metaObj as any).publishYear,
  } : {};

  return `You are a personal archive taxonomy assistant for Trackr.
Your task is to analyze the following resource and recommend relevant, high-precision hashtags for organization.

RULES:
1. Return ONLY a valid JSON array of string tags (e.g., ["scifi", "classic", "must-read"]).
2. Do NOT prefix tags with '#' inside the array (they will be formatted automatically).
3. All tags MUST be lowercase, alphanumeric, with optional hyphens.
4. PRIORITIZE EXISTING WORKSPACE TAGS: Favor tags from [${existingTagsStr}] to prevent taxonomy fragmentation and group synonyms.
5. Recommend only tags that are genuinely relevant and useful. Do NOT impose artificial limits or force unnecessary tags.
6. Do NOT suggest generic resource type tags like "movie" or "book" (handled separately).

RESOURCE DETAILS:
- Title: ${resource.title || 'Untitled'}
- Type: ${resource.type || 'unknown'}
- Notes: ${resource.notes || 'None'}
- Current Resource Tags: ${(resource.tags || []).join(', ') || 'None'}
- Key Metadata: ${JSON.stringify(minimalMeta)}

JSON Output Array Format:
["tag1", "tag2"]`;
}
