import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAllLeads, saveLead } from "@/lib/storage";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const leadId = session.metadata?.leadId;
    if (leadId) {
      const leads = getAllLeads();
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        const updated = { ...(lead as unknown as Record<string, unknown>), paid: true, stripeSessionId: session.id };
        saveLead({ ...(updated as unknown as import("@/types").Lead), id: lead.id + "_paid" });
      }
    }
  }

  return NextResponse.json({ received: true });
}
