import type { Lead, LeadTier, NicheConfig, Step } from "@/types";

export function scoreLead(
  answers: Record<string, string | string[]>,
  steps: Step[]
): { score: number; tier: LeadTier; maxScore: number } {
  let score = 0;
  let maxScore = 0;

  for (const step of steps) {
    if (step.type === "contact" || !step.options) continue;

    const answer = answers[step.id];
    if (!answer) continue;

    if (step.type === "multiselect" && Array.isArray(answer)) {
      const stepMax = step.options.reduce((a, o) => a + o.score, 0);
      maxScore += stepMax;
      for (const val of answer) {
        const opt = step.options.find((o) => o.value === val);
        if (opt) score += opt.score;
      }
    } else {
      const stepMax = Math.max(...step.options.map((o) => o.score));
      maxScore += stepMax;
      const opt = step.options.find((o) => o.value === answer);
      if (opt) score += opt.score;
    }
  }

  const pct = maxScore > 0 ? score / maxScore : 0;
  const tier: LeadTier =
    pct >= 0.8 ? "hot" :
    pct >= 0.6 ? "warm" :
    pct >= 0.4 ? "cool" : "cold";

  return { score, tier, maxScore };
}

export function isDisqualified(
  answers: Record<string, string | string[]>,
  steps: Step[]
): boolean {
  for (const step of steps) {
    if (!step.options) continue;
    const answer = answers[step.id];
    if (!answer || Array.isArray(answer)) continue;
    const opt = step.options.find((o) => o.value === answer);
    if (opt?.disqualify) return true;
  }
  return false;
}

export function tierLabel(tier: LeadTier) {
  return {
    hot:  { label: "Hot Lead 🔥",  color: "bg-red-100 text-red-700 border-red-200" },
    warm: { label: "Warm Lead ♨️", color: "bg-orange-100 text-orange-700 border-orange-200" },
    cool: { label: "Cool Lead 🌤️", color: "bg-blue-100 text-blue-700 border-blue-200" },
    cold: { label: "Cold Lead ❄️", color: "bg-slate-100 text-slate-600 border-slate-200" },
  }[tier];
}
