# Eyefeel

Static website for Eyefeel (www.eyefeel.me). See AGENTS.md for the full spec.

## Run locally
python3 -m http.server 8000  →  http://localhost:8000

## Go live (GitHub Pages)
1. To show the coming soon page first: rename coming-soon.html to index.html (keep the real one as home.html).
2. Repo → Settings → Pages → Deploy from branch (main, root). Custom domain: www.eyefeel.me.
3. DNS at the domain registrar:
   - CNAME  www  →  wolf5659.github.io
   - A  @  →  185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
4. When HTTPS is ready, tick "Enforce HTTPS".
