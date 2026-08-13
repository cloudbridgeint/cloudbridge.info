/* ============================================================
   ADMIN — STUDY DESTINATIONS (list)

   The grid of country cards, and the up/down ordering that decides the
   sequence on /destinations. Editing a country happens on its own page
   at /cbc-admin/destinations/<id> — twenty-odd fields, three list boxes
   and a set of FAQ pairs is a page's worth of work, not a dialog's.
   ============================================================ */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };

  let all = [];

  function gradientOf(row) {
    const v = String(row.gradient || '');
    return /^#[0-9a-fA-F]{3,8},#[0-9a-fA-F]{3,8}$/.test(v) ? v.split(',') : ['#2e4a7a', '#4d70a8'];
  }

  function flagCode(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const letters = Array.from(raw)
      .map(ch => ch.codePointAt(0))
      .filter(p => p >= 0x1f1e6 && p <= 0x1f1ff)
      .map(p => String.fromCharCode(p - 0x1f1e6 + 65))
      .join('');
    if (letters.length >= 2) return letters.slice(0, 2).toLowerCase();
    return raw.toLowerCase().replace(/[^a-z-]/g, '').slice(0, 2);
  }
  const flagSrc = (v) => { const c = flagCode(v); return c ? `/assets/flags/${c}.svg` : ''; };
  const photoSrc = (v) => {
    const s = String(v || '');
    if (!s) return '';
    return s.startsWith('media:') ? `/api/media/${s.slice(6)}` : s;
  };

  /* ---- list ------------------------------------------------------ */

  function render() {
    const el = $('destList');
    if (!all.length) {
      el.innerHTML = '<p class="text-sm text-slate-500">No destinations yet. Use “+ Add destination” to create the first country guide.</p>';
      return;
    }
    el.innerHTML = all.map((d, i) => {
      const [c1, c2] = gradientOf(d);
      const photo = photoSrc(d.card_image);
      const flag = flagSrc(d.flag);
      return `
      <div class="rounded-2xl ring-1 ring-black/5 shadow-sm bg-white overflow-hidden">
        <a href="/cbc-admin/destinations/${d.id}" class="block relative h-24" style="background-image:linear-gradient(160deg,${esc(c1)},${esc(c2)})">
          ${photo ? `<img src="${esc(photo)}" alt="" class="absolute inset-0 w-full h-full object-cover" onerror="this.style.display='none'">` : ''}
          <span class="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent"></span>
          ${flag ? `<img src="${esc(flag)}" alt="" class="absolute bottom-3 left-4 w-10 h-[1.875rem] rounded object-cover ring-1 ring-white/40 shadow" onerror="this.style.display='none'">` : ''}
          ${photo ? '' : '<span class="absolute bottom-3 right-4 text-[10px] font-semibold text-white/80 bg-black/25 rounded-full px-2 py-0.5">No photo</span>'}
        </a>
        <div class="p-4">
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-semibold text-slate-900 text-sm">Study in ${esc(d.short)}</h3>
            ${d.active ? '' : '<span class="shrink-0 text-[11px] font-semibold text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">Hidden</span>'}
          </div>
          <p class="text-xs text-slate-400 mt-1 truncate">/destinations/study-in-${esc(d.slug)}</p>
          <p class="text-xs text-slate-500 mt-2 line-clamp-2">${esc(d.tagline || '')}</p>
          <div class="mt-3 flex items-center gap-2">
            <a class="text-xs font-semibold text-bridge-700 hover:underline" href="/cbc-admin/destinations/${d.id}">Edit</a>
            <span class="text-slate-300">·</span>
            <button class="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30" data-move="${d.id}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move earlier">↑</button>
            <button class="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30" data-move="${d.id}" data-dir="1" ${i === all.length - 1 ? 'disabled' : ''} aria-label="Move later">↓</button>
            <a class="ml-auto text-xs text-slate-400 hover:text-bridge-700" href="/destinations/study-in-${esc(d.slug)}" target="_blank" rel="noopener">View ↗</a>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  async function load() {
    try {
      all = await apiFetch('/api/destinations');
      render();
    } catch (e) {
      $('destList').innerHTML = `<p class="text-sm text-red-600">Could not load: ${esc(e.message)}</p>`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('destList').addEventListener('click', async (e) => {
      const move = e.target.closest('[data-move]');
      if (!move) return;
      const i = all.findIndex(x => String(x.id) === move.dataset.move);
      const j = i + Number(move.dataset.dir);
      if (i < 0 || j < 0 || j >= all.length) return;
      [all[i], all[j]] = [all[j], all[i]];
      render();
      try {
        for (let k = 0; k < all.length; k++) {
          if (all[k].sort_order !== k * 10) {
            all[k].sort_order = k * 10;
            await apiFetch(`/api/destinations/${all[k].id}`, { method: 'PUT', body: JSON.stringify({ sort_order: k * 10 }) });
          }
        }
        showToast('Order saved');
      } catch (err) { showToast(err.message, 'error'); load(); }
    });

    load();
  });
})();
