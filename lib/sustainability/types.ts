export type PropertyOption = {
  property_id: string;
  property_code: string | null;
  property_name: string;
  location_city: string | null;
  location_region: string | null;
  room_count: number | null;
};

export type SustainabilityEnvironmentRow = {
  property_id: string;
  property_code: string | null;
  property_name: string;
  brand_tier: string | null;
  location_city: string | null;
  location_region: string | null;
  room_count: number | null;

  report_year: number;
  report_month: number;

  total_energy_kwh: number | null;
  renewable_energy_kwh: number | null;
  grid_electricity_kwh: number | null;
  solar_pv_kwh: number | null;
  solar_thermal_kwh: number | null;
  biomass_kwh: number | null;
  biogas_kwh: number | null;
  diesel_kwh: number | null;
  lpg_kwh: number | null;
  renewable_share_pct: number | null;

  scope1_tco2e: number | null;
  scope2_tco2e: number | null;
  total_scope1_2_tco2e: number | null;
  emissions_complete: boolean | null;
  missing_emission_factor_count: number | null;
  kgco2e_per_occupied_room: number | null;

  total_water_l: number | null;
  water_recycling_rate_pct: number | null;
  municipal_share_pct: number | null;
  groundwater_share_pct: number | null;
  rainwater_share_pct: number | null;
  water_l_per_occupied_room: number | null;

  total_waste_kg: number | null;
  diverted_kg: number | null;
  diversion_rate_pct: number | null;
  recycling_rate_pct: number | null;
  landfill_rate_pct: number | null;
  waste_kg_per_occupied_room: number | null;

  occupied_room_nights: number | null;
  occupancy_pct: number | null;
};