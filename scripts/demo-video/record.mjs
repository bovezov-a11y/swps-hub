// Records a narrated walkthrough of SWPS Hub against the seeded demo stack and writes out/swps-hub-demo.mp4.
// A visible cursor, captions and title cards are drawn on top of the real app; everything else is the app itself.
//
//   docker compose -p swps-demo -f compose.demo.yaml up -d && node seed.mjs && node record.mjs
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ffmpeg from 'ffmpeg-static'
import { chromium } from 'playwright'
import { PASSWORD, people } from './seed.mjs'

const BASE = process.env.DEMO_URL ?? 'http://localhost:3100'
const OUT = fileURLToPath(new URL('./out/', import.meta.url))
const WIDTH = 1440
const HEIGHT = 900

/** Draws the cursor, captions and a "demo data" badge above the page, including above modal dialogs. */
function installOverlay() {
  if (window.top !== window) return
  const install = () => {
    if (document.getElementById('demo-overlay')) return
    const style = document.createElement('style')
    style.textContent = `
      #demo-overlay { position: fixed; inset: 0; width: 100vw; height: 100vh; margin: 0; padding: 0; border: 0;
        background: transparent; pointer-events: none; overflow: visible; font-family: 'Inter Variable', system-ui, sans-serif; }
      #demo-cursor { position: absolute; left: 0; top: 0; width: 26px; height: 26px; transition: transform 40ms linear; }
      #demo-cursor svg { filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.35)); }
      #demo-cursor::after { content: ''; position: absolute; left: -14px; top: -14px; width: 28px; height: 28px; border-radius: 50%;
        background: rgb(99 102 241 / 0.35); transform: scale(0); transition: transform 150ms ease-out, opacity 300ms; opacity: 0; }
      #demo-cursor.down::after { transform: scale(1.4); opacity: 1; }
      #demo-caption { position: absolute; left: 50%; bottom: 34px; transform: translate(-50%, 12px); max-width: 900px; padding: 16px 26px;
        border-radius: 18px; background: rgb(15 23 42 / 0.93); color: #fff; box-shadow: 0 20px 40px -12px rgb(15 23 42 / 0.5);
        opacity: 0; transition: opacity 350ms ease, transform 350ms ease; text-align: center; }
      #demo-caption.shown { opacity: 1; transform: translate(-50%, 0); }
      #demo-caption strong { display: block; font-size: 21px; letter-spacing: -0.01em; }
      #demo-caption span { display: block; margin-top: 4px; font-size: 15.5px; line-height: 1.45; color: #cbd5e1; }
      #demo-caption em { font-style: normal; color: #fcd34d; }
      #demo-badge { position: absolute; right: 18px; bottom: 18px; padding: 5px 10px; border-radius: 999px; font-size: 11.5px;
        font-weight: 600; color: #475569; background: rgb(255 255 255 / 0.85); box-shadow: 0 1px 3px rgb(0 0 0 / 0.12); }
    `
    const root = document.createElement('div')
    root.id = 'demo-overlay'
    root.setAttribute('popover', 'manual')
    root.innerHTML = `
      <div id="demo-cursor"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2.5 19.5 12l-6.6 1.6L9.8 20z"
        fill="#0f172a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg></div>
      <div id="demo-caption"><strong></strong><span></span></div>
      <div id="demo-badge">Demo · made-up students and data</div>`
    document.head.append(style)
    document.body.append(root)
    const raise = () => {
      try {
        if (root.matches(':popover-open')) root.hidePopover()
        root.showPopover()
      } catch {
        // Older engines without popovers still show the overlay, just not above modals.
      }
    }
    raise()
    // A modal dialog joins the top layer above us; re-entering it keeps the cursor and captions visible. Only
    // dialogs opening matter, so ordinary re-renders do not touch the overlay.
    new MutationObserver((records) => {
      if (records.some((record) => record.target.nodeName === 'DIALOG')) setTimeout(raise, 0)
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] })

    const cursor = root.querySelector('#demo-cursor')
    const caption = root.querySelector('#demo-caption')
    const place = (x, y) => {
      cursor.style.transform = `translate(${x}px, ${y}px)`
      sessionStorage.setItem('demo-cursor', JSON.stringify([x, y]))
    }
    place(...JSON.parse(sessionStorage.getItem('demo-cursor') ?? '[720,450]'))
    addEventListener('mousemove', (event) => place(event.clientX, event.clientY), true)
    addEventListener('mousedown', () => cursor.classList.add('down'), true)
    addEventListener('mouseup', () => setTimeout(() => cursor.classList.remove('down'), 120), true)

    window.__demo = {
      place,
      press: (down) => cursor.classList.toggle('down', down),
      caption(title, text) {
        sessionStorage.setItem('demo-caption', JSON.stringify(title ? [title, text] : null))
        if (!title) return caption.classList.remove('shown')
        caption.querySelector('strong').textContent = title
        caption.querySelector('span').innerHTML = text ?? ''
        caption.classList.add('shown')
      },
      cursorVisible: (visible) => (cursor.style.opacity = visible ? '1' : '0'),
    }
    const saved = JSON.parse(sessionStorage.getItem('demo-caption') ?? 'null')
    if (saved) window.__demo.caption(...saved)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install)
  else install()
}

const titleCard = (inner) => `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Inter', system-ui, sans-serif;
    background: radial-gradient(70rem 40rem at 50% -10rem, rgb(99 102 241 / 0.16), transparent), #f8fafc; color: #0f172a; }
  .card { text-align: center; animation: in 900ms cubic-bezier(.2,.8,.2,1) both; }
  @keyframes in { from { opacity: 0; transform: translateY(18px) scale(.98); } to { opacity: 1; transform: none; } }
  .logo { display: inline-flex; align-items: flex-end; }
  .swps { font-size: 128px; font-weight: 900; letter-spacing: -0.05em; line-height: .8; }
  .hub { margin: 0 0 4px 8px; padding: 6px 14px; border-radius: 14px; font-size: 36px; font-weight: 700; color: #fff;
    background: linear-gradient(90deg, #4f46e5, #8b5cf6); line-height: 1; }
  h1 { margin: 48px 0 0; font-size: 40px; letter-spacing: -0.02em; }
  p { margin: 14px auto 0; max-width: 820px; font-size: 21px; line-height: 1.5; color: #475569; }
  .chips { margin-top: 34px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
  .chip { padding: 9px 16px; border-radius: 999px; background: #fff; box-shadow: 0 1px 3px rgb(15 23 42 / .12); font-size: 16px; font-weight: 600; color: #334155; }
  .grid { margin-top: 40px; display: grid; grid-template-columns: repeat(3, 280px); gap: 16px; text-align: left; }
  .tile { padding: 20px 22px; border-radius: 18px; background: #fff; box-shadow: 0 1px 3px rgb(15 23 42 / .1); }
  .tile b { display: block; font-size: 30px; letter-spacing: -0.02em; } .tile span { color: #64748b; font-size: 15px; }
  small { display: block; margin-top: 30px; font-size: 14px; color: #94a3b8; }
</style></head><body><div class="card">${inner}</div></body></html>`

const logo = '<div class="logo"><span class="swps">SWPS</span><span class="hub">hub</span></div>'

async function main() {
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    recordVideo: { dir: OUT, size: { width: WIDTH, height: HEIGHT } },
    locale: 'en-GB',
    timezoneId: 'Europe/Warsaw',
  })
  await context.addInitScript(installOverlay)
  const page = await context.newPage()
  page.on('dialog', (dialog) => dialog.accept())
  const started = Date.now()
  const chapters = []

  const wait = (ms) => page.waitForTimeout(ms)
  let pointer = [720, 450]
  const glide = async (x, y, steps = 22) => {
    const [fromX, fromY] = pointer
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
      const nx = fromX + (x - fromX) * ease
      const ny = fromY + (y - fromY) * ease
      await page.mouse.move(nx, ny)
      await page.evaluate(([a, b]) => window.__demo?.place(a, b), [nx, ny]).catch(() => {})
      await wait(12)
    }
    pointer = [x, y]
  }
  const point = async (locator) => {
    await locator.waitFor({ state: 'visible', timeout: 15000 })
    // Centre the target so the caption at the bottom never covers what is being used.
    const moved = await locator.evaluate((element) => {
      const { top, bottom } = element.getBoundingClientRect()
      if (top >= 90 && bottom <= innerHeight - 190) return false
      element.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return true
    })
    if (moved) await wait(650)
    const box = await locator.boundingBox()
    await glide(box.x + box.width / 2, box.y + box.height / 2)
  }
  const click = async (locator, pause = 500) => {
    const before = Date.now()
    await point(locator)
    await wait(220)
    await page.evaluate(() => window.__demo?.press(true)).catch(() => {})
    await locator.click({ timeout: 15000 })
    await page.evaluate(() => window.__demo?.press(false)).catch(() => {})
    if (Date.now() - before > 4000) console.log(`        slow click (${Date.now() - before} ms): ${locator}`)
    await wait(pause)
  }
  const type = async (locator, text, delay = 45) => {
    await click(locator, 150)
    await locator.pressSequentially(text, { delay })
    await wait(300)
  }
  const scroll = async (distance, duration = 1200) => {
    const steps = Math.max(1, Math.round(duration / 40))
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, distance / steps)
      await wait(40)
    }
    await wait(300)
  }
  const caption = (title, text) => page.evaluate(([a, b]) => window.__demo?.caption(a, b), [title, text]).catch(() => {})
  const chapter = async (name, title, text) => {
    chapters.push({ name, at: (Date.now() - started) / 1000 })
    console.log(`${((Date.now() - started) / 1000).toFixed(1).padStart(6)}s  ${name}`)
    if (title) await caption(title, text)
  }
  const card = async (html, ms) => {
    await page.setContent(titleCard(html))
    await page.evaluate(() => sessionStorage.removeItem('demo-caption')).catch(() => {})
    await wait(ms)
  }
  const go = async (path) => {
    await page.goto(`${BASE}${path}`)
    await page.waitForLoadState('networkidle')
  }
  const login = async (person) => {
    await go('/login')
    await type(page.getByPlaceholder('you@st.swps.edu.pl'), person.email, 30)
    await type(page.locator('input[type=password]'), PASSWORD, 30)
    await click(page.getByRole('button', { name: 'Log in' }), 1200)
  }
  const tab = (name) => page.getByRole('tab', { name })

  // ── Opening ───────────────────────────────────────────────────────────────────────────────────────────────
  await go('/login')
  await chapter('Title')
  await card(`${logo}<h1>Everything a SWPS student needs, in one place</h1>
    <p>Timetables and exams, shared notes and past exams, AI study tools, flashcards, Q&amp;A, study groups and
    wellbeing, plus moderation and insights for university staff.</p>
    <small>An unofficial student project · not affiliated with SWPS University</small>`, 5500)

  // ── Sign-up ───────────────────────────────────────────────────────────────────────────────────────────────
  await go('/register')
  await chapter('Sign-up', 'Only SWPS students and staff can join',
    'Sign-up accepts <em>@st.swps.edu.pl</em> and <em>@swps.edu.pl</em> addresses, confirms the email with a one-time link, and asks students to accept a versioned privacy policy.')
  await type(page.getByPlaceholder('Anna Nowak'), 'Maja Kowalska', 35)
  await type(page.getByPlaceholder('you@st.swps.edu.pl'), 'maja.kowalska@gmail.com', 35)
  await type(page.locator('input[type=password]'), 'a-strong-password', 25)
  await click(page.getByRole('button', { name: 'Create account' }), 1800)
  await page.getByPlaceholder('you@st.swps.edu.pl').fill('')
  await type(page.getByPlaceholder('you@st.swps.edu.pl'), 'maja.kowalska@st.swps.edu.pl', 30)
  await point(page.getByRole('checkbox'))
  await wait(2200)

  // ── Dashboard ─────────────────────────────────────────────────────────────────────────────────────────────
  await chapter('Dashboard', 'Meet Maja, a third-year Computer Science student', 'She logs in with her university account.')
  await login(people.maja)
  await page.getByText('Hi, Maja').waitFor()
  await chapter('Dashboard', 'Her day at a glance',
    'The next exam, a warning about the busy week ahead, flashcards due today with her study streak, and new files in her courses.')
  await point(page.getByText(/Busy week ahead/))
  await wait(2500)
  await point(page.getByText(/flashcards to review/))
  await wait(2000)
  await scroll(520)
  await wait(2200)
  await scroll(-520, 800)

  // ── Explore ───────────────────────────────────────────────────────────────────────────────────────────────
  await chapter('Explore', 'Every programme, every year', 'Courses are organised by programme and year, and search works across all of them.')
  await click(page.getByRole('link', { name: 'Explore' }).first(), 1200)
  await wait(1200)
  await type(page.getByRole('searchbox').first(), 'data', 90)
  await wait(1800)
  await click(page.getByRole('link', { name: /Databases/ }).first(), 1500)

  // ── Materials ─────────────────────────────────────────────────────────────────────────────────────────────
  await chapter('Materials', 'Past exams and notes, shared anonymously',
    'Students share past exams, notes and summaries. Others see only <em>“Shared by a student”</em>, and upvotes bring the most helpful files to the top.')
  await scroll(430)
  await click(page.getByRole('button', { name: 'Past exams' }), 1400)
  await click(page.getByRole('button', { name: 'All', exact: true }).first(), 900)
  await click(page.getByRole('button', { name: 'Upvote SQL joins and normalisation cheat sheet' }), 1300)

  // ── AI ────────────────────────────────────────────────────────────────────────────────────────────────────
  await chapter('AI summary', 'AI study tools, powered by Claude',
    'One click turns a shared file into a summary, a practice quiz or flashcards. Each result is generated once and shared with the whole course. <em>Sample output: no API key is connected in this demo.</em>')
  const lecture = page.getByRole('listitem').filter({ hasText: 'Lecture 4 – Transactions and ACID' })
  await click(lecture.getByRole('button', { name: /Summary, quiz/ }), 1500)
  await wait(3500)
  const dialog = page.getByRole('dialog')
  await point(dialog.getByText('Key terms'))
  await wait(2000)
  await chapter('AI quiz', 'A practice quiz with explanations', 'Wrong answers are marked and every question explains the right one.')
  await click(dialog.getByRole('tab', { name: 'Practice quiz' }), 1200)
  await click(dialog.getByRole('button', { name: 'SERIALIZABLE' }), 1800)
  await click(dialog.getByRole('button', { name: 'Data is encrypted' }), 2600)
  await chapter('AI flashcards', 'Or turn the file into flashcards', 'The deck is shared with the course; every student’s progress stays private.')
  await click(dialog.getByRole('tab', { name: 'Flashcards' }), 1500)
  await click(dialog.getByRole('button', { name: /Make flashcards and study/ }), 2000)

  // ── Flashcards ────────────────────────────────────────────────────────────────────────────────────────────
  await chapter('Flashcards', 'Spaced repetition (SM-2)',
    'Flip with the space bar, grade with 1–4. Each card comes back right before she would forget it: <em>Again</em> repeats it today, <em>Easy</em> pushes it weeks away.')
  await wait(1200)
  for (const key of ['3', '4', '1', '3']) {
    // Flipping with the keyboard, as students do, avoids a focus ring on the card.
    await point(page.getByRole('button', { name: 'Show the answer' }))
    await wait(500)
    await page.keyboard.press(' ')
    await wait(1600)
    await point(page.getByRole('group', { name: /How well/ }).getByRole('button').nth(Number(key) - 1))
    await wait(500)
    await page.keyboard.press(key)
    await wait(900)
  }
  await click(page.getByRole('link', { name: /Flashcards/ }).first(), 1500)
  await scroll(400)
  await wait(2500)

  // ── Q&A ───────────────────────────────────────────────────────────────────────────────────────────────────
  await chapter('Q&A', 'Ask the course, anonymously',
    'Questions and answers never show names. Upvotes sort them, and the asker marks the answer that solved it.')
  await click(tab(/Q&A/), 1500)
  await click(page.getByRole('link', { name: /Is the midterm open book/ }), 1800)
  await point(page.getByText('Accepted answer'))
  await wait(2200)
  await click(page.getByRole('button', { name: /Upvote this answer/ }).first(), 1200)
  await click(page.getByRole('link', { name: /DB-301 · Q&A/ }), 1500)
  await click(page.getByRole('button', { name: 'Ask a question' }), 900)
  await type(page.getByRole('textbox', { name: 'Question', exact: true }), 'Will the midterm include indexing?', 40)
  await type(page.getByRole('textbox', { name: 'Details', exact: true }), 'The lecture on B-trees was the week before, so I am not sure.', 25)
  await click(page.getByRole('button', { name: 'Post question' }), 2200)

  // ── Study groups ──────────────────────────────────────────────────────────────────────────────────────────
  await chapter('Study groups', 'Find people to revise with',
    'Groups have a set number of places. Only members see each other’s names and where the group meets.')
  await click(tab(/Study groups/), 1500)
  const prep = page.getByRole('listitem').filter({ hasText: 'Midterm prep' })
  await point(prep)
  await wait(1500)
  await click(prep.getByRole('button', { name: 'Join group' }), 2000)
  await point(prep.getByText(/Library, room 2.14/))
  await wait(2600)

  // ── Schedule ──────────────────────────────────────────────────────────────────────────────────────────────
  await chapter('Schedule', 'Exam dates straight from the syllabus',
    'Upload the syllabus and Claude lists every exam, deadline and grade weight. Students check each date before it goes into everyone’s calendar.')
  await click(tab(/Schedule/), 1500)
  await click(page.getByRole('button', { name: 'Import from syllabus' }), 3500)
  await page.keyboard.press('Escape')
  await wait(800)

  // ── Calendar ──────────────────────────────────────────────────────────────────────────────────────────────
  await chapter('Calendar', 'One calendar for all her courses',
    'Lectures, labs, exams, deadlines and her own study sessions. A private link syncs it all to Google Calendar, Apple Calendar or Outlook.')
  await click(page.getByRole('link', { name: 'Calendar' }).first(), 1800)
  await wait(1500)
  for (let i = 0; i < 2; i++) await click(page.getByRole('button', { name: 'Next week' }), 1300)
  await wait(1500)
  await scroll(700, 1400)
  await wait(2200)

  // ── Wellbeing ─────────────────────────────────────────────────────────────────────────────────────────────
  await chapter('Wellbeing', 'Spot the crunch before it hits',
    'Five exams and deadlines fall in one week. One click plans short study sessions in the days before each, straight into her calendar.')
  await click(page.getByRole('link', { name: 'Wellbeing' }).first(), 1800)
  await click(page.getByRole('button', { name: 'Plan study sessions' }).first(), 2200)
  await click(page.getByRole('button', { name: 'Plan study sessions' }).first(), 2000)
  await chapter('Wellbeing', 'Her semester as a heatmap, a focus timer and support',
    'Sixteen weeks of exams and deadlines at a glance, a 25/5 Pomodoro timer, and Polish support lines. No mood or health data is ever stored.')
  await scroll(520)
  await wait(2000)
  await click(page.getByRole('button', { name: 'Start', exact: true }), 2500)
  await click(page.getByRole('button', { name: 'Pause', exact: true }), 800)
  await scroll(500)
  await wait(2500)

  // ── Reporting ─────────────────────────────────────────────────────────────────────────────────────────────
  await chapter('Report', 'Anything wrong? Report it',
    'Copyright problems, spam or the wrong course. Reports are anonymous, and three reports hide an item until a moderator checks it.')
  await click(page.getByRole('link', { name: 'My courses' }).first(), 1200)
  await click(page.getByRole('link', { name: /Databases/ }).first(), 1500)
  await scroll(500)
  const scan = page.getByRole('listitem').filter({ hasText: 'Textbook chapter 5' })
  await click(scan.getByRole('button', { name: /Report/ }), 1200)
  await click(page.getByRole('dialog').getByText(/Copyright/).first(), 900)
  await click(page.getByRole('button', { name: 'Send report' }), 2400)
  await page.keyboard.press('Escape')
  await wait(600)

  // ── Mobile ────────────────────────────────────────────────────────────────────────────────────────────────
  await chapter('Mobile', 'Works on her phone too', 'The same app, laid out for small screens.')
  const here = new URL(page.url()).origin
  await page.setContent(titleCard(`<div style="display:flex;align-items:center;gap:72px;text-align:left">
      <div style="width:360px"><div class="logo" style="transform:scale(.5);transform-origin:left bottom">
        <span class="swps">SWPS</span><span class="hub">hub</span></div>
        <h1 style="margin-top:22px">On the go</h1><p style="margin-left:0">Responsive down to small phones, with the same features.</p></div>
      <div style="width:390px;height:780px;border-radius:52px;padding:14px;background:#0f172a;box-shadow:0 30px 60px -20px rgb(15 23 42/.6)">
        <iframe src="${here}/" style="width:100%;height:100%;border:0;border-radius:40px;background:#fff"></iframe></div></div>`))
  const phone = page.frameLocator('iframe')
  await phone.getByText('Hi, Maja').waitFor()
  await wait(2500)
  const frame = page.frames().find((f) => f !== page.mainFrame())
  for (let i = 0; i < 4; i++) {
    await frame.evaluate(() => window.scrollBy({ top: 330, behavior: 'smooth' }))
    await wait(1100)
  }
  await wait(1200)

  // ── Staff: moderation ─────────────────────────────────────────────────────────────────────────────────────
  await go('/')
  await chapter('Staff', 'For university staff', 'Staff accounts get a moderation queue and university-wide insights.')
  await click(page.getByRole('button', { name: 'Account menu' }), 900)
  await click(page.getByRole('menuitem', { name: 'Log out' }), 1200)
  await login(people.ewa)
  await click(page.getByRole('button', { name: 'Account menu' }), 1200)
  await point(page.getByText('Staff', { exact: true }))
  await wait(1200)
  await click(page.getByRole('menuitem', { name: 'Moderation' }), 1800)
  await chapter('Moderation', 'Moderators see content, never reporters',
    'The spam question was hidden automatically after three reports. Moderators see why, but not who reported it or who posted it.')
  await wait(2500)
  const spamCard = page.getByRole('listitem').filter({ hasText: 'Selling finished SQL projects' })
  await click(spamCard.getByRole('button', { name: 'Delete' }), 2000)
  const scanCard = page.getByRole('listitem').filter({ hasText: 'Textbook chapter 5' })
  await point(scanCard)
  await wait(1500)
  await click(scanCard.getByRole('button', { name: 'Hide' }), 2000)
  await scroll(500)
  await chapter('Moderation', 'Every decision is logged', 'Admins appoint moderators by university email.')
  await type(page.getByPlaceholder(/name@/), 'jan.zielinski@st.swps.edu.pl', 30)
  await click(page.getByRole('button', { name: 'Add', exact: true }), 2500)

  // ── Staff: insights ───────────────────────────────────────────────────────────────────────────────────────
  await chapter('Insights', 'Where students may need support',
    'Exam pressure per programme and week, students facing a crunch, courses with no materials and unanswered questions. Aggregate only: any figure based on fewer than 5 students shows as <em>&lt;5</em>.')
  await click(page.getByRole('button', { name: 'Account menu' }), 900)
  await click(page.getByRole('menuitem', { name: 'University insights' }), 2200)
  await wait(2500)
  await scroll(600, 1500)
  await wait(3000)
  await scroll(650, 1500)
  await wait(3000)
  await scroll(700, 1500)
  await wait(2500)

  // ── Privacy ───────────────────────────────────────────────────────────────────────────────────────────────
  await chapter('Privacy', 'Private by design',
    'No public profiles, no tracking, no ads. The privacy policy is versioned, and every account records which version it accepted.')
  await go('/privacy')
  await wait(1500)
  await scroll(700, 2000)
  await wait(2500)

  // ── Closing ───────────────────────────────────────────────────────────────────────────────────────────────
  await chapter('Tech')
  await card(`${logo}<h1>Built like a production app</h1>
    <div class="chips"><span class="chip">Java 25 · Spring Boot</span><span class="chip">React 19 · TypeScript</span>
    <span class="chip">PostgreSQL · Flyway</span><span class="chip">Claude API</span><span class="chip">Docker · GitHub Actions</span></div>
    <div class="grid"><div class="tile"><b>108</b><span>automated tests, run on every push</span></div>
    <div class="tile"><b>k ≥ 5</b><span>anonymity for every staff statistic</span></div>
    <div class="tile"><b>0</b><span>trackers, ads or public profiles</span></div></div>`, 6500)
  await chapter('End')
  await card(`${logo}<h1>Thank you</h1><p>github.com/bovezov-a11y/swps-hub</p>
    <small>An unofficial student project · not affiliated with SWPS University</small>`, 4500)

  await context.close()
  await browser.close()

  const webm = readdirSync(OUT).find((name) => name.endsWith('.webm'))
  const mp4 = `${OUT}swps-hub-demo.mp4`
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', `${OUT}${webm}`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4])
  console.log(`\nSaved ${mp4}`)
  console.log(JSON.stringify(chapters))
}

await main()
