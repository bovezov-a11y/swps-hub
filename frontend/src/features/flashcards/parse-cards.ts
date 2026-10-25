import type { CardInput } from './api'

/** One card per line: the front, then " ; " or a tab, then the back. Matches what spreadsheets and Anki export. */
export function parseCards(text: string): CardInput[] {
  return text
    .split('\n')
    .map((line) => /^(.*?)(?:\t|;)(.*)$/.exec(line))
    .filter((match) => match !== null)
    .map(([, front, back]) => ({ front: front!.trim(), back: back!.trim() }))
    .filter((card) => card.front && card.back)
}
