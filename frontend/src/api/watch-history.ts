import { apiClient } from './axios';
import type { WatchHistoryItem, ContinueWatchingItem } from '@/types/content';

interface SaveWatchHistoryPayload {
  content_id: string;
  episode_id?: string | null;
  progress_seconds: number;
  duration_seconds: number;
}

export async function saveWatchHistory(data: SaveWatchHistoryPayload): Promise<WatchHistoryItem> {
  const res = await apiClient.post('/api/v1/me/watch-history', data);
  return res.data.data;
}

export async function getWatchHistory(
  contentId: string,
  episodeId?: string | null,
): Promise<WatchHistoryItem> {
  const params: Record<string, string> = {};
  if (episodeId) {
    params.episode_id = episodeId;
  }
  const res = await apiClient.get(`/api/v1/me/watch-history/${contentId}`, { params });
  return res.data.data;
}

export async function getContinueWatching(): Promise<ContinueWatchingItem[]> {
  const res = await apiClient.get('/api/v1/me/continue-watching');
  return res.data.data;
}
