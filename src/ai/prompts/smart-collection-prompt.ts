import { Resource } from '@/types';

export function buildSmartCollectionPrompt(userPrompt: string, availableResources: Resource[]): string {
  const types = Array.from(new Set(availableResources.map((r) => r.type)));
  const allTags = Array.from(new Set(availableResources.flatMap((r) => r.tags)));

  return `You are a smart collection builder for Trackr.
Convert the user request into collection details and dynamic matching rules.

USER REQUEST: "${userPrompt}"

AVAILABLE TYPES IN ARCHIVE: ${types.join(', ')}
AVAILABLE TAGS IN ARCHIVE: ${allTags.join(', ')}

OUTPUT RULES:
Return ONLY a valid JSON object matching this structure:
{
  "title": "Short title for the collection",
  "description": "Clear description of collection criteria",
  "icon": "Lucide icon name (e.g. Bookmark, Film, BookOpen, Star, Code)",
  "color": "Tailwind color name (e.g. blue, emerald, purple, amber, rose)",
  "rules": [
    { "field": "type", "operator": "equals", "value": "movie" },
    { "field": "tag", "operator": "contains", "value": "scifi" }
  ]
}

Valid rule fields: "type" | "tag" | "status" | "year" | "provider"
Valid operators: "equals" | "contains" | "greaterThan" | "lessThan"`;
}
