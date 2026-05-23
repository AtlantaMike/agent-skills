import type { Lead } from "@/types";
import { tierLabel } from "@/lib/lead-scoring";

function formatAnswers(answers: Record<string, string | string[]>): string {
  return Object.entries(answers)
    .map(([k, v]) => `  • ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join("\n");
}

function buildEmailHtml(lead: Lead): string {
  const tier = tierLabel(lead.tier);
  const tierColors: Record<string, string> = {
    hot:  "#dc2626",
    warm: "#ea580c",
    cool: "#2563eb",
    cold: "#475569",
  };
  const color = tierColors[lead.tier] ?? "#2563eb";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:Inter,Arial,sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:${color};padding:20px 28px;">
      <p style="color:#fff;font-size:13px;margin:0;opacity:.8;">NEW LEAD — ${lead.niche.toUpperCase()}</p>
      <h1 style="color:#fff;font-size:22px;margin:6px 0 0;">${tier.label}</h1>
    </div>
    <div style="padding:28px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:120px;">Name</td><td style="font-weight:600;color:#0f172a;">${lead.name}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Business</td><td style="font-weight:600;color:#0f172a;">${lead.businessName}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Phone</td><td><a href="tel:${lead.phone}" style="color:${color};font-weight:600;">${lead.phone}</a></td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Email</td><td><a href="mailto:${lead.email}" style="color:${color};font-weight:600;">${lead.email}</a></td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">City</td><td style="color:#0f172a;">${lead.city}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Score</td><td style="font-weight:700;font-size:18px;color:${color};">${lead.score} pts</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;"/>
      <p style="color:#64748b;font-size:12px;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Answers</p>
      <pre style="background:#f8fafc;border-radius:8px;padding:12px;font-size:12px;color:#334155;white-space:pre-wrap;">${formatAnswers(lead.answers)}</pre>
      ${lead.utmSource ? `<p style="color:#94a3b8;font-size:11px;margin:12px 0 0;">Source: ${lead.utmSource} / ${lead.utmMedium ?? ""} / ${lead.utmCampaign ?? ""}</p>` : ""}
    </div>
  </div>
</body>
</html>`;
}

export async function sendEmailAlert(lead: Lead): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const to = process.env.ALERT_EMAIL_TO;
  const from = process.env.ALERT_EMAIL_FROM;
  if (!apiKey || !to || !from) return;

  try {
    const sgMail = (await import("@sendgrid/mail")).default;
    sgMail.setApiKey(apiKey);
    const tier = tierLabel(lead.tier);
    await sgMail.send({
      to,
      from,
      subject: `${tier.label} — ${lead.name} (${lead.businessName}) | ${lead.score} pts`,
      html: buildEmailHtml(lead),
      text: `New ${lead.tier} lead:\n${lead.name}\n${lead.businessName}\n${lead.phone}\n${lead.email}\n${lead.city}\nScore: ${lead.score}`,
    });
  } catch (err) {
    console.error("SendGrid alert failed:", err);
  }
}

export async function sendSmsAlert(lead: Lead): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_PHONE;
  const to = process.env.ALERT_SMS_TO;
  if (!sid || !token || !from || !to) return;

  const tier = tierLabel(lead.tier);
  const body = `${tier.label.split(" ")[0].toUpperCase()} LEAD 🔔\n${lead.name}\n${lead.businessName}\n📞 ${lead.phone}\nScore: ${lead.score}\nNiche: ${lead.niche}`;

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(sid, token);
    await client.messages.create({ body, from, to });
  } catch (err) {
    console.error("Twilio SMS alert failed:", err);
  }
}
