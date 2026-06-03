// Centralized parsing logic for tags and collections
export const HASHTAG_REGEX = /#[\w-]+/g;

export function formatTag(tag: string): string {
  if (!tag) return "";
  return tag.replace(/^#/, '').trim().toLowerCase().replace(/\s+/g, '-');
}

export function extractTags(input: string): string[] {
  const extractedHashtags = input.match(HASHTAG_REGEX) || [];
  return extractedHashtags.map(formatTag);
}

export function cleanTitle(input: string): string {
  const title = input.replace(HASHTAG_REGEX, '').trim();
  return title || "Untitled Memory";
}
