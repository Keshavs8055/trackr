import { TypedResourceMetadata, MovieMetadata, BookMetadata, GithubMetadata } from '../metadata/metadata-types';

export interface ProviderAdapter<TInput = any, TOutput = TypedResourceMetadata> {
  providerName: string;
  adapt(rawResponse: TInput): TOutput;
}

export class OMDbAdapter implements ProviderAdapter<any, MovieMetadata> {
  public providerName = 'omdb';

  public adapt(raw: any): MovieMetadata {
    const runtimeMatch = raw.Runtime ? String(raw.Runtime).match(/\d+/) : null;
    const yearMatch = raw.Year ? String(raw.Year).match(/\d{4}/) : null;

    return {
      director: raw.Director && raw.Director !== 'N/A' ? raw.Director : undefined,
      cast: raw.Actors && raw.Actors !== 'N/A' ? raw.Actors.split(',').map((a: string) => a.trim()) : undefined,
      runtimeMinutes: runtimeMatch ? parseInt(runtimeMatch[0], 10) : undefined,
      imdbRating: raw.imdbRating && raw.imdbRating !== 'N/A' ? raw.imdbRating : undefined,
      releaseYear: yearMatch ? parseInt(yearMatch[0], 10) : undefined,
      plot: raw.Plot && raw.Plot !== 'N/A' ? raw.Plot : undefined,
      genre: raw.Genre && raw.Genre !== 'N/A' ? raw.Genre.split(',').map((g: string) => g.trim()) : undefined,
    };
  }
}

export class OpenLibraryAdapter implements ProviderAdapter<any, BookMetadata> {
  public providerName = 'openlibrary';

  public adapt(raw: any): BookMetadata {
    return {
      authors: Array.isArray(raw.authors) 
        ? raw.authors.map((a: any) => typeof a === 'string' ? a : a.name).filter(Boolean)
        : Array.isArray(raw.author_name) ? raw.author_name : undefined,
      pageCount: raw.number_of_pages || raw.number_of_pages_median || undefined,
      publisher: Array.isArray(raw.publishers) ? raw.publishers[0] : (typeof raw.publisher === 'string' ? raw.publisher : undefined),
      isbn: Array.isArray(raw.isbn) ? raw.isbn[0] : (typeof raw.isbn === 'string' ? raw.isbn : undefined),
      publishYear: raw.first_publish_year || (raw.publish_date ? parseInt(String(raw.publish_date).match(/\d{4}/)?.[0] || '0', 10) : undefined),
      subjects: Array.isArray(raw.subjects) ? raw.subjects.slice(0, 5) : (Array.isArray(raw.subject) ? raw.subject.slice(0, 5) : undefined),
    };
  }
}

export class GithubAdapter implements ProviderAdapter<any, GithubMetadata> {
  public providerName = 'github';

  public adapt(raw: any): GithubMetadata {
    return {
      stars: typeof raw.stargazers_count === 'number' ? raw.stargazers_count : undefined,
      forks: typeof raw.forks_count === 'number' ? raw.forks_count : undefined,
      openIssues: typeof raw.open_issues_count === 'number' ? raw.open_issues_count : undefined,
      language: raw.language || undefined,
      license: raw.license?.spdx_id || raw.license?.name || undefined,
      lastPushDate: raw.pushed_at || undefined,
    };
  }
}
