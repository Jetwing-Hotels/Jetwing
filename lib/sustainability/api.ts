import type { PropertyOption, SustainabilityEnvironmentRow } from './types';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed: ${response.status}`);
  }

  return payload.data as T;
}

export async function getProperties(): Promise<PropertyOption[]> {
  return fetchJson<PropertyOption[]>('/api/sustainability/properties');
}

export async function getEnvironmentDashboardRows(params?: {
  propertyId?: string;
  year?: number;
  month?: number;
}): Promise<SustainabilityEnvironmentRow[]> {
  const searchParams = new URLSearchParams();

  if (params?.propertyId && params.propertyId !== 'all') {
    searchParams.set('propertyId', params.propertyId);
  }

  if (params?.year) {
    searchParams.set('year', String(params.year));
  }

  if (params?.month) {
    searchParams.set('month', String(params.month));
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `/api/sustainability/environment?${queryString}`
    : '/api/sustainability/environment';

  return fetchJson<SustainabilityEnvironmentRow[]>(url);
}