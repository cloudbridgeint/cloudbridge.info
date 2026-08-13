/* ============================================================
   APPLY-NOW FORM WIDGETS
   - Searchable comboboxes (country of residence, city, destination)
   - Country list + per-country city list loaded on demand from
     /data/countries.json and /data/cities/<slug>.json
   - Multi-add preferred destination countries with removable chips
   - File upload preview (image + PDF) before submit
   ============================================================ */
(function () {
  'use strict';

  var COUNTRIES = null;          // [{name, slug, n}]
  var cityCache = {};            // slug -> [cityName]
  var OTHER_KEY = '__other__';

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  async function loadCountries() {
    if (COUNTRIES) return COUNTRIES;
    try {
      var res = await fetch('/data/countries.json');
      COUNTRIES = await res.json();
    } catch (e) {
      COUNTRIES = [];
    }
    return COUNTRIES;
  }
  async function loadCities(slug) {
    if (cityCache[slug]) return cityCache[slug];
    try {
      var res = await fetch('/data/cities/' + slug + '.json');
      if (!res.ok) throw new Error('no city file');
      cityCache[slug] = await res.json();
    } catch (e) {
      cityCache[slug] = [];
    }
    return cityCache[slug];
  }

  /* ---------- generic combobox ---------- */
  function Combo(rootId, opts) {
    var root = document.getElementById(rootId);
    if (!root) return null;
    opts = opts || {};

    var api = {
      root: root,
      hidden: root.querySelector('input[type=hidden]'),
      btn: root.querySelector('[data-combo-toggle]'),
      text: root.querySelector('[data-combo-text]'),
      panel: root.querySelector('[data-combo-panel]'),
      search: root.querySelector('[data-combo-search]'),
      list: root.querySelector('[data-combo-list]'),
      items: [],
      allowFreeText: !!opts.allowFreeText,
      allowOther: !!opts.allowOther,
      placeholder: opts.placeholder || '— Select —',
      onSelect: opts.onSelect || function () {},
      _openHandler: null
    };

    function render(q) {
      var nq = norm(q);
      var filtered = nq ? api.items.filter(function (v) { return norm(v).indexOf(nq) !== -1; }) : api.items;
      var capped = filtered.slice(0, 300);
      var html = '';

      if (api.allowOther) {
        html += '<button type="button" data-val="' + OTHER_KEY + '" style="font-weight:700;color:#1c3255">Other (not listed)</button>';
      }
      html += capped.map(function (v) {
        return '<button type="button" data-val="' + esc(v) + '">' + esc(v) + '</button>';
      }).join('');

      // Free-text fallback goes AFTER real matches — otherwise typing "ba" ranks
      // Use "ba" above Bagerhat/Bandarban/Barguna, which reads as the wrong default.
      if (api.allowFreeText && q && q.trim() && filtered.indexOf(q.trim()) === -1) {
        html += '<button type="button" data-val="' + esc(q.trim()) + '" style="font-weight:700;color:#1c3255;border-top:1px solid rgba(0,0,0,.07)">Use "' + esc(q.trim()) + '"</button>';
      }

      if (!capped.length && !api.allowFreeText && !api.allowOther) {
        html += '<p class="cb-combo-empty">No matches found</p>';
      }
      if (filtered.length > capped.length) {
        html += '<p class="cb-combo-empty">' + (filtered.length - capped.length) + ' more… keep typing to narrow down</p>';
      }
      api.list.innerHTML = html;
    }

    api.setItems = function (items) {
      api.items = items || [];
      render(api.search ? api.search.value : '');
    };
    api.value = function () { return api.hidden ? api.hidden.value : ''; };
    api.setValue = function (v, label) {
      if (api.hidden) api.hidden.value = v || '';
      api.text.textContent = v ? (label || v) : api.placeholder;
      api.btn.classList.toggle('placeholder', !v);
      api.root.classList.remove('invalid');
      var err = api.root.parentElement && api.root.parentElement.querySelector('[data-combo-error]');
      if (err) err.classList.remove('show');
    };
    api.reset = function (msg) {
      api.setValue('');
      if (msg) api.text.textContent = msg;
    };
    api.setDisabled = function (flag, msg) {
      api.btn.disabled = !!flag;
      if (flag && msg) { api.text.textContent = msg; api.btn.classList.add('placeholder'); }
    };
    api.open = function () {
      closeAll(api);
      api.panel.classList.remove('hidden');
      if (api.search) { api.search.value = ''; render(''); setTimeout(function () { api.search.focus(); }, 0); }
      else render('');
    };
    api.close = function () { api.panel.classList.add('hidden'); };
    api.isOpen = function () { return !api.panel.classList.contains('hidden'); };

    api.btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (api.btn.disabled) return;
      api.isOpen() ? api.close() : api.open();
    });
    if (api.search) {
      api.search.addEventListener('input', function () { render(api.search.value); });
      api.search.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var first = api.list.querySelector('button[data-val]');
          if (first) first.click();
        } else if (e.key === 'Escape') { api.close(); }
      });
    }
    api.list.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-val]');
      if (!btn) return;
      var v = btn.getAttribute('data-val');
      api.close();
      if (v === OTHER_KEY) { api.setValue(''); api.onSelect(OTHER_KEY); return; }
      api.setValue(v);
      api.onSelect(v);
    });
    root.addEventListener('click', function (e) { e.stopPropagation(); });

    COMBOS.push(api);
    return api;
  }

  var COMBOS = [];
  function closeAll(except) {
    COMBOS.forEach(function (c) { if (c !== except) c.close(); });
  }
  document.addEventListener('click', function () { closeAll(null); });

  /* ---------- step 1: residence country + city ---------- */
  var comboCountry, comboCity, comboDest;

  async function initResidence() {
    comboCountry = Combo('comboResidenceCountry', {
      placeholder: '— Select —',
      onSelect: async function (name) {
        var rec = (COUNTRIES || []).find(function (c) { return c.name === name; });
        comboCity.setValue('');
        if (!rec || !rec.n) {
          comboCity.setDisabled(false);
          comboCity.setItems([]);
          comboCity.reset('Type your city name');
          return;
        }
        comboCity.setDisabled(false);
        comboCity.reset('Loading cities…');
        var cities = await loadCities(rec.slug);
        comboCity.setItems(cities);
        comboCity.reset('— Select —');
      }
    });
    comboCity = Combo('comboResidenceCity', { placeholder: '— Select —', allowFreeText: true });
    if (!comboCountry) return;

    var list = await loadCountries();
    comboCountry.setItems(list.map(function (c) { return c.name; }));
  }

  /* ---------- step 3: preferred destination countries ---------- */
  var destSelected = [];

  function renderDestChips() {
    var wrap = document.getElementById('applyDestChips');
    var hidden = document.getElementById('applyDestinationCountries');
    if (!wrap) return;
    wrap.innerHTML = destSelected.map(function (c, i) {
      return '<span class="cb-chip">' + esc(c) +
        '<button type="button" data-rm="' + i + '" aria-label="Remove ' + esc(c) + '">&times;</button></span>';
    }).join('');
    if (hidden) hidden.value = destSelected.join(', ');
    var err = document.getElementById('applyDestError');
    if (err && destSelected.length) err.classList.remove('show');
  }

  function addDest(name) {
    name = String(name || '').trim();
    if (!name) return;
    var exists = destSelected.some(function (c) { return norm(c) === norm(name); });
    if (exists) return;
    destSelected.push(name);
    renderDestChips();
  }

  async function initDestination() {
    var addBtn = document.getElementById('applyDestAddBtn');
    var otherWrap = document.getElementById('applyDestOtherWrap');
    var otherInput = document.getElementById('applyDestOtherInput');
    var chips = document.getElementById('applyDestChips');
    if (!addBtn) return;

    comboDest = Combo('comboDestCountry', {
      placeholder: '— Select a country —',
      allowOther: true,
      onSelect: function (v) {
        if (v === OTHER_KEY) {
          otherWrap.classList.remove('hidden');
          comboDest.text.textContent = 'Other (not listed)';
          comboDest.btn.classList.remove('placeholder');
          addBtn.disabled = false;
          setTimeout(function () { otherInput.focus(); }, 0);
        } else {
          otherWrap.classList.add('hidden');
          otherInput.value = '';
          addBtn.disabled = false;
        }
      }
    });

    var list = await loadCountries();
    comboDest.setItems(list.map(function (c) { return c.name; }));

    addBtn.addEventListener('click', function () {
      var isOther = !otherWrap.classList.contains('hidden');
      var name = isOther ? otherInput.value : comboDest.value();
      if (!name || !String(name).trim()) {
        if (isOther) otherInput.focus();
        return;
      }
      addDest(name);
      otherInput.value = '';
      otherWrap.classList.add('hidden');
      comboDest.setValue('');
      addBtn.disabled = true;
    });

    otherInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addBtn.click(); }
    });

    chips.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-rm]');
      if (!btn) return;
      destSelected.splice(parseInt(btn.getAttribute('data-rm'), 10), 1);
      renderDestChips();
    });
  }

  /* ---------- step 4: file preview ---------- */
  var objectUrls = {};

  function humanSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  function openPreview(inputId, fileName) {
    var modal = document.getElementById('cbPreviewModal');
    var body = document.getElementById('cbPreviewBody');
    var nameEl = document.getElementById('cbPreviewName');
    var url = objectUrls[inputId];
    if (!modal || !url) return;
    nameEl.textContent = fileName || 'Preview';
    var lower = (fileName || '').toLowerCase();
    if (/\.(png|jpe?g|gif|webp|bmp)$/.test(lower)) {
      body.innerHTML = '<img src="' + url + '" alt="Uploaded document preview">';
    } else if (/\.pdf$/.test(lower)) {
      body.innerHTML = '<iframe src="' + url + '" title="Document preview"></iframe>';
    } else {
      body.innerHTML = '<div style="padding:2.5rem;text-align:center;color:#6b7280;font-size:.9rem">' +
        'This file type can\'t be previewed in the browser.<br>' +
        '<a href="' + url + '" download="' + esc(fileName) + '" style="color:#1c3255;font-weight:700;text-decoration:underline">Download to check it</a></div>';
    }
    modal.classList.remove('hidden');
  }

  function closePreview() {
    var modal = document.getElementById('cbPreviewModal');
    var body = document.getElementById('cbPreviewBody');
    if (!modal) return;
    modal.classList.add('hidden');
    body.innerHTML = '';
  }

  function initFilePreviews() {
    var rows = document.querySelectorAll('[data-file-row]');
    if (!rows.length) return;

    rows.forEach(function (row) {
      var inputId = row.getAttribute('data-file-row');
      var input = document.getElementById(inputId);
      var actions = row.querySelector('[data-file-actions]');
      var label = row.querySelector('.apply-file-label');
      if (!input || !actions || !label) return;

      var originalLabel = label.innerHTML;
      var originalActions = actions.innerHTML;

      input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        if (objectUrls[inputId]) { URL.revokeObjectURL(objectUrls[inputId]); delete objectUrls[inputId]; }

        if (!file) {
          label.innerHTML = originalLabel;
          actions.innerHTML = originalActions;
          row.classList.remove('has-file');
          return;
        }

        objectUrls[inputId] = URL.createObjectURL(file);
        row.classList.add('has-file');
        label.innerHTML =
          '<svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="#16a34a" stroke-width="2.4"><path d="M5 13l4 4L19 7"/></svg>' +
          '<span class="apply-file-name">' + esc(file.name) + '</span>' +
          '<span style="color:#9ca3af;font-weight:600">(' + humanSize(file.size) + ')</span>';
        actions.innerHTML =
          '<button type="button" class="apply-file-view" data-preview="' + inputId + '">' +
          '<svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>' +
          'View</button>' +
          '<button type="button" class="apply-file-clear" data-clear="' + inputId + '" aria-label="Remove file">&times;</button>';
      });
    });

    document.addEventListener('click', function (e) {
      var viewBtn = e.target.closest('[data-preview]');
      if (viewBtn) {
        e.preventDefault(); e.stopPropagation();
        var id = viewBtn.getAttribute('data-preview');
        var inp = document.getElementById(id);
        openPreview(id, inp && inp.files[0] ? inp.files[0].name : '');
        return;
      }
      var clearBtn = e.target.closest('[data-clear]');
      if (clearBtn) {
        e.preventDefault(); e.stopPropagation();
        var cid = clearBtn.getAttribute('data-clear');
        var cinp = document.getElementById(cid);
        if (cinp) { cinp.value = ''; cinp.dispatchEvent(new Event('change')); }
      }
    });

    var closeBtn = document.getElementById('cbPreviewClose');
    var modal = document.getElementById('cbPreviewModal');
    if (closeBtn) closeBtn.addEventListener('click', closePreview);
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closePreview(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePreview(); });
  }

  /* ---------- validation hooks used by applyNext() in main.js ---------- */
  window.applyValidateCombos = function (stepEl) {
    var ok = true;
    stepEl.querySelectorAll('[data-combo-required]').forEach(function (root) {
      var hidden = root.querySelector('input[type=hidden]');
      var err = root.parentElement && root.parentElement.querySelector('[data-combo-error]');
      if (!hidden || !hidden.value.trim()) {
        root.classList.add('invalid');
        if (err) { err.textContent = root.getAttribute('data-combo-required'); err.classList.add('show'); }
        if (ok) root.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ok = false;
      } else {
        root.classList.remove('invalid');
        if (err) err.classList.remove('show');
      }
    });

    if (stepEl.id === 'applyStep3') {
      var err3 = document.getElementById('applyDestError');
      if (!destSelected.length) {
        if (err3) err3.classList.add('show');
        if (ok) document.getElementById('comboDestCountry').scrollIntoView({ behavior: 'smooth', block: 'center' });
        ok = false;
      } else if (err3) err3.classList.remove('show');
    }
    return ok;
  };

  window.applyGetExtraFields = function () {
    return {
      residence_city: (document.getElementById('applyResidenceCity') || {}).value || '',
      destination_country: destSelected.join(', ')
    };
  };

  /* ---------- boot ---------- */
  function boot() {
    if (!document.getElementById('applyStep1')) return;
    initResidence();
    initDestination();
    initFilePreviews();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
