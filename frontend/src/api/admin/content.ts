import { apiClient } from '../axios';
import type {
  AdminStats,
  Content,
  ContentListItem,
  CreateContentPayload,
  CreateEpisodePayload,
  CreateSeasonPayload,
  Episode,
  PaginatedResponse,
  Season,
  UpdateContentPayload,
  UpdateEpisodePayload,
  UpdateSeasonPayload,
} from '@/types/content';

export async function adminListContent(params?: {
  type?: string;
  search?: string;
  page?: number;
}): Promise<PaginatedResponse<ContentListItem>> {
  const res = await apiClient.get('/api/v1/admin/content', { params });
  return res.data.data;
}

export async function adminGetContent(id: string): Promise<Content> {
  const res = await apiClient.get(`/api/v1/admin/content/${id}`);
  return res.data.data;
}

export async function adminCreateContent(payload: CreateContentPayload): Promise<Content> {
  const res = await apiClient.post('/api/v1/admin/content', payload);
  return res.data.data;
}

export async function adminUpdateContent(id: string, payload: UpdateContentPayload): Promise<Content> {
  const res = await apiClient.put(`/api/v1/admin/content/${id}`, payload);
  return res.data.data;
}

export async function adminTogglePublish(id: string): Promise<Content> {
  const res = await apiClient.patch(`/api/v1/admin/content/${id}/publish`);
  return res.data.data;
}

export async function adminDeleteContent(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/content/${id}`);
}

export async function adminGetStats(): Promise<AdminStats> {
  const res = await apiClient.get('/api/v1/admin/stats');
  return res.data.data;
}

export async function adminCreateSeason(contentId: string, payload: CreateSeasonPayload): Promise<Season> {
  const res = await apiClient.post(`/api/v1/admin/content/${contentId}/seasons`, payload);
  return res.data.data;
}

export async function adminUpdateSeason(id: string, payload: UpdateSeasonPayload): Promise<Season> {
  const res = await apiClient.put(`/api/v1/admin/seasons/${id}`, payload);
  return res.data.data;
}

export async function adminDeleteSeason(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/seasons/${id}`);
}

export async function adminCreateEpisode(seasonId: string, payload: CreateEpisodePayload): Promise<Episode> {
  const res = await apiClient.post(`/api/v1/admin/seasons/${seasonId}/episodes`, payload);
  return res.data.data;
}

export async function adminUpdateEpisode(id: string, payload: UpdateEpisodePayload): Promise<Episode> {
  const res = await apiClient.put(`/api/v1/admin/episodes/${id}`, payload);
  return res.data.data;
}

export async function adminDeleteEpisode(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/episodes/${id}`);
}
