import { getNicheConfig } from "@/config";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const config = getNicheConfig();
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-200">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Payment Confirmed!</h1>
        <p className="text-slate-600 text-lg mb-8">
          Welcome to the program. Your account manager will contact you within 2 business hours to start your contract matching process.
        </p>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 mb-8 text-left">
          <h2 className="font-bold text-slate-800 mb-4">Your next steps:</h2>
          <div className="space-y-4">
            {[
              { step: "1", title: "Check your email", desc: "Your welcome email with login credentials and onboarding guide is on its way." },
              { step: "2", title: "Account manager call", desc: "We'll call you within 2 business hours to kick off your contract matching." },
              { step: "3", title: "First matches delivered", desc: "Expect your first verified contract opportunities within 48–72 hours." },
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

        {config.calendarUrl && (
          <a
            href={config.calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-brand-700 transition shadow-lg"
          >
            📅 Schedule Your Kickoff Call
          </a>
        )}
      </div>
    </main>
  );
}
