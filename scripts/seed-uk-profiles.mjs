/*
 * Profile content for the six UK universities, written from each institution's
 * own pages plus the standard reference sources.
 *
 * The prose is written here rather than lifted: copying a university's own
 * wording would be a copyright problem and would read as marketing rather than
 * as advice to a student. Facts — founding year, city, what the place is known
 * for — are not copyrightable and are what a student is actually after.
 *
 * Deliberately absent: fees, entry requirements and deadlines. Those move, and
 * the profile links to the university's own page for them instead of freezing a
 * number that will be wrong within a year.
 *
 *   node scripts/seed-uk-profiles.mjs   # prints SQL to stdout
 */

const sq = (v) => `'${String(v ?? '').replace(/'/g, "''")}'`;

const TODAY = new Date().toISOString().slice(0, 10);

const UK = [
  {
    name: 'Aston University',
    slug: 'aston-university',
    website: 'https://www.aston.ac.uk/',
    source_url: 'https://www.aston.ac.uk/international',
    founded: '1895',
    overview: [
      'Aston University sits on a single campus in the centre of Birmingham, ten minutes from the city’s main shopping and entertainment area and about half an hour from Birmingham International Airport. It began in 1895 as a technical school and became a university in 1966, and that industrial origin still shapes how it teaches: courses are built with employers, and a placement year or live industry project runs through much of the undergraduate portfolio.',
      'It is best known for graduate employment. Aston has been a leading university for graduate employment success for over 25 years, and its business school holds triple accreditation from AMBA, AACSB and EQUIS — held by fewer than 1% of business schools worldwide.',
      'The student body is large and international, drawing from more than 120 countries, which makes it a straightforward place to arrive as a Bangladeshi student rather than an unusual one.',
    ].join('\n\n'),
    rankings_note: 'Aston has been placed in the top 5% of universities in the QS World University Rankings, and holds a Gold rating in the Teaching Excellence Framework. Check the university’s own rankings page for the current year’s positions.',
    services: 'An International Orientation Programme runs at the start of each year. International Student Advisers who specialise in visas and immigration are available year round, every student is allocated a personal tutor, and the Careers and Placements team supports students from application through to graduate recruitment.',
    student_life: 'The campus holds accommodation, the Students’ Union, study spaces, sports centre and cafés on one site, so daily life does not require travelling across the city. Birmingham itself has one of the youngest populations in Europe and is under two hours from London by train.',
    accommodation: 'Accommodation is on the academic campus itself rather than spread across the city. Applying early matters — check the university’s accommodation pages for the current year’s options and deadlines.',
  },
  {
    name: 'Arden University',
    slug: 'arden-university',
    website: 'https://arden.ac.uk/',
    source_url: 'https://arden.ac.uk/international-students/our-campuses',
    founded: '1990',
    overview: [
      'Arden University is a private UK university built around flexible study. It started in 1990 as Resource Development International, a distance-learning provider, and was granted degree-awarding powers in 2015. Its head office is in Coventry, with study centres across the UK and an international campus in Berlin.',
      'For international students coming to study full time on campus, Arden offers two UK locations: Manchester, in the Spinningfields district, and London at Stratford. Manchester is the more affordable of the two; London offers the wider professional network.',
      'Programmes are career-focused rather than research-led — business and management, computing and IT, psychology, law and criminology, health and social care, data analytics. Many carry professional accreditation from bodies such as the Chartered Management Institute and the Association of Chartered Certified Accountants.',
    ].join('\n\n'),
    rankings_note: 'Arden is a teaching-focused private university and does not appear in the major global research league tables. It ranked 5th in the UK for overall student positivity in the 2025 National Student Survey. Judge it on student satisfaction and accreditation rather than on research rankings.',
    services: 'Arden is a licensed UK student visa sponsor and provides visa guidance and relocation advice as part of the application process. Both UK campuses sit close to student accommodation with good transport links.',
    student_life: 'Study centres are city-centre buildings rather than traditional campuses — libraries, classrooms, IT suites and social space, with the surrounding city as the wider student experience. Suits students who want to be in a working city and value flexibility over campus tradition.',
    accommodation: 'Arden does not run large halls of residence in the way a traditional campus university does. Students choose private accommodation near the Manchester or London campus, and the university advises on options — confirm current arrangements with Arden directly.',
  },
  {
    name: 'Birmingham City University',
    slug: 'birmingham-city-university',
    website: 'https://www.bcu.ac.uk/',
    source_url: 'https://www.bcu.ac.uk/international',
    founded: '1843',
    overview: [
      'Birmingham City University traces its roots to the Birmingham College of Art in 1843, became a polytechnic in 1971 and gained university status in 1992. It is one of the UK’s larger universities, with more than 31,000 students drawn from over 100 countries.',
      'Teaching is practice-based across the board. The City Centre Campus houses art and design, media, business, law and social sciences, while the City South Campus covers health, education and life sciences. The university has invested heavily in facilities, including a £125 million extension to the city-centre campus.',
      'It is strongest in the creative and applied subjects — art and design, media, jewellery, music and the built environment — where its specialist schools have long histories of their own.',
    ].join('\n\n'),
    rankings_note: 'BCU sits in the 1001–1200 band of the QS World University Rankings, with Art and Design ranked considerably higher by subject. As with most modern UK universities, subject-level standing is more useful here than the overall position.',
    services: 'The university runs academic advising, careers counselling and mental health support, with dedicated services for international students. Courses are built to include placements and industry projects with major employers.',
    student_life: 'Two campuses, both in Birmingham, with the city’s cultural and sporting life immediately around them — Birmingham hosted the 2022 Commonwealth Games and the campuses are within walking distance of the centre.',
    accommodation: 'University-managed halls and partner accommodation are available across both campuses. Check BCU’s accommodation pages for current options, prices and application dates.',
  },
  {
    name: 'Bangor University',
    slug: 'bangor-university',
    website: 'https://www.bangor.ac.uk/',
    source_url: 'https://www.bangor.ac.uk/international',
    founded: '1884',
    overview: [
      'Bangor University was founded in 1884 and received its Royal Charter in 1885, making it one of the older degree-awarding institutions in the UK. It sits in the small coastal city of Bangor in North Wales, between the mountains of Eryri (Snowdonia) and the Menai Strait.',
      'It is a small university by UK standards — around 10,000 students, of whom roughly 2,000 are international, from more than 120 countries. That size is the point for many students: teaching happens in small groups and the campus is walkable rather than sprawling.',
      'Bangor is particularly strong in ocean sciences, psychology, environmental science and forestry, and owns its own research vessel. In the 2021 Research Excellence Framework, 85% of its research was judged world-leading or internationally excellent.',
    ].join('\n\n'),
    rankings_note: 'Bangor was named top in the UK for teaching quality in the 2025 National Student Survey. Its global ranking is mid-table; its research and teaching scores are where it stands out.',
    services: 'An International Student Welfare Office supports students and their families, a Study Skills Centre runs classes in academic writing and presentation skills, and international student ambassadors help new arrivals from the day they land.',
    student_life: 'Around 150 clubs and societies, all free to join. The setting suits students who want the outdoors on their doorstep — mountains and sea within minutes — and the cost of living is among the lowest of any UK university city.',
    accommodation: 'Accommodation is within walking distance of the university, and first-year students who apply before the deadline are guaranteed a room. Confirm the current deadline on Bangor’s accommodation pages.',
  },
  {
    name: 'Abertay University',
    slug: 'abertay-university',
    website: 'https://www.abertay.ac.uk/',
    source_url: 'https://www.abertay.ac.uk/study/international/',
    founded: '1888',
    overview: [
      'Abertay University is in the centre of Dundee, Scotland. It opened in 1888 as Dundee Technical Institute and became a university in 1994, and it is a small, specialised institution rather than a broad one.',
      'It is best known for one thing: computer games. Abertay ran the world’s first computer games degree in 1997 and was the first UK university recognised as a Centre for Excellence in Computer Games Education. It has been ranked the top games university in Europe for eight consecutive years by the Princeton Review, and in 2025 was named the top international school for video games worldwide. It was also the first UK university to offer a degree in Ethical Hacking, from 2006.',
      'Dundee matters as much as the university here. DMA Design — now Rockstar North — created Lemmings and the original Grand Theft Auto in the city, and 4J Studios built the console editions of Minecraft there. Dundee holds UNESCO City of Design status and one of the UK’s largest clusters of games studios, so placements and industry contact are unusually close at hand.',
    ].join('\n\n'),
    rankings_note: 'Abertay does not feature prominently in general world rankings, which measure research volume across all subjects. For games and cybersecurity it is ranked among the best anywhere — judge it by subject, not by overall position.',
    services: 'A dedicated International Team supports students through arrival and study. Many students take up work experience in Dundee’s games studios during their degree, and the alumni network supports graduates through mentoring and portfolio reviews.',
    student_life: 'The campus is entirely city-centre, with every building within a few minutes’ walk of the others, and shops, the V&A Dundee design museum and transport links all walkable. The Students’ Association runs the clubs, societies and sports teams.',
    accommodation: 'University accommodation is in and around the city centre, and Dundee is compact and comparatively affordable. Check Abertay’s accommodation pages for current options.',
  },
  {
    name: 'De Montfort University',
    slug: 'de-montfort-university',
    website: 'https://www.dmu.ac.uk/',
    source_url: 'https://www.dmu.ac.uk/international/en/international.aspx',
    founded: '1870',
    overview: [
      'De Montfort University began as the Leicester School of Art in 1870 and became a university in 1992. It is named after Simon de Montfort, the 13th-century Earl of Leicester who called the first English parliament in 1265. Today it has over 23,000 students and a single campus in the centre of Leicester.',
      'DMU is one of the few UK universities teaching by block: students take one module at a time, with regular assessment and feedback, rather than carrying several modules to end-of-year exams. Students who prefer to concentrate on one subject at a time tend to find this suits them.',
      'International students ranked DMU first in the world for overall satisfaction in the 2024 International Student Barometer. It takes students from more than 130 countries, and more than 170 of its programmes carry professional accreditation from bodies such as ACCA, CIMA, RIBA and the IET.',
    ].join('\n\n'),
    rankings_note: 'DMU holds a Gold rating in the Teaching Excellence Framework and sits around the 800 mark in the QS World University Rankings. Its accreditation coverage and student satisfaction are the stronger signals.',
    services: 'An award-winning careers team gives guaranteed access to work experience, tailored career support and placement years that count towards the degree. A dedicated international team handles pre-arrival and in-country questions.',
    student_life: 'The campus merges into the city — historic and modern buildings, parks and public roads together — so student life and Leicester’s life are not separate. Leicester is one of the UK’s most ethnically diverse cities, which many international students find makes settling in easier.',
    accommodation: 'University halls and partner accommodation sit on or beside the city-centre campus. Confirm current options and prices on DMU’s accommodation pages.',
  },
];

const lines = [
  '-- Generated by scripts/seed-uk-profiles.mjs — profile content for the six UK universities.',
  '-- Written from each institution\'s own pages; facts, not copied prose.',
  '',
];

for (const u of UK) {
  lines.push(`UPDATE university_directory SET
  slug = ${sq(u.slug)},
  website = ${sq(u.website)},
  founded = ${sq(u.founded)},
  overview = ${sq(u.overview)},
  rankings_note = ${sq(u.rankings_note)},
  services = ${sq(u.services)},
  student_life = ${sq(u.student_life)},
  accommodation = ${sq(u.accommodation)},
  source_url = ${sq(u.source_url)},
  last_verified_at = ${sq(TODAY)}
WHERE name = ${sq(u.name)} AND country = 'UK';`);
  lines.push('');
}

/* Everything else gets a slug so its profile page resolves, even while the
   written sections are still empty. */
lines.push(`-- A slug for every remaining entry, so no profile link is broken while the
-- written sections are still being filled in.
UPDATE university_directory
SET slug = lower(
  replace(replace(replace(replace(replace(replace(name,
    ' ', '-'), '''', ''), '.', ''), ',', ''), '(', ''), ')', '')
)
WHERE slug IS NULL OR slug = '';`);

console.log(lines.join('\n'));
