# Eyefeel

Static website for Eyefeel (www.eyefeel.me). See AGENTS.md for the full spec.

The production site deploys from `main` to Vercel. To send contact emails directly from the server, verify a sender domain in Resend and set `RESEND_API_KEY` and `CONTACT_FROM_EMAIL` in Vercel Production. Keep `CONTACT_TO_EMAIL` as the recipient. Redeploy and verify a contact message arrives. Until a sender is configured, the form uses its existing FormSubmit relay. If you have the FormSubmit activation token, set `CONTACT_FORMSUBMIT_TOKEN` to hide the recipient address while using that relay.

## Run locally
python3 -m http.server 8000  →  http://localhost:8000

## Go live (GitHub Pages)
1. To show the coming soon page first: rename coming-soon.html to index.html (keep the real one as home.html).
2. Repo → Settings → Pages → Deploy from branch (main, root). Custom domain: www.eyefeel.me.
3. DNS at the domain registrar:
   - CNAME  www  →  wolf5659.github.io
   - A  @  →  185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
4. When HTTPS is ready, tick "Enforce HTTPS".
