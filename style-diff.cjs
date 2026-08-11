const fs = require('fs');
const a = JSON.parse(fs.readFileSync(process.argv[2]));
const b = JSON.parse(fs.readFileSync(process.argv[3]));

const PROPS = ['display','position','color','backgroundColor','backgroundImage','fontSize',
  'fontWeight','fontFamily','padding','margin','borderRadius','borderColor','borderWidth',
  'flexDirection','justifyContent','alignItems','gap','gridTemplateColumns','textAlign','opacity','boxShadow'];

let pagesCompared = 0, pagesSkipped = [], totalEls = 0, totalDiffs = 0;
const byProp = {};
const samples = [];

for (const path of Object.keys(a)) {
  const A = a[path], B = b[path];
  if (!B || A.error || B.error) { pagesSkipped.push(path + ' (missing/error)'); continue; }
  // element counts can differ if the page renders DB-driven rows; compare the
  // common prefix by index only when counts match, else align by tag+class
  if (A.count !== B.count) { pagesSkipped.push(`${path} (el count ${A.count} vs ${B.count} — data-driven)`); continue; }
  pagesCompared++;
  for (let i = 0; i < A.els.length; i++) {
    const ea = A.els[i], eb = B.els[i];
    if (ea.t !== eb.t) continue;
    totalEls++;
    for (const p of PROPS) {
      if (ea[p] !== eb[p]) {
        totalDiffs++;
        byProp[p] = (byProp[p] || 0) + 1;
        if (samples.length < 40) samples.push({ path, tag: ea.t, cls: ea.c.slice(0, 70), prop: p, before: ea[p], after: eb[p] });
      }
    }
  }
}

console.log('pages compared :', pagesCompared);
console.log('elements       :', totalEls);
console.log('style diffs    :', totalDiffs);
console.log('\nskipped pages (element counts differ — usually DB rows):');
pagesSkipped.forEach(p => console.log('  -', p));
console.log('\ndiffs by property:');
Object.entries(byProp).sort((x, y) => y[1] - x[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
console.log('\nsample diffs:');
samples.slice(0, 30).forEach(s =>
  console.log(`  [${s.path}] <${s.tag}> .${s.cls}\n      ${s.prop}: ${s.before}  ->  ${s.after}`));
