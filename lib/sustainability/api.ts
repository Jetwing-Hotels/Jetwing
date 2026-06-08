// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type {
  CommunityProgramRow,
  PropertyOption,
  SustainabilityEnvironmentRow,
  SustainabilityWasteMonthlySummaryRow,
} from './types';

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
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
  priorMonths?: number;
  year?: number;
  month?: number;
}): Promise<SustainabilityEnvironmentRow[]> {
  const searchParams = new URLSearchParams();

  if (params?.propertyId && params.propertyId !== 'all') {
    searchParams.set('propertyId', params.propertyId);
  }

  if (
    params?.startYear !== undefined &&
    params?.startMonth !== undefined &&
    params?.endYear !== undefined &&
    params?.endMonth !== undefined
  ) {
    searchParams.set('startYear', String(params.startYear));
    searchParams.set('startMonth', String(params.startMonth));
    searchParams.set('endYear', String(params.endYear));
    searchParams.set('endMonth', String(params.endMonth));
  } else if (params?.year !== undefined) {
    searchParams.set('year', String(params.year));
  }

  if (params?.month !== undefined) {
    searchParams.set('month', String(params.month));
  }

  if (params?.priorMonths !== undefined) {
    searchParams.set('priorMonths', String(params.priorMonths));
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `/api/sustainability/environment?${queryString}`
    : '/api/sustainability/environment';

  return fetchJson<SustainabilityEnvironmentRow[]>(url);
}

export async function getWasteMonthlySummaryRows(params?: {
  propertyId?: string;
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
}): Promise<SustainabilityWasteMonthlySummaryRow[]> {
  const searchParams = new URLSearchParams();

  if (params?.propertyId && params.propertyId !== 'all') {
    searchParams.set('propertyId', params.propertyId);
  }

  if (
    params?.startYear !== undefined &&
    params?.startMonth !== undefined &&
    params?.endYear !== undefined &&
    params?.endMonth !== undefined
  ) {
    searchParams.set('startYear', String(params.startYear));
    searchParams.set('startMonth', String(params.startMonth));
    searchParams.set('endYear', String(params.endYear));
    searchParams.set('endMonth', String(params.endMonth));
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `/api/sustainability/waste-summary?${queryString}`
    : '/api/sustainability/waste-summary';

  return fetchJson<SustainabilityWasteMonthlySummaryRow[]>(url);
}

export async function getCommunityPrograms(params?: {
  propertyId?: string;
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
}): Promise<CommunityProgramRow[]> {
  const searchParams = new URLSearchParams();

  if (params?.propertyId && params.propertyId !== 'all') {
    searchParams.set('propertyId', params.propertyId);
  }

  if (
    params?.startYear !== undefined &&
    params?.startMonth !== undefined &&
    params?.endYear !== undefined &&
    params?.endMonth !== undefined
  ) {
    searchParams.set('startYear', String(params.startYear));
    searchParams.set('startMonth', String(params.startMonth));
    searchParams.set('endYear', String(params.endYear));
    searchParams.set('endMonth', String(params.endMonth));
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `/api/sustainability/community-programs?${queryString}`
    : '/api/sustainability/community-programs';

  return fetchJson<CommunityProgramRow[]>(url);
}

export async function getSustainabilityDashboardData() {
  const response = await fetch('/api/sustainability/dashboard');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  const result = await response.json();
  return result;
}

export function toNumber(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString('en', { month: 'short' });
}

export function sumBy<T>(rows: T[], getter: (row: T) => unknown): number {
  return rows.reduce((total, row) => total + toNumber(getter(row)), 0);
}

export function latestByPeriod<T extends { report_year?: number; report_month?: number }>(rows: T[]): T | undefined {
  return [...rows].sort((a, b) => {
    const yearDiff = toNumber(b.report_year) - toNumber(a.report_year);
    if (yearDiff !== 0) return yearDiff;
    return toNumber(b.report_month) - toNumber(a.report_month);
  })[0];
}
