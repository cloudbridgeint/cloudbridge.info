/* ============================================================
   ADMIN — COUNTRY SIDEBAR

   A list of countries beside the Courses and University & College
   tables. Both screens showed every country in one long list, so finding
   the UK entries among eighty meant scrolling or searching for them.

   Shared rather than written twice: the two screens differ only in what
   they hold, not in how you move around them.

   The chosen country is kept in the address (?country=UK), so a reload
   or a shared link comes back to the same place.
   ============================================================ */
(function () {
  'use strict';

  const esc = (s) => {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  };

  const NO_COUNTRY = '__none__';

  /**
   * @param {object} opts
   * @param {string} opts.navId    element to render the list into
   * @param {function} opts.getItems  returns the full, unfiltered list
   * @param {function} opts.onSelect  called with the chosen country ('' = all)
   * @param {string} opts.allLabel
   */
  window.initCountryFilter = function initCountryFilter(opts) {
    const nav = document.getElementById(opts.navId);
    if (!nav) return { current: () => '', render: () => {} };

    const allLabel = opts.allLabel || 'All countries';
    let current = new URLSearchParams(location.search).get('country') || '';

    function countryOf(item) {
      return String(item.country || '').trim();
    }

    function render() {
      const items = opts.getItems() || [];
      const counts = new Map();
      for (const it of items) {
        const key = countryOf(it) || NO_COUNTRY;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      /* Alphabetical, with anything missing a country last — it is the group
         someone needs to find and fix, not one to hunt for. */
      const keys = [...counts.keys()].filter(k => k !== NO_COUNTRY).sort((a, b) => a.localeCompare(b));
      if (counts.has(NO_COUNTRY)) keys.push(NO_COUNTRY);

      const entry = (value, label, count) => {
        const on = current === value;
        return `<li class="shrink-0 lg:shrink">
          <button type="button" data-country="${esc(value)}"
                  class="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-left transition whitespace-nowrap lg:whitespace-normal ${
                    on ? 'bg-bridge-50 text-bridge-800 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }">
            <span>${esc(label)}</span>
            <span class="shrink-0 text-xs ${on ? 'text-bridge-700' : 'text-slate-400'}">${count}</span>
          </button></li>`;
      };

      nav.innerHTML = `
        <p class="hidden lg:block text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">Countries</p>
        <ul class="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-0.5 lg:gap-0 lg:overflow-visible lg:pb-0">
          ${entry('', allLabel, items.length)}
          ${keys.map(k => entry(k === NO_COUNTRY ? NO_COUNTRY : k,
                                k === NO_COUNTRY ? 'No country set' : k,
                                counts.get(k))).join('')}
        </ul>`;
    }

    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-country]');
      if (!btn) return;
      current = btn.dataset.country;
      if (history.replaceState) {
        const url = new URL(location.href);
        if (current) url.searchParams.set('country', current);
        else url.searchParams.delete('country');
        history.replaceState(null, '', url.pathname + url.search);
      }
      render();
      opts.onSelect(current);
    });

    return {
      current: () => current,
      /** True when the row belongs in the current view. */
      matches: (item) => {
        if (!current) return true;
        const c = String(item.country || '').trim();
        return current === NO_COUNTRY ? !c : c === current;
      },
      render,
    };
  };
})();
