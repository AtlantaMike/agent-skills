import { Lead } from "@/types";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), ".data", "leads.json");

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(DB_PATH)) writeFileSync(DB_PATH, "[]", "utf-8");
}

export function getAllLeads(): Lead[] {
  try {
    ensureDb();
    return JSON.parse(readFileSync(DB_PATH, "utf-8")) as Lead[];
  } catch {
    return [];
  }
}

export function saveLead(lead: Lead): void {
  const leads = getAllLeads();
  leads.unshift(lead);
  writeFileSync(DB_PATH, JSON.stringify(leads, null, 2), "utf-8");
}
