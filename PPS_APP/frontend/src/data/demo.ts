/**
 * DEMO DATA — sample scanner responses for visual testing only.
 *
 * Nothing here is produced by a scanner. Every result built from it has
 * `source: "demo"` and the UI labels it. Payloads use the exact JSON shape in
 * API_INTEGRATION.md, so they double as contract examples. The CA1 rubric
 * criteria are placeholders until the real faculty rubric comes from the API.
 */

export type DemoScenario = "valid_resume" | "earlier_draft" | "grade_card" | "empty_document";

export const DEMO_SCENARIOS: { id: DemoScenario; label: string; hint: string }[] = [
  { id: "valid_resume", label: "Sample resume", hint: "A real-looking resume with fixable issues" },
  { id: "earlier_draft", label: "Earlier draft", hint: "Same student, before fixes — useful for Compare" },
  { id: "grade_card", label: "Grade card", hint: "Not a resume — tests rejection" },
  { id: "empty_document", label: "Image-only file", hint: "No readable text" },
];

const RUBRIC = (s: [number, number, number, number, number], comments: string[]) => [
  { criterion: "Structure and sections", score: s[0], max_score: 6, comment: comments[0] },
  { criterion: "Formatting and layout", score: s[1], max_score: 6, comment: comments[1] },
  { criterion: "Content quality and impact", score: s[2], max_score: 8, comment: comments[2] },
  { criterion: "Projects and skills", score: s[3], max_score: 6, comment: comments[3] },
  { criterion: "Language and accuracy", score: s[4], max_score: 4, comment: comments[4] },
];

const VALID_FINDINGS = [
  {
    id: "placeholder-github", title: "Placeholder text left in the resume", category: "Links", severity: "critical",
    explanation: "A project entry contains template text instead of a real link.",
    why_it_matters: "Recruiters and faculty read placeholders as an unfinished resume — and a keyword checker would have counted this as a valid link.",
    suggestion: "Replace it with the public GitHub repository URL, or remove the line if the project is private.",
    evidence: "GitHub: Insert GitHub link here", location: { page: 1, section: "Projects" },
  },
  {
    id: "linkedin-incomplete", title: "Incomplete LinkedIn URL", category: "Links", severity: "critical",
    explanation: "The LinkedIn link ends at the domain and does not point to a profile.",
    why_it_matters: "A broken profile link is a missed chance for a recruiter to verify your background.",
    suggestion: "Use your full profile URL, e.g. linkedin.com/in/your-name.",
    evidence: "linkedin.com/in/", location: { page: 1, section: "Contact" },
  },
  {
    id: "two-column-skills", title: "Two-column skills block", category: "ATS compatibility", severity: "warning",
    explanation: "Skills are laid out in two side-by-side columns.",
    why_it_matters: "Many ATS parsers read straight across columns, merging unrelated skills into one line.",
    suggestion: "Use a single column grouped by type — Languages, Frameworks, Tools.",
    location: { page: 1, section: "Skills" },
  },
  {
    id: "section-spacing", title: "Inconsistent spacing between sections", category: "Formatting and alignment", severity: "warning",
    explanation: "Gaps above section headings vary noticeably across the page.",
    why_it_matters: "Uneven spacing looks unpolished at a glance, and the faculty rubric grades layout explicitly.",
    suggestion: "Use one heading style with identical space before and after.",
    location: { page: 1 },
  },
  {
    id: "date-alignment", title: "Dates are not aligned", category: "Formatting and alignment", severity: "warning",
    explanation: "Right-aligned dates in Experience use spaces instead of a tab stop, so they drift.",
    why_it_matters: "Misaligned dates are one of the most visible formatting issues on a one-page resume.",
    suggestion: "Set a right-aligned tab stop at the margin and use it for every date.",
    location: { page: 1, section: "Experience" },
  },
  {
    id: "unquantified", title: "Project outcomes are not quantified", category: "Content quality", severity: "warning",
    explanation: "Project bullets describe tasks but not results.",
    why_it_matters: "Measurable outcomes make the impact of your work concrete and comparable.",
    suggestion: "Add a number where you honestly can: users, accuracy, time saved, dataset size.",
    evidence: "Worked on a machine learning model for prediction.", location: { page: 1, section: "Projects" },
  },
  {
    id: "spelling", title: "Spelling errors", category: "Grammar and spelling", severity: "suggestion",
    explanation: "Two words are misspelled.",
    why_it_matters: "Spelling errors suggest a lack of attention to detail.",
    suggestion: "Correct “managment” → “management” and “develope” → “develop”.",
    evidence: "managment · develope", location: { page: 1, section: "Experience" },
  },
  {
    id: "tense", title: "Mixed tense in experience bullets", category: "Grammar and spelling", severity: "suggestion",
    explanation: "A completed internship mixes present and past tense.",
    why_it_matters: "Consistent tense reads more professionally.",
    suggestion: "Use past tense for completed roles and present tense only for current ones.",
    location: { page: 1, section: "Experience" },
  },
  {
    id: "cert-heading", title: "Certifications heading not recognised", category: "Resume structure", severity: "suggestion",
    explanation: "Certifications are listed under a heading styled as body text.",
    why_it_matters: "Parsers rely on recognisable headings to map content into fields.",
    suggestion: "Add a clear “Certifications” heading in the same style as other sections.",
    location: { page: 1, section: "Certifications" },
  },
  {
    id: "contact-ok", title: "Contact details are complete", category: "Contact information", severity: "info",
    explanation: "Name, email and phone number were found and are well-formed.",
    location: { page: 1, section: "Contact" }, resolved: true,
  },
  {
    id: "education-ok", title: "Education section is complete", category: "Education", severity: "info",
    explanation: "Degree, institution, dates and CGPA are present.",
    location: { page: 1, section: "Education" }, resolved: true,
  },
];

const CATEGORIES = (over: Record<string, "pass" | "warn" | "fail"> = {}) => [
  { key: "structure", label: "Structure", status: over.structure ?? "pass", summary: "Contact, Education, Projects, Skills and Experience in a logical order." },
  { key: "formatting", label: "Formatting", status: over.formatting ?? "warn", summary: "Mixed spacing between sections; right-aligned dates drift." },
  { key: "content", label: "Content", status: over.content ?? "warn", summary: "Project bullets describe tasks rather than outcomes." },
  { key: "skills", label: "Skills", status: over.skills ?? "warn", summary: "4 of 9 skills have no supporting evidence elsewhere." },
  { key: "education", label: "Education", status: over.education ?? "pass", summary: "Degree, institution, dates and CGPA present." },
  { key: "experience", label: "Experience", status: over.experience ?? "pass", summary: "One internship with role, dates and responsibilities." },
  { key: "projects", label: "Projects", status: over.projects ?? "warn", summary: "Two projects; one has a placeholder link." },
  { key: "contact", label: "Contact", status: over.contact ?? "pass", summary: "Email and phone present and well-formed." },
  { key: "links", label: "Links", status: over.links ?? "fail", summary: "One placeholder link and one incomplete LinkedIn URL." },
  { key: "grammar", label: "Grammar", status: over.grammar ?? "warn", summary: "Two spelling errors and one tense inconsistency." },
];

export const DEMO_PAYLOADS: Record<DemoScenario, object> = {
  valid_resume: {
    scan_id: "demo-valid",
    status: "completed",
    analysed_at: new Date().toISOString(),
    file: { name: "sample_resume_DEMO.pdf", mime_type: "application/pdf", size_bytes: 184320, pages: 1 },
    validation: {
      is_resume: true, document_type: "resume", message: "Recognised as a student resume.",
      reasons: ["Contact block, Education, Projects and Skills sections detected."], confidence: 0.96,
    },
    ats: {
      score: 72,
      summary: "Readable by most applicant-tracking systems. Placeholder text and a two-column skills block reduce reliability.",
      components: [
        { name: "Text extraction", score: 88, max_score: 100, summary: "All text layers extracted in reading order." },
        { name: "Section recognition", score: 74, max_score: 100, summary: "Certifications heading not recognised." },
        { name: "Layout safety", score: 58, max_score: 100, summary: "Two-column block and a text box in the header." },
      ],
    },
    ca1: {
      total: 19.5, max_score: 30, status: "provisional", reviewed_by: null, reviewed_at: null,
      rubric: RUBRIC([5, 3, 4.5, 4, 3], [
        "All core sections present.", "Inconsistent spacing and alignment.", "Project bullets lack measurable outcomes.",
        "One project has a placeholder link.", "Two spelling errors.",
      ]),
    },
    categories: CATEGORIES(),
    findings: VALID_FINDINGS,
    sections_detected: ["Contact", "Education", "Experience", "Projects", "Skills", "Certifications"],
    review_flags: [{ code: "placeholder_detected", message: "Placeholder text found — confirm the project link before finalising CA1." }],
    reports: [{ kind: "annotated_pdf", label: "Annotated PDF", url: null, available: false }],
  },
  earlier_draft: {
    scan_id: "demo-draft",
    status: "completed",
    analysed_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    file: { name: "sample_resume_v1_DEMO.pdf", mime_type: "application/pdf", size_bytes: 201728, pages: 2 },
    validation: { is_resume: true, document_type: "resume", message: "Recognised as a student resume.", reasons: [], confidence: 0.91 },
    ats: {
      score: 54,
      summary: "Parts of this resume may be skipped: a table-based layout and header text box break reading order.",
      components: [
        { name: "Text extraction", score: 70, max_score: 100, summary: "Header text box extracted out of order." },
        { name: "Section recognition", score: 52, max_score: 100, summary: "Skills and Certifications headings not recognised." },
        { name: "Layout safety", score: 40, max_score: 100, summary: "Table-based layout across two pages." },
      ],
    },
    ca1: {
      total: 14, max_score: 30, status: "provisional",
      rubric: RUBRIC([4, 2, 3, 3, 2], [
        "Skills section hard to locate.", "Table layout and uneven margins.", "Generic responsibilities, no outcomes.",
        "Placeholder link in projects.", "Several spelling and tense errors.",
      ]),
    },
    categories: CATEGORIES({ structure: "warn", formatting: "fail", skills: "fail" }),
    findings: [
      ...VALID_FINDINGS.filter((f) => f.id !== "cert-heading"),
      {
        id: "two-pages", title: "Resume runs onto a second page", category: "Formatting and alignment", severity: "warning",
        explanation: "Only four lines spill onto page two.",
        why_it_matters: "Fresh-graduate resumes are expected to fit on one page.",
        suggestion: "Tighten margins and trim older or less relevant bullets.",
        location: { page: 2 },
      },
      {
        id: "table-layout", title: "Table used for layout", category: "ATS compatibility", severity: "critical",
        explanation: "The whole resume is built inside a two-column table.",
        why_it_matters: "Tables are a common reason ATS software reads content out of order or drops it.",
        suggestion: "Rebuild the layout with normal paragraphs and tab stops.",
        location: { page: 1 },
      },
    ],
    sections_detected: ["Contact", "Education", "Experience", "Projects"],
    review_flags: [],
    reports: [],
  },
  grade_card: {
    scan_id: "demo-gradecard",
    status: "invalid_document",
    analysed_at: new Date().toISOString(),
    file: { name: "semester_marksheet_DEMO.pdf", mime_type: "application/pdf", size_bytes: 96256, pages: 1 },
    validation: {
      is_resume: false, document_type: "grade_card",
      message: "This looks like a grade card or marksheet, not a resume.",
      reasons: [
        "Tabular course codes, credits and grade points dominate the page.",
        "No resume sections (Projects, Skills, Experience) were found.",
        "Contains SGPA / CGPA summary rows typical of a marksheet.",
      ],
      confidence: 0.94,
    },
    categories: [], findings: [], sections_detected: [], review_flags: [], reports: [],
  },
  empty_document: {
    scan_id: "demo-empty",
    status: "invalid_document",
    analysed_at: new Date().toISOString(),
    file: { name: "scanned_resume_DEMO.pdf", mime_type: "application/pdf", size_bytes: 412000, pages: 1 },
    validation: {
      is_resume: false, document_type: "empty",
      message: "No readable text was found in this document.",
      reasons: ["The page is a scanned image with no text layer.", "Applicant-tracking systems cannot read image-only resumes either."],
      confidence: null,
    },
    categories: [], findings: [], sections_detected: [], review_flags: [], reports: [],
  },
};

/* --------------------------------------------------------- Faculty queue */
export interface DemoSubmission {
  id: string;
  student: string;
  roll: string;
  batch: string;
  submittedDaysAgo: number | null;
  scenario: DemoScenario | null;
  review: "Pending review" | "Needs resubmission" | "Not submitted";
}

export const DEMO_SUBMISSIONS: DemoSubmission[] = [
  { id: "sub-01", student: "Aarav Mehta", roll: "DEMO-014", batch: "PPS4027 A", submittedDaysAgo: 0, scenario: "valid_resume", review: "Pending review" },
  { id: "sub-02", student: "Ishita Kulkarni", roll: "DEMO-018", batch: "PPS4027 A", submittedDaysAgo: 1, scenario: "earlier_draft", review: "Pending review" },
  { id: "sub-03", student: "Nisha Rao", roll: "DEMO-021", batch: "PPS4027 A", submittedDaysAgo: 2, scenario: "grade_card", review: "Needs resubmission" },
  { id: "sub-04", student: "Sana Ali", roll: "DEMO-033", batch: "PPS4027 A", submittedDaysAgo: 3, scenario: "empty_document", review: "Needs resubmission" },
  { id: "sub-05", student: "Rohan Iyer", roll: "DEMO-040", batch: "PPS4027 A", submittedDaysAgo: null, scenario: null, review: "Not submitted" },
];

/* --------------------------------------------------------- Course (sample) */
export const DEMO_COURSE = {
  module: "Module 1 · Resume building",
  completion: 62,
  weeks: [
    { week: "W1", label: "ATS-ready resume basics", done: true },
    { week: "W2", label: "Tailoring a resume to a JD", done: true },
    { week: "W3", label: "Writing impact-focused projects", done: false },
    { week: "W4", label: "CA1 resume review", done: false },
  ],
  upcoming: [
    { date: "Tue", title: "Content drop", where: "Content library" },
    { date: "Wed", title: "Live Q&A · 4:00 PM", where: "MS Teams" },
    { date: "Thu", title: "CA1 resume review due", where: "Assignment area" },
  ],
};

export const DEMO_USERS = {
  student: { name: "Aarav Mehta", email: "aarav@example.edu", role: "student" as const, batch: "PPS4027 A", initials: "AM" },
  faculty: { name: "Dr. Kavya Shah", email: "kavya@example.edu", role: "faculty" as const, batch: "PPS4027 A", initials: "KS" },
};
