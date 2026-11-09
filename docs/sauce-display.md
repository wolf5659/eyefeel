# Sauce display for future launches

Owner decision, 9 November 2026: only Citrus Hysteria is displayed for now. Add new sauces when the owner supplies or approves them; do not restore the two placeholder products.

Keep the existing dark circus background and arched, gold-bordered red/black cards. Each real product uses the supplied photo at its natural aspect ratio, followed by its name, sauce type, approved price, vendor message, and Buy now link. Never invent product claims, prices, or availability.

Approved launch details: Citrus Hysteria costs 35 SAR. The message immediately above its Buy now button is "Visit our official vendor in Saudi Arabia". Its button links to `https://eshdhd.com/eyefeel-lemon-chili-sauce/p43727056`. It is no longer marked Coming soon.

The existing `css/sauces.css` grid supports three columns on desktop, two at 850px and below, and one at 560px and below. A single product uses the space remaining below the header and above the audio controls, with its full photo contained rather than cropped. Keep the original centered, vertically stacked arched card at every screen size (maximum width 360px): photo above the name and purchase details. Scale the complete card uniformly with js/sauce-fit.js to the remaining viewport height and width; preserve the original photo aspect ratio, spacing, and typography proportions. On very short screens, allow vertical scrolling so every detail remains accessible. Do not switch to a side-by-side layout. Additional products automatically use the multi-product layout. Preserve the mobile Menu dropdown.

Insert each approved sauce as a sibling `<li>` inside `.sauce-grid` in `sauces.html`. Replace the sample values and give every heading a unique ID:

```html
<li><article class="sauce-card" style="--sauce-color:#991e1e" aria-labelledby="sauce-NEW-ID">
  <div class="sauce-art sauce-art--photo">
    <img src="assets/APPROVED-PHOTO.jpg" width="PHOTO-WIDTH" height="PHOTO-HEIGHT" alt="APPROVED-PRODUCT-DESCRIPTION">
  </div>
  <div class="sauce-details">
    <h2 id="sauce-NEW-ID">APPROVED PRODUCT NAME</h2>
    <p>APPROVED SAUCE TYPE</p>
    <p class="sauce-price">APPROVED PRICE SAR</p>
    <p class="sauce-vendor">Visit our official vendor in Saudi Arabia</p>
    <a class="sauce-buy" href="APPROVED-VENDOR-PRODUCT-URL">Buy now</a>
  </div>
</article></li>
```

Use the owner's approved price, vendor destination, and availability. A future unlaunched product may use the existing `.sauce-status` badge only when requested; do not restore it on Citrus Hysteria. Keep full-size originals when preparing optimized assets, and update the stylesheet query version when its layout changes so phones fetch the new CSS.

Drinks uses the same original stacked card styling and proportional fit script. It shows Crimson Potion (Ice Lemon Tea) and Sweet Lunacy (Spiced Pineapple Elixir), both temporarily 0 SAR with Buy now linking to https://www.eyefeel.me/. Keep the copied vendor message. Show the two cards next to each other on desktop and vertically on phones, where the collection scrolls.
