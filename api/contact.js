// Eyefeel contact form backend. Recipient email is stored privately in Vercel.
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

  const siteOrigin = string(req.headers.origin || "", 250);
  if (siteOrigin) {
    try {
      const host = new URL(siteOrigin).hostname.toLowerCase();
      if (host !== "www.eyefeel.me" && host !== "eyefeel.me" &&
        !host.endsWith("-magadina.vercel.app") && host !== "eyefeel.vercel.app") {
        return reply(res, 403, "Please use the official Eyefeel website.");
      }
    } catch {
      return reply(res, 403, "Invalid request origin.");
    }
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

  try {
    const outbound = {
      name,
      email,
      phone: phone || "Not provided",
      subject: topic,
      order_number: order || "Not provided",
      message,
      _subject: "Eyefeel Contact | " + topic,
      _replyto: email,
      _captcha: "false",
      _template: "table",
      _url: "https://www.eyefeel.me/contact.html",
    };

    const response = await fetch(
      "https://formsubmit.co/ajax/" + encodeURIComponent(dest),
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json", "Referer": "https://www.eyefeel.me/contact.html", "Origin": "https://www.eyefeel.me" },
        body: JSON.stringify(outbound),
        signal: AbortSignal.timeout(12000),
      }
    );

    const result = await response.json().catch(() => ({}));
    // FormSubmit reports success as a boolean or as the string "true".
    if (!response.ok || (result.success !== true && result.success !== "true")) {
      const providerMessage = typeof result.message === "string" ? result.message.slice(0, 400) : "";
      console.error("Eyefeel contact: mail service rejected submission", response.status, providerMessage);
      if (/activation|activate|confirm.*email/i.test(providerMessage)) {
        return reply(res, 503, "Our email delivery needs a one-time address confirmation. Please use WhatsApp while we complete setup.");
      }
      return reply(res, 502, "We could not send your message right now. Please try again or contact us on WhatsApp.");
    }

    if (ip) recent.set(ip, now);
    return reply(res, 200, "Thank you. Your message has been submitted.");
  } catch (error) {
    console.error("Eyefeel contact: mail delivery request failed", error && error.message);
    return reply(res, 502, "We could not send your message right now. Please try again or contact us on WhatsApp.");
  }
};
