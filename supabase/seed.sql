-- ==============================================================================
-- SEED DATA — Jetwing Symphony PLC
--   • 7 properties (Appendix: Property Reference)
--   • 12 months of Sri Lanka seasonal context
-- Idempotent: safe to run repeatedly (ON CONFLICT DO NOTHING).
-- ==============================================================================

-- ── properties ───────────────────────────────────────────────────────────────
insert into public.properties
  (property_code, property_name, brand_tier, location_city, location_region, room_count, property_type, sustainability_tier, latitude, longitude)
values
  ('JWYL', 'Jetwing Yala',          'Premium_Hotel',  'Yala',      'Southern',      80, 'Wildlife_Safari', 'Green',    6.372000, 81.521000),
  ('JWJL', 'Jetwing Jungle Lodge',  'Luxury_Reserve', 'Yala',      'Southern',      10, 'Jungle_Lodge',    'Green',    6.301000, 81.470000),
  ('JWSS', 'Jetwing Surf & Safari', 'Luxury_Reserve', 'Pottuvil',  'Eastern',       26, 'Surf_Beach',      'Green',    6.840000, 81.830000),
  ('JWKG', 'Jetwing Kandy Gallery', 'Luxury_Reserve', 'Kandy',     'Central',       18, 'Cultural',        'Standard', 7.293000, 80.641000),
  ('JWLK', 'Jetwing Lake',          'Premium_Hotel',  'Dambulla',  'North Central', 94, 'Cultural',        'Green',    7.860000, 80.651000),
  ('JWKD', 'Jetwing Kaduruketha',   'Premium_Hotel',  'Wellawaya', 'Uva',           25, 'Agro_Eco',        'Platinum', 6.742000, 81.102000),
  ('JWCS', 'Jetwing Colombo Seven', 'Premium_Hotel',  'Colombo',   'Western',       56, 'Urban_Boutique',  'Standard', 6.910000, 79.861000)
on conflict (property_code) do nothing;

-- ── seasonal_context (12 months) ─────────────────────────────────────────────
insert into public.seasonal_context
  (month, season_label, applicable_regions, monsoon_active, monsoon_type, national_holidays, major_festivals, wildlife_events, surfing_conditions, school_holiday_lk, eu_uk_peak_outbound, notes)
values
  (1,  'Peak Season',  '["Southern","Central","Western","North Central"]'::jsonb, true,  'Northeast',
       '["Thai Pongal","Duruthu Full Moon Poya"]'::jsonb, '["Duruthu Perahera"]'::jsonb,
       '["Yala leopard sightings strong","Whale watching Mirissa peak"]'::jsonb, 'Fair', false, false,
       'High international arrivals; dry sunny weather across the south and cultural triangle.'),
  (2,  'Peak Season',  '["Southern","Central","Western","North Central"]'::jsonb, false, null,
       '["Independence Day","Navam Full Moon Poya"]'::jsonb, '["Navam Perahera"]'::jsonb,
       '["Yala leopard peak begins","Whale watching Mirissa peak"]'::jsonb, 'Fair', false, false,
       'Best wildlife visibility at Yala; strong demand from European winter-escape travellers.'),
  (3,  'Peak Season',  '["Southern","Central","Uva","Western"]'::jsonb, false, null,
       '["Maha Sivarathri","Madin Full Moon Poya"]'::jsonb, '[]'::jsonb,
       '["Yala leopard peak","Kaduruketha harvest season begins"]'::jsonb, 'Fair', false, false,
       'Kaduruketha paddy harvest — agro-eco wellness retreat opportunity.'),
  (4,  'Shoulder',     '["Southern","Central","Western"]'::jsonb, false, null,
       '["Sinhala & Tamil New Year","Bak Full Moon Poya"]'::jsonb, '["Avurudu / Sinhala-Tamil New Year"]'::jsonb,
       '["Whale watching Mirissa final weeks","East coast surf season opening"]'::jsonb, 'Good', true, false,
       'Avurudu drives strong domestic leisure demand; family travel surges.'),
  (5,  'Off-Peak',     '["Southern","Western"]'::jsonb, true,  'Southwest',
       '["Vesak Full Moon Poya","May Day"]'::jsonb, '["Vesak"]'::jsonb,
       '["East coast surf season strong (Arugam Bay)"]'::jsonb, 'Good', false, false,
       'Southwest monsoon onset on the south/west coast; east coast (Surf & Safari) comes alive.'),
  (6,  'Off-Peak',     '["Southern","Western"]'::jsonb, true,  'Southwest',
       '["Poson Full Moon Poya"]'::jsonb, '["Poson"]'::jsonb,
       '["Arugam Bay surf peak"]'::jsonb, 'Good', false, false,
       'Value season for the south; east coast surf at its best.'),
  (7,  'Shoulder',     '["Central","Eastern"]'::jsonb, true,  'Southwest',
       '["Esala Full Moon Poya"]'::jsonb, '["Kandy Esala Perahera"]'::jsonb,
       '["Arugam Bay surf peak"]'::jsonb, 'Good', true, true,
       'Kandy Esala Perahera — cultural peak for Kandy Gallery; EU/UK summer outbound begins.'),
  (8,  'Shoulder',     '["Central","Eastern"]'::jsonb, true,  'Southwest',
       '["Nikini Full Moon Poya"]'::jsonb, '["Kandy Esala Perahera (early Aug)"]'::jsonb,
       '["Arugam Bay surf strong"]'::jsonb, 'Good', true, true,
       'Peak EU/UK summer holidays; strong Kandy and east-coast demand.'),
  (9,  'Off-Peak',     '["Southern","Eastern"]'::jsonb, false, null,
       '["Binara Full Moon Poya"]'::jsonb, '[]'::jsonb,
       '["Kaduruketha second harvest","Yala block rotation (partial closure)"]'::jsonb, 'Fair', false, false,
       'Lowest-demand month overall; ideal for agro-eco and value packages.'),
  (10, 'Off-Peak',     '["Southern","Western","North Central"]'::jsonb, true, 'Northeast',
       '["Vap Full Moon Poya","Deepavali"]'::jsonb, '["Deepavali"]'::jsonb,
       '["Whale watching Mirissa season reopening"]'::jsonb, 'Poor', false, false,
       'Inter-monsoon rains; Deepavali drives Indian-market demand.'),
  (11, 'Off-Peak',     '["North Central","Eastern","Western"]'::jsonb, true, 'Northeast',
       '["Ill Full Moon Poya"]'::jsonb, '[]'::jsonb,
       '["Whale watching Mirissa resuming","Yala fully reopened"]'::jsonb, 'Poor', false, false,
       'Shoulder build-up toward the December peak; early-bird festive booking window.'),
  (12, 'Peak Season',  '["Southern","Central","Western","North Central"]'::jsonb, true, 'Northeast',
       '["Unduvap Full Moon Poya","Christmas Day"]'::jsonb, '["Christmas","New Year''s Eve"]'::jsonb,
       '["Yala leopard sightings strong","Whale watching Mirissa peak"]'::jsonb, 'Fair', true, true,
       'Festive peak — highest ADR of the year; Christmas/New Year international and domestic demand.')
on conflict (month) do nothing;
