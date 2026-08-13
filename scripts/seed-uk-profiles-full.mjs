/*
 * The fuller write-up for the six UK universities.
 *
 * Written from each institution's own pages and the standard references, in our
 * own words — their prose is theirs, and it reads as their marketing rather
 * than as advice to a student choosing between them.
 *
 * Entry requirements are given as the usual range and labelled as indicative.
 * They vary by course and change every cycle, and only the university's own
 * page is authoritative; the profile links there and records when it was last
 * checked, rather than presenting a threshold as though it were fixed.
 *
 *   node scripts/seed-uk-profiles-full.mjs > migrations/0007_seed_uk_profiles_full.sql
 */

const sq = (v) => `'${String(v ?? '').replace(/'/g, "''")}'`;
const TODAY = new Date().toISOString().slice(0, 10);
const P = (...parts) => parts.join('\n\n');
const L = (...lines) => lines.join('\n');

const UK = [
  {
    name: 'Aston University',
    student_count: '17,500+',
    international_count: '120+ countries',
    why_choose: L(
      'A placement year or live industry project runs through much of the undergraduate portfolio',
      'A leading university for graduate employment success for over 25 years',
      'Aston Business School holds triple accreditation — AMBA, AACSB and EQUIS — held by fewer than 1% of business schools worldwide',
      'One campus in the centre of Birmingham: teaching, accommodation, union and sport on one site',
      'Under two hours from London by train, 30 minutes from Birmingham International Airport',
    ),
    entry_requirements: P(
      'Undergraduate entry usually asks for HSC or A-Levels with good grades, or a recognised foundation year for students coming straight from the Bangladeshi system. Postgraduate entry usually asks for a Bachelor\'s degree with a 2:2 or 2:1 equivalent, which for most Bangladeshi universities means roughly a 2.8–3.0 CGPA.',
      'English is normally evidenced with IELTS around 6.0–6.5 overall for undergraduate study and 6.5 for most Master\'s courses, with a minimum in each band. PTE Academic and TOEFL are widely accepted, and some courses accept a Medium of Instruction letter.',
      'These are the usual ranges, not the rule for your course. Requirements differ by programme and change each cycle — your counsellor will check the exact figure for the course you want before you apply.',
    ),
    scholarships_info: P(
      'Aston invests over £5 million a year in scholarships, awarded on academic, professional and personal achievement. Awards are usually applied as a reduction in tuition rather than paid as cash.',
      'International students are also eligible for UK government-funded routes such as Chevening and Commonwealth Scholarships, which are applied for separately and have their own deadlines — usually much earlier than university deadlines.',
    ),
    facilities: P(
      'The academic campus holds accommodation, the Students\' Union, library, study spaces, cafés and a sports centre on one site, so daily life does not require crossing the city. It is one of the greener UK campuses, laid out as a single block rather than scattered buildings.',
    ),
    services: P(
      'An International Orientation Programme runs at the start of each academic year, and student volunteers meet new arrivals at Birmingham Airport at set times during the arrival period.',
      'International Student Advisers who specialise in visas and immigration are available year round. Every student is allocated a personal tutor for academic questions, and the award-winning Careers and Placements team supports students from application through to graduate recruitment.',
      'A Postgraduate Guaranteed Internship Scheme means full-time taught Master\'s students graduate with industry experience as well as a degree. It is open to international students with no registration fee.',
    ),
    student_life: P(
      'Birmingham has one of the youngest populations in Europe and is a genuine second city rather than a university town — leisure, shopping, sport and a large Bangladeshi and South Asian community are all present.',
      'The campus sits a ten-minute walk from the main shopping and entertainment area, so students are in the city without commuting into it. Aston has been recognised as one of the friendliest universities in the UK, and has the second largest proportion of Black and Minority Ethnic students of any UK university.',
    ),
    accommodation: P(
      'Accommodation is on the academic campus itself rather than spread across the city, which keeps costs and travel time down and makes the first weeks easier.',
      'Rooms are allocated in order of application, so applying early matters more than it appears to. Confirm the current year\'s options, prices and deadlines on Aston\'s accommodation pages.',
    ),
  },

  {
    name: 'Arden University',
    student_count: '40,000+ globally',
    international_count: '140+ nationalities',
    why_choose: L(
      'Built around flexible study — blended and online delivery alongside full-time on-campus options',
      'Among the more affordable UK tuition fees, with tiered scholarships for international students',
      'Ranked 5th in the UK for overall student positivity in the 2025 National Student Survey',
      'Programmes accredited by the CMI, CIM, ACCA and the British Psychological Society',
      'Two UK campuses for international students: Manchester and London Stratford',
    ),
    entry_requirements: P(
      'Arden is a teaching-focused university and its entry requirements are generally more accessible than those of research-intensive institutions, which is a large part of why students choose it. Undergraduate entry usually asks for HSC or equivalent; postgraduate entry asks for a Bachelor\'s degree, with some MBA routes considering relevant work experience alongside academic results.',
      'English is usually evidenced with IELTS around 6.0 overall for undergraduate and 6.5 for postgraduate study, with recognised alternatives accepted.',
      'These are the usual ranges rather than the rule for a specific course — your counsellor will confirm the exact requirement before you apply.',
    ),
    scholarships_info: P(
      'Arden offers merit-based scholarships and tuition discounts for international students, including regional and tiered fee reductions, a Berlin Merit Scholarship for its German campus, and a UK Welcome Offer. Awards typically range from £2,000 to £5,000 depending on academic performance and location.',
      'Because these are tiered by home country and campus, the figure that applies to a Bangladeshi student is worth checking case by case rather than assuming the headline number.',
    ),
    facilities: P(
      'Study centres are modern city-centre buildings rather than traditional campuses: library, classrooms, IT suites and social space, with high-speed connectivity throughout. The Manchester campus is in the Spinningfields financial district; the London campus is in the Turing Building at Stratford Cross, beside Westfield Stratford City and the Olympic Park.',
    ),
    services: P(
      'Arden is a licensed UK student visa sponsor and provides visa guidance and relocation advice as part of the application process rather than as an extra.',
      'Both UK campuses sit close to a range of student accommodation with good transport links, and the university advises on options for students arriving from abroad.',
    ),
    student_life: P(
      'This suits students who want to be in a working city and value flexibility over campus tradition. Manchester offers a lower cost of living than most large UK cities; London offers unmatched networking and cultural range at a higher cost.',
      'Because much of Arden\'s teaching is blended, the student community is more dispersed than at a traditional campus university — worth knowing if a busy campus social life is what you are after.',
    ),
    accommodation: P(
      'Arden does not run large halls of residence in the way a traditional campus university does. International students choose private accommodation near the Manchester or London campus, and the university advises on suitable options and budgets.',
      'Confirm current arrangements with Arden directly before you commit to anything, particularly deposits.',
    ),
  },

  {
    name: 'Birmingham City University',
    student_count: '31,000+',
    international_count: '100+ countries',
    why_choose: L(
      'Practice-based teaching across every faculty, with placements and industry projects built into courses',
      'Particular strength in the creative subjects — art and design, media, jewellery and music — through specialist schools with long histories',
      'A £125 million extension to the city-centre campus, part of Birmingham\'s Eastside learning quarter',
      'One of the UK\'s larger and most diverse universities, in England\'s second city',
      'Two campuses, both in Birmingham, walkable from the centre',
    ),
    entry_requirements: P(
      'Undergraduate entry usually asks for HSC or A-Levels, with a foundation or international year one available for students who need a bridge from the Bangladeshi system. Postgraduate entry asks for a recognised Bachelor\'s degree, typically at 2:2 or above.',
      'English is normally evidenced with IELTS around 6.0 overall for undergraduate and 6.5 for postgraduate courses. Creative courses often ask for a portfolio as well as grades, and that portfolio can matter more than the marks.',
      'Requirements vary by course and change each cycle — treat these as the usual range and let your counsellor confirm the figure for your programme.',
    ),
    scholarships_info: P(
      'BCU offers international scholarships applied as a tuition reduction, with awards usually assessed on academic merit at the point of application. Amounts and eligibility change year to year.',
      'Students should also check the UK government-funded routes — Chevening and Commonwealth — which are applied for separately and close earlier than university deadlines.',
    ),
    facilities: P(
      'The university has invested heavily in facilities: the Curzon and Parkside buildings on the City Centre Campus house business, law, social sciences, art, design and media, while the City South Campus carries health, education and life sciences with clinical simulation space.',
      'The specialist schools — the School of Jewellery in the Jewellery Quarter and the Royal Birmingham Conservatoire — have their own dedicated buildings and equipment.',
    ),
    services: P(
      'Academic advising, careers counselling and mental health support are available to all students, with services dedicated to international students alongside them.',
      'Courses are built to include placements and industry projects with major employers, and the careers team supports students into those placements rather than leaving them to find their own.',
    ),
    student_life: P(
      'Birmingham hosted the 2022 Commonwealth Games and has kept the sporting facilities that came with it. The campuses sit within walking distance of the city centre, so student life and city life are the same thing here.',
      'The city has a large, long-established South Asian community, which most Bangladeshi students find makes the first months considerably easier — food, community and places of worship are all close at hand.',
    ),
    accommodation: P(
      'University-managed halls and partner accommodation are available near both campuses, with a range of budgets. Private student housing is also plentiful in Birmingham and often cheaper than in London or the south.',
      'Check BCU\'s accommodation pages for current options, prices and application dates.',
    ),
  },

  {
    name: 'Bangor University',
    student_count: '10,000',
    international_count: '2,000 from 120+ countries',
    why_choose: L(
      'Named top in the UK for teaching quality in the 2025 National Student Survey',
      '85% of its research judged world-leading or internationally excellent in REF 2021',
      'Among the lowest costs of living of any UK university city',
      'Small enough for small-group teaching and a walkable campus',
      'First-year students who apply before the deadline are guaranteed a room',
    ),
    entry_requirements: P(
      'Undergraduate entry usually asks for HSC or A-Levels, with international foundation routes available. Postgraduate entry asks for a recognised Bachelor\'s degree, typically at 2:2 or above, with some research-heavy programmes asking for more.',
      'English is normally evidenced with IELTS around 6.0 overall for undergraduate and 6.5 for postgraduate study, with a minimum in each band.',
      'These are the usual ranges. Requirements differ by school — ocean sciences and psychology, for instance, ask for specific subject backgrounds — so confirm the exact requirement for your course before applying.',
    ),
    scholarships_info: P(
      'Bangor offers international scholarships as tuition reductions, generally assessed on academic merit at application. Because the cost of living in Bangor is low, the total saving relative to a large city can be larger than the scholarship figure alone suggests.',
      'Chevening and Commonwealth Scholarships apply here as at any UK university, with their own separate and earlier deadlines.',
    ),
    facilities: P(
      'Bangor is unusual for a university of its size in owning its own research vessel, the Prince Madog, used by the School of Ocean Sciences. The university also houses the North Wales Medical School, with clinical training facilities.',
      'Teaching, library and social buildings are grouped together, so nothing on campus is more than a walk away.',
    ),
    services: P(
      'An International Student Welfare Office supports students and their families, and over 20 international student ambassadors help new arrivals from the day they land through to graduation.',
      'The Study Skills Centre runs classes in academic writing, reading, statistics, presentation skills and project management — useful for students moving into a UK academic style for the first time.',
      'Trips to London, York and other cities are organised through the year, alongside events within the university.',
    ),
    student_life: P(
      'Around 150 clubs and societies, all free to join — a deliberate policy so that cost is not a barrier to taking part.',
      'The setting is the draw for many students: the mountains of Eryri (Snowdonia) on one side and the Menai Strait on the other, with hiking, climbing and water sports genuinely on the doorstep. Bangor is also one of the safest university cities in the UK and sits in one of its most bilingual areas, with Welsh spoken alongside English.',
      'It is a small city. Students who want a large nightlife scene will find Manchester and Liverpool reachable by train rather than on the doorstep.',
    ),
    accommodation: P(
      'All university accommodation is within walking distance of the campus and the city centre, across residences including St Mary\'s Village, Ffriddoedd Village, Bryn Eithin and Reichel. Options range from en-suite rooms to shared flats and studios, furnished with shared kitchens and social space.',
      'First-year students who apply before the deadline are guaranteed a room. Confirm the current deadline on Bangor\'s accommodation pages — it is one of the few dates worth diarising early.',
    ),
  },

  {
    name: 'Abertay University',
    student_count: '4,000+',
    international_count: 'Students from 60+ countries',
    why_choose: L(
      'Ran the world\'s first computer games degree in 1997, and the UK\'s first Ethical Hacking degree in 2006',
      'Ranked #1 in Europe for undergraduate games courses for eight consecutive years by the Princeton Review',
      'Named the top international school for video games worldwide in 2025',
      'A founding partner of Sony\'s PlayStation First programme, with one of the largest PlayStation teaching labs in Europe',
      'Dundee holds UNESCO City of Design status and one of the UK\'s largest clusters of games studios',
    ),
    entry_requirements: P(
      'Scottish undergraduate degrees run four years rather than three, which matters when comparing total cost against an English university. Entry usually asks for HSC or A-Levels; applicants from the Bangladeshi system are often asked for HSC plus a foundation or first year of a university programme, depending on the course.',
      'Postgraduate entry usually asks for a good honours degree — a 2:2 minimum for most courses. Technical Master\'s such as Computer Games Technology are programming-focused and expect a genuine background in object-oriented programming, not only an interest in games.',
      'English is normally evidenced with IELTS around 6.0 overall. These are the usual ranges — confirm the requirement for your specific course before applying.',
    ),
    scholarships_info: P(
      'Abertay offers international scholarships as tuition reductions, assessed at application. Dundee\'s cost of living is well below the UK average for a city with this much going on, which usually matters more to a total budget than the award itself.',
      'Chevening and Commonwealth Scholarships apply here as at any UK university, with separate and earlier deadlines.',
    ),
    facilities: P(
      'The campus is entirely city-centre, with every building within a few minutes\' walk of the others. It includes the historic Old College buildings of Dundee Business School and the Bernard King Library.',
      'For games and computing students, the draw is the equipment: dedicated games labs, one of Europe\'s largest PlayStation teaching labs, and the cybersecurity and ethical hacking facilities that made the university\'s name.',
    ),
    services: P(
      'A dedicated International Team supports students through application, arrival and study.',
      'Many students take up work experience in Dundee\'s games studios during their degree — the city\'s studio cluster is unusually dense for its size, so this is realistic rather than aspirational. The alumni network supports graduates into industry through mentoring, portfolio reviews and job referrals.',
    ),
    student_life: P(
      'Dundee is compact, affordable and well connected, and its games history is genuine: DMA Design — now Rockstar North — created Lemmings and the original Grand Theft Auto here, and 4J Studios built the console editions of Minecraft here. For a student in this field, the networking is out of proportion to the city\'s size.',
      'Shops, bars, the V&A Dundee design museum and the main transport links are all walkable from campus. The Students\' Association runs the clubs, societies and sports teams.',
    ),
    accommodation: P(
      'University accommodation is in and around the city centre, within walking distance of teaching buildings. Dundee\'s private rental market is also comparatively cheap by UK standards.',
      'Check Abertay\'s accommodation pages for the current year\'s options and application dates.',
    ),
  },

  {
    name: 'De Montfort University',
    student_count: '23,000+',
    international_count: '130+ countries',
    why_choose: L(
      'Ranked 1st in the world for overall international student satisfaction in the 2024 International Student Barometer',
      'Block teaching: one module at a time with regular assessment, instead of several modules and end-of-year exams',
      'Gold rating in the Teaching Excellence Framework',
      'More than 170 programmes accredited by bodies including ACCA, CIMA, RIBA, CMI and the IET',
      'Guaranteed access to work experience through an award-winning careers team',
    ),
    entry_requirements: P(
      'Undergraduate entry usually asks for HSC or A-Levels, with foundation and international year one routes for students bridging from the Bangladeshi system. Postgraduate entry asks for a recognised Bachelor\'s degree, typically at 2:2 or above.',
      'English is normally evidenced with IELTS around 6.0 overall for undergraduate and 6.5 for postgraduate courses, with a minimum in each band.',
      'Accredited programmes sometimes carry additional requirements set by the professional body rather than the university — architecture and engineering in particular. Confirm the requirement for your course before applying.',
    ),
    scholarships_info: P(
      'DMU offers international scholarships applied as tuition reductions, assessed on academic merit at application, alongside country-specific awards that change year to year.',
      'Chevening and Commonwealth Scholarships apply as at any UK university, with their own earlier deadlines.',
    ),
    facilities: P(
      'A single city-centre campus that merges into Leicester itself — historic buildings such as the Hawthorn Building alongside modern facilities including the Hugh Aston building for business and law, the Kimberlin Library and the Great Hall of Leicester Castle.',
      'The university has put substantial investment into teaching rooms, studios and student spaces over recent years.',
    ),
    services: P(
      'An award-winning careers team gives guaranteed access to work experience, career support tailored to the student, placement years that count towards the degree, and unlimited digital learning tools.',
      'A dedicated international team handles pre-arrival and in-country questions — visas, arrival, settling in — and DMU\'s first place for international student satisfaction suggests this is more than a stated commitment.',
    ),
    student_life: P(
      'The campus and the city are not separate: historic and modern university buildings sit among parks and public roads in central Leicester.',
      'Leicester is one of the UK\'s most ethnically diverse cities, with a long-established South Asian population. For Bangladeshi students that usually means food, community and places of worship are close at hand, and arriving feels less abrupt than it might elsewhere.',
      'DMU Local, the university\'s volunteering programme, connects students with the city — a straightforward way to build UK experience and references alongside a degree.',
    ),
    accommodation: P(
      'University halls and partner accommodation sit on or beside the city-centre campus, so most students walk to teaching. Leicester\'s private rental market is also relatively affordable.',
      'Confirm current options and prices on DMU\'s accommodation pages.',
    ),
  },
];

const out = [
  '-- Generated by scripts/seed-uk-profiles-full.mjs',
  '-- The fuller profile write-up for the six UK universities.',
  '',
];

for (const u of UK) {
  out.push(`UPDATE university_directory SET
  why_choose = ${sq(u.why_choose)},
  entry_requirements = ${sq(u.entry_requirements)},
  scholarships_info = ${sq(u.scholarships_info)},
  facilities = ${sq(u.facilities)},
  student_count = ${sq(u.student_count)},
  international_count = ${sq(u.international_count)},
  services = ${sq(u.services)},
  student_life = ${sq(u.student_life)},
  accommodation = ${sq(u.accommodation)},
  last_verified_at = ${sq(TODAY)}
WHERE name = ${sq(u.name)} AND country = 'UK';`);
  out.push('');
}

console.log(out.join('\n'));
