import { getNicheConfig } from "@/config";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function ThankYouPage() {
  const config = getNicheConfig();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Success icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-200">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
          {config.thankYouHeadline}
        </h1>
        <p className="text-slate-600 text-lg mb-8">
          {config.thankYouSubheadline}
        </p>

        {/* What happens next */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 mb-8 text-left">
          <h2 className="font-bold text-slate-800 mb-4">What happens next:</h2>
          <div className="space-y-4">
            {[
              { step: "1", title: "Application Review (Today)", desc: "Our team reviews your application and scores your contract eligibility." },
              { step: "2", title: "Specialist Call (Within 24hrs)", desc: "A contract specialist calls you to discuss your matches and territory availability." },
              { step: "3", title: "Contract Matching (48–72hrs)", desc: "We match you with verified contract opportunities in your service area." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{title}</p>
                  <p className="text-slate-500 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar CTA */}
        {config.calendarUrl && (
          <div className="mb-6">
            <p className="text-slate-500 text-sm mb-3">
              Want to skip the wait? Book your specialist call now:
            </p>
            <a
              href={config.calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-brand-700 transition shadow-lg hover:shadow-xl"
            >
              📅 Schedule My Call Now
            </a>
          </div>
        )}

        <Link href="/apply">
          <Button variant="ghost" size="sm">← Back to Application</Button>
        </Link>
      </div>
    </main>
  );
}
