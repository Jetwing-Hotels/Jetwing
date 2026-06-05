import { requireRevenueManager } from '@/lib/api/auth';
import { route, ok } from '@/lib/api/http';

const TIERS = ['Platinum', 'Gold', 'Silver', 'Standard'] as const;

/**
 * GET /api/v1/customers/scores/distribution
 * Count of customers per score tier (latest score). Revenue Manager (or Admin).
 */
export const GET = route(async () => {
  const { supabase } = await requireRevenueManager();

  const counts = await Promise.all(
    TIERS.map(async (tier) => {
      const { count, error } = await supabase
        .from('latest_customer_scores')
        .select('customer_id', { count: 'exact', head: true })
        .eq('score_tier', tier);
      if (error) throw new Error(error.message);
      return [tier, count ?? 0] as const;
    }),
  );

  const byTier = Object.fromEntries(counts) as Record<(typeof TIERS)[number], number>;
  const total = Object.values(byTier).reduce((a, b) => a + b, 0);

  return ok({ data: { total, by_tier: byTier } });
});
