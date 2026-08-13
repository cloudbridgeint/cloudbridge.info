/* ============================================================
   EVENT REGISTRATION + DETAILS
   Any element carrying data-ev-register / data-ev-details opens the
   shared dialogs, reading the event from its own data attributes. That
   keeps the homepage banner and the events grid on one code path.
   ============================================================ */
(function () {
  'use strict';

  const regModal = document.getElementById('evRegModal');
  const detModal = document.getElementById('evDetailsModal');
  const hasInlineForm = !!document.querySelector('.ev-join-form');
  if (!regModal && !detModal && !hasInlineForm) return;

  let lastFocused = null;

  function readEvent(el) {
    return {
      id: el.getAttribute('data-ev-id') || '',
      title: el.getAttribute('data-ev-title') || '',
      date: el.getAttribute('data-ev-date') || '',
      location: el.getAttribute('data-ev-location') || '',
      description: el.getAttribute('data-ev-description') || '',
    };
  }

  function openModal(modal) {
    lastFocused = document.activeElement;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    const first = modal.querySelector('input, select, button');
    if (first) setTimeout(() => first.focus(), 0);
  }

  function closeModal(modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function closeAll() {
    [regModal, detModal].forEach(m => { if (m) m.classList.add('hidden'); });
    document.body.style.overflow = '';
  }

  /* ---------- registration ---------- */
  function openRegistration(ev) {
    if (!regModal) return;
    document.getElementById('evRegEventId').value = ev.id;
    document.getElementById('evRegEventTitle').textContent = ev.title;
    document.getElementById('evRegEventMeta').textContent =
      [ev.date, ev.location].filter(Boolean).join(' · ');

    // Reset back to the form in case the dialog was left on the success state.
    const form = document.getElementById('evRegForm');
    const done = document.getElementById('evRegDone');
    const err = document.getElementById('evRegError');
    form.reset();
    form.classList.remove('hidden');
    done.classList.add('hidden');
    err.classList.add('hidden');
    err.textContent = '';

    openModal(regModal);
  }

  /* ---------- details ---------- */
  function openDetails(ev) {
    if (!detModal) return;
    document.getElementById('evDetTitle').textContent = ev.title;
    document.getElementById('evDetDate').textContent = ev.date || 'Date to be announced';
    const locWrap = document.getElementById('evDetLocationWrap');
    if (ev.location) {
      document.getElementById('evDetLocation').textContent = ev.location;
      locWrap.classList.remove('hidden');
    } else {
      locWrap.classList.add('hidden');
    }
    document.getElementById('evDetDesc').textContent =
      ev.description || 'Full details for this event will be shared soon. Register and our team will contact you with the agenda.';

    const regBtn = document.getElementById('evDetRegister');
    regBtn.onclick = function () { closeModal(detModal); openRegistration(ev); };

    openModal(detModal);
  }

  /* ---------- triggers ---------- */
  document.addEventListener('click', function (e) {
    const reg = e.target.closest('[data-ev-register]');
    if (reg) { e.preventDefault(); openRegistration(readEvent(reg)); return; }

    const det = e.target.closest('[data-ev-details]');
    if (det) { e.preventDefault(); openDetails(readEvent(det)); return; }

    if (e.target.closest('[data-ev-close]')) { e.preventDefault(); closeAll(); return; }

    // Click on the backdrop itself, not the dialog box
    if (e.target === regModal || e.target === detModal) closeAll();
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });

  /* ---------- inline "Join Our Event" form on an event page ---------- */
  const joinForm = document.querySelector('.ev-join-form');
  if (joinForm) {
    joinForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const wrap = joinForm.parentElement;
      const errEl = joinForm.querySelector('.ev-form-error');
      const btn = joinForm.querySelector('button[type="submit"]');
      errEl.classList.add('hidden');

      const val = n => (joinForm.querySelector(`[name="${n}"]`) || {}).value || '';
      const payload = {
        event_id: joinForm.getAttribute('data-event-id'),
        name: val('name'), phone: val('phone'), email: val('email'),
        city: val('city'), branch: val('branch'),
      };

      btn.disabled = true;
      const label = btn.textContent;
      btn.textContent = 'Registering…';

      try {
        const res = await fetch('/api/event-registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');

        joinForm.classList.add('hidden');
        const done = wrap.querySelector('.ev-join-done');
        if (done) done.classList.remove('hidden');
      } catch (ex) {
        errEl.textContent = ex.message || 'Something went wrong. Please try again.';
        errEl.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  }

  /* ---------- submit ---------- */
  const form = document.getElementById('evRegForm');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = document.getElementById('evRegSubmit');
      const err = document.getElementById('evRegError');
      err.classList.add('hidden');

      const val = n => (form.querySelector(`[name="${n}"]`) || {}).value || '';
      const payload = {
        event_id: document.getElementById('evRegEventId').value,
        name: val('name'), phone: val('phone'), email: val('email'),
        city: val('city'), branch: val('branch'),
      };

      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = 'Registering…';

      try {
        const res = await fetch('/api/event-registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');

        document.getElementById('evRegDoneEvent').textContent =
          data.event || document.getElementById('evRegEventTitle').textContent;
        form.classList.add('hidden');
        document.getElementById('evRegDone').classList.remove('hidden');
      } catch (ex) {
        err.textContent = ex.message || 'Something went wrong. Please try again.';
        err.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    });
  }
})();
