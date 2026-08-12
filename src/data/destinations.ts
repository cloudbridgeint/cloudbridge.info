/*
 * Destination guides.
 *
 * One entry per country drives /destinations/study-in-<slug>, the destinations
 * hub and the home page cards, so a country is added or edited in exactly one
 * place.
 *
 * On the numbers: tuition, living costs and the amount a student must show for
 * a visa all move, and the official figure is the only one that counts. Each
 * entry therefore carries `officialSource` — the government or immigration
 * page that actually sets the rule — and the page links to it in the open.
 * Ranges here are indicative and marked as such; they are for orienting a
 * student, not for filling in a visa form. Do not quote a precise figure on
 * these pages that is not on the linked official page.
 */

export interface Faq {
  q: string;
  a: string;
}

export interface Destination {
  /* URL is /destinations/study-in-<slug> */
  slug: string;
  country: string;        // "the United Kingdom"
  short: string;          // "UK" — used in headings and cards
  flag: string;
  /* 40-60 words answering cost, duration and IELTS in one breath. This is the
     block an AI assistant is most likely to lift, so it must stand alone and
     be true without the surrounding page. */
  answer: string;
  intro: string;
  why: string[];
  tuition: string;
  living: string;
  currency: string;
  intakes: string;
  workRights: string;
  postStudy: string;
  englishReq: string;
  academicReq: string;
  visaName: string;
  visaSteps: string[];
  scholarships: string[];
  universities: string[];
  officialSource: { label: string; url: string };
  faqs: Faq[];
  /* Home page / hub card */
  cardImage?: string;
  tagline: string;
}

export const DESTINATIONS: Destination[] = [
  {
    slug: 'uk',
    country: 'the United Kingdom',
    short: 'UK',
    flag: '🇬🇧',
    tagline: 'One-year Master\'s, Graduate Route work visa',
    answer:
      'Studying in the UK from Bangladesh typically costs £12,000–£25,000 a year in tuition plus living costs, with most Master\'s degrees finishing in a single year. You apply for a Student visa after an offer and CAS. IELTS is the usual English test, though many universities accept PTE, TOEFL or a Medium of Instruction letter instead.',
    intro:
      'The UK remains the most familiar destination for Bangladeshi students, and the reason is structural rather than sentimental: a taught Master\'s runs one year instead of two, so a student pays one year of tuition and one year of living costs, then moves to the Graduate Route and starts earning. That compresses the whole investment in a way most countries cannot match.',
    why: [
      'A taught Master\'s takes 12 months — roughly half the total cost of a two-year degree elsewhere',
      'The Graduate Route lets you stay and work for two years after finishing (three after a PhD), with no job offer needed first',
      'Degrees are recognised without question by employers in Bangladesh and across the Gulf',
      'January and September intakes both run widely, so a missed deadline costs months rather than a year',
    ],
    tuition: '£12,000–£25,000 per year for most taught programmes; medicine, dentistry and some MBAs run higher',
    living: '£1,023 per month outside London and £1,334 inside it is the figure the Home Office uses for maintenance — real spending is often close to this',
    currency: 'GBP (£)',
    intakes: 'September (main), January (widely available), some universities add a May intake',
    workRights: '20 hours per week during term time, full time during vacations',
    postStudy: 'Graduate Route — 2 years after a Bachelor\'s or Master\'s, 3 years after a PhD',
    englishReq: 'IELTS 6.0–6.5 overall is typical for a Master\'s. Many universities accept PTE Academic, TOEFL iBT, or an MOI letter if your previous degree was taught in English.',
    academicReq: 'A recognised Bachelor\'s degree for a Master\'s; HSC or A-Levels for an undergraduate course. Most universities want a 2.5–3.0 CGPA equivalent, though this varies by programme.',
    visaName: 'Student visa (formerly Tier 4)',
    visaSteps: [
      'Accept your offer and receive a CAS (Confirmation of Acceptance for Studies) from the university',
      'Hold the required maintenance funds in an acceptable account for 28 consecutive days',
      'Complete the online application and pay the visa fee and the Immigration Health Surcharge',
      'Book and attend biometrics at the visa application centre in Dhaka or Sylhet',
      'Submit academic documents, financial evidence, TB test certificate and passport',
    ],
    scholarships: [
      'Chevening Scholarships — fully funded Master\'s, UK government',
      'Commonwealth Scholarships — for students from Commonwealth countries including Bangladesh',
      'University-specific international scholarships, commonly £2,000–£10,000 off tuition',
    ],
    universities: ['Aston University', 'Birmingham City University', 'Bangor University', 'De Montfort University', 'Arden University', 'Abertay University'],
    officialSource: { label: 'UK Government — Student visa', url: 'https://www.gov.uk/student-visa' },
    faqs: [
      {
        q: 'How much does it cost to study in the UK from Bangladesh?',
        a: 'Budget roughly £12,000–£25,000 a year for tuition on most taught programmes, plus living costs. The Home Office maintenance requirement — £1,023 a month outside London, £1,334 in London — is a reasonable guide to what you will actually spend. A one-year Master\'s therefore usually lands between £24,000 and £40,000 all in, which is why it often works out cheaper than a two-year degree in another country.',
      },
      {
        q: 'Can I study in the UK without IELTS?',
        a: 'Often yes. Many UK universities accept PTE Academic, TOEFL iBT, Duolingo, or a Medium of Instruction (MOI) letter confirming your previous degree was taught in English. It depends entirely on the university and sometimes on the individual programme, so it needs checking case by case rather than assuming.',
      },
      {
        q: 'How much bank balance is needed for a UK student visa?',
        a: 'You must show your first year of tuition (or the balance still owed) plus living costs of £1,023 per month outside London or £1,334 in London, for up to nine months. The money has to sit in an acceptable account for 28 consecutive days ending no more than 31 days before you apply. Check the current figures on gov.uk before you lock funds in, as they are reviewed periodically.',
      },
      {
        q: 'Can I work while studying in the UK?',
        a: 'Yes — 20 hours a week during term time and full time during vacations, on a Student visa at degree level. Treat it as help with living costs rather than a way to fund tuition; the maths does not work otherwise, and universities expect study to come first.',
      },
      {
        q: 'What happens after I finish my degree?',
        a: 'The Graduate Route lets you stay and work, or look for work, for two years after a Bachelor\'s or Master\'s and three years after a PhD. You do not need a job offer to apply, and you can switch to a Skilled Worker visa later if an employer sponsors you.',
      },
    ],
  },
  {
    slug: 'usa',
    country: 'the United States',
    short: 'USA',
    flag: '🇺🇸',
    tagline: 'Widest choice of universities, strong funding',
    answer:
      'Studying in the USA from Bangladesh generally costs US$20,000–US$50,000 a year at public universities and more at private ones, with a Bachelor\'s taking four years and a Master\'s one and a half to two. You apply for an F-1 visa after receiving Form I-20, and attend an interview at the US Embassy in Dhaka.',
    intro:
      'The USA has more universities than any other destination, which cuts both ways: there is a place for almost every profile and budget, but choosing badly is easy. Funding is the part Bangladeshi students most often underestimate — assistantships and departmental scholarships at Master\'s and PhD level can cover far more than the headline tuition suggests.',
    why: [
      'Over 4,000 accredited institutions, so the range of entry requirements and fees is enormous',
      'Graduate assistantships and departmental funding can cover tuition plus a stipend, particularly in STEM',
      'OPT gives 12 months of work after graduation, extended to 36 months for eligible STEM degrees',
      'Course structure lets you change or combine majors well after you have started',
    ],
    tuition: 'US$20,000–US$45,000 per year at public universities; private universities commonly run US$30,000–US$70,000',
    living: 'US$10,000–US$20,000 per year, varying sharply by city — Texas and the Midwest sit far below New York or California',
    currency: 'USD ($)',
    intakes: 'Fall (August/September, the main one), Spring (January), a smaller Summer intake at some universities',
    workRights: '20 hours per week on campus during term, full time during official breaks; off-campus work requires CPT or OPT authorisation',
    postStudy: 'OPT — 12 months, extended by a further 24 months for eligible STEM degrees',
    englishReq: 'TOEFL iBT 79–100 or IELTS 6.5–7.0 is the usual range. Duolingo and MOI letters are accepted by a growing number of universities but far from all.',
    academicReq: 'HSC or A-Levels for undergraduate; a four-year Bachelor\'s for most Master\'s programmes. SAT is optional at many universities now; GRE or GMAT is still asked for by some graduate programmes.',
    visaName: 'F-1 student visa',
    visaSteps: [
      'Receive your admission offer and Form I-20 from a SEVP-approved university',
      'Pay the SEVIS I-901 fee and keep the receipt',
      'Complete the DS-160 online application and pay the visa fee',
      'Book your interview at the US Embassy in Dhaka',
      'Attend the interview with your I-20, financial evidence, academic records and passport',
    ],
    scholarships: [
      'Fulbright Foreign Student Program — fully funded Master\'s and PhD',
      'Graduate assistantships — tuition waiver plus a stipend for teaching or research',
      'University merit scholarships, often awarded automatically on admission',
    ],
    universities: ['Arizona State University', 'Northeastern University', 'University of Illinois Chicago', 'University of Dayton'],
    officialSource: { label: 'US Department of State — Student visas', url: 'https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html' },
    faqs: [
      {
        q: 'How much does it cost to study in the USA from Bangladesh?',
        a: 'Public universities typically charge US$20,000–US$45,000 a year in tuition and private ones US$30,000–US$70,000, with living costs adding roughly US$10,000–US$20,000 depending on the city. The spread is wide enough that the university you pick matters more than the country — a public university in Texas and a private one in New York are barely comparable financially.',
      },
      {
        q: 'What is the F-1 visa interview like at the Dhaka embassy?',
        a: 'It is short, usually a few minutes, and the officer is deciding two things: that you are a genuine student and that you can fund the course. Expect questions on why this university, why this course, who is paying, and what you plan to do afterwards. Answer directly and consistently with your documents — rehearsed speeches tend to hurt rather than help.',
      },
      {
        q: 'Can I get a full scholarship to study in the USA?',
        a: 'At Master\'s and PhD level, yes — graduate assistantships often cover tuition and pay a stipend, and Fulbright funds a small number of Bangladeshi students each year. Full funding at undergraduate level is much rarer and highly competitive. Partial merit scholarships are far more common and worth applying for widely.',
      },
      {
        q: 'Can I work while studying in the USA?',
        a: 'On-campus work is allowed up to 20 hours a week during term and full time during breaks. Off-campus work needs authorisation through CPT or OPT and is tied to your field of study. Working without authorisation puts your visa status at risk, so it is not worth improvising.',
      },
      {
        q: 'How long can I stay after graduating?',
        a: 'OPT gives you 12 months of work authorisation in your field. If your degree is on the STEM designated list, you can apply for a 24-month extension, taking the total to three years — which is usually enough time to find an employer willing to sponsor an H-1B.',
      },
    ],
  },
  {
    slug: 'malaysia',
    country: 'Malaysia',
    short: 'Malaysia',
    flag: '🇲🇾',
    tagline: 'Lowest total cost, UK and Australian dual awards',
    answer:
      'Malaysia is among the most affordable destinations for Bangladeshi students, with tuition commonly RM 15,000–RM 40,000 a year and living costs far below Europe or North America. Many universities offer UK or Australian dual-award degrees. You apply for a Student Pass through EMGS after an offer, and IELTS requirements are usually modest.',
    intro:
      'Malaysia is the destination that makes sense when the budget is the binding constraint. Living costs are a fraction of the UK\'s, English is the language of instruction at most private universities, and several campuses award degrees from UK or Australian partner institutions — so the certificate carries a name employers recognise while the cost stays local.',
    why: [
      'Total cost is often a third of studying in the UK or USA for a comparable degree',
      'Branch campuses and dual awards from UK and Australian universities',
      'English is the medium of instruction at most private universities',
      'A large Bangladeshi and South Asian community, and a shorter, cheaper flight home',
    ],
    tuition: 'RM 15,000–RM 40,000 per year at most private universities; branch campuses of foreign universities sit at the upper end',
    living: 'RM 1,500–RM 2,500 per month covers accommodation, food and transport for most students',
    currency: 'MYR (RM)',
    intakes: 'Most universities run three intakes — typically January/February, May and September',
    workRights: 'Up to 20 hours per week during semester breaks or holidays exceeding seven days, in approved sectors only',
    postStudy: 'No general post-study work visa; graduates move to an employment pass once an employer sponsors them',
    englishReq: 'IELTS 5.5–6.0 is typical, and many universities accept an MOI letter or run their own placement test.',
    academicReq: 'HSC for undergraduate; a Bachelor\'s degree for Master\'s programmes. Entry requirements are generally more flexible than in the UK or USA.',
    visaName: 'Student Pass, applied for through EMGS (Education Malaysia Global Services)',
    visaSteps: [
      'Accept your offer from a Malaysian institution',
      'The university submits your Student Pass application to EMGS on your behalf',
      'Complete the EMGS medical screening and provide your passport and academic documents',
      'Receive your Visa Approval Letter (VAL)',
      'Collect the single-entry visa from the Malaysian High Commission in Dhaka before you travel',
    ],
    scholarships: [
      'Malaysian International Scholarship (MIS) — government funded, for postgraduate study',
      'University merit scholarships, frequently 10–50% off tuition',
      'Early-bird and sibling discounts, which several private universities offer routinely',
    ],
    universities: ['Taylor\'s University', 'UCSI University', 'SEGi University', 'MAHSA University', 'Nilai University', 'INTI International University', 'Multimedia University (MMU)', 'City University Malaysia'],
    officialSource: { label: 'Education Malaysia Global Services (EMGS)', url: 'https://educationmalaysia.gov.my/' },
    faqs: [
      {
        q: 'How much does it cost to study in Malaysia from Bangladesh?',
        a: 'Tuition at most private universities runs RM 15,000–RM 40,000 a year, and living costs of RM 1,500–RM 2,500 a month cover accommodation, food and transport comfortably. For many students the all-in annual cost lands well below what a single year in the UK would take, which is the main reason Malaysia gets shortlisted.',
      },
      {
        q: 'Are Malaysian degrees recognised in Bangladesh and abroad?',
        a: 'Degrees from institutions accredited by the Malaysian Qualifications Agency are recognised, and dual-award programmes issue the certificate of the UK or Australian partner university as well. Check MQA accreditation for the specific programme rather than the institution as a whole — it is the programme that gets accredited.',
      },
      {
        q: 'Can I study in Malaysia without IELTS?',
        a: 'Frequently yes. Many Malaysian universities accept a Medium of Instruction letter or run their own English placement test, and required IELTS scores are lower than the UK or USA when a test is needed. Confirm with the specific university, as policy varies between institutions and programmes.',
      },
      {
        q: 'Can I work while studying in Malaysia?',
        a: 'Work rights are more limited than in Europe — up to 20 hours a week, and only during semester breaks or holidays longer than seven days, in approved sectors such as restaurants and mini-markets. Plan your budget on the assumption that you will not be earning during term.',
      },
      {
        q: 'How long does the Student Pass take?',
        a: 'EMGS processing usually takes several weeks once the university submits your application, and the medical screening and document checks add to that. Applying early matters — students who leave it late routinely miss their intake and have to defer.',
      },
    ],
  },
  {
    slug: 'canada',
    country: 'Canada',
    short: 'Canada',
    flag: '🇨🇦',
    tagline: 'Post-study work permit, clear route to residency',
    answer:
      'Studying in Canada from Bangladesh typically costs CAD 15,000–CAD 35,000 a year in tuition plus living costs. You apply for a study permit after an offer, and must show proof of funds beyond tuition. A Post-Graduation Work Permit of up to three years follows an eligible programme, and that work experience counts towards permanent residency.',
    intro:
      'Canada is chosen less for the degree itself than for what comes after it. The Post-Graduation Work Permit, and the way Canadian work experience feeds into the Express Entry points system, make it the clearest study-to-settlement path among the major destinations. Rules here change more often than elsewhere, so current official guidance matters more than a consultancy blog from last year.',
    why: [
      'Post-Graduation Work Permit of up to three years, depending on programme length',
      'Canadian work experience counts towards permanent residency through Express Entry',
      'Tuition is generally lower than comparable universities in the USA or UK',
      'Spouses of some students can apply for an open work permit',
    ],
    tuition: 'CAD 15,000–CAD 35,000 per year for most undergraduate and Master\'s programmes',
    living: 'CAD 12,000–CAD 20,000 per year, with Toronto and Vancouver well above smaller provinces',
    currency: 'CAD ($)',
    intakes: 'Fall (September, the main one), Winter (January), Summer (May) at some institutions',
    workRights: 'Up to 24 hours per week off campus during term, full time during scheduled breaks',
    postStudy: 'Post-Graduation Work Permit — 8 months to 3 years, tied to the length of your programme and, for some, the field of study',
    englishReq: 'IELTS 6.0–6.5 is the usual requirement; many institutions also accept PTE, TOEFL or the Duolingo English Test.',
    academicReq: 'HSC for undergraduate, a Bachelor\'s for Master\'s. Institutions look closely at the gap between your last qualification and the application.',
    visaName: 'Study permit',
    visaSteps: [
      'Receive a Letter of Acceptance from a Designated Learning Institution',
      'Obtain a Provincial Attestation Letter where your province and programme require one',
      'Show proof of funds covering tuition plus living costs, commonly through a GIC',
      'Complete the online study permit application and pay the fee',
      'Give biometrics and complete the required medical examination',
    ],
    scholarships: [
      'Vanier Canada Graduate Scholarships — doctoral level, highly competitive',
      'Institution-specific entrance scholarships, often awarded automatically',
      'Provincial and departmental awards, particularly at Master\'s level',
    ],
    universities: ['University of Toronto', 'Simon Fraser University', 'University of Manitoba', 'Toronto Metropolitan University'],
    officialSource: { label: 'Government of Canada — Study permits', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html' },
    faqs: [
      { q: 'How much does it cost to study in Canada from Bangladesh?', a: 'Tuition usually runs CAD 15,000–CAD 35,000 a year and living costs CAD 12,000–CAD 20,000, depending heavily on the city. Toronto and Vancouver sit well above the national average, and choosing a smaller province is one of the few decisions that meaningfully changes the total.' },
      { q: 'How much proof of funds is needed for a Canadian study permit?', a: 'You must show tuition plus living costs for yourself and any accompanying family. The living-cost threshold is set by IRCC and has been revised upward more than once in recent years, so check the current figure on the IRCC site rather than relying on an older number. Many students meet the requirement through a Guaranteed Investment Certificate.' },
      { q: 'Can I work while studying in Canada?', a: 'Eligible students can work up to 24 hours a week off campus during term and full time during scheduled breaks. This limit has changed more than once recently, so confirm the current rule before you count on a particular number of hours.' },
      { q: 'Does studying in Canada lead to permanent residency?', a: 'It is a recognised route rather than a guarantee. A Canadian credential and skilled Canadian work experience both earn points under Express Entry, which is why the Post-Graduation Work Permit matters so much. Selection thresholds move with each draw, so nobody can promise an outcome.' },
      { q: 'What is a Provincial Attestation Letter?', a: 'It is a letter from the province confirming your place counts against its allocation of study permit applications. Most new applicants need one, with some exemptions. Your institution normally arranges it, but it is worth confirming early because an application without one where it is required will be returned.' },
    ],
  },
  {
    slug: 'finland',
    country: 'Finland',
    short: 'Finland',
    flag: '🇫🇮',
    tagline: 'Strong scholarships, high quality of life',
    answer:
      'Studying in Finland from Bangladesh typically costs €8,000–€18,000 a year in tuition for non-EU students, with living costs around €700–€1,100 a month. Scholarships covering 50–100% of tuition are common and awarded with admission. You apply for a residence permit for studies through Migri, and most programmes are taught entirely in English.',
    intro:
      'Finland is unusual in how routinely it discounts its own tuition: scholarships covering half or all of the fee are built into the admission process at many universities rather than being a separate competition. For a strong applicant, the effective cost can drop well below the headline figure — which is what makes Finland worth a serious look despite the high nominal fees.',
    why: [
      'Tuition scholarships of 50–100% are awarded with admission at many universities',
      'Over 500 degree programmes taught entirely in English',
      'Two years to look for work after graduating on a post-study residence permit',
      'Consistently ranked among the safest countries with the highest quality of life',
    ],
    tuition: '€8,000–€18,000 per year for non-EU students at most universities; scholarships frequently reduce this substantially',
    living: '€700–€1,100 per month covering accommodation, food and transport; Helsinki sits at the upper end',
    currency: 'EUR (€)',
    intakes: 'The main joint application runs in January for an August/September start; a second round opens for some programmes',
    workRights: 'Up to 30 hours per week on average during term, with no limit during holidays',
    postStudy: 'Residence permit to look for work or start a business, valid for two years after graduation',
    englishReq: 'IELTS 6.0–6.5 is the common requirement; several universities accept PTE, TOEFL or an MOI letter, and some run their own entrance exam.',
    academicReq: 'HSC with a strong GPA for Bachelor\'s programmes; a relevant Bachelor\'s for Master\'s. Many programmes also set an entrance examination.',
    visaName: 'Residence permit for studies (Migri)',
    visaSteps: [
      'Apply through Studyinfo.fi during the joint application period',
      'Receive your admission decision and any tuition scholarship offer',
      'Pay the tuition instalment required before the permit application',
      'Take out health insurance meeting Finnish requirements',
      'Apply for the residence permit through Enter Finland and visit the VFS centre in Dhaka for identification',
    ],
    scholarships: [
      'University tuition-fee scholarships of 50–100%, awarded with admission',
      'The Finland Scholarship for non-EU/EEA students starting a Master\'s',
      'Doctoral positions, which are normally salaried rather than fee-paying',
    ],
    universities: ['University of Helsinki', 'Aalto University', 'LUT University'],
    officialSource: { label: 'Finnish Immigration Service (Migri) — Studying in Finland', url: 'https://migri.fi/en/studying-in-finland' },
    faqs: [
      { q: 'How much money must I show for a Finland student residence permit?', a: 'Migri sets a minimum monthly amount you must have available for living expenses, and you also need to have paid any required tuition instalment. Published figures vary widely across consultancy websites, so take the amount directly from migri.fi at the time you apply — this is the single most common point of confusion for Bangladeshi applicants.' },
      { q: 'Can I study in Finland without IELTS?', a: 'Sometimes. Universities may accept an MOI letter, PTE, TOEFL or their own entrance examination in place of IELTS. It is decided programme by programme, so it needs checking against the specific course rather than assumed.' },
      { q: 'Is tuition really free in Finland?', a: 'Not for Bangladeshi students. Tuition-free study applies to EU/EEA nationals. Non-EU students pay fees — but scholarships covering 50–100% of tuition are awarded routinely with admission, so the amount actually paid is often far lower than the published fee.' },
      { q: 'Can I work while studying in Finland?', a: 'Yes, up to an average of 30 hours a week during term and without restriction during holidays. Finding part-time work without Finnish is harder outside the biggest cities, so it should not be central to your funding plan.' },
      { q: 'What happens after I graduate in Finland?', a: 'You can apply for a two-year residence permit to look for work or start a business. Finland has an ageing workforce and active shortages in technology, engineering and healthcare, which works in favour of graduates in those fields.' },
    ],
  },
  {
    slug: 'france',
    country: 'France',
    short: 'France',
    flag: '🇫🇷',
    tagline: 'Low public tuition, strong business schools',
    answer:
      'Studying in France from Bangladesh costs comparatively little at public universities — often €3,000–€5,000 a year for non-EU students — while private business and engineering schools charge far more. Living costs run €700–€1,200 a month. You apply through Campus France before the visa, and many Master\'s programmes are taught in English.',
    intro:
      'France separates sharply into two systems. Public universities charge non-EU students a few thousand euros a year, which is among the lowest tuition of any major destination. Private grandes écoles and business schools charge many times that, and are a different proposition entirely. Which of the two you are applying to changes every calculation on this page.',
    why: [
      'Public university tuition is a fraction of the UK, USA or Australia',
      'Growing number of Master\'s programmes taught entirely in English',
      'Two years to look for work after a Master\'s on a post-study residence permit',
      'Government housing assistance (CAF) is available to international students',
    ],
    tuition: '€3,000–€5,000 per year at public universities for non-EU students; private business and engineering schools commonly charge €10,000–€25,000',
    living: '€700–€1,200 per month; Paris sits substantially above the rest of the country',
    currency: 'EUR (€)',
    intakes: 'September (main) and a smaller January intake at some institutions',
    workRights: 'Up to 964 hours per year, roughly 20 hours per week',
    postStudy: 'Temporary residence permit (APS) of up to two years after a Master\'s to seek work or start a business',
    englishReq: 'IELTS 6.0–6.5 for English-taught programmes. French-taught programmes require DELF or DALF instead.',
    academicReq: 'HSC for undergraduate; a Bachelor\'s for Master\'s. Applications from Bangladesh go through the Campus France Études en France procedure.',
    visaName: 'VLS-TS student long-stay visa',
    visaSteps: [
      'Create your Campus France account and complete the Études en France procedure',
      'Attend the Campus France interview and receive your NOC',
      'Accept your admission offer from the institution',
      'Apply for the VLS-TS student visa through the French visa centre in Dhaka',
      'Validate your visa online within three months of arriving in France',
    ],
    scholarships: [
      'Eiffel Excellence Scholarship — French government, Master\'s and PhD',
      'Charpak Scholarship and other embassy-administered awards',
      'Institution-specific merit scholarships, particularly at business schools',
    ],
    universities: ['Sorbonne University', 'Sciences Po', 'emlyon business school', 'Toulouse Business School'],
    officialSource: { label: 'Campus France — Bangladesh', url: 'https://www.bangladesh.campusfrance.org/en' },
    faqs: [
      { q: 'How much does it cost to study in France from Bangladesh?', a: 'At a public university, non-EU tuition is often €3,000–€5,000 a year, which is among the lowest of any major destination. Private business and engineering schools are a different matter, commonly €10,000–€25,000. Living costs of €700–€1,200 a month apply either way, with Paris well above the rest.' },
      { q: 'Do I need to speak French to study in France?', a: 'Not for English-taught programmes, and there are now many at Master\'s level. You will need French for daily life, part-time work and most internships, though — students who arrive with none generally find the first months harder than they expected.' },
      { q: 'What is the Campus France procedure?', a: 'Bangladeshi students must apply through the Études en France platform before the visa stage. It involves an online file, an interview at Campus France, and a No Objection Certificate. Skipping it is not possible — the visa application depends on it, so start early.' },
      { q: 'Can I work while studying in France?', a: 'Yes, up to 964 hours a year, which works out at roughly 20 hours a week. Students also qualify for CAF housing assistance, which often makes a larger difference to the monthly budget than part-time earnings do.' },
      { q: 'Can I stay in France after graduating?', a: 'After a Master\'s you can apply for a temporary residence permit (APS) valid up to two years to look for work or start a business, and switch to a work permit once you find a qualifying job.' },
    ],
  },
  {
    slug: 'malta',
    country: 'Malta',
    short: 'Malta',
    flag: '🇲🇹',
    tagline: 'English-speaking EU country, modest entry bar',
    answer:
      'Malta is an English-speaking EU destination where tuition commonly runs €6,000–€12,000 a year and living costs €600–€900 a month. Entry requirements are often more accessible than larger European countries, and students may work up to 20 hours a week after the first 90 days. You apply for a national long-stay visa and then a residence permit.',
    intro:
      'Malta\'s appeal is specific: it is inside the EU, it teaches and operates in English, and its entry requirements and costs sit below most of Western Europe. It is a small country with a correspondingly small job market, so it suits students who want an EU-recognised qualification at a manageable cost rather than those planning to build a career locally.',
    why: [
      'English is an official language, so there is no language barrier in daily life or study',
      'EU-recognised qualifications at costs well below Western Europe',
      'Entry requirements are frequently more accessible than in larger EU countries',
      'Small, safe and easy to navigate for a first time abroad',
    ],
    tuition: '€6,000–€12,000 per year at most institutions, varying by programme and level',
    living: '€600–€900 per month covering accommodation, food and transport',
    currency: 'EUR (€)',
    intakes: 'Typically September/October and January/February',
    workRights: 'Up to 20 hours per week, generally permitted after the first 90 days of study',
    postStudy: 'A limited post-study period to seek employment; graduates then move to a work permit',
    englishReq: 'IELTS 5.5–6.0 is common, and MOI letters are widely accepted.',
    academicReq: 'HSC for undergraduate; a Bachelor\'s for Master\'s. Requirements vary between the state university and private institutions.',
    visaName: 'National long-stay (D) visa, followed by a residence permit',
    visaSteps: [
      'Accept your offer and pay the required tuition deposit',
      'Arrange accommodation and health insurance covering your stay',
      'Show proof of sufficient funds for the duration of your course',
      'Apply for the national long-stay visa through the Maltese visa route serving Bangladesh',
      'Apply for your residence permit with Identità after arriving',
    ],
    scholarships: [
      'Institutional merit scholarships and early-payment discounts',
      'Endeavour Scholarship Scheme, for eligible postgraduate study',
    ],
    universities: ['Global College Malta', 'Global Business School Malta', 'Malta International College', 'MCAST'],
    officialSource: { label: 'Identità Malta — Study visas and residence', url: 'https://www.identita.gov.mt/' },
    faqs: [
      { q: 'How much does it cost to study in Malta from Bangladesh?', a: 'Tuition commonly runs €6,000–€12,000 a year and living costs €600–€900 a month, which places Malta below most of Western Europe while still awarding EU-recognised qualifications. Confirm the exact fee with the institution, as it varies considerably by programme.' },
      { q: 'Is Malta a good option if my IELTS score is low?', a: 'Entry requirements are often more accessible than in larger EU countries, with IELTS 5.5–6.0 common and MOI letters widely accepted. That said, a visa is assessed on funds, intent and documentation as well as grades, so a lower entry bar does not mean a lower standard of application.' },
      { q: 'Can I work while studying in Malta?', a: 'Students may generally work up to 20 hours a week once they have completed the first 90 days of study and hold the right authorisation. Malta\'s job market is small and seasonal, weighted towards tourism and hospitality, so opportunities are real but limited.' },
      { q: 'Do I need to speak Maltese?', a: 'No. English is an official language of Malta and is used in teaching, administration and everyday life. Maltese is widely spoken socially, but it is not a barrier to studying or living there.' },
      { q: 'Is a Maltese degree recognised elsewhere in the EU?', a: 'Qualifications from accredited Maltese institutions are recognised across the EU. Check that your specific programme is accredited by the Malta Further and Higher Education Authority before accepting an offer.' },
    ],
  },
  {
    slug: 'netherlands',
    country: 'the Netherlands',
    short: 'Netherlands',
    flag: '🇳🇱',
    tagline: 'Huge English-taught choice, one-year search visa',
    answer:
      'Studying in the Netherlands from Bangladesh costs roughly €8,000–€20,000 a year in tuition for non-EU students, with living costs of €800–€1,200 a month. The country offers more English-taught degrees than anywhere else in continental Europe, and graduates can apply for a one-year orientation visa to find work.',
    intro:
      'The Netherlands built its higher education around international students earlier than most of Europe, and it shows: the range of English-taught degrees is the widest on the continent and teaching is built around discussion and group work rather than lectures alone. The constraint is housing — student accommodation in Amsterdam and Utrecht is genuinely scarce, and that needs solving before you fly, not after.',
    why: [
      'The largest choice of English-taught degree programmes in continental Europe',
      'The zoekjaar orientation year lets graduates stay 12 months to find work',
      'Research universities and universities of applied sciences offer genuinely different routes',
      'Widely spoken English makes daily life straightforward from day one',
    ],
    tuition: '€8,000–€20,000 per year for non-EU students, depending on institution and programme',
    living: '€800–€1,200 per month, with Amsterdam and Utrecht at the top of the range',
    currency: 'EUR (€)',
    intakes: 'September (main) and February at some institutions',
    workRights: 'Up to 16 hours per week during term or full time for three summer months, with a work permit arranged by the employer',
    postStudy: 'Orientation year (zoekjaar) — 12 months to find work, usable within three years of graduating',
    englishReq: 'IELTS 6.0–6.5 is the usual requirement; TOEFL and Cambridge English are widely accepted.',
    academicReq: 'HSC for undergraduate, though some programmes require a foundation year; a relevant Bachelor\'s for Master\'s. Numerus fixus programmes have capped places and earlier deadlines.',
    visaName: 'MVV entry visa and VVR residence permit, applied for by the institution',
    visaSteps: [
      'Accept your offer; the institution applies for your MVV and residence permit on your behalf',
      'Show proof of sufficient funds for the year, usually transferred to the institution',
      'Take out Dutch health insurance once your status is settled',
      'Collect the MVV from the visa centre serving Bangladesh',
      'Register with the municipality and collect your residence permit after arriving',
    ],
    scholarships: [
      'Orange Knowledge Programme, for eligible postgraduate applicants',
      'Holland Scholarship for non-EEA students, typically a first-year award',
      'University-specific scholarships, several of which are substantial at Master\'s level',
    ],
    universities: ['University of Amsterdam', 'Erasmus University Rotterdam', 'Maastricht University', 'Tilburg University'],
    officialSource: { label: 'Study in NL — official information for international students', url: 'https://www.studyinnl.org/' },
    faqs: [
      { q: 'How much does it cost to study in the Netherlands from Bangladesh?', a: 'Non-EU tuition typically runs €8,000–€20,000 a year and living costs €800–€1,200 a month, with Amsterdam and Utrecht at the top of that range. You will normally need to show the full year\'s living costs before the residence permit is granted.' },
      { q: 'Is student housing hard to find in the Netherlands?', a: 'Yes, and this is the most underestimated part of moving there. Amsterdam and Utrecht in particular have a genuine shortage, and universities cannot guarantee a room. Start looking as soon as you accept an offer, and treat any listing that asks for a large deposit before a viewing with suspicion.' },
      { q: 'Can I work while studying in the Netherlands?', a: 'Non-EU students can work up to 16 hours a week during term, or full time across three summer months, and the employer must arrange a work permit. The hour limit is stricter than in several other European countries, so it should not be your funding plan.' },
      { q: 'What is the orientation year (zoekjaar)?', a: 'It is a 12-month residence permit that lets graduates stay and look for work without a job offer first, and it can be used any time within three years of graduating. During that year you can work without a separate permit.' },
      { q: 'What is the difference between a research university and a university of applied sciences?', a: 'Research universities (WO) are academic and theory-led; universities of applied sciences (HBO) are practice-led and usually include a placement. HBO degrees take four years at Bachelor\'s level rather than three. Neither is better — they suit different plans, and the choice affects Master\'s eligibility later.' },
    ],
  },
  {
    slug: 'new-zealand',
    country: 'New Zealand',
    short: 'New Zealand',
    flag: '🇳🇿',
    tagline: 'Post-study work visa, all eight universities ranked',
    answer:
      'Studying in New Zealand from Bangladesh typically costs NZD 22,000–NZD 40,000 a year in tuition, with living costs around NZD 20,000 a year. All eight of the country\'s universities appear in global rankings. Graduates of eligible qualifications can apply for a post-study work visa of up to three years.',
    intro:
      'New Zealand is small enough that quality is consistent — all eight universities are internationally ranked, so there is no weak tier to avoid. It also runs one of the more transparent post-study work systems: the length of the visa follows the level and length of your qualification, published in advance, rather than depending on finding an employer first.',
    why: [
      'All eight universities appear in international rankings — quality is consistent across the system',
      'Post-study work visa of up to three years for eligible qualifications',
      'Partners of some postgraduate students can apply for an open work visa',
      'Small international student population means more contact with academic staff',
    ],
    tuition: 'NZD 22,000–NZD 40,000 per year for most undergraduate and Master\'s programmes',
    living: 'Around NZD 20,000 per year — this is also roughly the figure Immigration New Zealand expects you to show',
    currency: 'NZD ($)',
    intakes: 'February (main) and July; some programmes add a third intake',
    workRights: 'Up to 20 hours per week during term and full time during scheduled holidays for eligible students',
    postStudy: 'Post Study Work Visa — up to 3 years, depending on the level and length of your qualification',
    englishReq: 'IELTS 6.0 for undergraduate and 6.5 for postgraduate is the common requirement; PTE and TOEFL are accepted.',
    academicReq: 'HSC for undergraduate, sometimes with a foundation year; a Bachelor\'s for Master\'s. Genuine intent is assessed closely in the visa decision.',
    visaName: 'Fee Paying Student Visa',
    visaSteps: [
      'Receive an Offer of Place from an approved education provider',
      'Pay tuition and receive the receipt required for the visa application',
      'Show funds for living costs and evidence of onward travel',
      'Complete the online application with medical and police certificates',
      'Provide biometrics at the visa application centre serving Bangladesh',
    ],
    scholarships: [
      'Manaaki New Zealand Scholarships — government funded, for eligible developing countries',
      'University international excellence scholarships, awarded on academic merit',
    ],
    universities: ['University of Auckland', 'University of Otago', 'Massey University', 'Victoria University of Wellington', 'Lincoln University'],
    officialSource: { label: 'Immigration New Zealand — Study visas', url: 'https://www.immigration.govt.nz/new-zealand-visas/options/study' },
    faqs: [
      { q: 'How much does it cost to study in New Zealand from Bangladesh?', a: 'Tuition typically runs NZD 22,000–NZD 40,000 a year, and Immigration New Zealand expects you to show around NZD 20,000 for annual living costs. Confirm the current living-cost figure on the official site, as it is reviewed periodically.' },
      { q: 'How long can I work after studying in New Zealand?', a: 'The Post Study Work Visa runs up to three years, and the length depends on the level and duration of your qualification rather than on finding an employer first. Postgraduate qualifications generally attract the longer entitlements.' },
      { q: 'Can I work while studying in New Zealand?', a: 'Most students on a Fee Paying Student Visa can work up to 20 hours a week during term and full time during scheduled holidays. Your visa conditions state your exact entitlement — check them rather than assuming the general rule applies.' },
      { q: 'Are New Zealand universities well ranked?', a: 'All eight universities appear in international rankings, which is unusual and means there is no weak tier to steer around. The choice comes down to programme, location and cost rather than institutional quality.' },
      { q: 'What does "genuine intent" mean in a New Zealand visa decision?', a: 'The officer assesses whether you genuinely intend to study rather than to migrate by another route. A course that follows sensibly from your previous study, funding that is clearly explained, and consistent answers all support this. An unexplained jump in field or a long unexplained study gap invites more scrutiny.' },
    ],
  },
  {
    slug: 'spain',
    country: 'Spain',
    short: 'Spain',
    flag: '🇪🇸',
    tagline: 'Affordable EU study, strong business schools',
    answer:
      'Studying in Spain from Bangladesh costs roughly €6,000–€15,000 a year at most institutions, with living costs of €700–€1,000 a month — among the lower ranges in Western Europe. Students may work up to 30 hours a week, and graduates can apply for a one-year permit to look for work.',
    intro:
      'Spain offers Western European qualifications at costs closer to Eastern Europe, and its business schools carry genuine international standing. The trade-off is language: while English-taught programmes exist and are growing, Spanish still runs daily life and most of the job market, so the students who do best there arrive intending to learn it.',
    why: [
      'Living costs among the lowest in Western Europe',
      'Business schools with strong international reputations',
      'Up to 30 hours of work per week permitted alongside study',
      'One-year post-study permit to look for work or start a business',
    ],
    tuition: '€6,000–€15,000 per year at most institutions; public universities sit lower and private business schools higher',
    living: '€700–€1,000 per month; Madrid and Barcelona sit above smaller cities',
    currency: 'EUR (€)',
    intakes: 'September/October (main) and a smaller February intake',
    workRights: 'Up to 30 hours per week during study, subject to the conditions on your permit',
    postStudy: 'One-year residence permit to seek employment or start a business after graduating',
    englishReq: 'IELTS 6.0–6.5 for English-taught programmes; Spanish-taught programmes require DELE instead.',
    academicReq: 'HSC for undergraduate; a Bachelor\'s for Master\'s. Some programmes require homologation of your previous qualification.',
    visaName: 'Student visa (long-stay), followed by a TIE residence card',
    visaSteps: [
      'Accept your offer and pay the required deposit',
      'Obtain health insurance valid in Spain for the full period',
      'Show proof of sufficient funds for living costs',
      'Apply for the student visa at the Spanish visa centre serving Bangladesh with a police clearance certificate',
      'Apply for your TIE residence card within 30 days of arriving',
    ],
    scholarships: [
      'Institutional merit scholarships, particularly at business schools',
      'Erasmus+ funding for eligible mobility and joint programmes',
    ],
    universities: ['University of Barcelona', 'Complutense University of Madrid', 'IE University', 'ESADE'],
    officialSource: { label: 'Spain — Ministry of Foreign Affairs, student visa information', url: 'https://www.exteriores.gob.es/en/ServiciosAlCiudadano/Paginas/Servicios-consulares.aspx' },
    faqs: [
      { q: 'How much does it cost to study in Spain from Bangladesh?', a: 'Most institutions charge €6,000–€15,000 a year, with public universities lower and private business schools higher, and living costs of €700–€1,000 a month put Spain among the more affordable Western European options. Madrid and Barcelona cost noticeably more than smaller cities.' },
      { q: 'Do I need to speak Spanish to study in Spain?', a: 'Not for English-taught programmes, and there are a growing number at Master\'s level. But Spanish runs daily life and most part-time work, so students who arrive with none find the first months harder. Starting a course before you fly is worth the effort.' },
      { q: 'Can I work while studying in Spain?', a: 'Yes, up to 30 hours a week under current rules — one of the more generous allowances in Europe — subject to the conditions attached to your own permit. Work in Spanish-speaking roles is far easier to find with some of the language.' },
      { q: 'Can I stay in Spain after graduating?', a: 'You can apply for a one-year residence permit to look for work or start a business, and switch to a work permit once you have a qualifying job offer.' },
      { q: 'What is homologation?', a: 'It is the official recognition of a foreign qualification so it can be used for further study or regulated professions in Spain. Not every programme requires it, but where it does apply it takes time, so ask the institution early whether your course needs it.' },
    ],
  },
];

export function getDestination(slug: string): Destination | undefined {
  return DESTINATIONS.find(d => d.slug === slug);
}
