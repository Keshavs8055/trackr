// Centralized parsing, normalization, and extraction logic for tags, URLs, and titles

export const HASHTAG_REGEX = /#[\w-]+/g;
export const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i;

/**
 * Mapping dictionary for reserved singular/plural resource tags and plan-to variants
 */
export const TAG_NORMALIZATION_MAP: Record<string, string> = {
  // Reserved Resource Type Singular/Plural Normalization
  movie: 'movie',
  movies: 'movie',
  film: 'movie',
  films: 'movie',

  book: 'book',
  books: 'book',
  novel: 'book',
  novels: 'book',

  tv: 'tv',
  show: 'tv',
  shows: 'tv',
  series: 'tv',

  article: 'article',
  articles: 'article',

  website: 'website',
  websites: 'website',
  site: 'website',
  sites: 'website',

  link: 'link',
  links: 'link',
  url: 'link',
  urls: 'link',

  course: 'course',
  courses: 'course',

  github: 'github',
  githubs: 'github',
  repo: 'github',
  repos: 'github',
  repository: 'github',
  repositories: 'github',

  tool: 'tool',
  tools: 'tool',

  podcast: 'podcast',
  podcasts: 'podcast',

  game: 'game',
  games: 'game',

  note: 'note',
  notes: 'note',

  // "Plan to" Canonical Tag Mapping
  plantowatch: 'plantowatch',
  plantoread: 'plantoread',
  plantocheck: 'plantocheck',
  plantolisten: 'plantolisten',
  plantodo: 'plantodo',
  'plan-to-watch': 'plantowatch',
  'plan-to-read': 'plantoread',
  'plan-to-check': 'plantocheck',
  'plan-to-listen': 'plantolisten',
  'plan-to-do': 'plantodo',
  planto: 'planto',
  wishlist: 'wishlist',
  'wish-list': 'wishlist',

  // Lifecycle Status Tag Normalization -> Preserved Canonical Tags
  watched: 'watched',
  completed: 'completed',
  over: 'completed',
  finished: 'completed',
  read: 'read',
  done: 'completed',
  dropped: 'dropped',
  fav: 'fav',
  favorite: 'fav',

  currentlyreading: 'reading',
  currentlywatching: 'watching',
  reading: 'reading',
  watching: 'watching',
  'currently-reading': 'reading',
  'currently-watching': 'watching',
  'in-progress': 'in-progress',
};

/**
 * Extracts the derived status from tags for a resource type.
 */
export function extractStatusFromTags(tags: string[], resourceType?: string): string | null {
  if (!tags || tags.length === 0) return null;
  const cleanTags = tags.map(t => t.toLowerCase().replace(/^#/, ''));

  for (const tag of cleanTags) {
    if (tag === 'wishlist' || tag === 'wish-list') return 'wishlist';
    if (['planto', 'plantoread', 'plantowatch', 'plantocheck', 'planned', 'plan-to-read', 'plan-to-watch', 'backlog'].includes(tag)) {
      if (resourceType === 'movie' || resourceType === 'tv' || resourceType === 'book') return 'planned';
      return 'backlog';
    }
    if (['watching', 'currentlywatching', 'currently-watching'].includes(tag)) return 'watching';
    if (['reading', 'currentlyreading', 'currently-reading'].includes(tag)) return 'reading';
    if (['read', 'watched', 'completed', 'finished', 'done', 'over'].includes(tag)) return 'completed';
    if (tag === 'dropped') return 'dropped';
    if (tag === 'archived') return 'archived';
  }
  return null;
}

/**
 * Returns tag synonyms matching a given status string.
 */
export function getStatusSynonymTags(status?: string): string[] {
  if (!status) return [];
  const s = status.toLowerCase();
  switch (s) {
    case 'wishlist':
      return ['wishlist', 'wish-list'];
    case 'planned':
    case 'planto':
    case 'backlog':
      return ['planto', 'plantowatch', 'plantoread', 'plantocheck', 'planned', 'backlog'];
    case 'watching':
      return ['watching', 'currentlywatching', 'in-progress'];
    case 'reading':
      return ['reading', 'currentlyreading', 'in-progress'];
    case 'completed':
      return ['completed', 'read', 'watched', 'finished', 'done'];
    case 'dropped':
      return ['dropped'];
    case 'archived':
      return ['archived'];
    default:
      return [s];
  }
}

/**
 * Normalizes a tag string into its canonical representation.
 * - Strips leading '#'
 * - Converts to lowercase & replaces whitespace with hyphens
 * - Maps singular/plural reserved tags & plan-to tags
 */
export function normalizeTag(tag: string): string {
  if (!tag) return "";
  const cleaned = tag.replace(/^#/, '').trim().toLowerCase().replace(/\s+/g, '-');
  return TAG_NORMALIZATION_MAP[cleaned] || cleaned;
}

export function formatTag(tag: string): string {
  return normalizeTag(tag);
}

export function extractTags(input: string): string[] {
  if (!input) return [];
  const extractedHashtags = input.match(HASHTAG_REGEX) || [];
  const normalized = extractedHashtags.map(formatTag);
  return Array.from(new Set(normalized));
}

/**
 * Extracts the first valid HTTP/HTTPS or www URL from an input string
 */
export function extractUrl(input: string): string | null {
  if (!input) return null;
  const words = input.split(/\s+/);
  for (const word of words) {
    if (word.startsWith('#')) continue;
    const match = word.match(URL_REGEX);
    if (match) {
      let rawUrl = match[0];
      // Clean trailing punctuation like ), ], ., ,
      rawUrl = rawUrl.replace(/[),.;]+$/, '');
      if (!rawUrl.match(/^https?:\/\//i)) {
        rawUrl = 'https://' + rawUrl;
      }
      try {
        new URL(rawUrl);
        return rawUrl;
      } catch {
        // Continue searching
      }
    }
  }
  return null;
}

/**
 * Cleans input string by removing hashtags and formatting raw URLs into human-readable titles
 */
export function cleanTitle(input: string): string {
  if (!input) return "Untitled Memory";
  
  // Remove hashtags
  let title = input.replace(HASHTAG_REGEX, '').trim();

  // If input is purely a URL or contains a URL, format title nicely
  const url = extractUrl(input);
  if (url && (title === url || title === url.replace(/^https?:\/\//i, '') || !title)) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '');
      const path = parsed.pathname.replace(/\/$/, '');
      if (path && path.length > 1) {
        title = `${host}${path}`;
      } else {
        title = host;
      }
    } catch {
      title = url;
    }
  }

  return title || "Untitled Memory";
}
