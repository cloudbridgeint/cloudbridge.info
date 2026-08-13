/* ============================================================
   ADMIN CONTENT FIELDS

   Save, image upload, and the page furniture around them: the jump-list
   highlight, the unsaved-changes warning, and one Save button that
   covers the text fields and every list on the screen.

   One button rather than one per box: with a Save under each section it
   is never obvious which one covers the change you just made, and a
   half-saved page is the usual result.

   An image field stores "media:<id>", not a URL, so the same picture can
   be re-served through /api/media whatever the deployment. Clearing a
   field writes an empty string rather than deleting the row, which is
   what lets the page fall back to its built-in default.
   ============================================================ */
(function () {
  'use strict';

  let dirty = false;
  const saveBtn = () => document.getElementById('saveContentBtn');

  function markDirty() {
    if (dirty) return;
    dirty = true;
    const btn = saveBtn();
    if (btn) {
      btn.classList.add('ring-4', 'ring-sunrise-100');
      const hint = document.getElementById('saveHint');
      if (hint) hint.textContent = 'Unsaved changes';
    }
  }
  window.__cbMarkDirty = markDirty;

  function markClean() {
    dirty = false;
    const btn = saveBtn();
    if (btn) btn.classList.remove('ring-4', 'ring-sunrise-100');
    const hint = document.getElementById('saveHint');
    if (hint) hint.textContent = 'All changes saved';
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.field-input').forEach(el => {
      el.addEventListener('input', markDirty);
      el.addEventListener('change', markDirty);
    });

    document.querySelectorAll('.img-file').forEach(input => {
      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const key = input.dataset.key;
        const fd = new FormData();
        fd.append('file', file);
        try {
          const res = await fetch('/api/media', { method: 'POST', body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload failed');
          document.querySelector(`.field-input[data-key="${key}"]`).value = `media:${data.id}`;
          document.querySelector(`.img-preview[data-key="${key}"]`).src = data.url;
          markDirty();
          showToast('Image uploaded — press Save to publish it');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    document.querySelectorAll('.img-clear').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        document.querySelector(`.field-input[data-key="${key}"]`).value = '';
        markDirty();
        showToast('Image cleared — press Save to publish the change');
      });
    });

    /* Jump list: highlight whichever section is currently in view. */
    const links = Array.from(document.querySelectorAll('[data-nav-link]'));
    if (links.length) {
      const setActive = (id) => links.forEach(a => {
        const on = a.dataset.navLink === id;
        a.classList.toggle('bg-bridge-50', on);
        a.classList.toggle('text-bridge-800', on);
        a.classList.toggle('font-semibold', on);
      });
      const seen = new Map();
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => seen.set(en.target.id, en.intersectionRatio));
        let best = null, bestRatio = 0;
        seen.forEach((ratio, id) => { if (ratio > bestRatio) { bestRatio = ratio; best = id; } });
        if (best) setActive(best);
      }, {
        root: document.getElementById('adminContent') || null,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      });
      document.querySelectorAll('[data-section]').forEach(s => io.observe(s));
    }

    /* Leaving with unsaved edits loses them silently otherwise. */
    window.addEventListener('beforeunload', (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    });

    const btn = saveBtn();
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const payload = {};
      document.querySelectorAll('.field-input').forEach(el => { payload[el.dataset.key] = el.value; });
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = 'Saving…';
      try {
        if (Object.keys(payload).length) {
          await apiFetch('/api/content', { method: 'PUT', body: JSON.stringify(payload) });
        }
        /* Lists register themselves so this one button covers the whole page. */
        for (const editor of (window.__cbEditors || [])) {
          await editor.save();
        }
        markClean();
        showToast('Saved — the website is updated');
      } catch (e) {
        showToast(e.message || 'Could not save', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  });
})();
