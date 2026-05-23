"use client";
import { useEffect, useState } from "react";

interface Props {
  baseCount: number;
  label: string;
  spotsLeft: number;
}

export function SocialProof({ baseCount, label, spotsLeft }: Props) {
  const [count, setCount] = useState(baseCount);

  useEffect(() => {
    // Simulate live counter ticking up slowly
    const id = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3));
    }, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
        <span>
          <strong className="text-slate-800">{count.toLocaleString()}</strong> {label}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-amber-700 font-medium">
        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Only <strong className="mx-1">{spotsLeft}</strong> spots remaining this month
      </div>
    </div>
  );
}
