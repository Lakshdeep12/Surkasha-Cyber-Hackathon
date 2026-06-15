// ── Types ──────────────────────────────────────────────────────
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type CircularStatus = 'Draft' | 'Published' | 'Archived';
export type CircularCategory =
  | 'Cyber Advisory'
  | 'Fraud Alert'
  | 'Data Security Circular'
  | 'Compliance Notice'
  | 'Master Direction';

export interface Circular {
  id: number;
  reference_number: string;
  title: string;
  category: CircularCategory;
  priority: Priority;
  summary: string | null;
  full_content: string | null;
  target_departments: string[];
  status: CircularStatus;
  pdf_path: string | null;
  created_at: string;
  published_at: string | null;
  issue_date: string | null;
  effective_date: string | null;
}

export interface RegEvent {
  id: number;
  event_id: string;
  event_type: string;
  regulation_id: string;
  regulation_title: string | null;
  category: string | null;
  priority: string | null;
  timestamp: string;
}

export interface DashboardStats {
  total_circulars: number;
  draft_circulars: number;
  published_circulars: number;
  critical_advisories: number;
  recent_publications: Partial<Circular>[];
  recent_events: Partial<RegEvent>[];
}

export interface CreateCircularPayload {
  reference_number: string;
  title: string;
  category: CircularCategory;
  priority: Priority;
  summary?: string;
  full_content?: string;
  target_departments?: string[];
  status: CircularStatus;
  issue_date?: string;
  effective_date?: string;
}

// ── Client ─────────────────────────────────────────────────────
const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Stats
  getStats: () => fetch('/api/stats').then(r => { if (!r.ok) throw new Error('Stats failed'); return r.json() as Promise<DashboardStats>; }),

  // Circulars
  listCirculars: (params?: { status?: string; category?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.category) qs.set('category', params.category);
    return request<Circular[]>(`/circulars${qs.toString() ? '?' + qs.toString() : ''}`);
  },

  getCircular: (id: number) => request<Circular>(`/circulars/${id}`),

  createCircular: (payload: CreateCircularPayload) =>
    request<Circular>('/circulars', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCircular: (id: number, payload: Partial<CreateCircularPayload>) =>
    request<Circular>(`/circulars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  publishCircular: (id: number) =>
    request<Circular>(`/circulars/${id}/publish`, { method: 'POST' }),

  uploadPdf: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`/api/circulars/${id}/upload`, { method: 'POST', body: form }).then(r => {
      if (!r.ok) throw new Error('Upload failed');
      return r.json();
    });
  },

  downloadPdfUrl: (id: number) => `/api/circulars/${id}/pdf`,

  // Publications
  getPublications: () => request<Circular[]>('/publications'),

  // Events
  getEvents: () => request<RegEvent[]>('/events'),
};

// ── Helpers ────────────────────────────────────────────────────
export function priorityClass(p: string): string {
  switch (p) {
    case 'Critical': return 'badge badge-critical';
    case 'High':     return 'badge badge-high';
    case 'Medium':   return 'badge badge-medium';
    case 'Low':      return 'badge badge-low';
    default:         return 'badge badge-medium';
  }
}

export function statusClass(s: string): string {
  switch (s) {
    case 'Published': return 'badge badge-published';
    case 'Draft':     return 'badge badge-draft';
    case 'Archived':  return 'badge badge-archived';
    default:          return 'badge badge-draft';
  }
}

export function categoryClass(c: string): string {
  if (c.includes('Cyber'))      return 'badge badge-cyber';
  if (c.includes('Fraud'))      return 'badge badge-fraud';
  if (c.includes('Data'))       return 'badge badge-datasec';
  if (c.includes('Compliance')) return 'badge badge-compliance';
  if (c.includes('Master'))     return 'badge badge-master';
  return 'badge badge-draft';
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}
