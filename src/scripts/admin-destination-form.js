/* ============================================================
   ADMIN — DESTINATION EDITOR (full page)

   Drives /cbc-admin/destinations/new and /cbc-admin/destinations/<id>.

   Two things this screen is careful about:

   - The address is a live URL. Changing it moves a published page and
     drops whatever standing it has in search, so it asks first, and the
     server refuses a collision.
   - Leaving with unsaved work loses it, so it warns.
   ============================================================ */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };

  let dirty = false;
  function markDirty() {
    if (dirty) return;
    dirty = true;
    const hint = $('saveHint');
    if (hint) hint.textContent = 'Unsaved changes';
    const btn = $('dSave');
    if (btn) btn.classList.add('ring-4', 'ring-sunrise-100');
  }

  const fromLines = (s) => String(s || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);

  function slugify(v) {
    return String(v || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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
    return String(raw).toLowerCase().replace(/[^a-z-]/g, '').slice(0, 2);
  }
  const flagSrc = (v) => { const c = flagCode(v); return c ? `/assets/flags/${c}.svg` : ''; };

  /* ---- FAQ rows ---------------------------------------------------- */

  function faqRow(q, a) {
    const wrap = document.createElement('div');
    wrap.className = 'rounded-xl border border-slate-200 p-3 bg-slate-50/50';
    wrap.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold text-slate-500">Question</span>
        <button type="button" class="text-xs font-semibold text-red-600 hover:underline" data-faq-remove>Remove</button>
      </div>
      <input class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-2 focus:border-bridge-500 focus:ring-2 focus:ring-bridge-100 outline-none" data-faq-q placeholder="How much does it cost to study there?">
      <textarea rows="3" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bridge-500 focus:ring-2 focus:ring-bridge-100 outline-none" data-faq-a placeholder="Answer in full sentences."></textarea>`;
    wrap.querySelector('[data-faq-q]').value = q || '';
    wrap.querySelector('[data-faq-a]').value = a || '';
    wrap.querySelector('[data-faq-remove]').addEventListener('click', () => { wrap.remove(); markDirty(); });
    return wrap;
  }

  function readFaqs() {
    return Array.from($('dFaqList').children).map(w => ({
      q: w.querySelector('[data-faq-q]').value.trim(),
      a: w.querySelector('[data-faq-a]').value.trim(),
    })).filter(f => f.q && f.a);
  }

  /* ---- previews ---------------------------------------------------- */

  function syncGradient() {
    $('dGradPreview').style.backgroundImage = `linear-gradient(160deg,${$('dGrad1').value},${$('dGrad2').value})`;
  }

  function syncSlug() {
    const s = slugify($('dSlug').value);
    $('dSlugPreview').textContent = s
      ? `The page will be cloudbridge.info/destinations/study-in-${s}`
      : 'Lowercase letters, numbers and dashes only.';
  }

  function syncFlag() {
    const img = $('dFlagPreview');
    const src = flagSrc($('dFlag').value);
    if (!src) { img.classList.add('hidden'); return; }
    img.src = src;
    img.classList.remove('hidden');
    img.onerror = () => {
      img.classList.add('hidden');
      $('dFlagNote').textContent = 'No flag found for that code — check the two-letter country code.';
    };
    img.onload = () => {
      $('dFlagNote').textContent = 'Two-letter country code — GB, US, MY, AU. A flag emoji works too.';
    };
  }

  /* ---- payload ----------------------------------------------------- */

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

  /* ---- wiring ------------------------------------------------------ */

  document.addEventListener('DOMContentLoaded', () => {
    const id = $('dId').value;
    const originalSlug = $('dOriginalSlug').value;

    const list = $('dFaqList');
    let initial = [];
    try { initial = JSON.parse(list.dataset.initial || '[]'); } catch { initial = []; }
    if (initial.length) initial.forEach(f => list.appendChild(faqRow(f.q, f.a)));
    else list.appendChild(faqRow('', ''));

    syncGradient(); syncSlug(); syncFlag();

    document.addEventListener('input', (e) => {
      if (e.target.closest('input, textarea, select')) markDirty();
    });
    $('dGrad1').addEventListener('input', syncGradient);
    $('dGrad2').addEventListener('input', syncGradient);
    $('dSlug').addEventListener('input', () => { $('dSlug').dataset.touched = '1'; syncSlug(); });
    $('dFlag').addEventListener('input', syncFlag);
    $('dFaqAdd').addEventListener('click', () => { list.appendChild(faqRow('', '')); markDirty(); });

    /* A new destination gets its address suggested from the short name; an
       existing one is left alone so a published URL never changes by accident. */
    $('dShort').addEventListener('input', () => {
      if (!id && !$('dSlug').dataset.touched) { $('dSlug').value = slugify($('dShort').value); syncSlug(); }
    });

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
        const img = $('dCardPreview');
        img.src = data.url;
        img.classList.remove('hidden');
        $('dCardClear').classList.remove('hidden');
        markDirty();
        showToast('Photo uploaded — press Save to publish it');
      } catch (err) { showToast(err.message, 'error'); }
    });

    $('dCardClear').addEventListener('click', () => {
      $('dCardImage').value = '';
      $('dCardPreview').classList.add('hidden');
      $('dCardClear').classList.add('hidden');
      $('dCardFile').value = '';
      markDirty();
    });

    window.addEventListener('beforeunload', (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    });

    $('dSave').addEventListener('click', async () => {
      const body = payload();
      if (!body.country || !body.short) { showToast('Country and short name are required', 'error'); return; }
      if (!body.slug) { showToast('The page address cannot be empty', 'error'); return; }
      if (id && body.slug !== originalSlug) {
        const ok = confirm(
          `This changes the page address from\n/destinations/study-in-${originalSlug}\nto\n/destinations/study-in-${body.slug}\n\n` +
          'Anyone with the old link, and its position in Google, will be lost. Continue?');
        if (!ok) return;
      }
      const btn = $('dSave');
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = 'Saving…';
      try {
        if (id) {
          await apiFetch(`/api/destinations/${id}`, { method: 'PUT', body: JSON.stringify(body) });
          dirty = false;
          $('saveHint').textContent = 'All changes saved';
          btn.classList.remove('ring-4', 'ring-sunrise-100');
          showToast('Saved');
          /* The address is part of this page's own URL, so a changed slug has
             to reload rather than leave the header showing the old one. */
          if (body.slug !== originalSlug) location.reload();
        } else {
          const res = await apiFetch('/api/destinations', { method: 'POST', body: JSON.stringify(body) });
          dirty = false;
          showToast('Destination created');
          location.href = `/cbc-admin/destinations/${res.id}`;
        }
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });

    const del = $('dDelete');
    if (del) {
      del.addEventListener('click', async () => {
        const ok = confirm(
          `Delete “Study in ${$('dShort').value}” completely?\n\n` +
          `The page at /destinations/study-in-${originalSlug} will start returning “not found”, and everything written for it is gone.\n\n` +
          'If you only want it off the site for now, untick “Show this guide on the website” instead.');
        if (!ok) return;
        try {
          await apiFetch(`/api/destinations/${id}`, { method: 'DELETE' });
          dirty = false;
          location.href = '/cbc-admin/destinations';
        } catch (e) { showToast(e.message, 'error'); }
      });
    }
  });
})();
