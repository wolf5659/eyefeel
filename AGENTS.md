# AGENTS.md — Eyefeel website

Static site (plain HTML/CSS/JS, no build step). Owner: Al. Domain: www.eyefeel.me. Repo: github.com/wolf5659/eyefeel.

## Owner preferences (important)
- Very short, concise replies. Lead with the answer/fix. Use checklists, not paragraphs.
- Never rewrite things that were not asked about. Make the smallest change that does the job.

## Brand
- EYEFEEL: sauces, drinks, apparel. Now about ALL human emotions (older horror theme dropped).
- Old slogan "Eyefeel, will you?" is retired. Final slogan comes later — do not invent one.
- Look: dark circus / carnival stage, gold + red + black. Mascot: top-hat elephant (assets/logo.png).

## Files
- index.html — main page. css/style.css, js/wheel.js, js/music.js.
- coming-soon.html — separate page: same background, only the "Feeling Soon" sign centered.
- assets/ — optimized images + music. source-originals/ — full-size originals (edit/re-export from these).
- source-originals/REFERENCE-mockup-wheel-and-middlewheel-only.png — reference for the WHEEL and MIDDLEWHEEL only, not the whole page.
- CNAME — www.eyefeel.me (GitHub Pages).

## Main page spec
- Full-screen background assets/bg.jpg (cover, bottom) with dark vignette. Logo top-left. Nav top-right: Sauces, Drinks, Apparel, Return Policy, Contact Us, Cart. Every nav item shows a "Coming soon" tooltip on hover/focus (links go nowhere yet).
- Wheel of feelings centered on the page (10 segments, 36 degrees each, clockwise from top): Angry, Cute, Funny, Happy, Loved, Nostalgic, Sad, Scary, Special, Weird.
- Layers inside `.disc` (square, sized by container query units): `.spin` (wheel.webp + SVG hover wedges, rotates) > `img.middlewheel` (compass, stays still, on the hub) > `img.upperbanner` (ribbon on top, stays still, ornament sits on the wheel's top rim).
- Geometry (percent of `.disc`): hub center 49.95% / 49.49%; wedge outer radius 43.5; hub radius 14.2; middlewheel width ~38.5%.
- RULE: the wheel + banner must never be cut off on any screen (desktop or mobile). `.disc` size = min(94cqw, 100cqh / 1.156).
- Only the landed emotion is highlighted with .won and becomes a clickable link after a spin. Before a spin and while spinning, every section is inactive. Clear the previous choice when starting a new spin.
- Spin: pressing the centre Spin button spins the wheel 5–7 turns, fast start, long slow stop (CSS cubic-bezier(.08,.6,.12,1), 6s), random landing. After it stops, enable only the landed feeling as a link; wait for the visitor to select it before opening its page.
- CSS gotcha: `.disc img{...}` is a broad rule — style `img.middlewheel` / `img.upperbanner` with `.disc img.name` or they blow up to 100% size.

## Sound
- music.js: assets/musicbox.mp3 (from musicbox1_spooky_waltz.mid via source-originals/midi_to_musicbox_mp3.py) loops forever. Browsers block autoplay, so it starts on the visitor's first click/tap/key. Round play/stop button + volume slider, bottom right. Default volume 35%, remembered in localStorage (`efVol`). Stop = mutes all site sound.
- wheel.js: Web Audio synth (no files). A wooden tick plays each time a segment boundary passes the top, driven by the wheel's real rotation (rate = wheel speed). A soft thud + chime plays when the wheel actually stops. All respect the mute state and the volume slider.

## Coming soon page
- Same background, only `assets/feeling-soon.webp` centered on screen. Size by thirds: ~56.7vw / 56.7vh (width = min(56.666vw, 56.666vh*1.305)); mobile width min(68vw, ...). Never cut off.

## Notes / decisions
- Sauces: show only Citrus Hysteria for now; Sauce No. 02 and 03 were removed at the owner's request. Do not add placeholder products. Preserve the existing arched gold/red cards, uncropped product photos, name, sauce type, and purchase details for future launches. Citrus Hysteria is 35 SAR with a "Buy now" link to `https://eshdhd.com/eyefeel-lemon-chili-sauce/p43727056`, preceded by "Visit our official vendor in Saudi Arabia". Do not mark it as coming soon. See `docs/sauce-display.md` for the reusable card and responsive layout.
- ribbon image upper-banner.webp reads "What are you feeling?" (corrected artwork supplied by the owner). Preserve the supplied wording.
- All ten feeling pages exist, but their wheel sections start inactive. The centre spins the wheel; only the landed feeling becomes clickable or keyboard accessible after the animation. Never redirect automatically after a spin. Citrus Hysteria appears on Angry and Sauces; Sweet Lunacy on Cute, Weird, and Drinks; Crimson Potion on Scary and Drinks. Nostalgic and Apparel share all 11 imported T-shirts from EshDHD. Build them from data/apparel.json using node scripts/build-apparel.cjs. The other feeling pages have matching styling and a Back to the wheel link, ready for assigned products.

## Next steps (owner's roadmap)
- [ ] Product pages: Sauces, Drinks, Apparel
- [ ] Language picker + 18+ gate
- [ ] Bright vs Dark Feelings look
- [ ] Go live on www.eyefeel.me (GitHub Pages)

## Run locally
`python3 -m http.server 8000` then open http://localhost:8000
