/* ============================================================
   ADMIN LIST EDITOR

   Drives every repeatable list on the About and Scholarship screens —
   skills, reasons, timeline, funding types, steps, destination cards,
   FAQ rows — against /api/page-items.

   One script rather than one per screen: the lists differ only in which
   fields they show, so each editor declares that in a data attribute and
   the behaviour (add, edit, reorder, delete, save) is shared.

   Rows are collapsed to a single summary line by default. Ten skill
   cards fully expanded is a wall of identical boxes that hides where one
   item ends and the next begins; collapsed, the list reads as a list.

   Each editor registers a save() on window, so one Save button at the
   bottom of the screen can cover the text fields and every list at once.

   Lives in public/scripts/ because Tailwind only scans ./src and
   ./public/scripts — a class written here in a template string would
   otherwise be stripped from the built CSS.
   ============================================================ */
(function () {
  'use strict';

  window.__cbEditors = window.__cbEditors || [];

  const esc = (s) => {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  };

  /* Fields every list may show. Each editor picks a subset by name. */
  const FIELD_DEFS = {
    title: { label: 'Title', type: 'text' },
    subtitle: { label: 'Label', type: 'text' },
    body: { label: 'Text', type: 'textarea' },
    icon: { label: 'Icon', type: 'icon' },
    accent: { label: 'Colour', type: 'accent' },
    link_url: { label: 'Link URL', type: 'text' },
    link_label: { label: 'Link text', type: 'text' },
  };

  const isImageIcon = (v) => {
    const s = String(v || '');
    return s.startsWith('media:') || s.startsWith('/') || /^https?:\/\//i.test(s);
  };
  const iconImageUrl = (v) => {
    const s = String(v || '');
    return s.startsWith('media:') ? `/api/media/${s.slice(6)}` : s;
  };

  function initEditor(root) {
    const group = root.dataset.group;
    const fields = (root.dataset.fields || 'title,body').split(',').map(s => s.trim()).filter(Boolean);
    const labels = JSON.parse(root.dataset.labels || '{}');
    const icons = JSON.parse(root.dataset.icons || '{}');
    const accents = JSON.parse(root.dataset.accents || '{}');

    const listEl = root.querySelector('[data-list]');
    const addBtn = root.querySelector('[data-add]');
    const saveBtn = root.querySelector('[data-save]');
    const countEl = root.querySelector('[data-count]');

    let rows = [];
    const deleted = [];
    /* Client-side ids for rows that do not exist in the database yet, so an
       unsaved row can still be edited, reordered and removed. */
    let tempSeq = -1;
    const expanded = new Set();

    const fieldLabel = (name) => labels[name] || FIELD_DEFS[name].label;
    const markDirty = () => { if (window.__cbMarkDirty) window.__cbMarkDirty(); };

    function iconOptions(selected) {
      return Object.entries(icons)
        .map(([k, v]) => `<option value="${esc(k)}"${k === selected ? ' selected' : ''}>${esc(v.label)}</option>`)
        .join('');
    }

    function accentOptions(selected) {
      return ['<option value="">Default</option>']
        .concat(Object.entries(accents).map(([k, v]) =>
          `<option value="${esc(k)}"${k === selected ? ' selected' : ''}>${esc(v.label)}</option>`))
        .join('');
    }

    function fieldMarkup(row, name) {
      const v = row[name] == null ? '' : row[name];
      const label = `<label class="block text-xs font-semibold text-slate-700 mb-1">${esc(fieldLabel(name))}</label>`;
      const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bridge-500 focus:ring-2 focus:ring-bridge-100 outline-none';
      if (name === 'icon') {
        /* Two ways to set an icon: pick one of the built-in line icons, which
           keeps the page visually consistent, or upload a picture when the set
           has nothing close enough. An uploaded value is "media:<id>"; the
           dropdown then reads "Uploaded picture" and the preview shows it. */
        const uploaded = isImageIcon(v);
        const path = (icons[v] || icons[Object.keys(icons)[0]] || { path: '' }).path;
        const previewImg = uploaded
          ? `<img src="${esc(iconImageUrl(v))}" alt="" class="w-6 h-6 object-contain" data-icon-img>`
          : `<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" data-icon-preview><path d="${esc(path)}"></path></svg>`;
        return `<div>${label}
          <div class="flex items-center gap-2">
            <span class="shrink-0 w-9 h-9 rounded-lg bg-white ring-1 ring-slate-200 flex items-center justify-center text-slate-600 overflow-hidden" data-icon-box>
              ${previewImg}
            </span>
            <select class="flex-1 ${input}" data-field="icon">
              ${uploaded ? `<option value="${esc(v)}" selected>Uploaded picture</option>` : ''}
              ${iconOptions(v)}
            </select>
            <label class="shrink-0 cursor-pointer rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" title="Upload your own icon">
              Upload
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" data-icon-upload>
            </label>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">Pick one above, or upload a square PNG — around 128&times;128 with a transparent background works best.</p>
        </div>`;
      }
      if (name === 'accent') {
        return `<div>${label}<select class="${input}" data-field="accent">${accentOptions(v)}</select></div>`;
      }
      if (FIELD_DEFS[name].type === 'textarea') {
        return `<div>${label}<textarea rows="3" class="${input}" data-field="${name}">${esc(v)}</textarea></div>`;
      }
      return `<div>${label}<input class="${input}" data-field="${name}" value="${esc(v)}"></div>`;
    }

    /* What the row says when it is closed. Falls back down the fields so a row
       is never represented by an empty line. */
    function summaryOf(row) {
      const parts = [];
      if (row.subtitle && fields.includes('subtitle')) parts.push(row.subtitle);
      const main = row.title || row.body || '';
      if (main) parts.push(String(main).slice(0, 90));
      return parts.join(' — ') || 'Untitled item';
    }

    function render() {
      if (countEl) countEl.textContent = rows.length ? `(${rows.length})` : '';
      listEl.innerHTML = '';
      if (!rows.length) {
        listEl.innerHTML = '<p class="text-sm text-slate-500">Nothing here yet — use “Add item” to create the first one.</p>';
        return;
      }
      rows.forEach((row, i) => {
        const open = expanded.has(row.id);
        const card = document.createElement('div');
        card.className = 'rounded-xl border border-slate-200 bg-white overflow-hidden';
        card.dataset.index = String(i);
        card.innerHTML = `
          <div class="flex items-center gap-3 px-3 py-2.5">
            <span class="shrink-0 w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-[11px] font-bold flex items-center justify-center">${i + 1}</span>
            <button type="button" data-toggle class="flex-1 min-w-0 text-left">
              <span class="block text-sm font-medium truncate ${row.active ? 'text-slate-800' : 'line-through text-slate-400'}">${esc(summaryOf(row))}</span>
            </button>
            ${row.id < 0 ? '<span class="shrink-0 text-[10px] font-semibold text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">unsaved</span>' : ''}
            <div class="shrink-0 flex items-center gap-0.5">
              <button type="button" class="px-1.5 py-1 text-xs rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-25" data-move="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button>
              <button type="button" class="px-1.5 py-1 text-xs rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-25" data-move="1" ${i === rows.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button>
              <button type="button" data-toggle class="ml-1 px-2 py-1 text-xs font-semibold rounded-md text-bridge-700 hover:bg-bridge-50">${open ? 'Close' : 'Edit'}</button>
            </div>
          </div>
          <div class="${open ? '' : 'hidden'} border-t border-slate-100 px-4 py-4 bg-slate-50/50">
            <div class="grid gap-3 sm:grid-cols-2">
              ${fields.map(f => `<div class="${FIELD_DEFS[f].type === 'textarea' ? 'sm:col-span-2' : ''}">${fieldMarkup(row, f)}</div>`).join('')}
            </div>
            <div class="mt-4 flex items-center justify-between">
              <label class="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" data-field="active" ${row.active ? 'checked' : ''}> Show this on the website
              </label>
              <button type="button" class="px-2.5 py-1.5 text-xs font-semibold rounded-lg text-red-600 hover:bg-red-50" data-delete>Delete item</button>
            </div>
          </div>`;
        listEl.appendChild(card);
      });
    }

    /* Read the inputs back into `rows` before anything that re-renders, so
       typing is never lost by pressing Move, Add or Edit. */
    function collect() {
      listEl.querySelectorAll('[data-index]').forEach(card => {
        const row = rows[Number(card.dataset.index)];
        if (!row) return;
        card.querySelectorAll('[data-field]').forEach(el => {
          const name = el.dataset.field;
          row[name] = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value;
        });
      });
    }

    listEl.addEventListener('input', markDirty);

    /* Uploading an icon: store it on the row like any other value, then swap
       the preview so the choice is visible before saving. */
    listEl.addEventListener('change', async (e) => {
      const input = e.target.closest('[data-icon-upload]');
      if (!input || !input.files || !input.files[0]) return;
      const card = input.closest('[data-index]');
      const row = rows[Number(card.dataset.index)];
      const fd = new FormData();
      fd.append('file', input.files[0]);
      try {
        const res = await fetch('/api/media', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        collect();
        row.icon = `media:${data.id}`;
        markDirty();
        render();
        showToast('Icon uploaded — press Save to publish it');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    listEl.addEventListener('change', (e) => {
      markDirty();
      const sel = e.target.closest('select[data-field="icon"]');
      if (!sel) return;
      const preview = sel.closest('div').querySelector('[data-icon-preview] path');
      if (preview && icons[sel.value]) preview.setAttribute('d', icons[sel.value].path);
    });

    listEl.addEventListener('click', (e) => {
      const card = e.target.closest('[data-index]');
      if (!card) return;
      const i = Number(card.dataset.index);
      const row = rows[i];

      if (e.target.closest('[data-toggle]')) {
        collect();
        if (expanded.has(row.id)) expanded.delete(row.id); else expanded.add(row.id);
        render();
        return;
      }

      const move = e.target.closest('[data-move]');
      if (move) {
        collect();
        const j = i + Number(move.dataset.move);
        if (j < 0 || j >= rows.length) return;
        [rows[i], rows[j]] = [rows[j], rows[i]];
        markDirty();
        render();
        return;
      }

      if (e.target.closest('[data-delete]')) {
        if (!confirm('Delete this item? It disappears from the website when you save.')) return;
        collect();
        const [removed] = rows.splice(i, 1);
        if (removed.id > 0) deleted.push(removed.id);
        markDirty();
        render();
      }
    });

    addBtn.addEventListener('click', () => {
      collect();
      const blank = { id: tempSeq--, active: 1 };
      fields.forEach(f => { blank[f] = f === 'icon' ? Object.keys(icons)[0] || '' : ''; });
      rows.push(blank);
      expanded.add(blank.id);
      markDirty();
      render();
      const last = listEl.lastElementChild;
      if (last) {
        const first = last.querySelector('input[data-field],textarea[data-field],select[data-field]');
        if (first) first.focus();
      }
    });

    async function save() {
      collect();
      for (const id of deleted) {
        await apiFetch(`/api/page-items/${id}`, { method: 'DELETE' });
      }
      deleted.length = 0;

      /* Position is rewritten from the on-screen order every save, so what the
         editor sees is what the page renders. */
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const payload = { sort_order: i * 10, active: row.active ? 1 : 0 };
        fields.forEach(f => { payload[f] = row[f] ?? ''; });
        if (row.id > 0) {
          await apiFetch(`/api/page-items/${row.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
          payload.group_key = group;
          const res = await apiFetch('/api/page-items', { method: 'POST', body: JSON.stringify(payload) });
          if (expanded.delete(row.id)) expanded.add(res.id);
          row.id = res.id;
        }
      }
      render();
    }

    window.__cbEditors.push({ group, save });

    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        saveBtn.disabled = true;
        const original = saveBtn.textContent;
        saveBtn.textContent = 'Saving…';
        try {
          await save();
          showToast('Saved — refresh the public page to see it');
        } catch (err) {
          showToast(err.message || 'Could not save', 'error');
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = original;
        }
      });
    }

    apiFetch(`/api/page-items?group=${encodeURIComponent(group)}`)
      .then(data => { rows = data || []; render(); })
      .catch(err => {
        listEl.innerHTML = `<p class="text-sm text-red-600">Could not load: ${esc(err.message)}</p>`;
      });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-list-editor]').forEach(initEditor);
  });
})();
