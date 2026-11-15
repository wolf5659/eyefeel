// Eyefeel contact form backend. Configure delivery through Vercel environment variables.
const ALLOWED_TOPICS = new Set([
  "General Enquiry",
  "Order Support",
  "Food & Beverages",
  "Clothing & Apparel",
  "Returns & Refunds",
  "Business & Collaborations",
]);
const recent = new Map();
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const allowedOrigins = new Set([
  "https://www.eyefeel.me",
  "https://eyefeel.me",
  "https://eyefeel.vercel.app",
  ...[process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter(Boolean).map(host => `https://${host}`),
]);

function string(value, limit) {
  return typeof value === "string" ? value.trim().slice(0, limit + 1) : "";
}

function reply(res, code, message) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(code).json({ ok: code >= 200 && code < 300, message });
}

module.exports = async function handler(req, res) {
  res.setHeader("Allow", "POST");
  if (req.method !== "POST") {
    return reply(res, 405, "Only form submissions are accepted.");
  }

  if (!allowedOrigins.has(req.headers.origin)) {
    return reply(res, 403, "Please use the official Eyefeel website.");
  }

  let input = req.body;
  if (typeof input === "string") {
    if (input.length > 18000) return reply(res, 413, "Message is too large.");
    try { input = JSON.parse(input); } catch { return reply(res, 400, "Invalid request."); }
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return reply(res, 400, "Invalid form submission.");
  }
  if (JSON.stringify(input).length > 18000) {
    return reply(res, 413, "Message is too large.");
  }

  // Honeypot. Real visitors never see or use this field.
  if (string(input.website, 250)) return reply(res, 200, "Message submitted.");

  const name = string(input.name, 100);
  const email = string(input.email, 254);
  const topic = string(input.topic, 50);
  const phone = string(input.phone, 35);
  const order = string(input.order_number, 60);
  const message = string(input.message, 4000);
  if (name.length < 2 || name.length > 100 || !EMAIL_PATTERN.test(email) ||
      !ALLOWED_TOPICS.has(topic) || message.length < 15 || message.length > 4000 ||
      phone.length > 35 || order.length > 60) {
    return reply(res, 400, "Please complete the required fields correctly.");
  }

  const startedAt = Number(input.started_at);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1300 ||
      startedAt > Date.now() + 10000) {
    return reply(res, 400, "Please review your message and try again.");
  }

  const dest = process.env.CONTACT_TO_EMAIL;
  if (!dest) {
    console.error("Eyefeel contact: recipient is not configured.");
    return reply(res, 503, "Contact form is temporarily unavailable. Please use WhatsApp.");
  }

  // A best-effort local throttling layer; the downstream service filters spam too.
  const ip = string((req.headers["x-forwarded-for"] || "").split(",")[0], 60);
  const now = Date.now();
  if (recent.size > 1500) {
    for (const [key, when] of recent) if (now - when > 120000) recent.delete(key);
  }
  if (ip && recent.has(ip) && now - recent.get(ip) < 20000) {
    return reply(res, 429, "Please allow a short moment before sending another message.");
  }

  if (ip) recent.set(ip, now);

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (resendKey && from) {
    const text = [
      `Name: ${name}`,
      `Email: ${email}`,
      phone && `Phone: ${phone}`,
      order && `Order: ${order}`,
      `Topic: ${topic}`,
    ].filter(Boolean).join("\n") + `\n\n${message}`;
    try {
      const result = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [dest], reply_to: email, subject: `Eyefeel Contact | ${topic}`, text }),
        signal: AbortSignal.timeout(8000),
        redirect: "error",
      });
      if (result.ok) return reply(res, 200, "Message submitted.");
      console.error("Eyefeel contact: email provider rejected the message", result.status);
    } catch {
      console.error("Eyefeel contact: email provider request failed.");
    }
    return reply(res, 502, "Message delivery failed. Please try again or use WhatsApp.");
  }

  // Keep the existing browser relay while the server-side sender is being set up.
  // FormSubmit can replace the visible address with its activation token.
  const relayTarget = process.env.CONTACT_FORMSUBMIT_TOKEN || dest;
  res.setHeader("Location", "https://formsubmit.co/ajax/" + encodeURIComponent(relayTarget));
  res.setHeader("Cache-Control", "no-store");
  res.status(307).end();
};
