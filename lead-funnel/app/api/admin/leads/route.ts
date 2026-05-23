import { NextRequest, NextResponse } from "next/server";
import { getAllLeads } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== (process.env.ADMIN_PASSWORD ?? "changeme123")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const leads = getAllLeads();
  return NextResponse.json(leads);
}
