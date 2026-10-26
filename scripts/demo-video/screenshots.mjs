// Takes the screenshots used in the project overview PDF from the seeded demo stack (see reset.sh).
//
//   ./reset.sh && node screenshots.mjs
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { PASSWORD, people } from './seed.mjs'

const BASE = process.env.DEMO_URL ?? 'http://localhost:3100'
const OUT = fileURLToPath(new URL('./out/shots/', import.meta.url))

async function signedIn(browser, person, options) {
  const context = await browser.newContext({ locale: 'en-GB', timezoneId: 'Europe/Warsaw', ...options })
  const page = await context.newPage()
  page.on('dialog', (dialog) => dialog.accept())
  await page.goto(`${BASE}/login`)
  await page.getByPlaceholder('you@st.swps.edu.pl').fill(person.email)
  await page.locator('input[type=password]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.getByRole('button', { name: 'Account menu' }).waitFor()
  return page
}

const api = (page, path) =>
  page.evaluate(async (url) => {
    const { token } = JSON.parse(localStorage.getItem('studenthub.session'))
    return (await fetch(`/api${url}`, { headers: { Authorization: `Bearer ${token}` } })).json()
  }, path)

// The app is centred in a 1152px column, so desktop shots are cropped to it; dialogs are cropped tighter still.
const APP = { x: 128, y: 0, width: 1184, height: 900 }
const DIALOG = { x: 344, y: 0, width: 752, height: 900 }
// Staff pages share one page of the PDF, so their shots are shorter.
const STAFF = { ...APP, height: 660 }

async function shot(page, name, prepare, clip) {
  if (prepare) await prepare()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(700)
  const fullWidth = page.viewportSize().width > 1000
  await page.screenshot({ path: `${OUT}${name}.jpg`, type: 'jpeg', quality: 86, clip: clip ?? (fullWidth ? APP : undefined) })
  console.log(`  ${name}.jpg`)
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const desktop = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }

  const maja = await signedIn(browser, people.maja, desktop)
  const db = (await api(maja, '/courses?q=Databases')).items.find((course) => course.code === 'DB-301').id
  const decks = await api(maja, `/courses/${db}/decks`)
  const questions = await api(maja, `/courses/${db}/questions?filter=all&sort=top`)

  await shot(maja, 'dashboard', () => maja.goto(`${BASE}/`))
  await shot(maja, 'materials', async () => {
    await maja.goto(`${BASE}/courses/${db}`)
    await maja.getByText('Final exam 2025 with solutions').waitFor()
    await maja.mouse.wheel(0, 380)
  })
  await shot(maja, 'ai-summary', async () => {
    await maja.getByRole('listitem').filter({ hasText: 'Lecture 4 – Transactions and ACID' })
      .getByRole('button', { name: /Summary, quiz/ }).click()
    await maja.getByText('Key terms').waitFor()
  }, DIALOG)
  await shot(maja, 'ai-quiz', async () => {
    const dialog = maja.getByRole('dialog')
    await dialog.getByRole('tab', { name: 'Practice quiz' }).click()
    await dialog.getByRole('button', { name: 'SERIALIZABLE' }).click()
    await dialog.getByRole('button', { name: 'Data is encrypted' }).click()
  }, DIALOG)
  await shot(maja, 'flashcards', async () => {
    await maja.keyboard.press('Escape')
    await maja.goto(`${BASE}/decks/${decks.find((deck) => deck.title === 'SQL essentials').id}/study`)
    await maja.getByRole('button', { name: 'Show the answer' }).waitFor()
    await maja.keyboard.press(' ')
    await maja.waitForTimeout(800)
  }, { x: 344, y: 0, width: 752, height: 640 })
  await shot(maja, 'question', () => maja.goto(`${BASE}/questions/${questions.find((q) => q.title.startsWith('Is the midterm')).id}`),
    { x: 320, y: 0, width: 800, height: 720 })
  await shot(maja, 'groups', async () => {
    await maja.goto(`${BASE}/courses/${db}?tab=groups`)
    await maja.getByRole('listitem').filter({ hasText: 'Midterm prep' }).getByRole('button', { name: 'Join group' }).click()
    await maja.getByText(/Library, room 2.14/).waitFor()
    await maja.mouse.wheel(0, 380)
  })
  await shot(maja, 'calendar', async () => {
    await maja.goto(`${BASE}/calendar`)
    for (let i = 0; i < 2; i++) await maja.getByRole('button', { name: 'Next week' }).click()
  })
  await shot(maja, 'wellbeing', async () => {
    await maja.goto(`${BASE}/wellbeing`)
    await maja.getByRole('button', { name: 'Plan study sessions' }).first().click()
    await maja.getByText('Sessions planned').waitFor()
  })
  await shot(maja, 'wellbeing-heatmap', () => maja.mouse.wheel(0, 640))

  const phone = await signedIn(browser, people.maja, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  await shot(phone, 'mobile', () => phone.goto(`${BASE}/`))

  const ewa = await signedIn(browser, people.ewa, desktop)
  await shot(ewa, 'moderation', async () => {
    await ewa.goto(`${BASE}/moderation`)
    await ewa.getByText('Selling finished SQL projects').first().waitFor()
  }, STAFF)
  await shot(ewa, 'insights', async () => {
    await ewa.goto(`${BASE}/insights`)
    await ewa.getByText('Exam pressure by program').waitFor()
  }, STAFF)
  // Scrolled a little less than the heading so the sticky header does not cover it.
  await shot(ewa, 'insights-heatmap', () => ewa.getByText('Exam pressure by program').evaluate((el) => {
    el.scrollIntoView({ block: 'start' })
    window.scrollBy(0, -110)
  }), STAFF)
  await shot(ewa, 'insights-lists', () => ewa.getByText('Busy courses with few materials').evaluate((el) => el.scrollIntoView({ block: 'center' })), STAFF)

  await browser.close()
}

await main()
