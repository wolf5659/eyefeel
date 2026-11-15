# Eyefeel

Static website for Eyefeel (www.eyefeel.me). See AGENTS.md for the full spec.

The production site deploys from `main` to Vercel. To send contact emails directly from the server, verify a sender domain in Resend and set `RESEND_API_KEY` and `CONTACT_FROM_EMAIL` in Vercel Production. Keep `CONTACT_TO_EMAIL` as the recipient. Redeploy and verify a contact message arrives. Until a sender is configured, the form uses its existing FormSubmit relay. If you have the FormSubmit activation token, set `CONTACT_FORMSUBMIT_TOKEN` to hide the recipient address while using that relay.

## Moyasar mada sandbox

Open `/checkout.html` on the Vercel preview for `moyasar-sandbox`. Set `MOYASAR_TEST_SECRET_KEY` in Preview for this branch and redeploy. Vercel's system environment variables supply the preview origin. For local testing outside Vercel, set `MOYASAR_SANDBOX_ORIGIN` to your preview server's origin. Use Moyasar's [test cards](https://docs.moyasar.com/guides/card-payments/test-cards) on the hosted invoice page.

The sandbox uses the three food and drink products with free pickup, 25 SAR Jeddah delivery and 45 SAR delivery elsewhere in Saudi Arabia. It creates and verifies test invoices, with no order fulfillment or customer address collection. Production requires an activated Moyasar account with mada, a [permitted fixed outbound IP](https://docs.moyasar.com/guides/dashboard/setting-up-your-ip-whitelist), and a place to record verified orders and their delivery details.

## Run locally
python3 -m http.server 8000  →  http://localhost:8000

## Go live (GitHub Pages)
1. To show the coming soon page first: rename coming-soon.html to index.html (keep the real one as home.html).
2. Repo → Settings → Pages → Deploy from branch (main, root). Custom domain: www.eyefeel.me.
3. DNS at the domain registrar:
   - CNAME  www  →  wolf5659.github.io
   - A  @  →  185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
4. When HTTPS is ready, tick "Enforce HTTPS".
