export interface ContentCard {
  id: string;
  title: string;
  slug: string;
  mediaType: 'Show' | 'Movie';
  overview: string;
  posterPath?: string;
  backdropPath?: string;
  genres: string[];
  releaseDate?: string;
  averageRating: number;
  totalRatings: number;
  streamingPlatforms: string[];
}

export interface StreamingPlatformLink {
  platform: string;
  deepLink: string;
  regions: string[];
}

export interface Episode {
  id: string;
  showId: string;
  seasonId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  overview?: string;
  stillPath?: string;
  runtimeMinutes: number;
  airDate?: string;
  averageRating: number;
}

export interface Season {
  id: string;
  showId: string;
  seasonNumber: number;
  title: string;
  overview?: string;
  posterPath?: string;
  episodeCount: number;
  airDate?: string;
  episodes: Episode[];
}

export interface ShowDetails extends ContentCard {
  totalSeasons: number;
  totalEpisodes: number;
  status: string;
  platforms: StreamingPlatformLink[];
  seasons: Season[];
}

export interface MovieDetails extends ContentCard {
  runtimeMinutes: number;
  platforms: StreamingPlatformLink[];
}

export interface DiscoveryResponse {
  trendingShows: ContentCard[];
  popularMovies: ContentCard[];
  topRated: ContentCard[];
}
