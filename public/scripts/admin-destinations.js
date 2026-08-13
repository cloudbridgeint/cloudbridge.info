/* ============================================================
   ADMIN — STUDY DESTINATIONS

   List, create, edit, reorder and delete the country guides behind
   /destinations/study-in-<slug>.

   Two things this screen is careful about:

   - The slug is a live URL. Changing it moves a published page and drops
     whatever search standing it has, so an edit to an existing slug asks
     for confirmation and the server refuses a collision.
   - Costs and visa figures move. The official source link is prompted for
     rather than optional in spirit, because the page tells students to
     check the real amount there.
   ============================================================ */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };

  let all = [];
  let editing = null;      // the row being edited, or null when adding
  let originalSlug = '';

  const parseList = (raw) => { try { const v = JSON.parse(raw || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
  const toLines = (arr) => (arr || []).join('\n');
  const fromLines = (s) => String(s || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);

  function slugify(v) {
    return String(v || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function gradientOf(row) {
    const v = String(row.gradient || '');
    return /^#[0-9a-fA-F]{3,8},#[0-9a-fA-F]{3,8}$/.test(v) ? v.split(',') : ['#2e4a7a', '#4d70a8'];
  }

  /* ---- list ------------------------------------------------------ */

  function render() {
    const el = $('destList');
    if (!all.length) {
      el.innerHTML = '<p class="text-sm text-slate-500">No destinations yet. Use “+ Add destination” to create the first country guide.</p>';
      return;
    }
    el.innerHTML = all.map((d, i) => {
      const [c1, c2] = gradientOf(d);
      return `
      <div class="rounded-2xl ring-1 ring-black/5 shadow-sm bg-white overflow-hidden">
        <div class="h-20 flex items-end p-4 text-white" style="background-image:linear-gradient(160deg,${esc(c1)},${esc(c2)})">
          <span class="text-2xl">${esc(d.flag || '')}</span>
        </div>
        <div class="p-4">
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-semibold text-slate-900 text-sm">Study in ${esc(d.short)}</h3>
            ${d.active ? '' : '<span class="shrink-0 text-[11px] font-semibold text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">Hidden</span>'}
          </div>
          <p class="text-xs text-slate-400 mt-1 truncate">/destinations/study-in-${esc(d.slug)}</p>
          <p class="text-xs text-slate-500 mt-2 line-clamp-2">${esc(d.tagline || '')}</p>
          <div class="mt-3 flex items-center gap-2">
            <button class="text-xs font-semibold text-bridge-700 hover:underline" data-edit="${d.id}">Edit</button>
            <span class="text-slate-300">·</span>
            <button class="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30" data-move="${d.id}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30" data-move="${d.id}" data-dir="1" ${i === all.length - 1 ? 'disabled' : ''}>↓</button>
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

  /* ---- FAQ rows -------------------------------------------------- */

  function faqRow(q, a) {
    const wrap = document.createElement('div');
    wrap.className = 'rounded-xl border border-slate-200 p-3';
    wrap.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold text-slate-400">Question</span>
        <button type="button" class="text-xs text-red-600 hover:underline" data-faq-remove>Remove</button>
      </div>
      <input class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-2" data-faq-q placeholder="How much does it cost to study there?">
      <textarea rows="3" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" data-faq-a placeholder="Answer in full sentences."></textarea>`;
    wrap.querySelector('[data-faq-q]').value = q || '';
    wrap.querySelector('[data-faq-a]').value = a || '';
    wrap.querySelector('[data-faq-remove]').addEventListener('click', () => wrap.remove());
    return wrap;
  }

  function readFaqs() {
    return Array.from($('dFaqList').children).map(w => ({
      q: w.querySelector('[data-faq-q]').value.trim(),
      a: w.querySelector('[data-faq-a]').value.trim(),
    })).filter(f => f.q && f.a);
  }

  /* ---- modal ----------------------------------------------------- */

  function syncGradientPreview() {
    $('dGradPreview').style.backgroundImage = `linear-gradient(160deg,${$('dGrad1').value},${$('dGrad2').value})`;
  }

  function syncSlugPreview() {
    const s = slugify($('dSlug').value);
    $('dSlugPreview').textContent = s ? `Page will be /destinations/study-in-${s}` : 'Lowercase letters, numbers and dashes only.';
  }

  function openModal(row) {
    editing = row || null;
    originalSlug = row ? row.slug : '';
    $('destModalTitle').textContent = row ? `Edit — Study in ${row.short}` : 'Add destination';
    $('dDelete').classList.toggle('hidden', !row);

    $('dId').value = row ? row.id : '';
    $('dCountry').value = row?.country || '';
    $('dShort').value = row?.short || '';
    $('dSlug').value = row?.slug || '';
    $('dFlag').value = row?.flag || '';
    $('dTagline').value = row?.tagline || '';
    $('dAnswer').value = row?.answer || '';
    $('dIntro').value = row?.intro || '';
    $('dWhy').value = toLines(parseList(row?.why));
    $('dTuition').value = row?.tuition || '';
    $('dLiving').value = row?.living || '';
    $('dCurrency').value = row?.currency || '';
    $('dIntakes').value = row?.intakes || '';
    $('dWorkRights').value = row?.work_rights || '';
    $('dPostStudy').value = row?.post_study || '';
    $('dEnglishReq').value = row?.english_req || '';
    $('dAcademicReq').value = row?.academic_req || '';
    $('dVisaName').value = row?.visa_name || '';
    $('dVisaSteps').value = toLines(parseList(row?.visa_steps));
    $('dScholarships').value = toLines(parseList(row?.scholarships));
    $('dUniversities').value = toLines(parseList(row?.universities));
    $('dOfficialLabel').value = row?.official_label || '';
    $('dOfficialUrl').value = row?.official_url || '';
    $('dCardImage').value = row?.card_image || '';
    $('dCardFile').value = '';
    $('dActive').checked = row ? row.active === 1 : true;

    const [c1, c2] = gradientOf(row || {});
    $('dGrad1').value = c1;
    $('dGrad2').value = c2;
    syncGradientPreview();
    syncSlugPreview();

    const list = $('dFaqList');
    list.innerHTML = '';
    const faqs = parseList(row?.faqs);
    if (faqs.length) faqs.forEach(f => list.appendChild(faqRow(f.q, f.a)));
    else list.appendChild(faqRow('', ''));

    $('destModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    $('destModal').classList.add('hidden');
    document.body.style.overflow = '';
    editing = null;
  }

  function payload() {
    return {
      slug: slugify($('dSlug').value),
      country: $('dCountry').value.trim(),
      short: $('dShort').value.trim(),
      flag: $('dFlag').value.trim(),
      tagline: $('dTagline').value.trim(),
      answer: $('dAnswer').value.trim(),
      intro: $('dIntro').value.trim(),
      why: fromLines($('dWhy').value),
      tuition: $('dTuition').value.trim(),
      living: $('dLiving').value.trim(),
      currency: $('dCurrency').value.trim(),
      intakes: $('dIntakes').value.trim(),
      work_rights: $('dWorkRights').value.trim(),
      post_study: $('dPostStudy').value.trim(),
      english_req: $('dEnglishReq').value.trim(),
      academic_req: $('dAcademicReq').value.trim(),
      visa_name: $('dVisaName').value.trim(),
      visa_steps: fromLines($('dVisaSteps').value),
      scholarships: fromLines($('dScholarships').value),
      universities: fromLines($('dUniversities').value),
      official_label: $('dOfficialLabel').value.trim(),
      official_url: $('dOfficialUrl').value.trim(),
      faqs: readFaqs(),
      card_image: $('dCardImage').value.trim(),
      gradient: `${$('dGrad1').value},${$('dGrad2').value}`,
      active: $('dActive').checked ? 1 : 0,
    };
  }

  /* ---- wiring ---------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', () => {
    $('addBtn').addEventListener('click', () => openModal(null));
    $('dCancel').addEventListener('click', closeModal);
    $('destClose').addEventListener('click', closeModal);
    $('dGrad1').addEventListener('input', syncGradientPreview);
    $('dGrad2').addEventListener('input', syncGradientPreview);
    $('dSlug').addEventListener('input', syncSlugPreview);
    $('dFaqAdd').addEventListener('click', () => $('dFaqList').appendChild(faqRow('', '')));

    /* A new destination gets its slug suggested from the short name; an
       existing one is left alone so a saved URL is never changed by accident. */
    $('dShort').addEventListener('input', () => {
      if (!editing && !$('dSlug').dataset.touched) {
        $('dSlug').value = slugify($('dShort').value);
        syncSlugPreview();
      }
    });
    $('dSlug').addEventListener('input', () => { $('dSlug').dataset.touched = '1'; });

    $('dCardFile').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/media', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        $('dCardImage').value = `media:${data.id}`;
        showToast('Photo uploaded — click Save destination to apply');
      } catch (err) { showToast(err.message, 'error'); }
    });

    $('destList').addEventListener('click', async (e) => {
      const edit = e.target.closest('[data-edit]');
      const move = e.target.closest('[data-move]');
      if (edit) {
        const row = all.find(x => String(x.id) === edit.dataset.edit);
        if (row) openModal(row);
        return;
      }
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

    $('dSave').addEventListener('click', async () => {
      const body = payload();
      if (!body.country || !body.short) { showToast('Country and short name are required', 'error'); return; }
      if (!body.slug) { showToast('The URL name cannot be empty', 'error'); return; }
      if (editing && body.slug !== originalSlug) {
        const ok = confirm(
          `This changes the page address from\n/destinations/study-in-${originalSlug}\nto\n/destinations/study-in-${body.slug}\n\n` +
          'Anyone with the old link, and its position in Google, will be lost. Continue?');
        if (!ok) return;
      }
      const btn = $('dSave');
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        if (editing) {
          await apiFetch(`/api/destinations/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
        } else {
          await apiFetch('/api/destinations', { method: 'POST', body: JSON.stringify(body) });
        }
        showToast('Destination saved');
        closeModal();
        load();
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = 'Save destination';
      }
    });

    $('dDelete').addEventListener('click', async () => {
      if (!editing) return;
      const ok = confirm(
        `Delete “Study in ${editing.short}” completely?\n\n` +
        `The page at /destinations/study-in-${editing.slug} will start returning “not found”, and everything written for it is gone.\n\n` +
        'If you only want it off the site for now, untick Published instead.');
      if (!ok) return;
      try {
        await apiFetch(`/api/destinations/${editing.id}`, { method: 'DELETE' });
        showToast('Destination deleted');
        closeModal();
        load();
      } catch (e) { showToast(e.message, 'error'); }
    });

    load();
  });
})();
