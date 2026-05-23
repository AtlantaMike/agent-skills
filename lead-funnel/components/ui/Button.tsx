"use client";
import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
        {
          "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 shadow-lg hover:shadow-xl active:scale-[0.98]": variant === "primary",
          "border-2 border-brand-600 text-brand-600 hover:bg-brand-50": variant === "outline",
          "text-brand-600 hover:bg-brand-50": variant === "ghost",
          "px-3 py-1.5 text-sm": size === "sm",
          "px-5 py-2.5 text-base": size === "md",
          "px-8 py-4 text-lg": size === "lg",
          "opacity-60 cursor-not-allowed": disabled || loading,
        },
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Processing…
        </span>
      ) : children}
    </button>
  );
}
