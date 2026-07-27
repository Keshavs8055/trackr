export interface MovieMetadata {
  director?: string;
  cast?: string[];
  runtimeMinutes?: number;
  imdbRating?: string;
  releaseYear?: number;
  plot?: string;
  genre?: string[];
}

export interface BookMetadata {
  authors?: string[];
  pageCount?: number;
  publisher?: string;
  isbn?: string;
  publishYear?: number;
  subjects?: string[];
}

export interface GithubMetadata {
  stars?: number;
  forks?: number;
  openIssues?: number;
  language?: string;
  license?: string;
  lastPushDate?: string;
}

export interface WebsiteMetadata {
  domain?: string;
  readTimeMinutes?: number;
  description?: string;
  faviconUrl?: string;
}

export type TypedResourceMetadata = 
  | MovieMetadata 
  | BookMetadata 
  | GithubMetadata 
  | WebsiteMetadata 
  | Record<string, unknown>;
