import { NicheConfig } from "@/types";

export function TrustBar({ badges }: { badges: NicheConfig["trustBadges"] }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {badges.map((badge) => (
        <div key={badge} className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
          <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {badge}
        </div>
      ))}
    </div>
  );
}
