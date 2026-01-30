export const VEHICLE_OPTIONS = [
  "car",
  "suv",
  "utv",
  "truck",
  "bus",
  "atv",
  "motorcycle",
  "van",
  "other",
] as const;

export const DRIVETRAIN_OPTIONS = ["two_wd", "four_wd", "awd"] as const;

export const TERRAIN_OPTIONS = [
  "asphalt",
  "sand",
  "mud",
  "rock",
  "snow",
  "water",
  "gravel",
  "other",
] as const;

export const PROBLEM_OPTIONS = [
  "stuck",
  "mechanical",
  "flat_tire",
  "battery",
  "fuel",
  "accident",
  "other",
] as const;

export const ASSISTANCE_STATUS_OPTIONS = [
  "none",
  "en_route",
  "on_site",
  "needs_more_help",
  "resolved",
] as const;

export const ASSISTANCE_CHANNEL_OPTIONS = [
  "none",
  "community",
  "official",
  "commercial",
  "private",
] as const;
