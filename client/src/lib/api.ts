import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export interface Checkpoint {
  created_at: string;
  message: string;
  location: string | null;
  tag: string;
  subtag: string;
  city: string | null;
  state: string | null;
  country_name: string | null;
}

export interface Package {
  id: number;
  aftership_id: string;
  tracking_number: string;
  slug: string;
  carrier_name: string;
  direction: 'incoming' | 'outgoing';
  label: string | null;
  order_id: string | null;
  status_tag: string;
  status_subtag: string | null;
  status_message: string | null;
  origin_country: string | null;
  destination_country: string | null;
  expected_delivery: string | null;
  last_checkpoint_at: string | null;
  last_synced_at: string | null;
  checkpoints: Checkpoint[];
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export const packagesApi = {
  list: (params?: { direction?: string; status?: string; search?: string }) =>
    api.get<Package[]>('/packages', { params }).then(r => r.data),

  get: (id: number) =>
    api.get<Package>(`/packages/${id}`).then(r => r.data),

  detect: (tracking_number: string) =>
    api.post<{ slug: string | null; carrier_name: string | null }>('/packages/detect', { tracking_number }).then(r => r.data),

  create: (data: { tracking_number: string; direction: string; label?: string; order_id?: string }) =>
    api.post<Package>('/packages', data).then(r => r.data),

  update: (id: number, data: { label?: string; order_id?: string; direction?: string }) =>
    api.put<Package>(`/packages/${id}`, data).then(r => r.data),

  refresh: (id: number) =>
    api.post<Package>(`/packages/${id}/refresh`).then(r => r.data),

  archive: (id: number) =>
    api.delete(`/packages/${id}`).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/packages/${id}?hard=true`).then(r => r.data),

  refreshAll: () =>
    api.post<{ refreshed: number; failed: number }>('/packages/refresh-all').then(r => r.data),

  seed: () =>
    api.post('/seed').then(r => r.data),

  seedForce: () =>
    api.post('/seed/force').then(r => r.data),
};

export const chatApi = {
  ask: (message: string) =>
    api.post<{ answer: string; matchedCount: number }>('/chat', { message }).then(r => r.data),

  suggestions: () =>
    api.get<{ suggestions: string[] }>('/chat/suggestions').then(r => r.data.suggestions),
};
