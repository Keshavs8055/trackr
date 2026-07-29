import { Resource } from '@/types';

export function buildDuplicateDetectionPrompt(resources: Resource[]): string {
  const catalog = resources.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    url: r.url || '',
    tags: r.tags,
  }));

  return `You are an archive deduplication assistant.
Identify duplicate or near-duplicate entries in the resource catalog based on title similarity, URL match, or type overlap.

CATALOG:
${JSON.stringify(catalog, null, 2)}

OUTPUT RULES:
Return ONLY a valid JSON array of duplicate groups:
[
  {
    "primaryResourceId": "id_of_main_item",
    "duplicateResourceIds": ["id_of_dup_1", "id_of_dup_2"],
    "confidence": 0.9,
    "reason": "Exact URL match and identical title"
  }
]
If no duplicates exist, return [].`;
}
