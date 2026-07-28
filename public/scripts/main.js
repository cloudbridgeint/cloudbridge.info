

/* ============================================================
   NAVIGATION ENGINE — swaps #pageRoot content and re-initialises
   the interactive bits (FAQ, counters, video facade, forms) that
   exist on whichever page was just rendered.
   ============================================================ */
/* ============================================================
   HERO SLIDER — 3 slides, auto-rotates every 5s, arrows + dots.
   Only present on the Home page; guarded so other pages are fine.
   ============================================================ */
let sliderIndex = 0;
let sliderTimer = null;
let uniCarouselTimers = [];
function sliderShow(i) {
  const slides = document.querySelectorAll('#heroSlider .slider-slide');
  if (!slides.length) return;
  sliderIndex = (i + slides.length) % slides.length;
  slides.forEach((s, idx) => s.classList.toggle('hidden', idx !== sliderIndex));
  document.querySelectorAll('#heroSlider .slider-dot').forEach((d, idx) => {
    d.classList.toggle('bg-sunrise-400', idx === sliderIndex);
    d.classList.toggle('bg-white/30', idx !== sliderIndex);
  });
}
function sliderMove(delta) { sliderShow(sliderIndex + delta); resetSliderTimer(); }
function sliderGoTo(i) { sliderShow(i); resetSliderTimer(); }
function resetSliderTimer() {
  if (sliderTimer) clearInterval(sliderTimer);
  if (!document.getElementById('heroSlider')) return;
  sliderTimer = setInterval(() => sliderShow(sliderIndex + 1), 5000);
}
window.sliderMove = sliderMove;
window.sliderGoTo = sliderGoTo;

/* ============================================================
   TESTIMONIAL CAROUSEL — Contact page only. Shows 3 cards at a
   time, auto-advances every 3s (right to left), plus manual
   prev/next arrows and dot indicators.
   ============================================================ */
const TESTIMONIALS = [
  { name: 'Farhana Akter', meta: "MSc, University of Manchester — UK", quote: "CloudBridge helped me secure admission and a partial scholarship at my dream university. The whole process felt supported from day one.", color: 'linear-gradient(160deg,#1c3255,#2f5182)' },
  { name: 'Tanvir Ahmed', meta: 'BSc, Sunway University — Malaysia', quote: "I was confused about which university to choose until I spoke with CloudBridge. They matched me with a course that fit my budget and career goals perfectly.", color: 'linear-gradient(160deg,#157e69,#1c9c82)' },
  { name: 'Mehjabin Rahman', meta: 'MSc, Arizona State University — USA', quote: "From my SOP to my visa interview prep, my counsellor was available every step of the way. I got my F-1 visa on the first attempt.", color: 'linear-gradient(160deg,#aa1821,#e12d38)' },
  { name: 'Shakil Hossain', meta: 'BEng, University of Leeds — UK', quote: "The team was honest about what I could realistically get into, which I appreciated. No false promises, just clear guidance.", color: 'linear-gradient(160deg,#233f68,#4d70a8)' },
  { name: 'Nusaiba Islam', meta: "BSc, Taylor's University — Malaysia", quote: "Affordable tuition and a smooth application — CloudBridge found me options I hadn't even considered.", color: 'linear-gradient(160deg,#157e69,#22a396)' },
  { name: 'Rafiul Karim', meta: 'MBA, University of Alabama — USA', quote: "I recommend CloudBridge to every junior at my college. Their after-arrival support made my first month abroad so much easier.", color: 'linear-gradient(160deg,#86131a,#ce1d27)' },
];
let testiIndex = 0;
let testiTimer = null;
function testiInitials(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ? parts[0][0] : '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}
function testiCardsHTML() {
  const n = TESTIMONIALS.length;
  const visible = [0, 1, 2].map(o => TESTIMONIALS[(testiIndex + o) % n]);
  return visible.map(t => `
    <div class="bg-white rounded-2xl p-6 ring-1 ring-black/5 flex flex-col">
      <p class="text-sm text-ink/70 leading-relaxed flex-1">&ldquo;${t.quote}&rdquo;</p>
      <div class="mt-5 pt-4 border-t border-black/5 flex items-center gap-4">
        <div class="w-28 h-28 shrink-0 rounded-2xl flex items-center justify-center text-white font-display font-bold text-4xl" style="background-image:${t.color}">${testiInitials(t.name)}</div>
        <div>
          <p class="font-display font-bold text-bridge-900 text-sm">${t.name}</p>
          <p class="text-xs text-ink/50">${t.meta}</p>
        </div>
      </div>
    </div>
  `).join('');
}
function testiRenderDots() {
  const dots = document.getElementById('testiDots');
  if (!dots) return;
  dots.innerHTML = TESTIMONIALS.map((_, i) => `<button onclick="testiGoTo(${i})" class="slider-dot w-2.5 h-2.5 rounded-full ${i === testiIndex ? 'bg-sunrise-400' : 'bg-bridge-900/15'}" aria-label="Testimonial set ${i + 1}"></button>`).join('');
}
function testiRender() {
  const track = document.getElementById('testiTrack');
  if (!track) return;
  track.innerHTML = testiCardsHTML();
  testiRenderDots();
}
function testiAdvance(direction) {
  const track = document.getElementById('testiTrack');
  if (!track) { testiRender(); return; }
  const exitX = direction < 0 ? '100%' : '-100%';
  const enterX = direction < 0 ? '-100%' : '100%';
  track.style.transition = 'transform .4s ease';
  track.style.transform = 'translateX(' + exitX + ')';
  setTimeout(() => {
    track.innerHTML = testiCardsHTML();
    testiRenderDots();
    track.style.transition = 'none';
    track.style.transform = 'translateX(' + enterX + ')';
    void track.offsetWidth;
    track.style.transition = 'transform .4s ease';
    track.style.transform = 'translateX(0)';
  }, 400);
}
function testiMove(delta) { testiIndex = (testiIndex + delta + TESTIMONIALS.length) % TESTIMONIALS.length; testiAdvance(delta); resetTestiTimer(); }
function testiGoTo(i) {
  const delta = i > testiIndex ? 1 : (i < testiIndex ? -1 : 0);
  testiIndex = i;
  testiAdvance(delta || 1);
  resetTestiTimer();
}
function resetTestiTimer() {
  if (testiTimer) clearInterval(testiTimer);
  if (!document.getElementById('testiTrack')) return;
  testiTimer = setInterval(() => { testiIndex = (testiIndex + 1) % TESTIMONIALS.length; testiAdvance(1); }, 8000);
}
window.testiMove = testiMove;
window.testiGoTo = testiGoTo;

/* ============================================================
   CONTACT FORM WIDGETS — searchable subject combobox and the
   conditional "Other" preferred-destination field.
   ============================================================ */
const SUBJECTS = [
  'Business & Management', 'Accounting & Finance', 'Marketing', 'Economics', 'Hospitality & Tourism Management',
  'Computer Science', 'Data Science & Analytics', 'Artificial Intelligence', 'Cybersecurity', 'Information Technology',
  'Civil Engineering', 'Mechanical Engineering', 'Electrical & Electronic Engineering', 'Chemical Engineering', 'Engineering (General)',
  'Nursing', 'Public Health', 'Pharmacy', 'Medicine', 'Health & Life Sciences',
  'Law', 'Psychology', 'Social Sciences', 'International Relations', 'Education',
  'Architecture', 'Fine Arts & Design', 'Media & Communication', 'Fashion Design', 'Music',
  'Agriculture & Food Science', 'Environmental Science', 'Biotechnology', 'Mathematics', 'Physics',
];
function toggleSubjectDropdown() {
  const panel = document.getElementById('subjectPanel');
  if (!panel) return;
  const willOpen = panel.classList.contains('hidden');
  panel.classList.toggle('hidden');
  if (willOpen) {
    const search = document.getElementById('subjectSearch');
    renderSubjectList('');
    if (search) { search.value = ''; setTimeout(() => search.focus(), 0); }
  }
}
function renderSubjectList(query) {
  const list = document.getElementById('subjectList');
  if (!list) return;
  const q = query.toLowerCase();
  const filtered = SUBJECTS.filter(s => s.toLowerCase().includes(q));
  list.innerHTML = filtered.length
    ? filtered.map(s => `<button type="button" onclick="selectSubject(this.textContent)" class="w-full text-left px-4 py-2.5 text-sm text-ink/70 hover:bg-bridge-50">${s}</button>`).join('')
    : '<p class="px-4 py-3 text-sm text-ink/40">No matching subjects</p>';
}
function filterSubjects() {
  const search = document.getElementById('subjectSearch');
  renderSubjectList(search ? search.value : '');
}
function selectSubject(s) {
  const display = document.getElementById('subjectDisplay');
  if (display) display.value = s;
  const panel = document.getElementById('subjectPanel');
  if (panel) panel.classList.add('hidden');
}
document.addEventListener('click', (e) => {
  const combo = document.getElementById('subjectCombo');
  const panel = document.getElementById('subjectPanel');
  if (combo && panel && !combo.contains(e.target)) panel.classList.add('hidden');
});
function toggleOtherDestination() {
  const select = document.getElementById('destinationSelect');
  const input = document.getElementById('otherDestinationInput');
  if (!select || !input) return;
  input.classList.toggle('hidden', select.value !== 'Other');
}
window.toggleSubjectDropdown = toggleSubjectDropdown;
window.filterSubjects = filterSubjects;
window.selectSubject = selectSubject;
window.toggleOtherDestination = toggleOtherDestination;

/* Second instance of the same widgets, for the Entry Requirements form
   on the home page, which now sits alongside the main lead-form and
   needs its own element IDs to avoid collisions. */
function toggleSubjectDropdown2() {
  const panel = document.getElementById('subjectPanel2');
  if (!panel) return;
  const willOpen = panel.classList.contains('hidden');
  panel.classList.toggle('hidden');
  if (willOpen) {
    const search = document.getElementById('subjectSearch2');
    renderSubjectList2('');
    if (search) { search.value = ''; setTimeout(() => search.focus(), 0); }
  }
}
function renderSubjectList2(query) {
  const list = document.getElementById('subjectList2');
  if (!list) return;
  const q = query.toLowerCase();
  const filtered = SUBJECTS.filter(s => s.toLowerCase().includes(q));
  list.innerHTML = filtered.length
    ? filtered.map(s => `<button type="button" onclick="selectSubject2(this.textContent)" class="w-full text-left px-4 py-2.5 text-sm text-ink/70 hover:bg-bridge-50">${s}</button>`).join('')
    : '<p class="px-4 py-3 text-sm text-ink/40">No matching subjects</p>';
}
function filterSubjects2() {
  const search = document.getElementById('subjectSearch2');
  renderSubjectList2(search ? search.value : '');
}
function selectSubject2(s) {
  const display = document.getElementById('subjectDisplay2');
  if (display) display.value = s;
  const panel = document.getElementById('subjectPanel2');
  if (panel) panel.classList.add('hidden');
}
document.addEventListener('click', (e) => {
  const combo = document.getElementById('subjectCombo2');
  const panel = document.getElementById('subjectPanel2');
  if (combo && panel && !combo.contains(e.target)) panel.classList.add('hidden');
});
function toggleOtherDestination2() {
  const select = document.getElementById('destinationSelect2');
  const input = document.getElementById('otherDestinationInput2');
  if (!select || !input) return;
  input.classList.toggle('hidden', select.value !== 'Other');
}
window.toggleSubjectDropdown2 = toggleSubjectDropdown2;
window.filterSubjects2 = filterSubjects2;
window.selectSubject2 = selectSubject2;
window.toggleOtherDestination2 = toggleOtherDestination2;

/* ============================================================
   APPLY NOW — 4-step application wizard. Next/Back swap the
   visible step, validate required fields in the current step
   before advancing, and update the dot/line progress indicator.
   ============================================================ */
let applyStep = 1;
function applyPopulateSubjects() {
  const sel = document.getElementById('applySubjectSelect');
  if (!sel || sel.options.length > 1) return;
  (typeof SUBJECTS !== 'undefined' ? SUBJECTS : []).forEach(s => {
    const opt = document.createElement('option');
    opt.textContent = s;
    sel.appendChild(opt);
  });
}
function applyUpdateIndicator() {
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById('applyDot' + i);
    const label = document.getElementById('applyLabel' + i);
    if (!dot) continue;
    if (i < applyStep) {
      dot.className = 'apply-dot completed';
      dot.innerHTML = '&#10003;';
      label.className = 'apply-label completed';
    } else if (i === applyStep) {
      dot.className = 'apply-dot active';
      dot.textContent = i;
      label.className = 'apply-label active';
    } else {
      dot.className = 'apply-dot';
      dot.textContent = i;
      label.className = 'apply-label';
    }
  }
  for (let i = 1; i <= 3; i++) {
    const line = document.getElementById('applyLine' + i);
    if (line) line.style.transform = i < applyStep ? 'scaleX(1)' : 'scaleX(0)';
  }
}
function applyShowStep(step) {
  for (let i = 1; i <= 4; i++) {
    const panel = document.getElementById('applyStep' + i);
    if (panel) panel.classList.toggle('hidden', i !== step);
  }
  applyStep = step;
  applyUpdateIndicator();
  const backBtn = document.getElementById('applyBackBtn');
  const nextBtn = document.getElementById('applyNextBtn');
  if (backBtn) backBtn.classList.toggle('hidden', step === 1);
  if (nextBtn) nextBtn.innerHTML = step === 4
    ? 'Submit Application'
    : 'Next Step <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 010-1.06L10.94 10 7.21 6.29a.75.75 0 111.06-1.06l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0z" clip-rule="evenodd"/></svg>';
}
function applyNext() {
  const panel = document.getElementById('applyStep' + applyStep);
  if (panel) {
    const fields = panel.querySelectorAll('[required]');
    for (const field of fields) {
      if (!field.checkValidity()) { field.reportValidity(); return; }
    }
  }
  if (applyStep < 4) { applyShowStep(applyStep + 1); }
  else { applySubmitForm(); }
}
function applyBack() {
  if (applyStep > 1) applyShowStep(applyStep - 1);
}
function applySubmitForm() {
  const body = document.getElementById('applyFormBody');
  const thanks = document.getElementById('applyThanks');
  if (body) body.classList.add('hidden');
  if (thanks) thanks.classList.remove('hidden');

  try {
    const val = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
    const firstName = val('applyFirstName');
    const lastName = val('applyLastName');
    const payload = {
      name: `${firstName} ${lastName}`.trim(),
      email: val('applyEmail'),
      phone: val('applyPhone'),
      message: '',
      source_page: 'apply-now',
    };
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (err) { /* never let lead capture break the UX */ }
}
window.applyNext = applyNext;
window.applyBack = applyBack;

/* ============================================================
   FEATURED UNIVERSITIES LOGO CAROUSEL
   Shows 6 logos at a time (4 on small screens, 3 on mobile),
   auto-slides right-to-left every 2s, loops seamlessly.
   Each track's items are duplicated (8 real + 8 clone) so that
   when we've slid past the real 8, we can snap back to 0 unseen.
   ============================================================ */
function uniVisibleCount() {
  const w = window.innerWidth;
  if (w >= 1024) return 6;
  if (w >= 640) return 4;
  return 3;
}
let uniResizeHandlers = [];
let uniSizeFns = {};

function initAboutPage() {
  const slider = document.getElementById('aboutTeamSlider');
  if (slider) {
    const slides = slider.querySelectorAll('.team-slide');
    const dotsBox = document.getElementById('aboutTeamDots');
    dotsBox.innerHTML = Array.from(slides).map((_, i) => `<button type="button" class="team-dot${i === 0 ? ' active' : ''}" data-slide="${i}" aria-label="Team member ${i + 1}"></button>`).join('');
    const dots = dotsBox.querySelectorAll('.team-dot');
    let current = 0;
    function restartTimer() {
      if (window.aboutTeamTimer) clearInterval(window.aboutTeamTimer);
      window.aboutTeamTimer = setInterval(() => { showSlide((current + 1) % slides.length); }, 4000);
    }
    function showSlide(i) {
      slides.forEach(s => s.classList.toggle('active', parseInt(s.dataset.slide, 10) === i));
      dots.forEach(d => d.classList.toggle('active', parseInt(d.dataset.slide, 10) === i));
      current = i;
    }
    dots.forEach(d => d.addEventListener('click', () => { showSlide(parseInt(d.dataset.slide, 10)); restartTimer(); }));
    const prevBtn = document.getElementById('aboutTeamPrev');
    const nextBtn = document.getElementById('aboutTeamNext');
    if (prevBtn) prevBtn.addEventListener('click', () => { showSlide((current - 1 + slides.length) % slides.length); restartTimer(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { showSlide((current + 1) % slides.length); restartTimer(); });
    restartTimer();
  }

  const partnerTrack = document.getElementById('partnerLogoTrack');
  if (partnerTrack) {
    const items = Array.from(partnerTrack.children);
    if (window.partnerLogoTimer) clearInterval(window.partnerLogoTimer);
    let pos = 0;
    partnerTrack.style.transform = 'translateX(0px)';
    window.partnerLogoTimer = setInterval(() => {
      pos++;
      const itemWidth = items[0].getBoundingClientRect().width + 16;
      partnerTrack.style.transition = 'transform 0.6s ease';
      partnerTrack.style.transform = `translateX(-${Math.round(pos * itemWidth)}px)`;
      if (pos >= 2) {
        setTimeout(() => {
          partnerTrack.style.transition = 'none';
          partnerTrack.style.transform = 'translateX(0px)';
          pos = 0;
        }, 620);
      }
    }, 2500);
  }
}

function initUniCarousels() {
  uniCarouselTimers.forEach(t => clearInterval(t));
  uniCarouselTimers = [];
  uniResizeHandlers.forEach(h => window.removeEventListener('resize', h));
  uniResizeHandlers = [];

  document.querySelectorAll('.uni-logo-viewport').forEach(viewport => {
    const track = viewport.querySelector('.uni-logo-track');
    if (!track) return;
    const items = Array.from(track.children);
    const originalCount = items.length / 2;
    const gap = 16;

    function sizeItems() {
      const vc = uniVisibleCount();
      const width = Math.floor((viewport.clientWidth - gap * (vc - 1)) / vc);
      items.forEach(item => {
        item.style.width = width + 'px';
        item.style.boxSizing = 'border-box';
      });
    }
    sizeItems();
    window.addEventListener('resize', sizeItems);
    uniResizeHandlers.push(sizeItems);
    const uniPanelEl = viewport.closest('.uni-tab-panel');
    if (uniPanelEl) uniSizeFns[uniPanelEl.dataset.panel] = sizeItems;

    let pos = 0;
    track.style.transform = 'translateX(0px)';
    const timer = setInterval(() => {
      pos++;
      const itemWidth = items[0].getBoundingClientRect().width + gap;
      track.style.transition = 'transform 0.6s ease';
      track.style.transform = `translateX(-${Math.round(pos * itemWidth)}px)`;
      if (pos >= originalCount) {
        setTimeout(() => {
          track.style.transition = 'none';
          track.style.transform = 'translateX(0px)';
          pos = 0;
        }, 620);
      }
    }, 2000);
    uniCarouselTimers.push(timer);
  });
}

/* ============================================================
   UNIVERSITY & COLLEGE DIRECTORY
   Left-sidebar filters (country, city, fee range, intake, search)
   drive a live-filtered grid on the right. All filtering runs
   client-side against the static dataset below.
   ============================================================ */
const universityDirectory = [
  {name:"Aston University", country:"UK", city:"Birmingham", feeMin:13000, feeMax:17000, intake:["September","January"], intakeYear:["2026","2027"], scholarship:true, ranking:"423", faculty:["Business","Engineering","Life Sciences"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/aston.png"},
  {name:"Arden University", country:"UK", city:"Coventry", feeMin:7000, feeMax:9500, intake:["September","January","May"], intakeYear:["2026","2027"], scholarship:true, ranking:"Not Ranked", faculty:["Business","Computing","Law"], studyLevel:["Undergraduate","Postgraduate"], logo:"/assets/universities/arden.png"},
  {name:"Birmingham City University", country:"UK", city:"Birmingham", feeMin:12500, feeMax:16000, intake:["September","January"], intakeYear:["2026","2027"], scholarship:true, ranking:"1001-1200", faculty:["Business","Art & Design","Computing"], studyLevel:["Undergraduate","Postgraduate"], logo:"/assets/universities/bcu.png"},
  {name:"Bangor University", country:"UK", city:"Bangor", feeMin:11500, feeMax:15500, intake:["September","January"], intakeYear:["2026","2027"], scholarship:false, ranking:"601-650", faculty:["Business","Natural Sciences","Law"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/bangor.png"},
  {name:"Abertay University", country:"UK", city:"Dundee", feeMin:11000, feeMax:14500, intake:["September","January"], intakeYear:["2026","2027"], scholarship:true, ranking:"Not Ranked", faculty:["Computer Games","Business","Science & Engineering"], studyLevel:["Undergraduate","Postgraduate"], logo:"/assets/universities/abertay.png"},
  {name:"De Montfort University", country:"UK", city:"Leicester", feeMin:12000, feeMax:15500, intake:["September","January"], intakeYear:["2026","2027"], scholarship:true, ranking:"801-1000", faculty:["Business","Computing","Art & Design"], studyLevel:["Undergraduate","Postgraduate"], logo:"/assets/universities/demontfort.png"},

  {name:"Northeastern University", country:"USA", city:"Boston", feeMin:35000, feeMax:48000, intake:["September","January"], intakeYear:["2026","2027"], scholarship:true, ranking:"242", faculty:["Business","Engineering","Computer Science"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/northeastern.png"},
  {name:"Arizona State University", country:"USA", city:"Tempe", feeMin:22000, feeMax:29000, intake:["September","January"], intakeYear:["2026","2027"], scholarship:true, ranking:"203", faculty:["Business","Engineering","Journalism"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/asu.png"},
  {name:"University of Illinois Chicago", country:"USA", city:"Chicago", feeMin:24000, feeMax:31000, intake:["September","January"], intakeYear:["2026","2027"], scholarship:false, ranking:"621-630", faculty:["Business","Health Sciences","Engineering"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/uic.png"},
  {name:"University of Dayton", country:"USA", city:"Dayton", feeMin:20000, feeMax:26000, intake:["September","January"], intakeYear:["2026","2027"], scholarship:true, ranking:"Not Ranked", faculty:["Business","Engineering","Education"], studyLevel:["Undergraduate","Postgraduate"], logo:"/assets/universities/dayton.png"},

  {name:"University of Toronto", country:"Canada", city:"Toronto", feeMin:28000, feeMax:42000, intake:["September","January"], intakeYear:["2026","2027"], scholarship:true, ranking:"25", faculty:["Business","Engineering","Arts & Science"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/toronto.png"},
  {name:"Simon Fraser University", country:"Canada", city:"Burnaby", feeMin:22000, feeMax:30000, intake:["September","January","May"], intakeYear:["2026","2027"], scholarship:true, ranking:"308", faculty:["Business","Computing Science","Health Sciences"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/sfu.png"},
  {name:"University of Manitoba", country:"Canada", city:"Winnipeg", feeMin:18000, feeMax:24000, intake:["September","January"], intakeYear:["2026","2027"], scholarship:false, ranking:"643", faculty:["Business","Engineering","Agriculture"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/manitoba.png"},
  {name:"Toronto Metropolitan University", country:"Canada", city:"Toronto", feeMin:21000, feeMax:27000, intake:["September","January"], intakeYear:["2026","2027"], scholarship:true, ranking:"711", faculty:["Business","Engineering","Media"], studyLevel:["Undergraduate","Postgraduate"], logo:"/assets/universities/tmu.png"},

  {name:"University of Malta", country:"Malta", city:"Msida", feeMin:8000, feeMax:12000, intake:["September","February","November"], intakeYear:["2026","2027"], scholarship:true, ranking:"Not Ranked", faculty:["Business","Law","Medicine"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/malta.png"},
  {name:"MCAST", country:"Malta", city:"Paola", feeMin:6000, feeMax:9000, intake:["September","February","December"], intakeYear:["2026","2027"], scholarship:false, ranking:"Not Ranked", faculty:["Engineering","Business","Applied Sciences"], studyLevel:["Diploma","Undergraduate"], logo:"/assets/universities/mcast.png"},
  {name:"American University of Malta", country:"Malta", city:"Bormla", feeMin:9000, feeMax:13000, intake:["September","January","November"], intakeYear:["2026","2027"], scholarship:true, ranking:"Not Ranked", faculty:["Business","Information Technology","Hospitality"], studyLevel:["Undergraduate","Postgraduate"], logo:"/assets/universities/aum.png"},

  {name:"Sorbonne University", country:"France", city:"Paris", feeMin:9000, feeMax:14000, intake:["September"], intakeYear:["2026","2027"], scholarship:true, ranking:"38", faculty:["Sciences","Medicine","Humanities"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/sorbonne.png"},
  {name:"Sciences Po", country:"France", city:"Paris", feeMin:15000, feeMax:22000, intake:["September","January"], intakeYear:["2026","2027"], scholarship:true, ranking:"Not Ranked", faculty:["Political Science","Law","International Affairs"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/sciencespo.png"},
  {name:"EM Lyon Business School", country:"France", city:"Lyon", feeMin:16000, feeMax:24000, intake:["September","January"], intakeYear:["2026","2027"], scholarship:false, ranking:"Not Ranked", faculty:["Business","Entrepreneurship","Finance"], studyLevel:["Undergraduate","Postgraduate"], logo:"/assets/universities/emlyon.png"},
  {name:"Toulouse Business School", country:"France", city:"Toulouse", feeMin:13000, feeMax:19000, intake:["September"], intakeYear:["2026","2027"], scholarship:true, ranking:"Not Ranked", faculty:["Business","Marketing","Finance"], studyLevel:["Undergraduate","Postgraduate"], logo:"/assets/universities/tbs.png"},

  {name:"IE University", country:"Spain", city:"Madrid", feeMin:18000, feeMax:26000, intake:["September","January"], intakeYear:["2026","2027"], scholarship:true, ranking:"Not Ranked", faculty:["Business","Law","Architecture"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/ie.png"},
  {name:"University of Barcelona", country:"Spain", city:"Barcelona", feeMin:8000, feeMax:12000, intake:["September"], intakeYear:["2026","2027"], scholarship:false, ranking:"164", faculty:["Medicine","Business","Social Sciences"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/barcelona.png"},
  {name:"ESADE", country:"Spain", city:"Barcelona", feeMin:19000, feeMax:27000, intake:["September"], intakeYear:["2026","2027"], scholarship:true, ranking:"Not Ranked", faculty:["Business","Law","Economics"], studyLevel:["Undergraduate","Postgraduate"], logo:"/assets/universities/esade.png"},
  {name:"Universidad Complutense Madrid", country:"Spain", city:"Madrid", feeMin:7000, feeMax:11000, intake:["September"], intakeYear:["2026","2027"], scholarship:false, ranking:"215", faculty:["Medicine","Law","Social Sciences"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/complutense.png"},

  {name:"University of Helsinki", country:"Finland", city:"Helsinki", feeMin:10000, feeMax:15000, intake:["September"], intakeYear:["2026","2027"], scholarship:true, ranking:"116", faculty:["Sciences","Medicine","Social Sciences"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/helsinki.png"},
  {name:"Aalto University", country:"Finland", city:"Espoo", feeMin:12000, feeMax:16000, intake:["September"], intakeYear:["2026","2027"], scholarship:true, ranking:"114", faculty:["Business","Engineering","Art & Design"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/aalto.png"},
  {name:"LUT University", country:"Finland", city:"Lappeenranta", feeMin:9000, feeMax:13000, intake:["September","January"], intakeYear:["2026","2027"], scholarship:false, ranking:"Not Ranked", faculty:["Business","Engineering","Energy Systems"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/lut.png"},

  {name:"University of Auckland", country:"New Zealand", city:"Auckland", feeMin:24000, feeMax:33000, intake:["February","July"], intakeYear:["2026","2027"], scholarship:true, ranking:"65", faculty:["Business","Engineering","Medical & Health Sciences"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/auckland.png"},
  {name:"University of Otago", country:"New Zealand", city:"Dunedin", feeMin:22000, feeMax:30000, intake:["February","July"], intakeYear:["2026","2027"], scholarship:true, ranking:"206", faculty:["Health Sciences","Business","Law"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/otago.png"},
  {name:"Victoria University of Wellington", country:"New Zealand", city:"Wellington", feeMin:21000, feeMax:28000, intake:["February","July"], intakeYear:["2026","2027"], scholarship:false, ranking:"241", faculty:["Law","Political Science","Business"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/vuw.png"},
  {name:"Massey University", country:"New Zealand", city:"Palmerston North", feeMin:20000, feeMax:27000, intake:["February","July"], intakeYear:["2026","2027"], scholarship:true, ranking:"293", faculty:["Agriculture","Business","Veterinary Science"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/massey.png"},

  {name:"University of Amsterdam", country:"Netherlands", city:"Amsterdam", feeMin:11000, feeMax:18000, intake:["September","February"], intakeYear:["2026","2027"], scholarship:true, ranking:"55", faculty:["Business","Law","Social Sciences"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/amsterdam.png"},
  {name:"Erasmus University Rotterdam", country:"Netherlands", city:"Rotterdam", feeMin:12000, feeMax:19000, intake:["September"], intakeYear:["2026","2027"], scholarship:true, ranking:"140", faculty:["Business","Economics","Medicine"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/erasmus.png"},
  {name:"Tilburg University", country:"Netherlands", city:"Tilburg", feeMin:9000, feeMax:15000, intake:["September","February"], intakeYear:["2026","2027"], scholarship:false, ranking:"347", faculty:["Business","Law","Social Sciences"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/tilburg.png"},
  {name:"Maastricht University", country:"Netherlands", city:"Maastricht", feeMin:10000, feeMax:16000, intake:["September","February"], intakeYear:["2026","2027"], scholarship:true, ranking:"239", faculty:["Business","Medicine","Law"], studyLevel:["Undergraduate","Postgraduate","PhD"], logo:"/assets/universities/maastricht.png"},

  {name:"Sunway University", country:"Malaysia", city:"Petaling Jaya", feeMin:6000, feeMax:9500, intake:["September","January","May"], intakeYear:["2026","2027"], scholarship:true, ranking:"Not Ranked", faculty:["Business","Engineering","Hospitality"], studyLevel:["Foundation","Undergraduate","Postgraduate"], logo:"/assets/universities/sunway.png"},
  {name:"Taylor's University", country:"Malaysia", city:"Subang Jaya", feeMin:6500, feeMax:10000, intake:["September","January","May"], intakeYear:["2026","2027"], scholarship:true, ranking:"Not Ranked", faculty:["Business","Culinary Arts","Computer Science"], studyLevel:["Foundation","Undergraduate","Postgraduate"], logo:"/assets/universities/taylors.png"},
  {name:"Monash University Malaysia", country:"Malaysia", city:"Bandar Sunway", feeMin:8000, feeMax:12500, intake:["September","January","May"], intakeYear:["2026","2027"], scholarship:false, ranking:"Not Ranked", faculty:["Business","Engineering","Pharmacy"], studyLevel:["Foundation","Undergraduate","Postgraduate"], logo:"/assets/universities/monash.png"},
  {name:"University of Nottingham Malaysia", country:"Malaysia", city:"Semenyih", feeMin:8500, feeMax:13000, intake:["September","January"], intakeYear:["2026","2027"], scholarship:true, ranking:"Not Ranked", faculty:["Business","Engineering","Science"], studyLevel:["Foundation","Undergraduate","Postgraduate"], logo:"/assets/universities/nottingham_my.png"}
];
const uniFeeBrackets = [0,5000,10000,15000,20000,25000,30000,35000,40000,50000];
function uniInitials(name) {
  return name.split(' ').filter(w => w[0] === w[0].toUpperCase() && /[A-Za-z]/.test(w[0])).slice(0,2).map(w => w[0]).join('').toUpperCase() || name.slice(0,2).toUpperCase();
}
const courseDirectory = [
  {name:"BSc Biomedical Science", university:"Aston University", country:"UK", city:"Birmingham", level:"Undergraduate", subject:"Life Sciences", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/aston.png"},
  {name:"BA Business Management", university:"Aston University", country:"UK", city:"Birmingham", level:"Undergraduate", subject:"Business", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/aston.png"},
  {name:"LLB Law", university:"Arden University", country:"UK", city:"Coventry", level:"Undergraduate", subject:"Law", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/arden.png"},
  {name:"BA Business Management", university:"Arden University", country:"UK", city:"Coventry", level:"Undergraduate", subject:"Business", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/arden.png"},
  {name:"BSc Computing", university:"Birmingham City University", country:"UK", city:"Birmingham", level:"Undergraduate", subject:"Computing", delivery:"Online", duration:"3 Years", logo:"/assets/universities/bcu.png"},
  {name:"BA Fashion Design", university:"Birmingham City University", country:"UK", city:"Birmingham", level:"Undergraduate", subject:"Art & Design", delivery:"Online", duration:"3 Years", logo:"/assets/universities/bcu.png"},
  {name:"BSc Chemistry", university:"Bangor University", country:"UK", city:"Bangor", level:"Undergraduate", subject:"Natural Sciences", delivery:"Blended", duration:"3 Years", logo:"/assets/universities/bangor.png"},
  {name:"MSc Environmental Science", university:"Bangor University", country:"UK", city:"Bangor", level:"Postgraduate", subject:"Natural Sciences", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/bangor.png"},
  {name:"BA Business Management", university:"Abertay University", country:"UK", city:"Dundee", level:"Undergraduate", subject:"Business", delivery:"Blended", duration:"3 Years", logo:"/assets/universities/abertay.png"},
  {name:"MSc Games Technology", university:"Abertay University", country:"UK", city:"Dundee", level:"Postgraduate", subject:"Computer Games", delivery:"Online", duration:"1 Year", logo:"/assets/universities/abertay.png"},
  {name:"BSc Cyber Security", university:"De Montfort University", country:"UK", city:"Leicester", level:"Undergraduate", subject:"Computing", delivery:"Online", duration:"3 Years", logo:"/assets/universities/demontfort.png"},
  {name:"MSc International Business", university:"De Montfort University", country:"UK", city:"Leicester", level:"Postgraduate", subject:"Business", delivery:"Online", duration:"1 Year", logo:"/assets/universities/demontfort.png"},
  {name:"PhD in Engineering", university:"Northeastern University", country:"USA", city:"Boston", level:"PhD", subject:"Engineering", delivery:"Online", duration:"3-4 Years", logo:"/assets/universities/northeastern.png"},
  {name:"PhD in Management", university:"Northeastern University", country:"USA", city:"Boston", level:"PhD", subject:"Business", delivery:"On-Campus", duration:"3-4 Years", logo:"/assets/universities/northeastern.png"},
  {name:"BEng Mechanical Engineering", university:"Arizona State University", country:"USA", city:"Tempe", level:"Undergraduate", subject:"Engineering", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/asu.png"},
  {name:"MEng Advanced Engineering", university:"Arizona State University", country:"USA", city:"Tempe", level:"Postgraduate", subject:"Engineering", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/asu.png"},
  {name:"MSc Marketing Management", university:"University of Illinois Chicago", country:"USA", city:"Chicago", level:"Postgraduate", subject:"Business", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/uic.png"},
  {name:"MSc Robotics", university:"University of Illinois Chicago", country:"USA", city:"Chicago", level:"Postgraduate", subject:"Engineering", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/uic.png"},
  {name:"MSc Finance & Investment", university:"University of Dayton", country:"USA", city:"Dayton", level:"Postgraduate", subject:"Business", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/dayton.png"},
  {name:"BA Business Management", university:"University of Dayton", country:"USA", city:"Dayton", level:"Undergraduate", subject:"Business", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/dayton.png"},
  {name:"MSc Engineering Management", university:"University of Toronto", country:"Canada", city:"Toronto", level:"Postgraduate", subject:"Engineering", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/toronto.png"},
  {name:"BEng Electrical Engineering", university:"University of Toronto", country:"Canada", city:"Toronto", level:"Undergraduate", subject:"Engineering", delivery:"Blended", duration:"3 Years", logo:"/assets/universities/toronto.png"},
  {name:"PhD in Management", university:"Simon Fraser University", country:"Canada", city:"Burnaby", level:"PhD", subject:"Business", delivery:"Online", duration:"3-4 Years", logo:"/assets/universities/sfu.png"},
  {name:"BA Marketing", university:"Simon Fraser University", country:"Canada", city:"Burnaby", level:"Undergraduate", subject:"Business", delivery:"Blended", duration:"3 Years", logo:"/assets/universities/sfu.png"},
  {name:"BA Business Management", university:"University of Manitoba", country:"Canada", city:"Winnipeg", level:"Undergraduate", subject:"Business", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/manitoba.png"},
  {name:"BSc Agriculture", university:"University of Manitoba", country:"Canada", city:"Winnipeg", level:"Undergraduate", subject:"Agriculture", delivery:"Online", duration:"3 Years", logo:"/assets/universities/manitoba.png"},
  {name:"MSc Finance & Investment", university:"Toronto Metropolitan University", country:"Canada", city:"Toronto", level:"Postgraduate", subject:"Business", delivery:"Online", duration:"1 Year", logo:"/assets/universities/tmu.png"},
  {name:"MSc Robotics", university:"Toronto Metropolitan University", country:"Canada", city:"Toronto", level:"Postgraduate", subject:"Engineering", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/tmu.png"},
  {name:"PhD in Medical Sciences", university:"University of Malta", country:"Malta", city:"Msida", level:"PhD", subject:"Medicine", delivery:"Online", duration:"3-4 Years", logo:"/assets/universities/malta.png"},
  {name:"PhD in Law", university:"University of Malta", country:"Malta", city:"Msida", level:"PhD", subject:"Law", delivery:"On-Campus", duration:"3-4 Years", logo:"/assets/universities/malta.png"},
  {name:"BA Business Management", university:"MCAST", country:"Malta", city:"Paola", level:"Undergraduate", subject:"Business", delivery:"Blended", duration:"3 Years", logo:"/assets/universities/mcast.png"},
  {name:"BEng Electrical Engineering", university:"MCAST", country:"Malta", city:"Paola", level:"Undergraduate", subject:"Engineering", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/mcast.png"},
  {name:"BA Hospitality Management", university:"American University of Malta", country:"Malta", city:"Bormla", level:"Undergraduate", subject:"Hospitality", delivery:"Online", duration:"3 Years", logo:"/assets/universities/aum.png"},
  {name:"BSc Information Technology", university:"American University of Malta", country:"Malta", city:"Bormla", level:"Undergraduate", subject:"Information Technology", delivery:"Online", duration:"3 Years", logo:"/assets/universities/aum.png"},
  {name:"MSc Public Health", university:"Sorbonne University", country:"France", city:"Paris", level:"Postgraduate", subject:"Medicine", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/sorbonne.png"},
  {name:"BSc Mathematics", university:"Sorbonne University", country:"France", city:"Paris", level:"Undergraduate", subject:"Sciences", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/sorbonne.png"},
  {name:"MA International Affairs", university:"Sciences Po", country:"France", city:"Paris", level:"Postgraduate", subject:"International Affairs", delivery:"Online", duration:"1 Year", logo:"/assets/universities/sciencespo.png"},
  {name:"BA Political Science", university:"Sciences Po", country:"France", city:"Paris", level:"Undergraduate", subject:"Political Science", delivery:"Online", duration:"3 Years", logo:"/assets/universities/sciencespo.png"},
  {name:"MSc Finance & Investment", university:"EM Lyon Business School", country:"France", city:"Lyon", level:"Postgraduate", subject:"Business", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/emlyon.png"},
  {name:"BSc Finance", university:"EM Lyon Business School", country:"France", city:"Lyon", level:"Undergraduate", subject:"Finance", delivery:"Blended", duration:"3 Years", logo:"/assets/universities/emlyon.png"},
  {name:"MSc Corporate Finance", university:"Toulouse Business School", country:"France", city:"Toulouse", level:"Postgraduate", subject:"Finance", delivery:"Online", duration:"1 Year", logo:"/assets/universities/tbs.png"},
  {name:"BA Marketing", university:"Toulouse Business School", country:"France", city:"Toulouse", level:"Undergraduate", subject:"Marketing", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/tbs.png"},
  {name:"MSc International Business", university:"IE University", country:"Spain", city:"Madrid", level:"Postgraduate", subject:"Business", delivery:"Online", duration:"1 Year", logo:"/assets/universities/ie.png"},
  {name:"BSc Architecture", university:"IE University", country:"Spain", city:"Madrid", level:"Undergraduate", subject:"Architecture", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/ie.png"},
  {name:"PhD in Medical Sciences", university:"University of Barcelona", country:"Spain", city:"Barcelona", level:"PhD", subject:"Medicine", delivery:"On-Campus", duration:"3-4 Years", logo:"/assets/universities/barcelona.png"},
  {name:"MBBS Medicine", university:"University of Barcelona", country:"Spain", city:"Barcelona", level:"Undergraduate", subject:"Medicine", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/barcelona.png"},
  {name:"BSc Economics", university:"ESADE", country:"Spain", city:"Barcelona", level:"Undergraduate", subject:"Economics", delivery:"Blended", duration:"3 Years", logo:"/assets/universities/esade.png"},
  {name:"BA Marketing", university:"ESADE", country:"Spain", city:"Barcelona", level:"Undergraduate", subject:"Business", delivery:"Online", duration:"3 Years", logo:"/assets/universities/esade.png"},
  {name:"MSc Social Sciences", university:"Universidad Complutense Madrid", country:"Spain", city:"Madrid", level:"Postgraduate", subject:"Social Sciences", delivery:"Blended", duration:"1 Year", logo:"/assets/universities/complutense.png"},
  {name:"LLB Law", university:"Universidad Complutense Madrid", country:"Spain", city:"Madrid", level:"Undergraduate", subject:"Law", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/complutense.png"},
  {name:"MA Sociology", university:"University of Helsinki", country:"Finland", city:"Helsinki", level:"Postgraduate", subject:"Social Sciences", delivery:"Blended", duration:"1 Year", logo:"/assets/universities/helsinki.png"},
  {name:"MSc Public Health", university:"University of Helsinki", country:"Finland", city:"Helsinki", level:"Postgraduate", subject:"Medicine", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/helsinki.png"},
  {name:"MSc Marketing Management", university:"Aalto University", country:"Finland", city:"Espoo", level:"Postgraduate", subject:"Business", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/aalto.png"},
  {name:"BA Business Management", university:"Aalto University", country:"Finland", city:"Espoo", level:"Undergraduate", subject:"Business", delivery:"Online", duration:"3 Years", logo:"/assets/universities/aalto.png"},
  {name:"BEng Civil Engineering", university:"LUT University", country:"Finland", city:"Lappeenranta", level:"Undergraduate", subject:"Engineering", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/lut.png"},
  {name:"MSc Engineering Management", university:"LUT University", country:"Finland", city:"Lappeenranta", level:"Postgraduate", subject:"Engineering", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/lut.png"},
  {name:"PhD in Engineering", university:"University of Auckland", country:"New Zealand", city:"Auckland", level:"PhD", subject:"Engineering", delivery:"On-Campus", duration:"3-4 Years", logo:"/assets/universities/auckland.png"},
  {name:"PhD in Health Sciences", university:"University of Auckland", country:"New Zealand", city:"Auckland", level:"PhD", subject:"Medical & Health Sciences", delivery:"On-Campus", duration:"3-4 Years", logo:"/assets/universities/auckland.png"},
  {name:"BSc Health Sciences", university:"University of Otago", country:"New Zealand", city:"Dunedin", level:"Undergraduate", subject:"Health Sciences", delivery:"Blended", duration:"3 Years", logo:"/assets/universities/otago.png"},
  {name:"BSc International Business", university:"University of Otago", country:"New Zealand", city:"Dunedin", level:"Undergraduate", subject:"Business", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/otago.png"},
  {name:"LLM International Law", university:"Victoria University of Wellington", country:"New Zealand", city:"Wellington", level:"Postgraduate", subject:"Law", delivery:"Blended", duration:"1 Year", logo:"/assets/universities/vuw.png"},
  {name:"MA Political Science", university:"Victoria University of Wellington", country:"New Zealand", city:"Wellington", level:"Postgraduate", subject:"Political Science", delivery:"Blended", duration:"1 Year", logo:"/assets/universities/vuw.png"},
  {name:"MSc Veterinary Science", university:"Massey University", country:"New Zealand", city:"Palmerston North", level:"Postgraduate", subject:"Veterinary Science", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/massey.png"},
  {name:"BA Business Management", university:"Massey University", country:"New Zealand", city:"Palmerston North", level:"Undergraduate", subject:"Business", delivery:"Online", duration:"3 Years", logo:"/assets/universities/massey.png"},
  {name:"PhD in Social Sciences", university:"University of Amsterdam", country:"Netherlands", city:"Amsterdam", level:"PhD", subject:"Social Sciences", delivery:"On-Campus", duration:"3-4 Years", logo:"/assets/universities/amsterdam.png"},
  {name:"BA Marketing", university:"University of Amsterdam", country:"Netherlands", city:"Amsterdam", level:"Undergraduate", subject:"Business", delivery:"Blended", duration:"3 Years", logo:"/assets/universities/amsterdam.png"},
  {name:"PhD in Medical Sciences", university:"Erasmus University Rotterdam", country:"Netherlands", city:"Rotterdam", level:"PhD", subject:"Medicine", delivery:"On-Campus", duration:"3-4 Years", logo:"/assets/universities/erasmus.png"},
  {name:"MBBS Medicine", university:"Erasmus University Rotterdam", country:"Netherlands", city:"Rotterdam", level:"Undergraduate", subject:"Medicine", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/erasmus.png"},
  {name:"BA Social Sciences", university:"Tilburg University", country:"Netherlands", city:"Tilburg", level:"Undergraduate", subject:"Social Sciences", delivery:"Blended", duration:"3 Years", logo:"/assets/universities/tilburg.png"},
  {name:"PhD in Management", university:"Tilburg University", country:"Netherlands", city:"Tilburg", level:"PhD", subject:"Business", delivery:"Online", duration:"3-4 Years", logo:"/assets/universities/tilburg.png"},
  {name:"LLB Law", university:"Maastricht University", country:"Netherlands", city:"Maastricht", level:"Undergraduate", subject:"Law", delivery:"Blended", duration:"3 Years", logo:"/assets/universities/maastricht.png"},
  {name:"PhD in Law", university:"Maastricht University", country:"Netherlands", city:"Maastricht", level:"PhD", subject:"Law", delivery:"On-Campus", duration:"3-4 Years", logo:"/assets/universities/maastricht.png"},
  {name:"MSc Marketing Management", university:"Sunway University", country:"Malaysia", city:"Petaling Jaya", level:"Postgraduate", subject:"Business", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/sunway.png"},
  {name:"BEng Mechanical Engineering", university:"Sunway University", country:"Malaysia", city:"Petaling Jaya", level:"Undergraduate", subject:"Engineering", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/sunway.png"},
  {name:"BA Culinary Arts Management", university:"Taylor's University", country:"Malaysia", city:"Subang Jaya", level:"Undergraduate", subject:"Culinary Arts", delivery:"On-Campus", duration:"3 Years", logo:"/assets/universities/taylors.png"},
  {name:"Foundation in Computing", university:"Taylor's University", country:"Malaysia", city:"Subang Jaya", level:"Foundation", subject:"Computer Science", delivery:"Online", duration:"1 Year", logo:"/assets/universities/taylors.png"},
  {name:"MSc Marketing Management", university:"Monash University Malaysia", country:"Malaysia", city:"Bandar Sunway", level:"Postgraduate", subject:"Business", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/monash.png"},
  {name:"Foundation in Engineering", university:"Monash University Malaysia", country:"Malaysia", city:"Bandar Sunway", level:"Foundation", subject:"Engineering", delivery:"On-Campus", duration:"1 Year", logo:"/assets/universities/monash.png"},
  {name:"Foundation in Engineering", university:"University of Nottingham Malaysia", country:"Malaysia", city:"Semenyih", level:"Foundation", subject:"Engineering", delivery:"Online", duration:"1 Year", logo:"/assets/universities/nottingham_my.png"},
  {name:"BSc Science", university:"University of Nottingham Malaysia", country:"Malaysia", city:"Semenyih", level:"Undergraduate", subject:"Science", delivery:"Online", duration:"3 Years", logo:"/assets/universities/nottingham_my.png"},
];

const uniCountryOrder = ["UK","USA","Canada","France","Spain","Finland","Netherlands","Malta","New Zealand","Malaysia"];
const uniAllMonths = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function initUniversityDirectory() {
  const grid = document.getElementById('uniDirectoryGrid');
  if (!grid) return;

  const countryBox = document.getElementById('uniFilterCountry');
  const cityBox = document.getElementById('uniFilterCity');
  const intakeBox = document.getElementById('uniFilterIntake');
  const intakeYearBox = document.getElementById('uniFilterIntakeYear');
  const facultyBox = document.getElementById('uniFilterFaculty');
  const studyLevelBox = document.getElementById('uniFilterStudyLevel');
  const universityBox = document.getElementById('uniFilterUniversity');
  const rankingSel = document.getElementById('uniFilterRanking');
  const feeMinSel = document.getElementById('uniFilterFeeMin');
  const feeMaxSel = document.getElementById('uniFilterFeeMax');
  const searchInput = document.getElementById('uniSearchInput');
  const resultsCount = document.getElementById('uniResultsCount');
  const emptyState = document.getElementById('uniEmptyState');
  const activeChips = document.getElementById('uniActiveChips');

  const countries = uniCountryOrder.filter(c => universityDirectory.some(u => u.country === c));
  const faculties = [...new Set(universityDirectory.flatMap(u => u.faculty))].sort();
  const studyLevelOrder = ["Foundation","Diploma","Undergraduate","Postgraduate","PhD"];
  const studyLevels = studyLevelOrder.filter(s => universityDirectory.some(u => u.studyLevel.includes(s)));
  const intakeYears = [...new Set(universityDirectory.flatMap(u => u.intakeYear))].sort();
  const universityNames = universityDirectory.map(u => u.name).sort();

  countryBox.innerHTML = countries.map(c => `
    <label class="uni-filter-check-label"><input type="checkbox" class="uni-filter-check" data-group="country" value="${c}"> ${c}</label>
  `).join('');
  facultyBox.innerHTML = faculties.map(f => `
    <label class="uni-filter-check-label"><input type="checkbox" class="uni-filter-check" data-group="faculty" value="${f}"> ${f}</label>
  `).join('');
  studyLevelBox.innerHTML = studyLevels.map(s => `
    <label class="uni-filter-check-label"><input type="checkbox" class="uni-filter-check" data-group="studylevel" value="${s}"> ${s}</label>
  `).join('');
  intakeYearBox.innerHTML = intakeYears.map(y => `
    <label class="uni-filter-check-label"><input type="checkbox" class="uni-filter-check" data-group="intakeyear" value="${y}"> ${y}</label>
  `).join('');
  intakeBox.innerHTML = uniAllMonths.map(m => `
    <label class="uni-filter-check-label"><input type="checkbox" class="uni-filter-check" data-group="intake" value="${m}"> ${m}</label>
  `).join('');
  universityBox.innerHTML = universityNames.map(n => `
    <label class="uni-filter-check-label"><input type="checkbox" class="uni-filter-check" data-group="university" value="${n}"> ${n}</label>
  `).join('');

  feeMinSel.innerHTML = uniFeeBrackets.map(v => `<option value="${v}">$${v.toLocaleString()}</option>`).join('');
  feeMaxSel.innerHTML = uniFeeBrackets.map(v => `<option value="${v}">$${v.toLocaleString()}</option>`).join('') + `<option value="999999">No limit</option>`;
  feeMinSel.value = "0";
  feeMaxSel.value = "999999";

  function getChecked(group) {
    return [...document.querySelectorAll(`.uni-filter-check[data-group="${group}"]:checked`)].map(el => el.value);
  }

  function updateDependentFilters() {
    const checkedCountries = getChecked('country');
    const prevCheckedCities = getChecked('city');

    const relevant = checkedCountries.length
      ? universityDirectory.filter(u => checkedCountries.includes(u.country))
      : universityDirectory;

    const availableCities = [...new Set(relevant.map(u => u.city))].sort();

    cityBox.innerHTML = availableCities.map(c => `
      <label class="uni-filter-check-label"><input type="checkbox" class="uni-filter-check" data-group="city" value="${c}" ${prevCheckedCities.includes(c) ? 'checked' : ''}> ${c}</label>
    `).join('');

    cityBox.querySelectorAll('.uni-filter-check').forEach(el => el.addEventListener('change', renderChips));
    renderChips();
  }

  function filterUniversityCheckboxList() {
    const q = searchInput.value.trim().toLowerCase();
    universityBox.querySelectorAll('label').forEach(label => {
      const text = label.textContent.trim().toLowerCase();
      label.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
    });
  }

  const chipGroupLabels = {
    country: 'Country', city: 'Location', intake: 'Intake', intakeyear: 'Intake Year',
    faculty: 'Faculty', studylevel: 'Study Level', university: 'University'
  };

  function renderChips() {
    const chips = [];
    Object.keys(chipGroupLabels).forEach(group => {
      getChecked(group).forEach(value => {
        chips.push({ group: group, value: value });
      });
    });
    if (rankingSel.value !== 'any') chips.push({ group: 'ranking', value: 'Top ' + rankingSel.value });
    if (parseInt(feeMinSel.value,10) > 0 || parseInt(feeMaxSel.value,10) < 999999) {
      const maxLabel = feeMaxSel.value === '999999' ? 'Any' : parseInt(feeMaxSel.value,10).toLocaleString();
      chips.push({ group: 'fee', value: '$' + parseInt(feeMinSel.value,10).toLocaleString() + ' - $' + maxLabel });
    }

    if (!chips.length) {
      activeChips.classList.add('hidden');
      activeChips.innerHTML = '';
      return;
    }
    activeChips.classList.remove('hidden');
    activeChips.innerHTML = chips.map((c, idx) => `
      <span class="uni-filter-chip">${c.value}<button type="button" data-chip-remove="${idx}" aria-label="Remove">&times;</button></span>
    `).join('');

    activeChips.querySelectorAll('[data-chip-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-chip-remove'), 10);
        const chip = chips[idx];
        if (chip.group === 'ranking') {
          rankingSel.value = 'any';
        } else if (chip.group === 'fee') {
          feeMinSel.value = '0';
          feeMaxSel.value = '999999';
        } else {
          const match = [...document.querySelectorAll(`.uni-filter-check[data-group="${chip.group}"]`)].find(e => e.value === chip.value);
          if (match) match.checked = false;
          if (chip.group === 'country') updateDependentFilters();
        }
        renderChips();
        applyFilters();
      });
    });
  }

  function cardHTML(u) {
    const logo = u.logo
      ? `<img src="${u.logo}" alt="${u.name}" class="max-h-10 max-w-10 object-contain">`
      : `<span class="font-display font-bold text-bridge-700">${uniInitials(u.name)}</span>`;
    const intakeBadges = u.intake.map(i => `<span class="uni-intake-badge">${i}</span>`).join('');
    const scholarshipText = u.scholarship
      ? `<span class="font-semibold text-harbor-600">Available</span>`
      : `<span class="font-semibold text-ink/60">Not Available</span>`;
    return `
      <div class="university-card rounded-2xl border border-black/10 shadow-sm p-5 flex flex-col bg-white">
        <div class="flex items-center gap-3">
          <div class="w-14 h-14 shrink-0 rounded-lg bg-white border border-black/10 flex items-center justify-center overflow-hidden p-1.5">${logo}</div>
          <div class="min-w-0">
            <p class="font-display font-bold text-bridge-900 leading-tight text-sm">${u.name}</p>
            <p class="text-xs text-ink/50 mt-0.5">${u.city}, ${u.country}</p>
          </div>
        </div>
        <div class="mt-4 space-y-2.5 text-sm border-t border-black/5 pt-3">
          <div class="flex items-center justify-between">
            <span class="text-ink font-medium">Tuition / year</span>
            <span class="font-semibold text-bridge-900">$${u.feeMin.toLocaleString()} - $${u.feeMax.toLocaleString()}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-ink font-medium">Scholarships</span>
            ${scholarshipText}
          </div>
          <div class="flex items-center justify-between">
            <span class="text-ink font-medium">About the university</span>
            <a href="/#lead-form" class="font-semibold text-sunrise-600 hover:underline nav-link cursor-pointer">View Profile</a>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-ink font-medium">Find Courses</span>
            <a href="/programs" class="font-semibold text-sunrise-600 hover:underline nav-link cursor-pointer">View All</a>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">${intakeBadges}</div>
        <a href="/#lead-form" class="btn-outline uni-card-btn !text-xs mt-4 w-full text-center nav-link">Apply Now</a>
      </div>`;
  }

  function applyFilters() {
    const checkedCountries = getChecked('country');
    const checkedCities = getChecked('city');
    const checkedIntakes = getChecked('intake');
    const checkedFaculties = getChecked('faculty');
    const checkedStudyLevels = getChecked('studylevel');
    const checkedIntakeYears = getChecked('intakeyear');
    const checkedUniversities = getChecked('university');
    const feeMin = parseInt(feeMinSel.value, 10);
    const feeMax = parseInt(feeMaxSel.value, 10);
    const rankingMax = rankingSel.value;

    const filtered = universityDirectory.filter(u => {
      if (checkedCountries.length && !checkedCountries.includes(u.country)) return false;
      if (checkedCities.length && !checkedCities.includes(u.city)) return false;
      if (checkedIntakes.length && !u.intake.some(i => checkedIntakes.includes(i))) return false;
      if (checkedFaculties.length && !u.faculty.some(f => checkedFaculties.includes(f))) return false;
      if (checkedStudyLevels.length && !u.studyLevel.some(s => checkedStudyLevels.includes(s))) return false;
      if (checkedIntakeYears.length && !u.intakeYear.some(y => checkedIntakeYears.includes(y))) return false;
      if (checkedUniversities.length && !checkedUniversities.includes(u.name)) return false;
      if (u.feeMax < feeMin || u.feeMin > feeMax) return false;
      if (rankingMax !== 'any') {
        const rankNum = parseInt(u.ranking, 10);
        if (isNaN(rankNum) || rankNum > parseInt(rankingMax, 10)) return false;
      }
      return true;
    });

    grid.innerHTML = filtered.map(cardHTML).join('');
    const anyFilterActive = checkedCountries.length || checkedCities.length || checkedIntakes.length ||
      checkedFaculties.length || checkedStudyLevels.length || checkedIntakeYears.length || checkedUniversities.length ||
      feeMin > 0 || feeMax < 999999 || rankingMax !== 'any';
    resultsCount.textContent = anyFilterActive
      ? `Showing ${filtered.length} of ${universityDirectory.length} universities`
      : `Showing all ${universityDirectory.length} universities`;
    emptyState.classList.toggle('hidden', filtered.length > 0);
    grid.classList.toggle('hidden', filtered.length === 0);
  }

  function clearAll() {
    document.querySelectorAll('.uni-filter-check').forEach(el => { el.checked = false; });
    feeMinSel.value = "0";
    feeMaxSel.value = "999999";
    rankingSel.value = "any";
    searchInput.value = "";
    filterUniversityCheckboxList();
    updateDependentFilters();
    renderChips();
    applyFilters();
  }

  countryBox.querySelectorAll('.uni-filter-check').forEach(el => el.addEventListener('change', () => { updateDependentFilters(); renderChips(); }));
  document.querySelectorAll('.uni-filter-check[data-group="faculty"], .uni-filter-check[data-group="studylevel"], .uni-filter-check[data-group="intakeyear"], .uni-filter-check[data-group="intake"], .uni-filter-check[data-group="university"]').forEach(el => {
    el.addEventListener('change', renderChips);
  });
  rankingSel.addEventListener('change', renderChips);
  feeMinSel.addEventListener('change', renderChips);
  feeMaxSel.addEventListener('change', renderChips);
  searchInput.addEventListener('input', filterUniversityCheckboxList);

  const applyBtn = document.getElementById('uniApplyFilters');
  if (applyBtn) applyBtn.addEventListener('click', applyFilters);
  const clearBtn = document.getElementById('uniClearFilters');
  if (clearBtn) clearBtn.addEventListener('click', clearAll);
  const emptyClearBtn = document.getElementById('uniEmptyClear');
  if (emptyClearBtn) emptyClearBtn.addEventListener('click', clearAll);

  const toggleBtn = document.getElementById('uniFilterToggle');
  const panel = document.getElementById('uniFilterPanel');
  const toggleIcon = document.getElementById('uniFilterToggleIcon');
  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('hidden');
      if (toggleIcon) toggleIcon.style.transform = panel.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    });
  }

  document.querySelectorAll('.uni-accordion').forEach(acc => {
    const btn = acc.querySelector('.uni-accordion-btn');
    const accPanel = acc.querySelector('.uni-accordion-panel');
    btn.addEventListener('click', () => {
      const isOpen = acc.classList.contains('open');
      acc.classList.toggle('open', !isOpen);
      accPanel.classList.toggle('hidden', isOpen);
    });
  });

  updateDependentFilters();
  applyFilters();
}

function initCourseDirectory() {
  const list = document.getElementById('courseDirectoryList');
  if (!list) return;

  const subjectSel = document.getElementById('courseFilterSubject');
  const levelSel = document.getElementById('courseFilterLevel');
  const deliverySel = document.getElementById('courseFilterDelivery');
  const durationSel = document.getElementById('courseFilterDuration');
  const searchInput = document.getElementById('courseSearchInput');
  const resultsCount = document.getElementById('courseResultsCount');
  const emptyState = document.getElementById('courseEmptyState');

  const subjects = [...new Set(courseDirectory.map(c => c.subject))].sort();
  const levelOrder = ["Foundation","Diploma","Undergraduate","Postgraduate","PhD"];
  const levels = levelOrder.filter(l => courseDirectory.some(c => c.level === l));
  const deliveries = [...new Set(courseDirectory.map(c => c.delivery))].sort();
  const durations = [...new Set(courseDirectory.map(c => c.duration))].sort();

  subjectSel.innerHTML = '<option value="">Select</option>' + subjects.map(s => `<option value="${s}">${s}</option>`).join('');
  levelSel.innerHTML = '<option value="">Select</option>' + levels.map(l => `<option value="${l}">${l}</option>`).join('');
  deliverySel.innerHTML = '<option value="">Select</option>' + deliveries.map(d => `<option value="${d}">${d}</option>`).join('');
  durationSel.innerHTML = '<option value="">Select</option>' + durations.map(d => `<option value="${d}">${d}</option>`).join('');

  const capIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" /></svg>';
  const pinIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5"><path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd" /></svg>';

  function cardHTML(c) {
    const logo = c.logo
      ? `<img src="${c.logo}" alt="${c.university}" class="max-h-full max-w-full object-contain">`
      : `<span class="font-display font-bold text-bridge-700 text-xs">${uniInitials(c.university)}</span>`;
    return `
      <div class="flex flex-col sm:flex-row sm:items-center gap-4 bg-white rounded-2xl border border-black/10 shadow-sm p-5">
        <div class="w-16 h-16 shrink-0 rounded-lg bg-white border border-black/10 flex items-center justify-center overflow-hidden p-2">${logo}</div>
        <div class="flex-1 min-w-0">
          <p class="font-display font-bold text-bridge-900 text-base leading-tight">${c.name}</p>
          <p class="text-sm font-semibold text-sunrise-600 mt-0.5">${c.university}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span class="course-badge">${capIcon} ${c.level}</span>
            <span class="course-badge">${pinIcon} ${c.city}</span>
          </div>
        </div>
        <div class="shrink-0 w-full sm:w-auto">
          <a href="/#lead-form" class="course-detail-btn w-full sm:w-auto nav-link">Program Details</a>
        </div>
      </div>`;
  }

  function applyFilters() {
    const subject = subjectSel.value;
    const level = levelSel.value;
    const delivery = deliverySel.value;
    const duration = durationSel.value;
    const search = searchInput.value.trim().toLowerCase();

    const filtered = courseDirectory.filter(c => {
      if (subject && c.subject !== subject) return false;
      if (level && c.level !== level) return false;
      if (delivery && c.delivery !== delivery) return false;
      if (duration && c.duration !== duration) return false;
      if (search && !c.name.toLowerCase().includes(search) && !c.university.toLowerCase().includes(search)) return false;
      return true;
    });

    list.innerHTML = filtered.map(cardHTML).join('');
    const anyActive = subject || level || delivery || duration || search;
    resultsCount.textContent = anyActive
      ? `Showing ${filtered.length} of ${courseDirectory.length} courses`
      : `Showing all ${courseDirectory.length} courses`;
    emptyState.classList.toggle('hidden', filtered.length > 0);
    list.classList.toggle('hidden', filtered.length === 0);
  }

  function clearAll() {
    subjectSel.value = '';
    levelSel.value = '';
    deliverySel.value = '';
    durationSel.value = '';
    searchInput.value = '';
    applyFilters();
  }

  const applyBtn = document.getElementById('courseApplyFilters');
  if (applyBtn) applyBtn.addEventListener('click', applyFilters);
  const resetBtn = document.getElementById('courseResetFilters');
  if (resetBtn) resetBtn.addEventListener('click', clearAll);
  const emptyClearBtn = document.getElementById('courseEmptyClear');
  if (emptyClearBtn) emptyClearBtn.addEventListener('click', clearAll);

  const toggleBtn = document.getElementById('courseFilterToggle');
  const panel = document.getElementById('courseFilterPanel');
  const toggleIcon = document.getElementById('courseFilterToggleIcon');
  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('hidden');
      if (toggleIcon) toggleIcon.style.transform = panel.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    });
  }

  applyFilters();
}












// Progressive enhancement: every nav link now has a real href, so a plain
// click (or ctrl/cmd/shift/middle-click, or right-click) still works as a
// normal link — this only intercepts an ordinary left-click to do a fast
// in-page transition instead of a full reload.



// Browser back/forward support
;

function initPageScripts() {
  // Hero slider (home page only)
  sliderIndex = 0;
  sliderShow(0);
  resetSliderTimer();

  // Testimonial carousel (Contact page only)
  testiIndex = 0;
  testiRender();
  resetTestiTimer();

  // Apply Now wizard (Apply Now page only)
  if (document.getElementById('applyStep1')) {
    applyPopulateSubjects();
    applyShowStep(1);
  }

  // Course tabs (home page only)
  document.querySelectorAll('.course-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.course-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.course-tab-panel').forEach(p => p.classList.toggle('hidden', p.dataset.panel !== tab));
    });
  });

  // Featured Universities tabs + auto-sliding logo carousels (home page only)
  document.querySelectorAll('.uni-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.uni-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.uni-tab-panel').forEach(p => p.classList.toggle('hidden', p.dataset.panel !== tab));
      if (uniSizeFns[tab]) requestAnimationFrame(() => requestAnimationFrame(uniSizeFns[tab]));
    });
  });
  initAboutPage();
  initUniCarousels();
  initUniversityDirectory();
  initCourseDirectory();

  // FAQ accordion
  document.querySelectorAll('.faq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      const icon = btn.querySelector('.faq-icon');
      const isOpen = !answer.classList.contains('hidden');
      document.querySelectorAll('.faq-answer').forEach(a => a.classList.add('hidden'));
      document.querySelectorAll('.faq-icon').forEach(i => i.style.transform = 'rotate(0deg)');
      if (!isOpen) { answer.classList.remove('hidden'); icon.style.transform = 'rotate(45deg)'; }
    });
  });

  // YouTube facade -> real embed on click
  document.querySelectorAll('.yt-facade').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1';
      iframe.className = 'w-full h-full';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      btn.replaceWith(iframe);
      iframe.parentElement.classList.add('aspect-video');
    });
  });

  // Stat counters
  const counters = document.querySelectorAll('.counter');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix ?? '+';
        const start = performance.now();
        const duration = 1200;
        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          el.textContent = Math.floor(progress * target).toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => io.observe(c));

  // Forms: show a thank-you state immediately, and best-effort send the lead to the backend
  document.querySelectorAll('.demo-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.classList.add('hidden');
      const thanks = form.nextElementSibling;
      if (thanks) thanks.classList.remove('hidden');

      try {
        const source = form.dataset.source || 'website';
        const get = (n) => { const el = form.querySelector(`[name="${n}"]`); return el ? el.value : ''; };
        const firstName = get('firstName');
        const lastName = get('lastName');
        const plainName = get('name');
        const name = plainName || `${firstName} ${lastName}`.trim();
        const payload = {
          name,
          email: get('email'),
          phone: get('phone'),
          message: get('message'),
          source_page: source,
        };
        fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      } catch (err) { /* never let lead capture break the UX */ }
    });
  });
}

// Mobile menu toggle (bound once — header is static across pages)
document.getElementById('mobileToggle').addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.toggle('hidden');
});

// Mobile menu accordion (e.g. "About" expanding to About Us / Our Team)
function toggleMobileAccordion(btn) {
  const panel = btn.nextElementSibling;
  const icon = btn.querySelector('.mobile-accordion-icon');
  const isOpen = !panel.classList.contains('hidden');
  panel.classList.toggle('hidden');
  if (icon) icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(45deg)';
}
window.toggleMobileAccordion = toggleMobileAccordion;

// Boot: restore page from the real URL path on load, and transparently
// migrate any old-style hash link (e.g. /#university-college, /#home from
// before this fix) to the new clean URL.
// Page is already server-rendered by Astro -- just init this page's interactive widgets.
initPageScripts();

// Hide header on scroll down, show it again on scroll up.
(function () {
  var header = document.getElementById('siteHeader');
  if (!header) return;
  var lastScrollY = window.scrollY;
  var headerHeight = header.offsetHeight;

  window.addEventListener('scroll', function () {
    var currentScrollY = window.scrollY;
    if (currentScrollY > lastScrollY && currentScrollY > headerHeight) {
      header.style.transform = 'translateY(-100%)';
    } else {
      header.style.transform = 'translateY(0)';
    }
    lastScrollY = currentScrollY;
  }, { passive: true });
})();
