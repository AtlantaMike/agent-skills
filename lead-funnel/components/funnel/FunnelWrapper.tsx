"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NicheConfig, Step } from "@/types";
import { ProgressBar } from "./ProgressBar";
import { OptionCard } from "./OptionCard";
import { DisqualifiedScreen } from "./DisqualifiedScreen";
import { Button } from "@/components/ui/Button";
import { isDisqualified } from "@/lib/lead-scoring";
import { clsx } from "clsx";

interface ContactData {
  name: string;
  businessName: string;
  phone: string;
  email: string;
  city: string;
}

interface Props {
  config: NicheConfig;
}

export function FunnelWrapper({ config }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const questionSteps = config.steps.filter((s) => s.type !== "contact");
  const contactStep = config.steps.find((s) => s.type === "contact")!;
  const allSteps = [...questionSteps, contactStep];
  const totalSteps = allSteps.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [contact, setContact] = useState<ContactData>({
    name: "", businessName: "", phone: "", email: "", city: "",
  });
  const [disqualified, setDisqualified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactData>>({});
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const currentStep = allSteps[currentIndex];
  const isContactStep = currentStep?.type === "contact";
  const currentAnswer = answers[currentStep?.id];

  const canProceed = isContactStep
    ? contact.name && contact.phone && contact.email
    : currentStep?.type === "multiselect"
    ? Array.isArray(currentAnswer) && (currentAnswer as string[]).length > 0
    : !!currentAnswer;

  const handleOptionClick = useCallback(
    (stepId: string, value: string, multi: boolean) => {
      if (multi) {
        setAnswers((prev) => {
          const existing = (prev[stepId] as string[] | undefined) ?? [];
          const next = existing.includes(value)
            ? existing.filter((v) => v !== value)
            : [...existing, value];
          return { ...prev, [stepId]: next };
        });
      } else {
        setAnswers((prev) => ({ ...prev, [stepId]: value }));
        // Auto-advance on single-select after short delay
        setTimeout(() => {
          advanceAfterSingleSelect(stepId, value);
        }, 280);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex]
  );

  const advanceAfterSingleSelect = (stepId: string, value: string) => {
    const updatedAnswers = { ...answers, [stepId]: value };
    if (isDisqualified(updatedAnswers, config.steps)) {
      setDisqualified(true);
      return;
    }
    setDirection("forward");
    setCurrentIndex((i) => Math.min(i + 1, totalSteps - 1));
  };

  const handleNext = () => {
    if (!canProceed) return;
    if (isContactStep) {
      handleSubmit();
      return;
    }
    if (isDisqualified(answers, config.steps)) {
      setDisqualified(true);
      return;
    }
    setDirection("forward");
    setCurrentIndex((i) => Math.min(i + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setDirection("back");
    setCurrentIndex((i) => Math.max(i - 1, 0));
  };

  const validateContact = (): boolean => {
    const errs: Partial<ContactData> = {};
    if (!contact.name.trim()) errs.name = "Full name is required";
    if (!contact.businessName.trim()) errs.businessName = "Business name is required";
    if (!contact.phone.trim() || contact.phone.replace(/\D/g, "").length < 10)
      errs.phone = "Valid phone number required";
    if (!contact.email.trim() || !contact.email.includes("@"))
      errs.email = "Valid email address required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateContact()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contact,
          answers,
          utmSource: searchParams.get("utm_source"),
          utmMedium: searchParams.get("utm_medium"),
          utmCampaign: searchParams.get("utm_campaign"),
        }),
      });
      const data = await res.json();
      // Route hot leads to payment gate if Stripe is configured
      const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";
      if (stripeEnabled && (data.tier === "hot" || data.tier === "warm")) {
        router.push(`/checkout?leadId=${data.leadId ?? ""}&email=${encodeURIComponent(contact.email)}`);
      } else {
        router.push("/apply/thank-you");
      }
    } catch {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setContact({ name: "", businessName: "", phone: "", email: "", city: "" });
    setDisqualified(false);
    setErrors({});
  };

  if (disqualified) {
    return <DisqualifiedScreen onRestart={handleRestart} />;
  }

  return (
    <div className="w-full animate-fade-in">
      <ProgressBar current={currentIndex + 1} total={totalSteps} />

      <div key={currentIndex} className="mt-8 animate-slide-up">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-snug">
            {currentStep.question}
          </h2>
          {currentStep.subtitle && (
            <p className="mt-1.5 text-sm text-slate-500">{currentStep.subtitle}</p>
          )}
        </div>

        {/* Option / Multiselect Step */}
        {!isContactStep && currentStep.options && (
          <div className="space-y-3">
            {currentStep.options.map((opt) => {
              const isMulti = currentStep.type === "multiselect";
              const selected = isMulti
                ? (Array.isArray(currentAnswer) ? currentAnswer : []).includes(opt.value)
                : currentAnswer === opt.value;

              return (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  icon={opt.icon}
                  selected={selected}
                  multi={isMulti}
                  onClick={() => handleOptionClick(currentStep.id, opt.value, isMulti)}
                />
              );
            })}

            {currentStep.type === "multiselect" && (
              <div className="pt-2">
                <Button
                  size="lg"
                  className="w-full"
                  disabled={!canProceed}
                  onClick={handleNext}
                >
                  Continue →
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Contact Step */}
        {isContactStep && (
          <div className="space-y-4">
            {[
              { field: "name" as const, label: "Your Full Name", placeholder: "John Smith", type: "text" },
              { field: "businessName" as const, label: "Business Name", placeholder: "Smith Cleaning Co.", type: "text" },
              { field: "phone" as const, label: "Best Phone Number", placeholder: "(555) 000-0000", type: "tel" },
              { field: "email" as const, label: "Email Address", placeholder: "john@smithcleaning.com", type: "email" },
              { field: "city" as const, label: "City & State", placeholder: "Atlanta, GA", type: "text" },
            ].map(({ field, label, placeholder, type }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {label} {field !== "city" && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={type}
                  value={contact[field]}
                  placeholder={placeholder}
                  onChange={(e) => {
                    setContact((c) => ({ ...c, [field]: e.target.value }));
                    setErrors((err) => ({ ...err, [field]: undefined }));
                  }}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition",
                    errors[field] ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"
                  )}
                />
                {errors[field] && (
                  <p className="mt-1 text-xs text-red-600">{errors[field]}</p>
                )}
              </div>
            ))}

            <p className="text-xs text-slate-400 text-center">
              🔒 Your information is encrypted and never sold to third parties.
            </p>

            <Button
              size="lg"
              className="w-full mt-2"
              loading={submitting}
              onClick={handleSubmit}
            >
              Submit My Application →
            </Button>
          </div>
        )}
      </div>

      {/* Back button */}
      {currentIndex > 0 && !isContactStep && (
        <button
          onClick={handleBack}
          className="mt-6 text-sm text-slate-400 hover:text-slate-600 transition flex items-center gap-1"
        >
          ← Back
        </button>
      )}
    </div>
  );
}
