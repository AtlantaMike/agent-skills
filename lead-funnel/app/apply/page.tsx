import { Suspense } from "react";
import { getNicheConfig } from "@/config";
import { FunnelWrapper } from "@/components/funnel/FunnelWrapper";
import { SocialProof } from "@/components/funnel/SocialProof";
import { TrustBar } from "@/components/funnel/TrustBar";

export default function ApplyPage() {
  const config = getNicheConfig();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50">
      {/* Top bar */}
      <div className="bg-brand-700 text-white text-center text-xs py-2 px-4 font-medium">
        ⚡ Limited spots available this month — {config.spotsPerMonth} remaining
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-brand-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600" />
            </span>
            Accepting Applications Now
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
            {config.heroHeadline}
          </h1>
          <p className="text-slate-600 text-base md:text-lg max-w-xl mx-auto">
            {config.heroSubheadline}
          </p>
        </div>

        {/* Social proof */}
        <div className="mb-6">
          <Suspense>
            <SocialProof
              baseCount={config.socialProofCount}
              label={config.socialProofLabel}
              spotsLeft={config.spotsPerMonth}
            />
          </Suspense>
        </div>

        {/* Trust badges */}
        <div className="mb-8">
          <TrustBar badges={config.trustBadges} />
        </div>

        {/* Funnel card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8">
          <Suspense>
            <FunnelWrapper config={config} />
          </Suspense>
        </div>

        {/* Bottom trust */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-4 flex-wrap">
          <span>🔒 256-bit SSL encrypted</span>
          <span>🚫 No spam, ever</span>
          <span>✅ No credit card required</span>
          <span>📞 Real humans review every application</span>
        </div>
      </div>
    </main>
  );
}
