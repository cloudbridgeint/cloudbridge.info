import { chromium } from 'playwright';
const BASE = process.argv[2]; let f=0;
const ok=m=>console.log('  PASS  '+m), bad=m=>{f++;console.log('  FAIL  '+m);};
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1366,height:900}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
console.log(`\n=== ${BASE} ===\n[1] INSTAGRAM GRADIENT`);
await p.goto(BASE,{waitUntil:'networkidle',timeout:60000});
await p.evaluate(()=>document.querySelector('.social-chip').scrollIntoView({block:'center'}));
await p.waitForTimeout(500);
await (await p.$('.social-chip[title="Instagram"]')).hover(); await p.waitForTimeout(450);
const ig=await p.evaluate(()=>{const e=document.querySelector('.social-chip[title="Instagram"]');const c=getComputedStyle(e);
  return {img:c.backgroundImage,bg:c.backgroundColor,grad:e.style.getPropertyValue('--brand-grad')};});
ig.img.includes('radial-gradient')?ok('Instagram paints a real gradient on hover'):bad('backgroundImage='+ig.img.slice(0,80));
const stops=(ig.img.match(/rgb\(/g)||[]).length;
stops>=4?ok(`gradient has ${stops} colour stops (yellow -> orange -> pink -> blue)`):bad(`only ${stops} stops`);
ig.bg==='rgb(228, 64, 95)'?ok('flat #E4405F still underneath as fallback'):bad('fallback bg='+ig.bg);
// others must stay flat
await (await p.$('.social-chip[title="Facebook"]')).hover(); await p.waitForTimeout(400);
const fb=await p.evaluate(()=>{const c=getComputedStyle(document.querySelector('.social-chip[title="Facebook"]'));return{img:c.backgroundImage,bg:c.backgroundColor};});
(fb.bg==='rgb(24, 119, 242)'&&fb.img==='none')?ok('Facebook still flat brand blue (gradient not leaking)'):bad(`fb bg=${fb.bg} img=${fb.img.slice(0,40)}`);

console.log('\n[2] BLOG LINKS ON HOME');
const links=await p.evaluate(()=>[...document.querySelectorAll('a[href*="study-in-"]')].map(a=>a.getAttribute('href')));
links.every(h=>h.startsWith('/blogs/'))?ok('home article cards point at /blogs/... ('+links.join(', ')+')'):bad('still old links: '+links.join(', '));

console.log('\n[3] /blogs LISTING');
await p.goto(BASE+'/blogs',{waitUntil:'networkidle',timeout:60000});
const bl=await p.evaluate(()=>[...document.querySelectorAll('a')].map(a=>a.getAttribute('href')).filter(h=>h&&/study-in|scholarship|visa-interview|first-month/.test(h)));
const oldStyle=bl.filter(h=>!h.startsWith('/blogs/')&&h!=='/scholarship');
oldStyle.length===0?ok('every article link uses /blogs/<slug>'):bad('old-style links remain: '+oldStyle.join(', '));

console.log('\n[4] ARTICLE PAGE INTACT');
await p.goto(BASE+'/blogs/study-in-uk',{waitUntil:'networkidle',timeout:60000});
const a=await p.evaluate(()=>{const g=JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
  return {canon:document.querySelector('link[rel=canonical]')?.href,h1:document.querySelector('h1')?.textContent?.trim().slice(0,50),
    bp:!!g.find(n=>n['@type']==='BlogPosting'),chips:document.querySelectorAll('.social-chip').length,
    broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).length};});
a.canon==='https://cloudbridge.info/blogs/study-in-uk'?ok('canonical is the blog URL'):bad('canonical='+a.canon);
a.bp?ok('BlogPosting schema still present'):bad('BlogPosting gone');
a.chips===7?ok('7 social chips on article page'):bad('chips='+a.chips);
a.broken===0?ok('no broken images'):bad(a.broken+' broken');
console.log('  h1: '+a.h1);

console.log('\n[5] REDIRECT IN A REAL BROWSER');
const r=await p.goto(BASE+'/study-in-uk',{waitUntil:'networkidle',timeout:60000});
const url=p.url();
url.endsWith('/blogs/study-in-uk')?ok('browser lands on '+url.replace(BASE,'')):bad('landed at '+url);
r.status()===200?ok('final page renders 200'):bad('status '+r.status());

console.log('\n[6] CONSOLE');
errs.length?bad(errs.length+' errors: '+errs.slice(0,3).join(' | ')):ok('no console errors');
console.log('\n'+(f?f+' FAILED':'ALL CHECKS PASSED')+'\n'); await b.close(); process.exit(f?1:0);
