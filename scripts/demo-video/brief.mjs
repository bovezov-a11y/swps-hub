// Builds out/SWPS-Hub-project-overview.pdf, a short document to send to university staff, from the screenshots
// that screenshots.mjs takes.
//
//   ./reset.sh && node screenshots.mjs && node brief.mjs
import { writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const OUT = fileURLToPath(new URL('./out/', import.meta.url))
const shot = (name) => pathToFileURL(`${OUT}shots/${name}.jpg`).href
const font = pathToFileURL(fileURLToPath(new URL(
  '../../frontend/node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', import.meta.url))).href

const author = {
  name: 'Bayram Ovezov',
  programme: 'Computer Science, SWPS University',
  email: 'bovezov@st.swps.edu.pl',
  repository: 'github.com/bovezov-a11y/swps-hub',
}
const totalPages = 9

const logo = (size) => `<span class="logo" style="--s:${size}px"><span class="swps">SWPS</span><span class="hub">hub</span></span>`
const footer = (page) => `<footer><span>${logo(13)}&nbsp; Project overview</span><span>${page} / ${totalPages}</span></footer>`
const figure = (name, caption, extra = '') =>
  `<figure class="${extra}"><img src="${shot(name)}"><figcaption>${caption}</figcaption></figure>`

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>SWPS Hub – Project overview</title><style>
@font-face { font-family: Inter; src: url('${font}') format('woff2'); font-weight: 100 900; }
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: Inter, sans-serif; color: #0f172a; font-size: 10.4pt; line-height: 1.5; }
.page { position: relative; width: 210mm; height: 297mm; padding: 17mm 18mm 20mm; overflow: hidden; page-break-after: always; }
.page:last-child { page-break-after: auto; }
footer { position: absolute; left: 18mm; right: 18mm; bottom: 9mm; display: flex; justify-content: space-between; align-items: center;
  padding-top: 3mm; border-top: 0.5pt solid #e2e8f0; font-size: 8pt; color: #94a3b8; }
footer > span:first-child { display: inline-flex; align-items: flex-end; }
.logo { display: inline-flex; align-items: flex-end; line-height: 1; }
.logo .swps { font-size: var(--s); font-weight: 900; letter-spacing: -0.05em; color: #0f172a; }
.logo .hub { margin: 0 0 calc(var(--s) * 0.04) calc(var(--s) * 0.06); padding: calc(var(--s) * 0.05) calc(var(--s) * 0.11);
  border-radius: calc(var(--s) * 0.11); font-size: calc(var(--s) * 0.3); font-weight: 700; color: #fff;
  background: linear-gradient(90deg, #4f46e5, #8b5cf6); }
.eyebrow { font-size: 8.5pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #6366f1; }
h1 { margin: 2mm 0 5mm; font-size: 23pt; line-height: 1.15; letter-spacing: -0.02em; }
h2 { margin: 7mm 0 2.5mm; font-size: 13pt; letter-spacing: -0.01em; }
h3 { margin: 0 0 1mm; font-size: 10.5pt; }
p { margin: 0 0 3mm; }
.lead { font-size: 12pt; line-height: 1.55; color: #334155; }
.muted { color: #64748b; }
ul { margin: 0 0 3mm; padding-left: 4.5mm; } li { margin-bottom: 1.6mm; } li::marker { color: #6366f1; }
b, strong { font-weight: 650; }

/* Cover */
.cover { padding: 0; background: radial-gradient(160mm 110mm at 105% -10%, rgb(139 92 246 / 0.22), transparent),
  radial-gradient(140mm 100mm at -15% 105%, rgb(79 70 229 / 0.16), transparent), #f8fafc; }
.cover .inner { position: absolute; inset: 0; padding: 30mm 22mm; display: flex; flex-direction: column; }
.cover h1 { margin-top: 20mm; font-size: 34pt; }
.cover .lead { max-width: 135mm; font-size: 13.5pt; }
.cover .who { margin-top: auto; display: grid; grid-template-columns: auto 1fr; gap: 1.5mm 8mm; font-size: 10.5pt; }
.cover .who dt { color: #64748b; } .cover .who dd { margin: 0; font-weight: 600; }
.cover .note { margin-top: 12mm; padding: 4mm 5mm; border-radius: 3mm; background: rgb(255 255 255 / 0.75); font-size: 8.8pt; color: #475569; }
.pills { display: flex; flex-wrap: wrap; gap: 2mm; margin-top: 7mm; }
.pill { padding: 1.4mm 3.4mm; border-radius: 99mm; background: #fff; box-shadow: 0 0.3mm 1mm rgb(15 23 42 / 0.12); font-size: 9pt; font-weight: 600; color: #334155; }

/* Building blocks */
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin: 5mm 0 2mm; }
.stat { padding: 4mm; border-radius: 3mm; background: #f1f5f9; }
.stat b { display: block; font-size: 17pt; letter-spacing: -0.02em; color: #4338ca; }
.stat span { font-size: 8.5pt; color: #475569; line-height: 1.35; display: block; }
.problems { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
.problem { padding: 3.5mm 4mm; border-radius: 3mm; border: 0.5pt solid #e2e8f0; }
.problem p { margin: 0; font-size: 9.4pt; color: #475569; }
table { width: 100%; border-collapse: collapse; font-size: 9.3pt; }
th { text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; padding: 0 3mm 1.5mm 0; }
td { padding: 2.2mm 3mm 2.2mm 0; border-top: 0.5pt solid #e2e8f0; vertical-align: top; }
td:first-child { width: 43mm; font-weight: 650; }
.section-label { margin: 5mm 0 1.5mm; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #6366f1; }
figure { margin: 0; }
figure img { display: block; width: 100%; border-radius: 2.2mm; border: 0.5pt solid #e2e8f0; box-shadow: 0 1mm 3mm rgb(15 23 42 / 0.08); }
figcaption { margin-top: 1.6mm; font-size: 8.6pt; color: #475569; line-height: 1.4; }
figcaption b { color: #0f172a; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm 5mm; }
.phone { display: grid; grid-template-columns: 52mm 1fr; gap: 7mm; align-items: start; }
.phone img { border-radius: 5mm; }
.callout { padding: 4mm 5mm; border-radius: 3mm; background: #eef2ff; color: #312e81; font-size: 9.6pt; }
.callout b { color: #1e1b4b; }
.asks { counter-reset: ask; list-style: none; padding: 0; }
.asks li { counter-increment: ask; position: relative; padding: 0 0 0 9mm; margin-bottom: 3mm; }
.asks li::before { content: counter(ask); position: absolute; left: 0; top: 0; width: 6mm; height: 6mm; border-radius: 50%;
  background: #4f46e5; color: #fff; font-size: 8.5pt; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.arch { display: flex; align-items: center; gap: 2mm; margin: 3mm 0 1mm; font-size: 8.6pt; }
.arch .box { padding: 2.5mm 3mm; border-radius: 2mm; background: #f1f5f9; text-align: center; line-height: 1.3; }
.arch .box b { display: block; font-size: 9pt; }
.arch .arrow { color: #94a3b8; font-size: 12pt; }
.arch .stack { display: flex; flex-direction: column; gap: 1.5mm; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; }
</style></head><body>

<!-- 1 · Cover -->
<section class="page cover"><div class="inner">
  ${logo(64)}
  <h1>A study platform for<br>SWPS University students</h1>
  <p class="lead">Timetables and exam dates, past exams and notes shared across year groups, AI study tools,
  flashcards, an anonymous Q&amp;A and study groups, plus moderation and anonymous insights for university staff.</p>
  <div class="pills"><span class="pill">Working prototype</span><span class="pill">Open source</span>
    <span class="pill">Privacy by design</span><span class="pill">Built with Claude AI</span></div>
  <dl class="who">
    <dt>Author</dt><dd>${author.name}</dd>
    <dt>Programme</dt><dd>${author.programme}</dd>
    <dt>Contact</dt><dd>${author.email}</dd>
    <dt>Source code</dt><dd>${author.repository}</dd>
    <dt>Date</dt><dd>October 2026</dd>
  </dl>
  <div class="note">SWPS Hub is an unofficial student project. It is not affiliated with or endorsed by SWPS University.
  All people and data in the screenshots are made up for the demo.</div>
</div></section>

<!-- 2 · Summary and the problem -->
<section class="page">
  <div class="eyebrow">Summary</div>
  <h1>One place for everything a student needs to study</h1>
  <p class="lead">Today SWPS students piece their studies together from the student portal, Google Classroom, syllabi,
  e-mails and private group chats. SWPS Hub brings this into one app, organised by programme, year and course, and
  adds tools that help students study better and look after themselves during exam periods.</p>
  <p>It also gives the university something it does not have today: an anonymous, aggregate view of where students
  may need support, such as weeks when several exams fall together, or courses where students have no study
  materials, without watching what any individual student does.</p>
  <div class="stats">
    <div class="stat"><b>11</b><span>feature areas for students and staff</span></div>
    <div class="stat"><b>108</b><span>automated tests, run on every change</span></div>
    <div class="stat"><b>k ≥ 5</b><span>no staff statistic is based on fewer than five students</span></div>
    <div class="stat"><b>0</b><span>ads, trackers or public profiles</span></div>
  </div>
  <h2>The problem</h2>
  <div class="problems">
    <div class="problem"><h3>Information is scattered</h3><p>The timetable is in the portal, materials in Classroom,
      exam dates in syllabi and e-mails, and questions in private chats that not everyone is part of.</p></div>
    <div class="problem"><h3>Knowledge is lost every year</h3><p>Past exams and good notes circulate in closed groups
      and disappear when a year group graduates. Smaller programmes often have no such groups at all.</p></div>
    <div class="problem"><h3>Exam weeks pile up unnoticed</h3><p>Students see deadlines course by course, so a week
      with five assessments is often noticed only when it is too late to plan for it.</p></div>
    <div class="problem"><h3>Asking for help is hard</h3><p>Many students, especially first-years and international
      students, hesitate to ask questions in front of others.</p></div>
    <div class="problem"><h3>Staff lack the overall picture</h3><p>It is hard to see which weeks are overloaded for a
      programme, or which courses have no study materials, without collecting personal data.</p></div>
    <div class="problem"><h3>Tools are not built for studying</h3><p>General chat and storage tools do not schedule
      revision, check understanding or turn notes into practice.</p></div>
  </div>
  ${footer(2)}
</section>

<!-- 3 · Features -->
<section class="page">
  <div class="eyebrow">What it does</div>
  <h1>Features</h1>
  <div class="section-label">For students</div>
  <table>
    <tr><td>Programmes and courses</td><td>Every programme (Psychology, Computer Science, Law and more) and year of study.
      Courses persist across academic years and can be searched across the whole university.</td></tr>
    <tr><td>Timetable and calendar</td><td>Lectures, labs, exams and deadlines, with weekly classes that keep their time
      across daylight-saving changes. One personal calendar, also as a private feed for Google, Apple or Outlook.</td></tr>
    <tr><td>Shared materials</td><td>Past exams, notes, summaries and assignments tagged with their academic year,
      filtered by type and year, and ranked by upvotes. Files are shared anonymously.</td></tr>
    <tr><td>AI study tools</td><td>Claude turns a shared PDF, image or text file into a summary, a practice quiz with
      explanations, or a flashcard deck. Each result is made once and shared with the course; 20 new results per
      student per day.</td></tr>
    <tr><td>Syllabus import</td><td>Upload a syllabus and the AI lists every exam, deadline and grade weight. Students
      check each date before it is added to the course calendar; dates the syllabus does not give are never guessed.</td></tr>
    <tr><td>Flashcards</td><td>Shared decks with private progress, scheduled with spaced repetition (the SM-2
      algorithm) so each card returns just before it would be forgotten. Daily streaks keep students going.</td></tr>
    <tr><td>Anonymous Q&amp;A</td><td>Questions and answers per course, sorted by upvotes, with an accepted answer chosen
      by the person who asked. Names are never shown.</td></tr>
    <tr><td>Study groups</td><td>Groups with a set number of places. Only members see each other's names and where the
      group meets.</td></tr>
    <tr><td>Workload and wellbeing</td><td>A 16-week heatmap of exams and deadlines, alerts for crunch weeks, one-click
      study plans placed in the calendar, a focus timer, and Polish support lines. No mood or health data is stored.</td></tr>
  </table>
  <div class="section-label">For university staff</div>
  <table>
    <tr><td>Moderation</td><td>Anonymous reports; content reported three times is hidden until a moderator reviews it.
      A queue to hide, restore or delete, a log of every decision, and admins who appoint moderators.</td></tr>
    <tr><td>University insights</td><td>Exam pressure per programme and week, students facing a crunch, courses with no
      materials and unanswered questions. Aggregate only; any figure based on fewer than five students is withheld.</td></tr>
  </table>
  ${footer(3)}
</section>

<!-- 4 · Screens: everyday use -->
<section class="page">
  <div class="eyebrow">A tour</div>
  <h1>A student's day</h1>
  ${figure('dashboard', '<b>Dashboard.</b> The next exam, a warning about the busy week ahead, flashcards due today with a five-day streak, and upcoming deadlines across all courses.')}
  <div class="grid2" style="margin-top:6mm">
    ${figure('materials', '<b>Shared materials.</b> Past exams and notes with their academic year, ranked by upvotes and shared anonymously.')}
    ${figure('calendar', '<b>Calendar.</b> Every class, exam and deadline from all courses in one week view, with a private link to sync it to a phone.')}
  </div>
  ${footer(4)}
</section>

<!-- 5 · Screens: AI and learning -->
<section class="page">
  <div class="eyebrow">A tour</div>
  <h1>Studying with AI and flashcards</h1>
  <div class="grid2" style="grid-template-columns: 1fr 1fr; width: 82%; margin: 0 auto">
    ${figure('ai-summary', '<b>AI summary.</b> Key points and key terms from a shared lecture file.')}
    ${figure('ai-quiz', '<b>Practice quiz.</b> Wrong answers are marked and each question explains the right one.')}
  </div>
  <div class="grid2" style="margin-top:5mm">
    ${figure('flashcards', '<b>Flashcards.</b> Flip with the space bar and grade from “Again” to “Easy”; the SM-2 schedule decides when the card returns.')}
    ${figure('question', '<b>Anonymous Q&amp;A.</b> The asker marked the answer that solved the question; nobody sees names.')}
  </div>
  <div class="callout" style="margin-top:6mm"><b>About the AI examples.</b> The app calls Anthropic's Claude model
  through its official SDK with structured outputs. No API key is connected in this demo, so the AI results shown here
  are sample content written in advance. With a key, the same screens are filled by the model.</div>
  ${footer(5)}
</section>

<!-- 6 · Screens: community and wellbeing -->
<section class="page">
  <div class="eyebrow">A tour</div>
  <h1>Community and wellbeing</h1>
  <div class="grid2">
    ${figure('groups', '<b>Study groups.</b> After joining, Maja sees the members and the meeting place; others only see how full the group is.')}
    ${figure('wellbeing', '<b>Crunch alert.</b> Six exams and deadlines in one week. One click plans short study sessions before each.')}
  </div>
  <div class="phone" style="margin-top:6mm">
    ${figure('mobile', '<b>On a phone.</b> The same app on a small screen.')}
    <div>
      ${figure('wellbeing-heatmap', '<b>Semester heatmap, focus timer and support.</b> Sixteen weeks of assessments at a glance, a 25/5 Pomodoro timer, and the 24/7 Centrum Wsparcia line, 116 123 and 112.')}
    </div>
  </div>
  ${footer(6)}
</section>

<!-- 7 · Staff -->
<section class="page">
  <div class="eyebrow">For the university</div>
  <h1>Moderation and insights</h1>
  <div class="grid2">
    ${figure('moderation', '<b>Moderation queue.</b> A spam question was hidden automatically after three reports. Moderators see the content and the reasons, never who reported it or who posted it.')}
    ${figure('insights-heatmap', '<b>University insights.</b> Exam pressure per programme and week. Programmes with fewer than five students show “&lt;5” instead of a number.')}
    ${figure('insights', '<b>Overview.</b> Totals for the whole university: verified students, courses, shared files, upcoming assessments and use of the study tools.')}
    ${figure('insights-lists', '<b>Where to act.</b> Busy courses with few materials, questions nobody has answered, and the most helpful materials.')}
  </div>
  <h2 style="margin-top:5mm">How it helps SWPS</h2>
  <ul>
    <li><b>Earlier support in exam periods.</b> Crunch weeks are visible to students in time to plan, and to staff as
      anonymous totals per programme, for example to spread deadlines or remind students of counselling.</li>
    <li><b>Better use of teaching materials.</b> Insights show busy courses with few materials, where lecturers might
      share more, and questions that nobody has answered yet.</li>
    <li><b>Peer learning across year groups and programmes.</b> Knowledge stays available from one year to the next,
      also for international students and smaller programmes.</li>
    <li><b>Safe by default.</b> Only SWPS accounts can join, reported content is hidden quickly, and every moderation
      decision is logged.</li>
    <li><b>Low cost to run.</b> Open source, packaged with Docker, and runs on a single small server.</li>
  </ul>
  ${footer(7)}
</section>

<!-- 8 · Privacy and technology -->
<section class="page">
  <div class="eyebrow">Trust</div>
  <h1>Privacy, security and technology</h1>
  <div class="two-col">
    <div>
      <h2 style="margin-top:0">Privacy by design</h2>
      <ul>
        <li>Only <b>@st.swps.edu.pl</b> and <b>@swps.edu.pl</b> addresses can sign up, confirmed by a one-time e-mail link.</li>
        <li>No public profiles or activity status. Files, questions and answers are anonymous to other students, who
          only ever see totals.</li>
        <li>Staff statistics are aggregate; figures based on fewer than five students are withheld. Moderators never
          see reporters or authors.</li>
        <li>No ads, analytics or tracking, and no mood or health data.</li>
        <li>A versioned privacy policy (now 1.1); each account records which version it accepted. GDPR rights are
          described, including complaints to UODO.</li>
        <li>Files are sent to the AI provider only when a student asks for an AI tool on them.</li>
      </ul>
      <h2>Security</h2>
      <ul>
        <li>Passwords stored only as bcrypt hashes; signed login tokens (JWT); no default secrets.</li>
        <li>Every permission and role is checked on the server, and covered by tests.</li>
      </ul>
    </div>
    <div>
      <h2 style="margin-top:0">Technology</h2>
      <table>
        <tr><td style="width:24mm">Backend</td><td>Java 25, Spring Boot 4.1, Spring Security, JPA, Flyway migrations</td></tr>
        <tr><td style="width:24mm">Database</td><td>PostgreSQL 17</td></tr>
        <tr><td style="width:24mm">Frontend</td><td>React 19, TypeScript 6, Vite 8, Tailwind CSS 4, TanStack Query</td></tr>
        <tr><td style="width:24mm">AI</td><td>Claude via the Anthropic Java SDK, with structured outputs validated against a schema</td></tr>
        <tr><td style="width:24mm">Quality</td><td>71 backend integration tests on a real PostgreSQL (Testcontainers) and 37 frontend tests (Vitest, Testing Library), run by GitHub Actions on every push</td></tr>
        <tr><td style="width:24mm">Delivery</td><td>Docker Compose: database, API, web app and mail; a scripted demo that records itself</td></tr>
      </table>
      <h2>Architecture</h2>
      <div class="arch">
        <div class="box"><b>Web app</b>React</div><span class="arrow">→</span>
        <div class="box"><b>REST API</b>Spring Boot</div><span class="arrow">→</span>
        <div class="stack"><div class="box"><b>PostgreSQL</b></div><div class="box"><b>File storage</b></div>
          <div class="box"><b>Claude API</b></div><div class="box"><b>E-mail</b></div></div>
      </div>
    </div>
  </div>
  ${footer(8)}
</section>

<!-- 9 · Status and asks -->
<section class="page">
  <div class="eyebrow">Next steps</div>
  <h1>Where it stands, and what I would like to ask</h1>
  <h2 style="margin-top:2mm">Status</h2>
  <ul>
    <li><b>Done:</b> every feature in this document is implemented, tested and runs locally. The source code is
      public, and a five-minute video walks through the app.</li>
    <li><b>Not yet:</b> the app is not deployed publicly; AI tools need an API key; timetables are added by students or
      imported from syllabi, because there is no official data feed.</li>
  </ul>
  <h2>What I would like to ask</h2>
  <ol class="asks">
    <li><b>Your feedback</b> on the idea and on what would make it most useful at SWPS.</li>
    <li><b>A small pilot</b> with one programme or year group for a semester, to learn from real use.</li>
    <li><b>Access to timetable data,</b> such as a calendar (iCal) export or a read-only interface from the student
      portal, so students do not enter their schedule by hand.</li>
    <li><b>Guidance on the SWPS name and logo,</b> and whether the project may present itself as connected to the
      university.</li>
    <li><b>Advice on data protection and hosting,</b> for example a review with the Data Protection Officer before
      any real student data is used.</li>
  </ol>
  <h2>Roadmap</h2>
  <ul>
    <li>E-mail and push reminders before exams and deadlines; a Polish interface; installable mobile app (PWA).</li>
    <li>Official timetable import, and an optional Google Classroom connection that each student authorises.</li>
    <li>Public deployment with backups, monitoring and error tracking.</li>
  </ul>
  <div class="callout" style="margin-top:7mm"><b>Contact.</b> ${author.name} · ${author.email}<br>
  Source code: ${author.repository} · Demo video available on request.</div>
  ${footer(9)}
</section>
</body></html>`

const htmlPath = `${OUT}brief.html`
writeFileSync(htmlPath, html)
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
const overflowing = await page.$$eval('.page', (pages) =>
  pages.map((element, index) => (element.scrollHeight > element.clientHeight + 1 ? index + 1 : null)).filter(Boolean))
if (overflowing.length) console.warn(`Content overflows on page(s) ${overflowing.join(', ')}`)
const pdf = `${OUT}SWPS-Hub-project-overview.pdf`
await page.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true })
await browser.close()
console.log(`Saved ${pdf}`)
