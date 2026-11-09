# Apparel and Nostalgic catalog

Both pages list the same 11 published Eyefeel T-shirts from [EshDHD’s Eyefeel collection](https://eshdhd.com/eyefeel/c2114773962). Product pages, structured product data, images, size options and colour options were read on 9 November 2026.

`data/apparel.json` stores each listing’s source URL, source image, original Arabic name, SKU, price, sizes and colours, alongside concise English display text. The original WebP images are copied unchanged to `assets/apparel/`.

The nine Treasure Island / Tsuzuku designs are 85 SAR each; Grendizer Head is 89 SAR; Transformers Icecream is 79 SAR. Purchase buttons open the corresponding vendor product page, where shoppers choose size and colour. Do not invent fabric, fit or stock claims. Existing food and drink prices are owner-approved separately.

To update the two matching pages, change the catalog and run:

```powershell
node scripts/build-apparel.cjs
node tests/apparel-catalog.cjs
```

Use the established arched cards, larger numeric price and smaller SAR label. Keep readable, scrolling collections on desktop and phones. Do not fit the complete 11-product collection into a single screen.
