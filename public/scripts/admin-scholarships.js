/* ============================================================
   ADMIN — NAMED SCHOLARSHIPS

   The list of real awards shown in "Scholarships Open Now" on
   /scholarship. Separate from the card lists on the same screen, which
   are page furniture rather than funding a student can apply for.
   ============================================================ */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };

  let all = [];
  let editing = null;

  function render() {
    const el = $('schList');
    if (!all.length) {
      el.innerHTML = '<p class="text-sm text-slate-500">No scholarships added yet. Until you add one, the “Scholarships Open Now” section stays hidden on the public page.</p>';
      return;
    }
    el.innerHTML = all.map(s => `
      <div class="rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-semibold text-slate-900 text-sm">${esc(s.name)}</h3>
            ${s.featured ? '<span class="text-[11px] font-semibold text-sunrise-700 bg-sunrise-50 rounded-full px-2 py-0.5">Featured</span>' : ''}
            ${s.active ? '' : '<span class="text-[11px] font-semibold text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">Hidden</span>'}
          </div>
          <p class="text-xs text-slate-400 mt-1">
            ${[s.provider, s.country, s.level].filter(Boolean).map(esc).join(' · ') || 'No details set'}
          </p>
          <p class="text-xs text-slate-500 mt-1">
            ${[s.amount && `Amount: ${esc(s.amount)}`, s.deadline && `Deadline: ${esc(s.deadline)}`].filter(Boolean).join(' — ')}
          </p>
        </div>
        <button class="shrink-0 text-xs font-semibold text-bridge-700 hover:underline" data-edit="${s.id}">Edit</button>
      </div>`).join('');
  }

  async function load() {
    try {
      all = await apiFetch('/api/scholarships');
      render();
    } catch (e) {
      $('schList').innerHTML = `<p class="text-sm text-red-600">Could not load: ${esc(e.message)}</p>`;
    }
  }

  function openModal(row) {
    editing = row || null;
    $('schModalTitle').textContent = row ? 'Edit scholarship' : 'Add scholarship';
    $('sDelete').classList.toggle('hidden', !row);
    $('sId').value = row?.id || '';
    $('sName').value = row?.name || '';
    $('sProvider').value = row?.provider || '';
    $('sCountry').value = row?.country || '';
    $('sLevel').value = row?.level || '';
    $('sAmount').value = row?.amount || '';
    $('sCoverage').value = row?.coverage || '';
    $('sDeadline').value = row?.deadline || '';
    $('sDescription').value = row?.description || '';
    $('sEligibility').value = row?.eligibility || '';
    $('sApplyUrl').value = row?.apply_url || '';
    $('sFeatured').checked = row ? row.featured === 1 : false;
    $('sActive').checked = row ? row.active === 1 : true;
    $('schModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    $('schModal').classList.add('hidden');
    document.body.style.overflow = '';
    editing = null;
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('schAdd').addEventListener('click', () => openModal(null));
    $('sCancel').addEventListener('click', closeModal);
    $('schClose').addEventListener('click', closeModal);

    $('schList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-edit]');
      if (!btn) return;
      const row = all.find(x => String(x.id) === btn.dataset.edit);
      if (row) openModal(row);
    });

    $('sSave').addEventListener('click', async () => {
      const body = {
        name: $('sName').value.trim(),
        provider: $('sProvider').value.trim(),
        country: $('sCountry').value.trim(),
        level: $('sLevel').value.trim(),
        amount: $('sAmount').value.trim(),
        coverage: $('sCoverage').value.trim(),
        deadline: $('sDeadline').value.trim(),
        description: $('sDescription').value.trim(),
        eligibility: $('sEligibility').value.trim(),
        apply_url: $('sApplyUrl').value.trim(),
        featured: $('sFeatured').checked ? 1 : 0,
        active: $('sActive').checked ? 1 : 0,
      };
      if (!body.name) { showToast('The scholarship needs a name', 'error'); return; }
      if (body.apply_url && !/^https?:\/\//i.test(body.apply_url)) {
        showToast('The official page link must start with https://', 'error');
        return;
      }
      const btn = $('sSave');
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        if (editing) await apiFetch(`/api/scholarships/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
        else await apiFetch('/api/scholarships', { method: 'POST', body: JSON.stringify(body) });
        showToast('Scholarship saved');
        closeModal();
        load();
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = 'Save scholarship';
      }
    });

    $('sDelete').addEventListener('click', async () => {
      if (!editing) return;
      if (!confirm(`Delete “${editing.name}”? This cannot be undone — untick Published instead if you only want it off the page for now.`)) return;
      try {
        await apiFetch(`/api/scholarships/${editing.id}`, { method: 'DELETE' });
        showToast('Deleted');
        closeModal();
        load();
      } catch (e) { showToast(e.message, 'error'); }
    });

    load();
  });
})();
