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

    /* One section at a time. The menu is the position: picking a section shows
       that one and hides the rest, and the chosen entry is marked so it is
       obvious where you are.

       Hidden sections stay in the page rather than being removed, so their
       fields are still collected by Save — an edit made in one section is not
       lost by moving to another before saving. */
    const links = Array.from(document.querySelectorAll('[data-nav-link]'));
    const panes = Array.from(document.querySelectorAll('[data-section]'));

    function showSection(id) {
      if (!panes.some(p => p.id === id)) id = panes[0] && panes[0].id;
      panes.forEach(p => p.classList.toggle('hidden', p.id !== id));
      links.forEach(a => {
        const on = a.dataset.navLink === id;
        a.classList.toggle('bg-bridge-50', on);
        a.classList.toggle('text-bridge-800', on);
        a.classList.toggle('font-semibold', on);
        a.setAttribute('aria-current', on ? 'true' : 'false');
        const num = a.querySelector('.nav-num');
        if (num) {
          num.classList.toggle('bg-bridge-700', on);
          num.classList.toggle('text-white', on);
          num.classList.toggle('bg-slate-100', !on);
          num.classList.toggle('text-slate-500', !on);
        }
      });
      /* Back to the top of the pane, or section 7 opens halfway down. */
      const scroller = document.getElementById('adminContent');
      if (scroller) scroller.scrollTop = 0;
      if (history.replaceState) history.replaceState(null, '', '#' + id);
    }

    if (links.length && panes.length) {
      links.forEach(a => a.addEventListener('click', () => showSection(a.dataset.navLink)));
      /* Reopen on the same section after a reload. */
      const fromHash = (location.hash || '').replace('#', '');
      showSection(fromHash || panes[0].id);
      window.addEventListener('hashchange', () => {
        showSection((location.hash || '').replace('#', ''));
      });
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
