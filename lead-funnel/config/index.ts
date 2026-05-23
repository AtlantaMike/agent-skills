import { commercialCleaning } from "./niches/commercial-cleaning";
import { hvac } from "./niches/hvac";
import { landscaping } from "./niches/landscaping";
import type { NicheConfig } from "@/types";

const configs: Record<string, NicheConfig> = {
  "commercial-cleaning": commercialCleaning,
  "hvac": hvac,
  "landscaping": landscaping,
};

export function getNicheConfig(): NicheConfig {
  const slug = process.env.NEXT_PUBLIC_NICHE ?? "commercial-cleaning";
  return configs[slug] ?? commercialCleaning;
}

export { commercialCleaning, hvac, landscaping };
