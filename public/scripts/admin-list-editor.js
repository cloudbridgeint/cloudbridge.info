/* ============================================================
   ADMIN LIST EDITOR

   Drives every repeatable list on the About and Scholarship screens —
   skills, reasons, timeline, funding types, steps, destination cards,
   FAQ rows — against /api/page-items.

   One script rather than one per screen: the lists differ only in which
   fields they show, so each editor declares that in a data attribute and
   the behaviour (add, edit, reorder, delete, save) is shared.

   Lives in public/scripts/ because Tailwind only scans ./src and
   ./public/scripts — a class written here in a template string would
   otherwise be stripped from the built CSS.
   ============================================================ */
(function () {
  'use strict';

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

  function initEditor(root) {
    const group = root.dataset.group;
    const fields = (root.dataset.fields || 'title,body').split(',').map(s => s.trim()).filter(Boolean);
    const labels = JSON.parse(root.dataset.labels || '{}');
    const icons = JSON.parse(root.dataset.icons || '{}');
    const accents = JSON.parse(root.dataset.accents || '{}');

    const listEl = root.querySelector('[data-list]');
    const addBtn = root.querySelector('[data-add]');
    const saveBtn = root.querySelector('[data-save]');

    let rows = [];
    /* Client-side ids for rows that do not exist in the database yet, so an
       unsaved row can still be edited, reordered and removed. */
    let tempSeq = -1;

    const fieldLabel = (name) => labels[name] || FIELD_DEFS[name].label;

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
      const label = `<label class="block text-xs font-medium text-slate-600 mb-1">${esc(fieldLabel(name))}</label>`;
      if (name === 'icon') {
        const path = (icons[v] || icons[Object.keys(icons)[0]] || { path: '' }).path;
        return `<div>${label}
          <div class="flex items-center gap-2">
            <span class="shrink-0 w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" data-icon-preview><path d="${esc(path)}"></path></svg>
            </span>
            <select class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" data-field="icon">${iconOptions(v)}</select>
          </div></div>`;
      }
      if (name === 'accent') {
        return `<div>${label}<select class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" data-field="accent">${accentOptions(v)}</select></div>`;
      }
      if (FIELD_DEFS[name].type === 'textarea') {
        return `<div>${label}<textarea rows="3" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" data-field="${name}">${esc(v)}</textarea></div>`;
      }
      return `<div>${label}<input class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" data-field="${name}" value="${esc(v)}"></div>`;
    }

    function render() {
      listEl.innerHTML = '';
      if (!rows.length) {
        listEl.innerHTML = '<p class="text-sm text-slate-500">Nothing here yet — use “Add item” to create the first one.</p>';
        return;
      }
      rows.forEach((row, i) => {
        const card = document.createElement('div');
        card.className = 'rounded-xl border border-slate-200 p-4';
        card.dataset.index = String(i);
        card.innerHTML = `
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-slate-400">#${i + 1}${row.id < 0 ? ' · unsaved' : ''}</span>
            <div class="flex items-center gap-1">
              <button type="button" class="px-2 py-1 text-xs rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30" data-move="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button>
              <button type="button" class="px-2 py-1 text-xs rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30" data-move="1" ${i === rows.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button>
              <label class="ml-2 flex items-center gap-1.5 text-xs text-slate-500">
                <input type="checkbox" data-field="active" ${row.active ? 'checked' : ''}> Show
              </label>
              <button type="button" class="ml-2 px-2 py-1 text-xs rounded-lg text-red-600 hover:bg-red-50" data-delete>Delete</button>
            </div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            ${fields.map(f => `<div class="${FIELD_DEFS[f].type === 'textarea' ? 'sm:col-span-2' : ''}">${fieldMarkup(row, f)}</div>`).join('')}
          </div>`;
        listEl.appendChild(card);
      });
    }

    /* Read the inputs back into `rows` before anything that re-renders, so
       typing is never lost by pressing Move or Add. */
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

    listEl.addEventListener('change', (e) => {
      const sel = e.target.closest('select[data-field="icon"]');
      if (!sel) return;
      const preview = sel.closest('div').querySelector('[data-icon-preview] path');
      if (preview && icons[sel.value]) preview.setAttribute('d', icons[sel.value].path);
    });

    listEl.addEventListener('click', (e) => {
      const move = e.target.closest('[data-move]');
      const del = e.target.closest('[data-delete]');
      if (!move && !del) return;
      const card = e.target.closest('[data-index]');
      const i = Number(card.dataset.index);
      collect();
      if (move) {
        const j = i + Number(move.dataset.move);
        if (j < 0 || j >= rows.length) return;
        [rows[i], rows[j]] = [rows[j], rows[i]];
        render();
        return;
      }
      if (!confirm('Delete this item? This cannot be undone.')) return;
      const [removed] = rows.splice(i, 1);
      if (removed.id > 0) deleted.push(removed.id);
      render();
    });

    const deleted = [];

    addBtn.addEventListener('click', () => {
      collect();
      const blank = { id: tempSeq--, active: 1 };
      fields.forEach(f => { blank[f] = f === 'icon' ? Object.keys(icons)[0] || '' : ''; });
      rows.push(blank);
      render();
      listEl.lastElementChild?.querySelector('input,textarea,select')?.focus();
    });

    saveBtn.addEventListener('click', async () => {
      collect();
      saveBtn.disabled = true;
      const original = saveBtn.textContent;
      saveBtn.textContent = 'Saving…';
      try {
        for (const id of deleted) {
          await apiFetch(`/api/page-items/${id}`, { method: 'DELETE' });
        }
        deleted.length = 0;

        /* Position is rewritten from the on-screen order every save, so what
           the editor sees is what the page renders. */
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const payload = { sort_order: i * 10, active: row.active ? 1 : 0 };
          fields.forEach(f => { payload[f] = row[f] ?? ''; });
          if (row.id > 0) {
            await apiFetch(`/api/page-items/${row.id}`, { method: 'PUT', body: JSON.stringify(payload) });
          } else {
            payload.group_key = group;
            const res = await apiFetch('/api/page-items', { method: 'POST', body: JSON.stringify(payload) });
            row.id = res.id;
          }
        }
        showToast('Saved — refresh the public page to see it');
        render();
      } catch (err) {
        showToast(err.message || 'Could not save', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = original;
      }
    });

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
