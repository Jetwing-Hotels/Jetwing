// ============================================================================
// Database types — mirrors supabase/migrations/*.sql
// You can regenerate this from the live schema with:
//   npx supabase login
//   npx supabase gen types typescript --project-id <ref> --schema public > lib/supabase/types.ts
// Until then, this hand-maintained version keeps the client fully typed.
// ============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamp = string; // ISO timestamptz
type DateStr = string;   // ISO date

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          property_id: string;
          property_code: string;
          property_name: string;
          brand_tier: 'Luxury_Reserve' | 'Premium_Hotel';
          location_city: string;
          location_region: string;
          room_count: number;
          property_type: string;
          sustainability_tier: 'Standard' | 'Green' | 'Platinum';
          latitude: number;
          longitude: number;
          active: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          property_id?: string;
          property_code: string;
          property_name: string;
          brand_tier: 'Luxury_Reserve' | 'Premium_Hotel';
          location_city: string;
          location_region: string;
          room_count: number;
          property_type: string;
          sustainability_tier?: 'Standard' | 'Green' | 'Platinum';
          latitude: number;
          longitude: number;
          active?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['properties']['Insert']>;
        Relationships: [];
      };
      seasonal_context: {
        Row: {
          context_id: string;
          month: number;
          season_label: string;
          applicable_regions: Json;
          monsoon_active: boolean;
          monsoon_type: 'Southwest' | 'Northeast' | null;
          national_holidays: Json;
          major_festivals: Json;
          wildlife_events: Json;
          surfing_conditions: string | null;
          school_holiday_lk: boolean;
          eu_uk_peak_outbound: boolean;
          notes: string | null;
        };
        Insert: {
          context_id?: string;
          month: number;
          season_label: string;
          applicable_regions?: Json;
          monsoon_active?: boolean;
          monsoon_type?: 'Southwest' | 'Northeast' | null;
          national_holidays?: Json;
          major_festivals?: Json;
          wildlife_events?: Json;
          surfing_conditions?: string | null;
          school_holiday_lk?: boolean;
          eu_uk_peak_outbound?: boolean;
          notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['seasonal_context']['Insert']>;
        Relationships: [];
      };
      prompt_registry: {
        Row: {
          prompt_id: string;
          property_id: string | null;
          module: 'offer_generation' | 'email_personalisation';
          version: number;
          is_active: boolean;
          prompt_template: string;
          system_context: string;
          sri_lanka_context: Json;
          property_profile: Json;
          max_tokens: number;
          temperature: number;
          created_by: string;
          created_at: Timestamp;
          notes: string | null;
        };
        Insert: {
          prompt_id?: string;
          property_id?: string | null;
          module: 'offer_generation' | 'email_personalisation';
          version: number;
          is_active?: boolean;
          prompt_template: string;
          system_context: string;
          sri_lanka_context?: Json;
          property_profile: Json;
          max_tokens?: number;
          temperature?: number;
          created_by: string;
          created_at?: Timestamp;
          notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['prompt_registry']['Insert']>;
        Relationships: [];
      };
      historical_revenue: {
        Row: {
          record_id: string;
          property_id: string;
          year: number;
          month: number;
          total_revenue_lkr: number;
          room_revenue_lkr: number;
          fb_revenue_lkr: number;
          ancillary_revenue_lkr: number;
          total_room_nights_sold: number;
          occupancy_pct: number;
          adr_lkr: number;
          revpar_lkr: number;
          domestic_guest_pct: number;
          international_guest_pct: number;
          top_source_markets: Json;
          avg_length_of_stay: number;
          repeat_guest_pct: number;
          cancellation_rate_pct: number;
          created_at: Timestamp;
        };
        Insert: Omit<Database['public']['Tables']['historical_revenue']['Row'], 'record_id' | 'created_at'> & {
          record_id?: string;
          created_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['historical_revenue']['Insert']>;
        Relationships: [];
      };
      offer_generation_runs: {
        Row: {
          run_id: string;
          target_month: number;
          target_year: number;
          triggered_by: 'SCHEDULER' | 'MANUAL' | 'API';
          triggered_by_user: string | null;
          status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
          properties_processed: Json;
          properties_failed: Json;
          total_offers_generated: number;
          total_tokens_used: number;
          estimated_api_cost_usd: number;
          started_at: Timestamp;
          completed_at: Timestamp | null;
          error_log: string | null;
        };
        Insert: {
          run_id?: string;
          target_month: number;
          target_year: number;
          triggered_by: 'SCHEDULER' | 'MANUAL' | 'API';
          triggered_by_user?: string | null;
          status?: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
          properties_processed?: Json;
          properties_failed?: Json;
          total_offers_generated?: number;
          total_tokens_used?: number;
          estimated_api_cost_usd?: number;
          started_at?: Timestamp;
          completed_at?: Timestamp | null;
          error_log?: string | null;
        };
        Update: Partial<Database['public']['Tables']['offer_generation_runs']['Insert']>;
        Relationships: [];
      };
      seasonal_offers: {
        Row: {
          offer_id: string;
          generation_run_id: string;
          property_id: string;
          offer_title: string;
          offer_description: string;
          offer_type: 'Accommodation' | 'Package' | 'Experience' | 'F&B' | 'Wellness';
          target_month: number;
          target_year: number;
          discount_type: 'Percentage' | 'Complimentary' | 'Value_Add' | 'Rate_Plan' | null;
          discount_value: number | null;
          predicted_occupancy_uplift_pct: number | null;
          predicted_revenue_uplift_pct: number | null;
          predicted_incremental_lkr: number | null;
          llm_rationale: string | null;
          target_guest_segment: string | null;
          sustainability_angle: string | null;
          status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'EXPIRED';
          rejection_reason: string | null;
          approved_by: string | null;
          approved_at: Timestamp | null;
          valid_from: DateStr | null;
          valid_to: DateStr | null;
          created_at: Timestamp;
        };
        Insert: Omit<Database['public']['Tables']['seasonal_offers']['Row'],
          'offer_id' | 'status' | 'created_at' | 'discount_type' | 'discount_value' |
          'predicted_occupancy_uplift_pct' | 'predicted_revenue_uplift_pct' | 'predicted_incremental_lkr' |
          'llm_rationale' | 'target_guest_segment' | 'sustainability_angle' | 'rejection_reason' |
          'approved_by' | 'approved_at' | 'valid_from' | 'valid_to'> & {
          offer_id?: string;
          status?: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'EXPIRED';
          created_at?: Timestamp;
          discount_type?: 'Percentage' | 'Complimentary' | 'Value_Add' | 'Rate_Plan' | null;
          discount_value?: number | null;
          predicted_occupancy_uplift_pct?: number | null;
          predicted_revenue_uplift_pct?: number | null;
          predicted_incremental_lkr?: number | null;
          llm_rationale?: string | null;
          target_guest_segment?: string | null;
          sustainability_angle?: string | null;
          rejection_reason?: string | null;
          approved_by?: string | null;
          approved_at?: Timestamp | null;
          valid_from?: DateStr | null;
          valid_to?: DateStr | null;
        };
        Update: Partial<Database['public']['Tables']['seasonal_offers']['Insert']>;
        Relationships: [];
      };
      customers: {
        Row: {
          customer_id: string;
          pms_guest_id: string | null;
          email: string;
          first_name: string;
          last_name: string;
          nationality: string | null;
          country_of_residence: string | null;
          phone: string | null;
          date_of_birth: DateStr | null;
          gender: string | null;
          preferred_language: string;
          tier_label: 'Standard' | 'Silver' | 'Gold' | 'Platinum';
          acquisition_channel: 'Direct' | 'OTA' | 'Travel_Agent' | 'Corporate' | 'Jetwing_Travels' | null;
          marketing_opt_in: boolean;
          consent_date: Timestamp | null;
          eco_interest_flag: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
          deleted_at: Timestamp | null;
        };
        Insert: {
          customer_id?: string;
          pms_guest_id?: string | null;
          email: string;
          first_name: string;
          last_name: string;
          nationality?: string | null;
          country_of_residence?: string | null;
          phone?: string | null;
          date_of_birth?: DateStr | null;
          gender?: string | null;
          preferred_language?: string;
          tier_label?: 'Standard' | 'Silver' | 'Gold' | 'Platinum';
          acquisition_channel?: 'Direct' | 'OTA' | 'Travel_Agent' | 'Corporate' | 'Jetwing_Travels' | null;
          marketing_opt_in?: boolean;
          consent_date?: Timestamp | null;
          eco_interest_flag?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
          deleted_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
        Relationships: [];
      };
      bookings: {
        Row: {
          booking_id: string;
          customer_id: string;
          property_id: string;
          pms_reservation_id: string | null;
          booking_channel: 'Direct_Web' | 'Direct_Phone' | 'OTA' | 'Travel_Agent' | 'Corporate' | 'Walk_In';
          booking_date: DateStr;
          check_in_date: DateStr;
          check_out_date: DateStr;
          length_of_stay: number;
          room_type: string;
          adults: number;
          children: number;
          rate_plan: string | null;
          total_room_revenue_lkr: number;
          total_fb_spend_lkr: number;
          total_ancillary_spend_lkr: number;
          total_revenue_lkr: number;
          is_cancelled: boolean;
          cancellation_date: DateStr | null;
          cancellation_reason: string | null;
          is_repeat_visit: boolean;
          satisfaction_score: number | null;
          nps_score: number | null;
          special_requests: string | null;
          created_at: Timestamp;
        };
        Insert: Omit<Database['public']['Tables']['bookings']['Row'],
          'booking_id' | 'created_at' | 'children' | 'total_fb_spend_lkr' | 'total_ancillary_spend_lkr' |
          'is_cancelled' | 'is_repeat_visit'> & {
          booking_id?: string;
          created_at?: Timestamp;
          children?: number;
          total_fb_spend_lkr?: number;
          total_ancillary_spend_lkr?: number;
          is_cancelled?: boolean;
          is_repeat_visit?: boolean;
        };
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
        Relationships: [];
      };
      customer_features: {
        Row: {
          feature_id: string;
          customer_id: string;
          recency_days: number;
          frequency_total: number;
          frequency_12m: number;
          monetary_total_lkr: number;
          monetary_avg_per_stay_lkr: number;
          monetary_12m_lkr: number;
          preferred_property_id: string | null;
          property_diversity_score: number;
          avg_lead_time_days: number;
          avg_length_of_stay: number;
          direct_booking_ratio: number;
          cancellation_ratio: number;
          avg_satisfaction_score: number | null;
          eco_engagement_flag: boolean;
          luxury_reserve_visits: number;
          premium_hotel_visits: number;
          domestic_guest: boolean;
          high_season_preference: boolean;
          feature_computed_at: Timestamp;
        };
        Insert: Omit<Database['public']['Tables']['customer_features']['Row'], 'feature_id' | 'feature_computed_at'> & {
          feature_id?: string;
          feature_computed_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['customer_features']['Insert']>;
        Relationships: [];
      };
      scoring_runs: {
        Row: {
          scoring_run_id: string;
          triggered_by: 'SCHEDULER' | 'CAMPAIGN' | 'MANUAL';
          campaign_id: string | null;
          model_version: string;
          customers_scored: number;
          status: 'RUNNING' | 'COMPLETED' | 'FAILED';
          started_at: Timestamp;
          completed_at: Timestamp | null;
          error_log: string | null;
        };
        Insert: {
          scoring_run_id?: string;
          triggered_by: 'SCHEDULER' | 'CAMPAIGN' | 'MANUAL';
          campaign_id?: string | null;
          model_version: string;
          customers_scored?: number;
          status: 'RUNNING' | 'COMPLETED' | 'FAILED';
          started_at?: Timestamp;
          completed_at?: Timestamp | null;
          error_log?: string | null;
        };
        Update: Partial<Database['public']['Tables']['scoring_runs']['Insert']>;
        Relationships: [];
      };
      customer_scores: {
        Row: {
          score_id: string;
          customer_id: string;
          scoring_run_id: string;
          composite_score: number;
          recency_score: number | null;
          frequency_score: number | null;
          monetary_score: number | null;
          loyalty_score: number | null;
          engagement_score: number | null;
          score_tier: 'Platinum' | 'Gold' | 'Silver' | 'Standard';
          model_version: string;
          scored_at: Timestamp;
        };
        Insert: Omit<Database['public']['Tables']['customer_scores']['Row'], 'score_id' | 'scored_at'> & {
          score_id?: string;
          scored_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['customer_scores']['Insert']>;
        Relationships: [];
      };
      campaigns: {
        Row: {
          campaign_id: string;
          campaign_name: string;
          offer_ids: Json;
          target_month: number;
          target_year: number;
          min_score_threshold: number;
          target_tiers: Json;
          target_property_ids: Json;
          target_nationalities: Json;
          scheduled_send_date: Timestamp | null;
          status: 'DRAFT' | 'AUDIENCE_READY' | 'SENDING' | 'SENT' | 'PAUSED' | 'CANCELLED';
          total_audience_size: number;
          emails_sent: number;
          emails_delivered: number;
          emails_opened: number;
          emails_clicked: number;
          emails_bounced: number;
          emails_unsubscribed: number;
          created_by: string;
          created_at: Timestamp;
          sent_at: Timestamp | null;
        };
        Insert: {
          campaign_id?: string;
          campaign_name: string;
          offer_ids: Json;
          target_month: number;
          target_year: number;
          min_score_threshold?: number;
          target_tiers?: Json;
          target_property_ids?: Json;
          target_nationalities?: Json;
          scheduled_send_date?: Timestamp | null;
          status?: 'DRAFT' | 'AUDIENCE_READY' | 'SENDING' | 'SENT' | 'PAUSED' | 'CANCELLED';
          total_audience_size?: number;
          emails_sent?: number;
          emails_delivered?: number;
          emails_opened?: number;
          emails_clicked?: number;
          emails_bounced?: number;
          emails_unsubscribed?: number;
          created_by: string;
          created_at?: Timestamp;
          sent_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>;
        Relationships: [];
      };
      campaign_audience: {
        Row: {
          audience_id: string;
          campaign_id: string;
          customer_id: string;
          composite_score_snapshot: number;
          score_tier_snapshot: string;
          email_subject: string | null;
          email_html_body: string | null;
          email_plain_body: string | null;
          sendgrid_message_id: string | null;
          send_status: 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'UNSUBSCRIBED';
          sent_at: Timestamp | null;
          opened_at: Timestamp | null;
          clicked_at: Timestamp | null;
          bounced_at: Timestamp | null;
          unsubscribed_at: Timestamp | null;
          generation_tokens_used: number;
          created_at: Timestamp;
        };
        Insert: Omit<Database['public']['Tables']['campaign_audience']['Row'],
          'audience_id' | 'created_at' | 'send_status' | 'generation_tokens_used' | 'email_subject' |
          'email_html_body' | 'email_plain_body' | 'sendgrid_message_id' | 'sent_at' | 'opened_at' |
          'clicked_at' | 'bounced_at' | 'unsubscribed_at'> & {
          audience_id?: string;
          created_at?: Timestamp;
          send_status?: 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'UNSUBSCRIBED';
          generation_tokens_used?: number;
          email_subject?: string | null;
          email_html_body?: string | null;
          email_plain_body?: string | null;
          sendgrid_message_id?: string | null;
          sent_at?: Timestamp | null;
          opened_at?: Timestamp | null;
          clicked_at?: Timestamp | null;
          bounced_at?: Timestamp | null;
          unsubscribed_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['campaign_audience']['Insert']>;
        Relationships: [];
      };
      email_events: {
        Row: {
          event_id: string;
          audience_id: string;
          sendgrid_message_id: string;
          event_type: 'delivered' | 'open' | 'click' | 'bounce' | 'spam_report' | 'unsubscribe';
          event_timestamp: Timestamp;
          url_clicked: string | null;
          user_agent: string | null;
          ip_address: string | null;
          raw_payload: Json | null;
          received_at: Timestamp;
        };
        Insert: Omit<Database['public']['Tables']['email_events']['Row'], 'event_id' | 'received_at'> & {
          event_id?: string;
          received_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['email_events']['Insert']>;
        Relationships: [];
      };
      user_roles: {
        Row: { user_id: string; role: 'ADMIN' | 'REVENUE_MANAGER'; created_at: Timestamp };
        Insert: { user_id: string; role: 'ADMIN' | 'REVENUE_MANAGER'; created_at?: Timestamp };
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>;
        Relationships: [];
      };
    };
    Views: {
      latest_customer_scores: {
        Row: {
          customer_id: string | null;
          score_id: string | null;
          composite_score: number | null;
          score_tier: string | null;
          model_version: string | null;
          scored_at: Timestamp | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      has_role: { Args: { _role: string }; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      activate_prompt: { Args: { _prompt_id: string }; Returns: undefined };
      expire_stale_offers: { Args: Record<string, never>; Returns: number };
      build_campaign_audience: { Args: { _campaign_id: string }; Returns: number };
      refresh_customer_features: { Args: Record<string, never>; Returns: number };
      reconcile_campaign_metrics: { Args: Record<string, never>; Returns: number };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row-type aliases
export type Property = Database['public']['Tables']['properties']['Row'];
export type SeasonalContext = Database['public']['Tables']['seasonal_context']['Row'];
export type PromptRegistry = Database['public']['Tables']['prompt_registry']['Row'];
export type HistoricalRevenue = Database['public']['Tables']['historical_revenue']['Row'];
export type OfferGenerationRun = Database['public']['Tables']['offer_generation_runs']['Row'];
export type SeasonalOffer = Database['public']['Tables']['seasonal_offers']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type CustomerFeatures = Database['public']['Tables']['customer_features']['Row'];
export type ScoringRun = Database['public']['Tables']['scoring_runs']['Row'];
export type CustomerScore = Database['public']['Tables']['customer_scores']['Row'];
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type CampaignAudience = Database['public']['Tables']['campaign_audience']['Row'];
export type EmailEvent = Database['public']['Tables']['email_events']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
