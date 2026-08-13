/* ============================================================
   ADMIN CONTENT FIELDS

   Save and image-upload handling for every screen that edits the
   content table through the ContentSections component.

   An image field stores "media:<id>", not a URL, so the same picture can
   be re-served through /api/media whatever the deployment. Clearing a
   field writes an empty string rather than deleting the row, which is
   what lets the page fall back to its built-in default.
   ============================================================ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveContentBtn');

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
          showToast('Image uploaded — click Save to apply');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    document.querySelectorAll('.img-clear').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        document.querySelector(`.field-input[data-key="${key}"]`).value = '';
        showToast('Image cleared — click Save to apply');
      });
    });

    if (!saveBtn) return;
    saveBtn.addEventListener('click', async () => {
      const payload = {};
      document.querySelectorAll('.field-input').forEach(el => { payload[el.dataset.key] = el.value; });
      saveBtn.disabled = true;
      const original = saveBtn.textContent;
      saveBtn.textContent = 'Saving…';
      try {
        await apiFetch('/api/content', { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Saved — refresh the public page to see it');
      } catch (e) {
        showToast(e.message || 'Could not save', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = original;
      }
    });
  });
})();
