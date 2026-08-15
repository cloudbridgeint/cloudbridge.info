/*
 * The course page editor.
 *
 * There is no publish control, so this script's real job is to answer the only
 * question the person has: is this course on the site, and if not, what is
 * still missing? That answer sits at the top of the page and updates as they
 * type, so nobody has to save to find out.
 */
(function () {
  const form = document.getElementById('courseForm');
  if (!form) return;
  const id = form.dataset.id;
  const liveUrl = form.dataset.liveurl || '';

  const val = (elId) => {
    const el = document.getElementById(elId);
    return el ? el.value.trim() : '';
  };

  const BLOCKS = ['overview', 'entry_requirements', 'english_requirements', 'tuition_note',
    'scholarships_info', 'modules', 'careers', 'how_to_apply', 'faq'];

  /* Mirrors the rule the server applies. Kept in the same words the labels
     use, because this list is read by someone deciding what to type next. */
  const NEEDED = [
    { label: 'About this course', ok: () => val('f_overview').length > 150,
      short: () => val('f_overview').length > 0 ? 'About this course (write a little more)' : 'About this course' },
    { label: 'Entry requirements', ok: () => !!val('f_entry_requirements') },
    { label: 'Tuition fee for one year', ok: () => !!val('fTuitionFee') },
  ];

  function renderStatus() {
    const box = document.getElementById('statusBox');
    const missing = NEEDED.filter(n => !n.ok());

    if (missing.length === 0) {
      box.className = 'mt-5 rounded-2xl px-5 py-4 ring-1 bg-green-50 ring-green-200';
      box.innerHTML =
        '<p class="font-semibold text-green-900 text-sm">This course is on the website.</p>' +
        '<p class="text-sm text-green-800 mt-1">Students can read this page' +
        (liveUrl ? ' at <span class="font-mono text-xs">cloudbridge.info' + liveUrl + '</span>' : '') +
        '. Any change you save shows up there straight away.</p>';
      return;
    }

    box.className = 'mt-5 rounded-2xl px-5 py-4 ring-1 bg-amber-50 ring-amber-200';
    box.innerHTML =
      '<p class="font-semibold text-amber-900 text-sm">This course is not on the website yet.</p>' +
      '<p class="text-sm text-amber-800 mt-1">Still to fill in:</p>' +
      '<ul class="mt-2 space-y-1 text-sm text-amber-900">' +
      missing.map(m => '<li>• ' + (m.short ? m.short() : m.label) + '</li>').join('') +
      '</ul>' +
      '<p class="text-xs text-amber-700 mt-2">It goes on the site by itself once these are done and you press Save.</p>';
  }

  form.addEventListener('input', renderStatus);
  renderStatus();

  document.getElementById('saveBtn').addEventListener('click', async () => {
    const payload = {
      slug: val('fSlug'),
      credential: val('fCredential'),
      tuition_fee: val('fTuitionFee'),
      // One per line everywhere else on the site; a comma list just reads
      // better in a single-line box.
      intakes: val('fIntakes').split(',').map(s => s.trim()).filter(Boolean).join('\n'),
      source_url: val('fSourceUrl'),
      last_verified_at: val('fVerified'),
    };
    for (const b of BLOCKS) payload[b] = val('f_' + b);

    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.textContent = 'Saving…';
    try {
      const res = await apiFetch('/api/courses/' + id, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const course = res && res.course;
      if (course && course.slug) document.getElementById('fSlug').value = course.slug;

      // The server decides whether the page exists; reflect what it decided.
      const view = document.getElementById('viewLive');
      if (view) view.classList.toggle('hidden', !(course && course.published));

      renderStatus();
      const note = document.getElementById('savedNote');
      note.classList.remove('hidden');
      setTimeout(() => note.classList.add('hidden'), 2500);
      showToast('Saved');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save';
    }
  });
})();
