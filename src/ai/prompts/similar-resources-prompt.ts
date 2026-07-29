import { Resource } from '@/types';

export function buildSimilarResourcesPrompt(target: Resource, candidateResources: Resource[]): string {
  const candidateSummaries = candidateResources.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    tags: r.tags,
    notesExcerpt: r.notes ? r.notes.slice(0, 150) : '',
  }));

  return `You are a recommendation engine for personal archives.
Analyze the target resource and rank up to 3 candidate resources in the archive that are most semantically/thematically similar.

RULES:
1. Return ONLY a valid JSON array of objects.
2. Each object MUST contain:
   - "resourceId": string (matches candidate id)
   - "matchScore": number (integer between 0 and 100)
   - "reason": string (a short, compelling 1-sentence explanation why they are related)
3. Do NOT include the target resource itself.
4. If no candidates are meaningfully related, return an empty JSON array [].

TARGET RESOURCE:
- ID: ${target.id}
- Title: ${target.title}
- Type: ${target.type}
- Tags: ${target.tags.join(', ')}
- Notes: ${target.notes || 'None'}

CANDIDATES:
${JSON.stringify(candidateSummaries, null, 2)}

JSON Output Format:
[
  { "resourceId": "res_123", "matchScore": 88, "reason": "Both explore themes of artificial intelligence and dystopian futures." }
]`;
}
