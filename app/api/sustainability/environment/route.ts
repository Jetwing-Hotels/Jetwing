// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();
    const { searchParams } = new URL(request.url);

    const propertyId = searchParams.get('propertyId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    let query = supabaseAdmin
      .from('sustainability_environment_dashboard_monthly')
      .select('*')
      .order('report_year', { ascending: true })
      .order('report_month', { ascending: true })
      .order('property_name', { ascending: true });

    if (propertyId && propertyId !== 'all') {
      query = query.eq('property_id', propertyId);
    }

    if (year) {
      const parsedYear = Number(year);
      if (!Number.isNaN(parsedYear)) {
        query = query.eq('report_year', parsedYear);
      }
    }

    if (month) {
      const parsedMonth = Number(month);
      if (!Number.isNaN(parsedMonth)) {
        query = query.eq('report_month', parsedMonth);
      }
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}