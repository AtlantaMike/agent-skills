import { commercialCleaning } from "./niches/commercial-cleaning";
import { hvac } from "./niches/hvac";
import { landscaping } from "./niches/landscaping";
import { plumbing } from "./niches/plumbing";
import { pestControl } from "./niches/pest-control";
import type { NicheConfig } from "@/types";

const configs: Record<string, NicheConfig> = {
  "commercial-cleaning": commercialCleaning,
  "hvac": hvac,
  "landscaping": landscaping,
  "plumbing": plumbing,
  "pest-control": pestControl,
};

export function getNicheConfig(): NicheConfig {
  const slug = process.env.NEXT_PUBLIC_NICHE ?? "commercial-cleaning";
  return configs[slug] ?? commercialCleaning;
}

export { commercialCleaning, hvac, landscaping, plumbing, pestControl };
