import { Resource } from '@/types';

export function buildNaturalLanguageQueryPrompt(query: string, archiveResources: Resource[]): string {
  const catalog = archiveResources.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    status: r.status || 'unread',
    tags: r.tags,
    notes: r.notes ? r.notes.slice(0, 120) : '',
    year: r.providerMetadata?.metadata?.year || r.metadata?.year || 'unknown',
  }));

  return `You are a natural language query processor for Trackr archive.
Process the user's search query against the archive catalog.

USER QUERY: "${query}"

ARCHIVE CATALOG:
${JSON.stringify(catalog, null, 2)}

OUTPUT RULES:
Return ONLY a single valid JSON object matching the following structure:
{
  "intent": "Brief description of user intent (e.g. 'Search for unread sci-fi books')",
  "confidence": 0.95, // Float between 0.0 and 1.0
  "reasoning": "Step-by-step reasoning explaining why matching items were selected and how query criteria were mapped",
  "matchingResourceIds": ["id1", "id2"],
  "answer": "A friendly 1-2 sentence summary of what was found in the archive",
  "suggestedFilters": {
    "types": ["book"],
    "tags": ["scifi"],
    "status": ["unread"]
  }
}

Do NOT include markdown formatting or extra explanatory text outside the JSON object.`;
}
