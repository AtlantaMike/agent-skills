"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getNicheConfig } from "@/config";

function CheckoutInner() {
  const params = useSearchParams();
  const leadId = params.get("leadId");
  const email = params.get("email") ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
            You Qualified! 🎉
          </h1>
          <p className="text-slate-600 mb-6">
            Your application scored in the <strong>top tier</strong>. Complete your one-time setup fee to unlock your exclusive contract matches.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-2">
            {[
              "Access to verified contract opportunities in your area",
              "Dedicated account manager for 30 days",
              "Guaranteed minimum of 3 contract introductions",
              "Done-for-you proposal templates",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {item}
              </div>
            ))}
          </div>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-brand-600 text-white font-bold py-4 px-8 rounded-xl text-lg hover:bg-brand-700 transition shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting to Stripe…
              </span>
            ) : (
              "Secure Checkout →"
            )}
          </button>

          <p className="mt-4 text-xs text-slate-400">
            🔒 Powered by Stripe. 256-bit SSL encryption. No subscription — one-time fee.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}
