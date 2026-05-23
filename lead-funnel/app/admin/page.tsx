"use client";

import { useState, useEffect } from "react";
import type { Lead } from "@/types";
import { tierLabel } from "@/lib/lead-scoring";
import { clsx } from "clsx";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "hot" | "warm" | "cool" | "cold">("all");
  const [loading, setLoading] = useState(false);

  const fetchLeads = async (pw: string) => {
    setLoading(true);
    const res = await fetch("/api/admin/leads", {
      headers: { "x-admin-password": pw },
    });
    if (res.status === 401) { setError("Wrong password"); setLoading(false); return; }
    const data = await res.json();
    setLeads(data);
    setAuthed(true);
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads(password);
  };

  const filtered = filter === "all" ? leads : leads.filter((l) => l.tier === filter);

  const exportCSV = () => {
    const headers = ["Name", "Business", "Phone", "Email", "City", "Score", "Tier", "Niche", "Created"];
    const rows = filtered.map((l) => [
      l.name, l.businessName, l.phone, l.email, l.city,
      l.score, l.tier, l.niche, new Date(l.createdAt).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "leads.csv"; a.click();
  };

  if (!authed) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">Admin Dashboard</h1>
          {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Loading…" : "Sign In"}
          </button>
        </form>
      </main>
    );
  }

  const tiers = ["all", "hot", "warm", "cool", "cold"] as const;
  const counts = {
    all: leads.length,
    hot:  leads.filter((l) => l.tier === "hot").length,
    warm: leads.filter((l) => l.tier === "warm").length,
    cool: leads.filter((l) => l.tier === "cool").length,
    cold: leads.filter((l) => l.tier === "cold").length,
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Lead Dashboard</h1>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">
            ↓ Export CSV
          </button>
          <button onClick={() => fetchLeads(password)} className="text-sm bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        {tiers.map((t) => {
          const info = t === "all"
            ? { label: "All Leads", color: "bg-white border-slate-200 text-slate-700" }
            : { ...tierLabel(t as Lead["tier"]) };
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={clsx(
                "rounded-xl border p-4 text-left transition hover:shadow-md",
                filter === t ? "ring-2 ring-blue-500 shadow-md" : "",
                t === "all" ? "bg-white border-slate-200" : tierLabel(t as Lead["tier"]).color
              )}
            >
              <div className="text-2xl font-bold">{counts[t]}</div>
              <div className="text-xs mt-0.5 opacity-80">
                {t === "all" ? "All Leads" : tierLabel(t as Lead["tier"]).label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Tier", "Name", "Business", "Phone", "Email", "City", "Score", "Niche", "Date"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-12 text-slate-400">No leads yet</td></tr>
                )}
                {filtered.map((lead) => {
                  const tier = tierLabel(lead.tier);
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <span className={clsx("inline-block text-xs font-semibold px-2 py-0.5 rounded-full border", tier.color)}>
                          {tier.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{lead.name}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.businessName}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <a href={`tel:${lead.phone}`} className="hover:text-blue-600">{lead.phone}</a>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <a href={`mailto:${lead.email}`} className="hover:text-blue-600">{lead.email}</a>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.city}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-800">{lead.score}</span>
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-500">{lead.niche}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
