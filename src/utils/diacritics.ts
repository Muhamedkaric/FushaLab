// Arabic diacritics (harakat) Unicode range: U+064B–U+065F + U+0670
const HARAKAT_REGEX = /[\u064B-\u065F\u0670]/g

export function removeHarakat(text: string): string {
  return text.replace(HARAKAT_REGEX, '')
}

export function hasHarakat(text: string): boolean {
  return HARAKAT_REGEX.test(text)
}

// Reset lastIndex since we reuse the regex
export function toggleHarakat(text: string, show: boolean): string {
  HARAKAT_REGEX.lastIndex = 0
  return show ? text : removeHarakat(text)
}
