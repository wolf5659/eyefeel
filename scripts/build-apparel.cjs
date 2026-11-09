// Rebuild the two clothing collections from the verified vendor catalog.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root,'data/apparel.json'),'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cards = catalog.products.map(p => {
  if (!p.url.startsWith('https://eshdhd.com/') || p.currency !== 'SAR') throw Error('Unexpected vendor or currency');
  const options = [['Sizes',p.sizes],['Colours',p.colors]].filter(([,values]) => values.length).map(([label,values]) => `<dt>${label}</dt><dd>${escape(values.join(' · '))}</dd>`).join('');
  return `<li><article class="sauce-card" data-product-id="${escape(p.id)}" aria-labelledby="apparel-${escape(p.id)}">
<div class="sauce-art sauce-art--photo"><a class="apparel-photo" href="${escape(p.url)}" aria-label="View ${escape(p.name+' — '+p.variant)} at EshDHD"><img src="${escape(p.image)}" width="512" height="512" loading="lazy" alt="${escape(p.name+' — '+p.variant)}"></a></div>
<div class="sauce-details"><h2 id="apparel-${escape(p.id)}"><a href="${escape(p.url)}">${escape(p.name)}</a></h2><p class="apparel-variant">${escape(p.variant)}</p>
<details class="apparel-info"><summary>Details &amp; sizes</summary><p>${escape(p.description)}</p><dl>${options}</dl></details>
<div class="apparel-purchase"><p class="sauce-price"><span class="price-amount">${escape(p.price)}</span> <span class="price-currency">SAR</span></p><p class="sauce-vendor">Visit our official vendor in Saudi Arabia</p><a class="sauce-buy" href="${escape(p.url)}">Buy now</a></div>
</div></article></li>`;
}).join('\n');
const base = fs.readFileSync(path.join(root,'angry.html'),'utf8');
for (const name of ['Apparel','Nostalgic']) {
  let html = base.replace('<title>Angry · Eyefeel</title>',`<title>${name} · Eyefeel</title>`).replace('class="sauces-page angry-page"',`class="sauces-page apparel-page${name === 'Nostalgic' ? ' nostalgic-page' : ''}"`);
  html = html.replace(/<meta name="description"[^>]+>/,`<meta name="description" content="Explore Eyefeel ${name === 'Nostalgic' ? 'Nostalgic ' : ''}T-shirts: Treasure Island, Tsuzuku, Grendizer and Transformers. Shop through our official vendor in Saudi Arabia.">`);
  html = html.replace('<meta name="description"','<link rel="stylesheet" href="css/apparel.css?v=20261109-1">\n<meta name="description"');
  html = html.replace('<h1>Angry</h1></div>',`<h1>${name}</h1></div>`);
  html = html.replace(/<ul class="sauce-grid"[\s\S]*?<\/ul>/,`<ul class="sauce-grid" aria-label="Eyefeel T-shirts">\n${cards}\n</ul>`);
  html = html.replace(/<script src="js\/sauce-fit.js[^<]+<\/script>\s*/,'');
  if (name === 'Apparel') html = html.replace('<a href="apparel.html">Apparel</a>','<a href="apparel.html" aria-current="page">Apparel</a>');
  fs.writeFileSync(path.join(root,name.toLowerCase()+'.html'),html);
}
console.log('Built Apparel and Nostalgic with '+catalog.products.length+' matching T-shirts.');
