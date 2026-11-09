const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const {products}=JSON.parse(read('data/apparel.json'));
assert.equal(products.length,11);
assert.equal(new Set(products.map(p=>p.id)).size,products.length);
const apparel=read('apparel.html'),nostalgic=read('nostalgic.html');
const collection=html=>html.match(/<ul class="sauce-grid"[\s\S]*?<\/ul>/)[0];
assert.equal(collection(apparel),collection(nostalgic));
for(const page of [apparel,nostalgic]){
 assert.equal((page.match(/data-product-id=/g)||[]).length,products.length);
 for(const p of products){
  assert.ok(page.includes('data-product-id="'+p.id+'"'));
  assert.ok(page.includes('href="'+p.url+'"'));
  assert.ok(page.includes('src="'+p.image+'"'));
  assert.ok(page.includes('class="price-amount">'+p.price+'</span>'));
  assert.equal(p.currency,'SAR');
  assert.ok(p.url.startsWith('https://eshdhd.com/'));
  const image=fs.readFileSync(path.join(root,p.image));
  assert.equal(image.toString('ascii',0,4),'RIFF');
  assert.equal(image.toString('ascii',8,12),'WEBP');
 }
}
for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){
 const html=read(file);
 assert.ok(!/href="(?:index\.html)?#apparel"/.test(html));
}
console.log('Passed: matching 11-product collections, vendor links, prices, local WebP assets and Apparel navigation.');
