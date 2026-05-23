"use client";
import { clsx } from "clsx";

interface Props {
  label: string;
  icon?: string;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
}

export function OptionCard({ label, icon, selected, onClick, multi }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-left font-medium transition-all duration-150 hover:border-brand-500 hover:bg-brand-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-400",
        selected
          ? "border-brand-600 bg-brand-50 text-brand-700 shadow-sm"
          : "border-slate-200 bg-white text-slate-700"
      )}
    >
      {multi && (
        <span className={clsx(
          "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center",
          selected ? "border-brand-600 bg-brand-600" : "border-slate-300"
        )}>
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
      )}
      {!multi && (
        <span className={clsx(
          "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center",
          selected ? "border-brand-600" : "border-slate-300"
        )}>
          {selected && <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />}
        </span>
      )}
      {icon && <span className="text-xl">{icon}</span>}
      <span className="flex-1">{label}</span>
      {selected && !multi && (
        <svg className="w-4 h-4 text-brand-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}
