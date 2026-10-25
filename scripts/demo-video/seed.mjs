// Fills the demo stack (compose.demo.yaml, http://localhost:3100) with a believable semester: a third-year Computer
// Science student, her classmates, courses, a timetable, shared files, Q&A, study groups, flashcards and a few
// reports for the moderators. Every person and file here is made up.
//
//   node seed.mjs
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const BASE = process.env.DEMO_URL ?? 'http://localhost:3100'
// Demo accounts only exist in the throwaway demo database.
export const PASSWORD = 'demo-pass-2026'

export const people = {
  maja: { email: 'maja.kowalska@st.swps.edu.pl', name: 'Maja Kowalska' },
  jan: { email: 'jan.zielinski@st.swps.edu.pl', name: 'Jan Zieliński' },
  ola: { email: 'ola.wisniewska@st.swps.edu.pl', name: 'Ola Wiśniewska' },
  piotr: { email: 'piotr.mazur@st.swps.edu.pl', name: 'Piotr Mazur' },
  kasia: { email: 'kasia.lewandowska@st.swps.edu.pl', name: 'Kasia Lewandowska' },
  tomek: { email: 'tomek.krol@st.swps.edu.pl', name: 'Tomek Król' },
  zuzia: { email: 'zuzia.dabrowska@st.swps.edu.pl', name: 'Zuzia Dąbrowska' },
  ola2: { email: 'ola.nowicka@st.swps.edu.pl', name: 'Ola Nowicka' },
  ewa: { email: 'ewa.lis@swps.edu.pl', name: 'Ewa Lis' },
}

function sql(statement) {
  return execFileSync('docker', [
    'compose', '-p', 'swps-demo', '-f', fileURLToPath(new URL('./compose.demo.yaml', import.meta.url)),
    'exec', '-T', 'postgres', 'psql', '-U', 'studenthub', '-d', 'studenthub', '-tA', '-c', statement,
  ], { encoding: 'utf8' }).trim()
}

async function call(token, method, path, body) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let payload
  if (body instanceof FormData) payload = body
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const response = await fetch(`${BASE}/api${path}`, { method, headers, body: payload })
  const text = await response.text()
  if (!response.ok) throw new Error(`${method} ${path} → ${response.status} ${text}`)
  return text ? JSON.parse(text) : null
}

async function account(person) {
  await call(null, 'POST', '/auth/register', {
    email: person.email, password: PASSWORD, displayName: person.name, privacyPolicyVersion: '1.1',
  })
  // Skips the confirmation email; the sign-up flow itself is covered by the backend tests.
  sql(`update users set email_verified = true where email = '${person.email}'`)
  const { token } = await call(null, 'POST', '/auth/login', { email: person.email, password: PASSWORD })
  return token
}

/** Warsaw local time as an instant. Summer time ends on 25 October 2026. */
function warsaw(date, time) {
  const offset = date < '2026-10-25' ? '+02:00' : '+01:00'
  return new Date(`${date}T${time}:00${offset}`).toISOString()
}

/** A tiny but valid one-page PDF with the given lines, so shared files open like real ones. */
function pdf(title, lines) {
  const escape = (text) => text.replace(/[\\()]/g, (c) => `\\${c}`)
  const content = [
    'BT /F1 20 Tf 60 780 Td', `(${escape(title)}) Tj`, '/F1 11 Tf 0 -34 Td 15 TL',
    ...lines.map((line) => `(${escape(line)}) '`), 'ET',
  ].join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let out = '%PDF-1.4\n'
  const offsets = []
  objects.forEach((object, index) => {
    offsets.push(out.length)
    out += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = out.length
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  out += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return new Blob([out], { type: 'application/pdf' })
}

async function upload(token, courseId, { type, title, description, year, fileName, lines }) {
  const form = new FormData()
  form.append('type', type)
  form.append('title', title)
  if (description) form.append('description', description)
  form.append('academicYear', year)
  form.append('file', pdf(title, lines), fileName)
  return call(token, 'POST', `/courses/${courseId}/materials`, form)
}

async function main() {
  const t = {}
  for (const [key, person] of Object.entries(people)) t[key] = await account(person)
  const ids = Object.fromEntries(Object.values(people).map((p) => [p.email, sql(`select id from users where email = '${p.email}'`)]))
  const programs = Object.fromEntries((await call(t.maja, 'GET', '/programs')).map((p) => [p.slug, p.id]))

  const course = async (token, program, year, code, name, lecturer, description) =>
    (await call(token, 'POST', '/courses', {
      programId: programs[program], studyYear: year, term: 'WINTER', code, name, lecturer, description,
    })).id

  const db = await course(t.ola, 'computer-science', 3, 'DB-301', 'Databases', 'dr Marta Wójcik',
    'Relational modelling, SQL, normalisation, transactions and indexing. Midterm (30%), SQL project (20%) and a written final exam (50%).')
  const se = await course(t.jan, 'computer-science', 3, 'SE-301', 'Software Engineering', 'dr Paweł Nowak',
    'Requirements, design, testing and Scrum, taught through a semester-long team project.')
  const nm = await course(t.piotr, 'computer-science', 3, 'NM-301', 'Numerical Methods', 'prof. Anna Kamińska',
    'Floating point, root finding, interpolation, numerical integration and linear systems.')
  const pl = await course(t.kasia, 'computer-science', 3, 'PL-301', 'Programming Languages', 'dr Tomasz Wrona',
    'Paradigms, type systems and semantics, with labs in Haskell and Rust.')
  const ml = await course(t.zuzia, 'computer-science', 3, 'ADA-301', 'Advanced Data Analysis', 'dr Iga Sowa',
    'Regression, classification and model evaluation in Python.')
  await course(t.ola2, 'psychology', 1, 'PSY-101', 'Introduction to Psychology', 'dr Ewa Marek',
    'Classic studies and the main areas of psychology.')
  await course(t.ola2, 'law', 2, 'LAW-210', 'Civil Law', 'prof. Jerzy Bąk', 'Obligations and contracts.')

  const cs = [db, se, nm, pl, ml]
  const classmates = ['maja', 'jan', 'ola', 'piotr', 'kasia', 'tomek', 'zuzia']
  for (const who of classmates) {
    for (const id of cs) await call(t[who], 'PUT', `/courses/${id}/enrollment`).catch(() => {})
  }

  // Weekly timetable from the first week of the semester.
  const weekly = [
    [db, 'LECTURE', 'Databases – lecture', '2026-10-05', '10:00', '11:30', 'Room 302'],
    [db, 'LAB', 'Databases – lab', '2026-10-07', '12:00', '13:30', 'Lab 1.12'],
    [se, 'LECTURE', 'Software Engineering – lecture', '2026-10-06', '08:00', '09:30', 'Aula C'],
    [se, 'CLASS', 'Software Engineering – project class', '2026-10-08', '14:00', '15:30', 'Room 204'],
    [nm, 'LECTURE', 'Numerical Methods – lecture', '2026-10-07', '09:00', '10:30', 'Aula B'],
    [nm, 'CLASS', 'Numerical Methods – exercises', '2026-10-09', '10:00', '11:30', 'Room 115'],
    [pl, 'LECTURE', 'Programming Languages – lecture', '2026-10-08', '10:00', '11:30', 'Room 302'],
    [pl, 'LAB', 'Programming Languages – lab', '2026-10-05', '14:00', '15:30', 'Lab 1.10'],
    [ml, 'LAB', 'Advanced Data Analysis – lab', '2026-10-06', '12:00', '13:30', 'Lab 1.12'],
  ]
  for (const [id, type, title, date, start, end, location] of weekly) {
    await call(t.ola, 'POST', `/courses/${id}/events`, {
      type, title, startsAt: warsaw(date, start), endsAt: warsaw(date, end), location, repeatWeeks: 15,
    })
  }
  const assessments = [
    [se, 'DEADLINE', 'Sprint 1 demo', '2026-11-05', '14:00'],
    [db, 'DEADLINE', 'SQL project hand-in', '2026-11-10', '23:59'],
    [pl, 'DEADLINE', 'Haskell assignment', '2026-11-11', '23:59'],
    [db, 'EXAM', 'Databases midterm', '2026-11-12', '10:00'],
    [se, 'DEADLINE', 'Exercises 1–4', '2026-11-12', '23:59'],
    [nm, 'EXAM', 'Numerical Methods colloquium', '2026-11-13', '10:00'],
    [ml, 'DEADLINE', 'Regression report', '2026-12-03', '23:59'],
    [pl, 'EXAM', 'Programming Languages exam', '2027-01-28', '09:00'],
    [db, 'EXAM', 'Databases final exam', '2027-02-02', '10:00'],
  ]
  for (const [id, type, title, date, time] of assessments) {
    const startsAt = warsaw(date, time)
    const endsAt = type === 'EXAM' ? new Date(new Date(startsAt).getTime() + 2 * 3600_000).toISOString() : startsAt
    await call(t.jan, 'POST', `/courses/${id}/events`, { type, title, startsAt, endsAt, location: type === 'EXAM' ? 'Aula A' : null, repeatWeeks: null })
  }

  // Shared files.
  const finalExam = await upload(t.jan, db, {
    type: 'PAST_EXAM', title: 'Final exam 2025 with solutions', year: '2024/25', fileName: 'db-final-2025.pdf',
    description: 'All six tasks, with worked solutions for the SQL and normalisation questions.',
    lines: ['Task 1. Write SQL that lists customers with no orders.', 'Task 2. Normalise the given relation to 3NF.', 'Task 3. Explain the isolation levels and their anomalies.'],
  })
  const cheatSheet = await upload(t.ola, db, {
    type: 'SUMMARY', title: 'SQL joins and normalisation cheat sheet', year: '2026/27', fileName: 'sql-cheat-sheet.pdf',
    description: 'One page: every join type with a diagram, and 1NF to BCNF with examples.',
    lines: ['INNER JOIN keeps matching rows only.', 'LEFT JOIN keeps every row of the left table.', '3NF: no transitive dependencies on the key.'],
  })
  const transactions = await upload(t.kasia, db, {
    type: 'NOTES', title: 'Lecture 4 – Transactions and ACID', year: '2026/27', fileName: 'lecture-4-transactions.pdf',
    description: 'Clean notes from the lecture, with the isolation-level table.',
    lines: [
      'A transaction is a unit of work that either completes fully or not at all.',
      'Atomicity, Consistency, Isolation, Durability.',
      'Isolation levels: READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE.',
      'Anomalies: dirty read, non-repeatable read, phantom read, lost update.',
      'Write-ahead logging makes committed changes survive a crash.',
    ],
  })
  await upload(t.piotr, db, {
    type: 'PAST_EXAM', title: 'Midterm 2024 questions', year: '2023/24', fileName: 'db-midterm-2024.pdf',
    lines: ['1. ER diagram for a library.', '2. Relational algebra: projection and selection.', '3. Keys and functional dependencies.'],
  })
  const scanned = await upload(t.tomek, db, {
    type: 'OTHER', title: 'Textbook chapter 5 (full scan)', year: '2026/27', fileName: 'textbook-ch5.pdf',
    lines: ['Scanned pages 120-168.'],
  })
  await upload(t.jan, se, {
    type: 'SUMMARY', title: 'Scrum in one page', year: '2026/27', fileName: 'scrum-summary.pdf',
    lines: ['Roles: Product Owner, Scrum Master, Developers.', 'Events: Sprint, Planning, Daily, Review, Retrospective.'],
  })
  await upload(t.piotr, nm, {
    type: 'NOTES', title: 'Newton’s method – worked examples', year: '2026/27', fileName: 'newton-method.pdf',
    lines: ['x_{n+1} = x_n - f(x_n) / f\'(x_n)', 'Quadratic convergence near a simple root.'],
  })
  for (const [who, material] of [['maja', finalExam], ['ola', finalExam], ['piotr', finalExam], ['kasia', finalExam], ['zuzia', finalExam],
    ['jan', cheatSheet], ['piotr', cheatSheet], ['zuzia', cheatSheet], ['maja', transactions], ['jan', transactions]]) {
    await call(t[who], 'PUT', `/materials/${material.id}/vote`)
  }

  // Sample AI results for the transactions notes, stored as if Claude had generated them earlier. The demo has
  // no API key, so the video shows these and says so on screen.
  const summary = {
    overview: 'The lecture explains what a database transaction is, the four ACID guarantees, and how isolation levels trade consistency for concurrency.',
    keyPoints: [
      'A transaction is all-or-nothing: either every change is committed or none is.',
      'Atomicity, Consistency, Isolation and Durability are the four ACID properties.',
      'Lower isolation levels allow more concurrency but permit more anomalies.',
      'SERIALIZABLE prevents dirty reads, non-repeatable reads and phantoms.',
      'Write-ahead logging is what makes committed data survive a crash.',
    ],
    keyTerms: [
      { term: 'Dirty read', definition: 'Reading data another transaction has written but not yet committed.' },
      { term: 'Phantom read', definition: 'A repeated query returns new rows inserted by another transaction.' },
      { term: 'Write-ahead log', definition: 'Changes are logged to disk before they are applied to the data.' },
      { term: 'Lost update', definition: 'Two transactions overwrite each other’s change to the same row.' },
    ],
  }
  const quiz = {
    questions: [
      { question: 'Which isolation level prevents phantom reads?', options: ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'], correctOptionIndex: 3, explanation: 'Only SERIALIZABLE guarantees that a repeated range query sees no new rows.' },
      { question: 'What does the "D" in ACID guarantee?', options: ['Data is encrypted', 'Committed changes survive a crash', 'Deadlocks never happen', 'Duplicates are removed'], correctOptionIndex: 1, explanation: 'Durability means a committed transaction stays committed, usually thanks to the write-ahead log.' },
      { question: 'A transaction reads a row another transaction has not committed yet. What is this?', options: ['Dirty read', 'Phantom read', 'Lost update', 'Deadlock'], correctOptionIndex: 0, explanation: 'Reading uncommitted data is a dirty read; it is possible only under READ UNCOMMITTED.' },
    ],
  }
  const store = (kind, value) => sql(`insert into material_ai_results (material_id, kind, content, model, created_at) values ('${transactions.id}', '${kind}', '${JSON.stringify(value).replace(/'/g, "''")}', 'claude-opus-5-5', now())`)
  store('SUMMARY', summary)
  store('QUIZ', quiz)

  // Flashcards: a deck made by a classmate, and one "made by AI" from the transactions notes.
  const sqlDeck = await call(t.ola, 'POST', `/courses/${db}/decks`, {
    title: 'SQL essentials', description: 'Everything for the midterm, one fact per card.',
    cards: [
      ['INNER JOIN', 'Returns only rows with a match in both tables.'],
      ['LEFT JOIN', 'Returns every row of the left table, with NULLs where the right has no match.'],
      ['Primary key', 'A minimal set of columns that uniquely identifies each row.'],
      ['Foreign key', 'A column that must match a key in another table.'],
      ['1NF', 'Every column holds a single, atomic value.'],
      ['2NF', '1NF, and no non-key column depends on only part of a composite key.'],
      ['3NF', '2NF, and no non-key column depends on another non-key column.'],
      ['GROUP BY', 'Collapses rows with the same values so aggregates can be computed per group.'],
      ['HAVING', 'Filters groups after aggregation; WHERE filters rows before it.'],
      ['Index', 'A data structure that speeds up lookups at the cost of slower writes.'],
      ['Transaction', 'A unit of work that either fully happens or not at all.'],
      ['Deadlock', 'Two transactions each wait for a lock the other holds.'],
    ].map(([front, back]) => ({ front, back })),
  })
  const aiDeck = await call(t.kasia, 'POST', `/courses/${db}/decks`, {
    title: 'Flashcards: Lecture 4 – Transactions and ACID', description: '',
    cards: [
      ['What does ACID stand for?', 'Atomicity, Consistency, Isolation, Durability.'],
      ['What is a dirty read?', 'Reading data that another transaction has not committed yet.'],
      ['Which isolation level prevents phantoms?', 'SERIALIZABLE.'],
      ['What is write-ahead logging for?', 'Making committed changes survive a crash.'],
      ['What is a lost update?', 'Two transactions overwrite each other’s change to the same row.'],
      ['What does REPEATABLE READ guarantee?', 'Rows you have read do not change until you commit.'],
    ].map(([front, back]) => ({ front, back })),
  })
  sql(`update flashcard_decks set source_material_id = '${transactions.id}', created_by = null where id = '${aiDeck.id}'`)
  await call(t.piotr, 'POST', `/courses/${nm}/decks`, {
    title: 'Numerical methods formulas', description: '',
    cards: [['Newton’s method', 'x₁ = x₀ − f(x₀) / f′(x₀)'], ['Trapezoidal rule error', 'O(h²)'], ['Machine epsilon (double)', 'About 2.2 × 10⁻¹⁶']].map(([front, back]) => ({ front, back })),
  })

  // Maja has been revising daily: a five-day streak and a few cards reviewed already.
  const deck = await call(t.maja, 'GET', `/decks/${sqlDeck.id}`)
  for (const card of deck.cards.slice(0, 4)) await call(t.maja, 'POST', `/cards/${card.id}/reviews`, { grade: 'GOOD' })
  sql(`update flashcard_progress set due_at = now() - interval '1 hour' where user_id = '${ids[people.maja.email]}'`)
  for (let day = 1; day <= 4; day++) {
    sql(`insert into flashcard_review_log (user_id, card_id, grade, reviewed_at) select '${ids[people.maja.email]}', id, 'GOOD', now() - interval '${day} days' from flashcards where deck_id = '${sqlDeck.id}' limit 3`)
  }

  // Course Q&A.
  const q1 = await call(t.jan, 'POST', `/courses/${db}/questions`, {
    title: 'Is the midterm open book?', body: 'The syllabus says "one page of notes" but not whether it can be printed. Does anyone know from last year?',
  })
  const a1 = await call(t.ola, 'POST', `/questions/${q1.id}/answers`, { body: 'Last year it was one handwritten A4 page, both sides. Printed notes were not allowed.' })
  await call(t.piotr, 'POST', `/questions/${q1.id}/answers`, { body: 'Same for me in 2024. Calculators were not needed either.' })
  await call(t.jan, 'PUT', `/questions/${q1.id}/accepted-answer`, { answerId: a1.id })
  for (const who of ['maja', 'kasia', 'zuzia', 'piotr']) await call(t[who], 'PUT', `/questions/${q1.id}/vote`)
  for (const who of ['maja', 'jan', 'kasia']) await call(t[who], 'PUT', `/answers/${a1.id}/vote`)

  const q2 = await call(t.kasia, 'POST', `/courses/${db}/questions`, {
    title: 'When should I use LEFT JOIN instead of INNER JOIN?', body: 'In task 1 of the 2025 exam both seem to work. What is the difference in practice?',
  })
  await call(t.zuzia, 'POST', `/questions/${q2.id}/answers`, { body: 'Use LEFT JOIN when you also need rows with no match, e.g. customers with no orders: LEFT JOIN orders and keep rows where orders.id IS NULL.' })
  for (const who of ['jan', 'ola']) await call(t[who], 'PUT', `/questions/${q2.id}/vote`)

  await call(t.zuzia, 'POST', `/courses/${db}/questions`, {
    title: 'Does 3NF always remove every update anomaly?', body: 'Or do we need BCNF for that? The lecture slides were a bit unclear.',
  })
  const spam = await call(t.tomek, 'POST', `/courses/${db}/questions`, {
    title: 'Selling finished SQL projects, message me', body: 'Cheap, any topic, delivered in 24h.',
  })
  for (const who of ['jan', 'ola', 'kasia']) {
    await call(t[who], 'POST', '/reports', { targetType: 'QUESTION', targetId: spam.id, reason: 'SPAM', details: who === 'ola' ? 'Advertising paid homework.' : null })
  }
  await call(t.piotr, 'POST', '/reports', { targetType: 'MATERIAL', targetId: scanned.id, reason: 'COPYRIGHT', details: 'A full chapter scanned from the textbook.' })

  // Study groups.
  const prep = await call(t.ola, 'POST', `/courses/${db}/groups`, {
    name: 'Midterm prep', description: 'We go through one past exam every week and explain the answers to each other.',
    meetingDetails: 'Library, room 2.14 – Thursdays 17:00', capacity: 6,
  })
  for (const who of ['jan', 'kasia']) await call(t[who], 'PUT', `/groups/${prep.id}/membership`)
  const online = await call(t.piotr, 'POST', `/courses/${db}/groups`, {
    name: 'SQL practice online', description: 'Short evening sessions on Discord.', meetingDetails: 'Discord link in the group', capacity: 3,
  })
  for (const who of ['zuzia', 'tomek']) await call(t[who], 'PUT', `/groups/${online.id}/membership`)
  await call(t.jan, 'POST', `/courses/${se}/groups`, { name: 'Team Kanban', description: 'Our project team.', meetingDetails: 'Room 204 after class', capacity: 5 })

  console.log(JSON.stringify({ courses: { db, se, nm, pl, ml }, transactions: transactions.id, sqlDeck: sqlDeck.id }, null, 2))
}

// Only seed when run directly; record.mjs imports the account details from here.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
