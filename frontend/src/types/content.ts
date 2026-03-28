export type ContentType = 'movie' | 'series';

export interface VideoAsset {
  hls_url: string | null;
  status: 'pending' | 'processing' | 'ready' | 'error';
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface ContentListItem {
  id: string;
  title: string;
  slug: string;
  type: ContentType;
  year: number | null;
  rating: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  genre_ids: string[];
  is_published: boolean;
  view_count: number;
  published_at: string | null;
  created_at: string;
}

export interface Content extends ContentListItem {
  description: string;
  cast: string[];
  director: string | null;
  trailer_url: string | null;
  video: VideoAsset;
  updated_at: string;
}

export interface Season {
  id: string;
  content_id: string;
  number: number;
  title: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  season_id: string;
  content_id: string;
  number: number;
  title: string;
  description: string | null;
  duration: number | null;
  thumbnail_url: string | null;
  video: VideoAsset;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface CreateContentPayload {
  title: string;
  description: string;
  type: ContentType;
  genre_ids?: string[];
  cast?: string[];
  director?: string | null;
  year?: number | null;
  rating?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  trailer_url?: string | null;
}

export type UpdateContentPayload = Partial<CreateContentPayload>;

export interface CreateSeasonPayload {
  number: number;
  title?: string | null;
  description?: string | null;
}

export type UpdateSeasonPayload = Partial<CreateSeasonPayload>;

export interface CreateEpisodePayload {
  number: number;
  title: string;
  description?: string | null;
  duration?: number | null;
  thumbnail_url?: string | null;
}

export type UpdateEpisodePayload = Partial<CreateEpisodePayload>;

export interface AdminStats {
  total_content: number;
  published: number;
  unpublished: number;
  movies: number;
  series: number;
}
