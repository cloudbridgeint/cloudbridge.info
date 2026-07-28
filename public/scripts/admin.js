
(function () {
  // Activate for the clean /cbc-admin path, or the old query param as a fallback.
  // Everything else on the page (including all other scripts) runs untouched either way.
  var params = new URLSearchParams(window.location.search);
  var pathMatch = window.location.pathname.replace(/\/$/, '') === '/cbc-admin';
  var queryMatch = params.get('cbadmin') === 'manage';
  if (!pathMatch && !queryMatch) return;

  document.getElementById('cbAdminRoot').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // -------- login gate (basic front-door check, not real security --------
  // -------- the GitHub token step below is the actual access control) ----
  var ADMIN_EMAIL = 'cloudb.global@gmail.com';
  var ADMIN_PASSWORD = 'cbc@1234';
  document.getElementById('cbAdminLoginBtn').onclick = function () {
    var email = document.getElementById('cbAdminEmailInput').value.trim();
    var pass = document.getElementById('cbAdminPasswordInput').value;
    var err = document.getElementById('cbAdminLoginError');
    if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
      err.classList.add('hidden');
      document.getElementById('cbAdminLoginGate').classList.add('hidden');
      document.getElementById('cbAdminGate').classList.remove('hidden');
    } else {
      err.textContent = 'Incorrect email or password.';
      err.classList.remove('hidden');
    }
  };

  var COUNTRY_PANELS = ['uk','usa','canada','malta','france','spain','finland','newzealand','netherlands','malaysia'];
  var COUNTRY_LABELS = {uk:'UK',usa:'USA',canada:'Canada',malta:'Malta',france:'France',spain:'Spain',finland:'Finland',newzealand:'New Zealand',netherlands:'Netherlands',malaysia:'Malaysia'};

  function findPanelBounds(html, panelName) {
    var openRe = new RegExp('<div class="uni-tab-panel[^"]*" data-panel="' + panelName + '">');
    var openMatch = openRe.exec(html);
    if (!openMatch) throw new Error('Panel not found: ' + panelName);
    var start = openMatch.index;
    var openTag = openMatch[0];
    var afterOpen = start + openTag.length;
    var closeTriple = '        </div>\n      </div>\n    </div>';
    var closeIdx = html.indexOf(closeTriple, afterOpen);
    if (closeIdx === -1) throw new Error('Closing sequence not found for panel: ' + panelName);
    var end = closeIdx + closeTriple.length;
    return { start: start, end: end, openTag: openTag };
  }

  function extractItems(html, panelName) {
    var b = findPanelBounds(html, panelName);
    var block = html.slice(b.start, b.end);
    var itemRe = /<div class="uni-logo-item[^"]*"><img src="([^"]+)" alt="([^"]*)"[^>]*><\/div>/g;
    var seen = {};
    var unique = [];
    var m;
    while ((m = itemRe.exec(block)) !== null) {
      if (!seen[m[1]]) { seen[m[1]] = true; unique.push({ src: m[1], alt: m[2] }); }
    }
    return unique;
  }

  function buildPanelBlock(openTag, uniqueItems) {
    var doubled = uniqueItems.concat(uniqueItems);
    var lines = [];
    lines.push(openTag);
    lines.push('      <div class="uni-logo-viewport overflow-hidden">');
    lines.push('        <div class="uni-logo-track flex gap-4">');
    doubled.forEach(function (item) {
      lines.push('        <div class="uni-logo-item shrink-0 h-24 w-40 rounded-lg bg-white border border-black/10 shadow flex items-center justify-center p-4"><img src="' + item.src + '" alt="' + item.alt + '" class="max-h-full max-w-full object-contain"></div>');
    });
    lines.push('        </div>');
    lines.push('      </div>');
    lines.push('    </div>');
    return lines.join('\n');
  }

  function replacePanel(html, panelName, uniqueItems) {
    var b = findPanelBounds(html, panelName);
    var newBlock = buildPanelBlock(b.openTag, uniqueItems);
    return html.slice(0, b.start) + newBlock + html.slice(b.end);
  }

  var OWNER = 'cloudbridgeint';
  var REPO = 'cloudbridge.info';
  var BRANCH = 'main';
  var token = null;
  var activeCountry = 'uk';
  var liveItemsCache = {};
  var pendingAdds = {};
  var pendingRemoves = {};
  COUNTRY_PANELS.forEach(function (p) { pendingAdds[p] = []; pendingRemoves[p] = {}; });

  function ghHeaders() { return { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }; }

  function ghGetFile(path) {
    return fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + path + '?ref=' + BRANCH, { headers: ghHeaders() })
      .then(function (res) { if (!res.ok) throw new Error('GET ' + path + ' failed: ' + res.status); return res.json(); });
  }

  function ghPutFile(path, base64Content, message, sha) {
    var body = { message: message, content: base64Content, branch: BRANCH };
    if (sha) body.sha = sha;
    return fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + path, {
      method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, ghHeaders()), body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) return res.text().then(function (t) { throw new Error('PUT ' + path + ' failed: ' + res.status + ' ' + t); });
      return res.json();
    });
  }

  function cbLog(msg) {
    var box = document.getElementById('cbAdminLogBox');
    box.classList.remove('hidden');
    var line = document.createElement('div');
    line.textContent = '› ' + msg;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  }

  function slugify(name) { return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result.split(',')[1]); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function decodeGhContent(b64) { return decodeURIComponent(escape(atob(b64.replace(/\n/g, '')))); }
  function encodeToGhContent(str) { return btoa(unescape(encodeURIComponent(str))); }

  function renderTabs() {
    var box = document.getElementById('cbAdminCountryTabs');
    box.innerHTML = '';
    COUNTRY_PANELS.forEach(function (p) {
      var btn = document.createElement('button');
      btn.textContent = COUNTRY_LABELS[p];
      btn.className = 'px-4 py-1.5 rounded-lg text-sm font-semibold border ' +
        (p === activeCountry ? 'bg-sunrise-500 text-white border-sunrise-500' : 'bg-white text-bridge-900 border-black/10 hover:border-bridge-300');
      btn.onclick = function () { activeCountry = p; renderTabs(); renderGrid(); };
      box.appendChild(btn);
    });
  }

  function currentEffectiveItems(panel) {
    var live = (liveItemsCache[panel] || []).filter(function (it) { return !pendingRemoves[panel][it.src]; });
    var staged = pendingAdds[panel].map(function (a) { return { src: a.slug, alt: a.name, __pending: true, __previewUrl: a.previewUrl }; });
    return live.concat(staged);
  }

  function renderGrid() {
    document.getElementById('cbAdminPanelTitle').textContent = COUNTRY_LABELS[activeCountry] + ' — current logos';
    var grid = document.getElementById('cbAdminLogoGrid');
    grid.innerHTML = '';
    var items = currentEffectiveItems(activeCountry);
    document.getElementById('cbAdminItemCount').textContent = items.length + ' logo' + (items.length === 1 ? '' : 's');
    items.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'border rounded-lg p-3 flex flex-col items-center gap-2 ' + (item.__pending ? 'border-harbor-500 bg-harbor-500/5' : 'border-black/10');
      if (item.__pending) {
        var tag = document.createElement('div');
        tag.className = 'text-[10px] font-bold text-harbor-600 uppercase';
        tag.textContent = 'Pending add';
        card.appendChild(tag);
      }
      var img = document.createElement('img');
      img.src = item.__previewUrl || item.src;
      img.className = 'h-14 object-contain';
      var label = document.createElement('div');
      label.className = 'text-xs text-center text-ink/70';
      label.textContent = item.alt;
      var removeBtn = document.createElement('button');
      removeBtn.textContent = item.__pending ? 'Cancel' : 'Remove';
      removeBtn.className = 'text-[11px] text-sunrise-600 hover:text-sunrise-700 font-semibold';
      removeBtn.onclick = function () {
        if (item.__pending) {
          pendingAdds[activeCountry] = pendingAdds[activeCountry].filter(function (a) { return a.slug !== item.src; });
        } else {
          pendingRemoves[activeCountry][item.src] = true;
        }
        renderGrid();
        updateStageStatus();
      };
      card.appendChild(img);
      card.appendChild(label);
      card.appendChild(removeBtn);
      grid.appendChild(card);
    });
  }

  function updateStageStatus() {
    var totalAdds = 0, totalRemoves = 0;
    COUNTRY_PANELS.forEach(function (p) {
      totalAdds += pendingAdds[p].length;
      totalRemoves += Object.keys(pendingRemoves[p]).length;
    });
    var status = document.getElementById('cbAdminStageStatus');
    var saveBtn = document.getElementById('cbAdminSaveBtn');
    if (totalAdds === 0 && totalRemoves === 0) {
      status.textContent = 'No pending changes.';
      saveBtn.disabled = true;
    } else {
      status.textContent = totalAdds + ' to add, ' + totalRemoves + ' to remove, across all countries.';
      saveBtn.disabled = false;
    }
  }

  document.getElementById('cbAdminAddBtn').onclick = function () {
    var name = document.getElementById('cbAdminNewName').value.trim();
    var fileInput = document.getElementById('cbAdminNewFile');
    var file = fileInput.files[0];
    if (!name) { alert('Enter an institution name.'); return; }
    if (!file) { alert('Choose a logo image.'); return; }
    var slug = 'assets/universities/' + slugify(name) + '.png';
    var previewUrl = URL.createObjectURL(file);
    pendingAdds[activeCountry].push({ name: name, file: file, slug: slug, previewUrl: previewUrl });
    document.getElementById('cbAdminNewName').value = '';
    fileInput.value = '';
    renderGrid();
    updateStageStatus();
  };

  document.getElementById('cbAdminSaveBtn').onclick = function () {
    var saveBtn = document.getElementById('cbAdminSaveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    var uploadChain = Promise.resolve();
    COUNTRY_PANELS.forEach(function (panel) {
      pendingAdds[panel].forEach(function (add) {
        uploadChain = uploadChain.then(function () {
          cbLog('Uploading ' + add.slug + ' …');
          return fileToBase64(add.file).then(function (b64) {
            return ghPutFile(add.slug, b64, 'Add ' + add.name + ' logo asset');
          }).then(function () { cbLog('✓ Uploaded ' + add.slug); });
        });
      });
    });

    uploadChain.then(function () {
      cbLog('Fetching latest index.html…');
      return ghGetFile('index.html');
    }).then(function (fileData) {
      var html = decodeGhContent(fileData.content);
      var sha = fileData.sha;
      var changedAny = false;
      COUNTRY_PANELS.forEach(function (panel) {
        if (pendingAdds[panel].length === 0 && Object.keys(pendingRemoves[panel]).length === 0) return;
        var currentLive = extractItems(html, panel);
        var afterRemove = currentLive.filter(function (it) { return !pendingRemoves[panel][it.src]; });
        var afterAdd = afterRemove.concat(pendingAdds[panel].map(function (a) { return { src: a.slug, alt: a.name }; }));
        html = replacePanel(html, panel, afterAdd);
        changedAny = true;
        cbLog('✓ Updated ' + COUNTRY_LABELS[panel] + ' panel (' + afterAdd.length + ' logos)');
      });
      if (!changedAny) { cbLog('Nothing to save.'); return; }
      cbLog('Committing index.html…');
      var b64Html = encodeToGhContent(html);
      return ghPutFile('index.html', b64Html, 'Update Featured Universities via admin panel', sha).then(function (commitRes) {
        cbLog('✓ Committed: ' + commitRes.commit.html_url);
        COUNTRY_PANELS.forEach(function (p) { pendingAdds[p] = []; pendingRemoves[p] = {}; });
        return loadLiveItems();
      }).then(function () {
        renderGrid();
        updateStageStatus();
        cbLog('All changes saved successfully.');
      });
    }).catch(function (err) {
      cbLog('ERROR: ' + err.message);
      alert('Something went wrong: ' + err.message + '\n\nCheck the activity log for details before retrying.');
    }).finally(function () {
      saveBtn.textContent = 'Save changes';
      updateStageStatus();
    });
  };

  function loadLiveItems() {
    return ghGetFile('index.html').then(function (fileData) {
      var html = decodeGhContent(fileData.content);
      COUNTRY_PANELS.forEach(function (p) { liveItemsCache[p] = extractItems(html, p); });
    });
  }

  document.getElementById('cbAdminConnectBtn').onclick = function () {
    var val = document.getElementById('cbAdminTokenInput').value.trim();
    var errBox = document.getElementById('cbAdminGateError');
    errBox.classList.add('hidden');
    if (!val) return;
    token = val;
    cbLog('Verifying token access…');
    loadLiveItems().then(function () {
      document.getElementById('cbAdminGate').classList.add('hidden');
      document.getElementById('cbAdminDashboard').classList.remove('hidden');
      renderTabs();
      renderGrid();
      updateStageStatus();
    }).catch(function (err) {
      token = null;
      errBox.textContent = 'Could not connect: ' + err.message + '. Check the token has repo Contents read/write access.';
      errBox.classList.remove('hidden');
    });
  };

  document.getElementById('cbAdminDisconnectBtn').onclick = function () {
    token = null;
    liveItemsCache = {};
    COUNTRY_PANELS.forEach(function (p) { pendingAdds[p] = []; pendingRemoves[p] = {}; });
    document.getElementById('cbAdminTokenInput').value = '';
    document.getElementById('cbAdminDashboard').classList.add('hidden');
    document.getElementById('cbAdminGate').classList.remove('hidden');
  };
})();
