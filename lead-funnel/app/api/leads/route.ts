import { NextRequest, NextResponse } from "next/server";
import { saveLead } from "@/lib/storage";
import { sendWebhook } from "@/lib/webhooks";
import { sendEmailAlert, sendSmsAlert } from "@/lib/notifications";
import { scoreLead } from "@/lib/lead-scoring";
import { getNicheConfig } from "@/config";
import type { Lead } from "@/types";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config = getNicheConfig();
    const { score, tier } = scoreLead(body.answers ?? {}, config.steps);

    const lead: Lead = {
      id: randomUUID(),
      niche: config.slug,
      createdAt: new Date().toISOString(),
      score,
      tier,
      name: body.name ?? "",
      businessName: body.businessName ?? "",
      phone: body.phone ?? "",
      email: body.email ?? "",
      city: body.city ?? "",
      answers: body.answers ?? {},
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
    };

    saveLead(lead);
    await Promise.all([
      sendWebhook(lead),
      sendEmailAlert(lead),
      sendSmsAlert(lead),
    ]);

    return NextResponse.json({ success: true, tier, score, leadId: lead.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
