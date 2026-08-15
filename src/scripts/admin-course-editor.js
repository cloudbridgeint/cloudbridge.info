/*
 * The course content editor.
 *
 * Two jobs: save the form, and tell the person whether the course is actually
 * ready to be published. The readiness list is advisory rather than enforced —
 * a course can be published with gaps, because sometimes a university simply
 * does not state a module list — but it makes the gaps visible at the moment
 * of deciding, which is the only moment they matter.
 */
(function () {
  const form = document.getElementById('courseForm');
  if (!form) return;
  const id = form.dataset.id;

  const val = (elId) => {
    const el = document.getElementById(elId);
    return el ? el.value.trim() : '';
  };

  const BLOCKS = ['overview', 'entry_requirements', 'english_requirements', 'tuition_note',
    'scholarships_info', 'modules', 'careers', 'how_to_apply', 'faq'];

  /* What a page needs before it is worth a URL of its own. Overview, entry
     requirements and fees are the three a student came for; the rest improve
     the page but their absence does not make it thin. */
  const REQUIRED = [
    { label: 'Course overview', ok: () => val('f_overview').length > 200 },
    { label: 'Entry requirements', ok: () => !!val('f_entry_requirements') },
    { label: 'Tuition figure', ok: () => !!val('fTuitionFee') },
    { label: 'Source URL', ok: () => !!val('fSourceUrl') },
    { label: 'Last verified date', ok: () => !!val('fVerified') },
  ];
  const NICE = [
    { label: 'English requirements', ok: () => !!val('f_english_requirements') },
    { label: 'Modules', ok: () => !!val('f_modules') },
    { label: 'Career outcomes', ok: () => !!val('f_careers') },
    { label: 'How to apply', ok: () => !!val('f_how_to_apply') },
    { label: 'FAQ (adds FAQ rich results)', ok: () => !!val('f_faq') },
  ];

  function renderReadiness() {
    const box = document.getElementById('readiness');
    if (!box) return;
    const line = (item, required) => {
      const done = item.ok();
      const colour = done ? 'text-green-700' : required ? 'text-amber-700' : 'text-slate-400';
      const mark = done ? '✓' : '○';
      return `<li class="flex items-center gap-2 ${colour}"><span>${mark}</span><span>${item.label}</span></li>`;
    };
    const missing = REQUIRED.filter(r => !r.ok()).length;
    box.innerHTML = `
      <div class="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
        <p class="text-xs font-semibold text-slate-600">
          ${missing === 0
            ? 'Ready to publish.'
            : `${missing} thing${missing === 1 ? '' : 's'} still missing before this is worth publishing.`}
        </p>
        <ul class="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
          ${REQUIRED.map(r => line(r, true)).join('')}
          ${NICE.map(r => line(r, false)).join('')}
        </ul>
      </div>`;
  }

  form.addEventListener('input', renderReadiness);
  renderReadiness();

  document.getElementById('saveBtn').addEventListener('click', async () => {
    const payload = {
      slug: val('fSlug'),
      credential: val('fCredential'),
      tuition_fee: val('fTuitionFee'),
      // Typed as a comma list because that reads better in one input, stored
      // one per line like every other list on the site.
      intakes: val('fIntakes').split(',').map(s => s.trim()).filter(Boolean).join('\n'),
      source_url: val('fSourceUrl'),
      last_verified_at: val('fVerified'),
      published: document.getElementById('fPublished').checked,
    };
    for (const b of BLOCKS) payload[b] = val('f_' + b);

    try {
      const res = await apiFetch(`/api/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      // The server may have adjusted the slug to keep it unique.
      if (res && res.course && res.course.slug) {
        document.getElementById('fSlug').value = res.course.slug;
      }
      const badge = document.getElementById('publishBadge');
      const published = document.getElementById('fPublished').checked;
      badge.textContent = published ? 'Published' : 'Draft';
      badge.className = 'rounded-full px-3 py-1.5 text-xs font-semibold ' +
        (published ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600');
      showToast('Saved');
    } catch (e) {
      showToast(e.message, 'error');
    }
  });
})();
