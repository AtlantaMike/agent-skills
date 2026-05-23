import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_PRICE_ID } from "@/lib/stripe";
import { getNicheConfig } from "@/config";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const config = getNicheConfig();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `https://${req.headers.get("host")}`;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/apply`,
      metadata: {
        leadId: body.leadId ?? "",
        niche: config.slug,
      },
      customer_email: body.email ?? undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
