/*
 * Country flags.
 *
 * The flag used to be stored and rendered as an emoji. That works on phones
 * and on macOS, but Windows has no flag glyphs at all — it falls back to the
 * two regional-indicator letters, so a Windows visitor saw "GB" and "US"
 * printed on the destination cards instead of a flag. These are real SVGs
 * served from our own origin, so every visitor sees the same thing.
 *
 * Files: public/assets/flags/<iso2>.svg, from flag-icons (MIT) — see
 * public/assets/flags/LICENSE.txt.
 */

/** Every flag file present, so an unknown code degrades instead of 404ing. */
export const FLAG_CODES = new Set(["ad","ae","af","ag","ai","al","am","ao","aq","ar","arab","as","at","au","aw","ax","az","ba","bb","bd","be","bf","bg","bh","bi","bj","bl","bm","bn","bo","bq","br","bs","bt","bv","bw","by","bz","ca","cc","cd","cefta","cf","cg","ch","ci","ck","cl","cm","cn","co","cp","cr","cu","cv","cw","cx","cy","cz","de","dg","dj","dk","dm","do","dz","eac","ec","ee","eg","eh","er","es","es-ct","es-ga","es-pv","et","eu","fi","fj","fk","fm","fo","fr","ga","gb","gb-eng","gb-nir","gb-sct","gb-wls","gd","ge","gf","gg","gh","gi","gl","gm","gn","gp","gq","gr","gs","gt","gu","gw","gy","hk","hm","hn","hr","ht","hu","ic","id","ie","il","im","in","io","iq","ir","is","it","je","jm","jo","jp","ke","kg","kh","ki","km","kn","kp","kr","kw","ky","kz","la","lb","lc","li","lk","lr","ls","lt","lu","lv","ly","ma","mc","md","me","mf","mg","mh","mk","ml","mm","mn","mo","mp","mq","mr","ms","mt","mu","mv","mw","mx","my","mz","na","nc","ne","nf","ng","ni","nl","no","np","nr","nu","nz","om","pa","pc","pe","pf","pg","ph","pk","pl","pm","pn","pr","ps","pt","pw","py","qa","re","ro","rs","ru","rw","sa","sb","sc","sd","se","sg","sh","sh-ac","sh-hl","sh-ta","si","sj","sk","sl","sm","sn","so","sr","ss","st","sv","sx","sy","sz","tc","td","tf","tg","th","tj","tk","tl","tm","tn","to","tr","tt","tv","tw","tz","ua","ug","um","un","us","uy","uz","va","vc","ve","vg","vi","vn","vu","wf","ws","xk","xx","ye","yt","za","zm","zw"]);

/**
 * Accepts what an editor might reasonably have typed — a flag emoji, "GB",
 * "gb", or "gb-eng" — and returns the ISO code, or '' if it is none of those.
 */
export function flagCode(value: string | null | undefined): string {
  const raw = String(value || '').trim();
  if (!raw) return '';

  // Regional-indicator pairs: U+1F1E6 is 'A'.
  const points = Array.from(raw).map(ch => ch.codePointAt(0) || 0);
  const letters = points
    .filter(p => p >= 0x1f1e6 && p <= 0x1f1ff)
    .map(p => String.fromCharCode(p - 0x1f1e6 + 65))
    .join('');
  if (letters.length >= 2) {
    const code = letters.slice(0, 2).toLowerCase();
    return FLAG_CODES.has(code) ? code : '';
  }

  const plain = raw.toLowerCase().replace(/[^a-z-]/g, '');
  if (FLAG_CODES.has(plain)) return plain;
  if (FLAG_CODES.has(plain.slice(0, 2))) return plain.slice(0, 2);
  return '';
}

/** URL of the flag image, or '' when there is no matching file. */
export function flagSrc(value: string | null | undefined): string {
  const code = flagCode(value);
  return code ? `/assets/flags/${code}.svg` : '';
}
