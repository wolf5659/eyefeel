# Sauce display for future launches

Owner decision, 9 November 2026: only Citrus Hysteria is displayed for now. Add new sauces when the owner supplies or approves them; do not restore the two placeholder products.

Keep the existing dark circus background and arched, gold-bordered red/black cards. Each real product uses the supplied photo at its natural aspect ratio, followed by its name, sauce type, and availability badge. Never invent product claims, prices, or availability.

The existing `css/sauces.css` grid supports three columns on desktop, two at 850px and below, and one at 560px and below. A single product is centered with a maximum width of 360px; additional products automatically use the multi-product layout. Preserve the mobile Menu dropdown.

Insert each approved sauce as a sibling `<li>` inside `.sauce-grid` in `sauces.html`. Replace the sample values and give every heading a unique ID:

```html
<li><article class="sauce-card" style="--sauce-color:#991e1e" aria-labelledby="sauce-NEW-ID">
  <div class="sauce-art sauce-art--photo">
    <img src="assets/APPROVED-PHOTO.jpg" width="PHOTO-WIDTH" height="PHOTO-HEIGHT" alt="APPROVED-PRODUCT-DESCRIPTION">
  </div>
  <div class="sauce-details">
    <h2 id="sauce-NEW-ID">APPROVED PRODUCT NAME</h2>
    <p>APPROVED SAUCE TYPE</p>
    <span class="sauce-status">Coming soon</span>
  </div>
</article></li>
```

Use the owner's approved availability text. Keep full-size originals when preparing optimized assets, and update the stylesheet query version when its layout changes so phones fetch the new CSS.
