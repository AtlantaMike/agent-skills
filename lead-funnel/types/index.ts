export type StepType = "option" | "multiselect" | "contact";

export interface Option {
  label: string;
  value: string;
  score: number;
  disqualify?: boolean;
  icon?: string;
}

export interface Step {
  id: string;
  type: StepType;
  question: string;
  subtitle?: string;
  options?: Option[];
  field?: string;
}

export interface NicheConfig {
  slug: string;
  name: string;
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  ctaText: string;
  accentColor: string;
  steps: Step[];
  thankYouHeadline: string;
  thankYouSubheadline: string;
  calendarUrl?: string;
  spotsPerMonth: number;
  socialProofCount: number;
  socialProofLabel: string;
  trustBadges: string[];
}

export interface Lead {
  id: string;
  niche: string;
  createdAt: string;
  score: number;
  tier: "hot" | "warm" | "cool" | "cold";
  name: string;
  businessName: string;
  phone: string;
  email: string;
  city: string;
  answers: Record<string, string | string[]>;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export type LeadTier = Lead["tier"];
