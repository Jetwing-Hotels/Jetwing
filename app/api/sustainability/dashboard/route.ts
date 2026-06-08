// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');

  const results: Record<string, unknown> = {};

  try {
    const environmentQuery = (await createAdminClient())
      .from('sustainability_environment_dashboard_monthly')
      .select('*')
      .order('report_year', { ascending: true })
      .order('report_month', { ascending: true });

    if (propertyId && propertyId !== 'all') {
      environmentQuery.eq('property_id', propertyId);
    }

    const { data: environment, error: environmentError } = await environmentQuery;
    if (environmentError) {
      return NextResponse.json({ error: environmentError.message }, { status: 500 });
    }

    results.environment = environment ?? [];

    // Disabled in emergency mode
    // const biodiversityQuery = (await createAdminClient())
    //     .from('sustainability_biodiversity_annual_summary')
    //     .select('*')
    //     .order('report_year', { ascending: true })
    //     .order('property_name', { ascending: true });
    //
    // if (propertyId && propertyId !== 'all') {
    //     biodiversityQuery.eq('property_id', propertyId);
    // }
    // const { data: biodiversity } = await biodiversityQuery;
    // results.biodiversity = biodiversity ?? [];


    const socialQuery = (await createAdminClient())
        .from('sustainability_social_monthly_summary')
        .select('*')
        .order('report_year', { ascending: true })
        .order('report_month', { ascending: true })
        .order('property_name', { ascending: true });

    if (propertyId && propertyId !== 'all') {
        socialQuery.eq('property_id', propertyId);
    }
    const { data: social } = await socialQuery;
    results.social = social ?? [];


    // Disabled in emergency mode
    // const riskQuery = (await createAdminClient())
    //     .from('sustainability_risk_register_view')
    //     .select('*')
    //     .order('report_year', { ascending: false })
    //     .order('risk_score', { ascending: false });
    //
    // if (propertyId && propertyId !== 'all') {
    //     riskQuery.eq('property_id', propertyId);
    // }
    // const { data: risks } = await riskQuery;
    // results.risks = risks ?? [];


    // Disabled in emergency mode
    // const goalsQuery = (await createAdminClient())
    //     .from('sustainability_goal_progress')
    //     .select('*')
    //     .order('due_date', { ascending: true });
    //
    // if (propertyId && propertyId !== 'all') {
    //     goalsQuery.eq('property_id', propertyId);
    // }
    // const { data: goals } = await goalsQuery;
    // results.goals = goals ?? [];


    const governanceQuery = (await createAdminClient())
        .from('sustainability_governance_annual_summary')
        .select('*')
        .order('report_year', { ascending: true })
        .order('property_name', { ascending: true });

    if (propertyId && propertyId !== 'all') {
        governanceQuery.eq('property_id', propertyId);
    }
    const { data: governance } = await governanceQuery;
    results.governance = governance ?? [];


    // Disabled in emergency mode
    // const esgQuery = (await createAdminClient())
    //     .from('sustainability_esg_score_snapshots')
    //     .select('*')
    //     .order('report_year', { ascending: true })
    //     .order('report_month', { ascending: true });
    //
    // if (propertyId && propertyId !== 'all') {
    //     esgQuery.eq('property_id', propertyId);
    // }
    // const { data: esg } = await esgQuery;
    // results.esg = esg ?? [];

    return NextResponse.json(results);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
