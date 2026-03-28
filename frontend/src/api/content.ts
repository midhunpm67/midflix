import { apiClient } from './axios';
import type { Content, ContentListItem, Genre, PaginatedResponse, Season, Episode } from '@/types/content';

export async function browseContent(params?: {
  type?: string;
  genre_id?: string;
  page?: number;
}): Promise<PaginatedResponse<ContentListItem>> {
  const res = await apiClient.get('/api/v1/content', { params });
  return res.data.data;
}

export async function getTrending(): Promise<ContentListItem[]> {
  const res = await apiClient.get('/api/v1/content/trending');
  return res.data.data;
}

export async function getNewReleases(): Promise<ContentListItem[]> {
  const res = await apiClient.get('/api/v1/content/new-releases');
  return res.data.data;
}

export async function searchContent(q: string, page = 1): Promise<PaginatedResponse<ContentListItem>> {
  const res = await apiClient.get('/api/v1/content/search', { params: { q, page } });
  return res.data.data;
}

export async function getContentBySlug(slug: string): Promise<Content> {
  const res = await apiClient.get(`/api/v1/content/${slug}`);
  return res.data.data;
}

export async function getContentSeasons(slug: string): Promise<Season[]> {
  const res = await apiClient.get(`/api/v1/content/${slug}/seasons`);
  return res.data.data;
}

export async function getSeasonEpisodes(seasonId: string): Promise<Episode[]> {
  const res = await apiClient.get(`/api/v1/seasons/${seasonId}/episodes`);
  return res.data.data;
}

export async function getGenres(): Promise<Genre[]> {
  const res = await apiClient.get('/api/v1/genres');
  return res.data.data;
}
