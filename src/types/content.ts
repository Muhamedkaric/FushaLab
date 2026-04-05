export type Level = 'B1' | 'B2' | 'C1' | 'C2'
export type Category =
  | 'travel'
  | 'culture'
  | 'news'
  | 'literature'
  | 'religion'
  | 'health'
  | 'work'
  | 'technology'
  | 'social'
  | 'food'
  | 'education'
  | 'finance'
  | 'mysteries'
  | 'history'
  | 'psychology'
  | 'conversations'
  | 'idioms'
  | 'stories'
  | 'opinions'
export type DifficultyRating = 'easy' | 'medium' | 'hard' | null

export interface ContentMetadata {
  difficulty: 1 | 2 | 3
  tags: string[]
  source?: string
}

export interface WordAnnotation {
  w: string // exact vocalized form as it appears in the sentence
  lemma?: string // dictionary key — look up root/bs/en from dictionary.json via this
}

export interface SavedWord {
  key: string // lemma if present, else w — dictionary lookup key
  w: string // the inflected form seen in text
  lemma?: string // dictionary key
  // bs/en/root cached from dictionary at save time so review works offline
  root?: string
  bs: string
  en: string
  savedAt: number
}

export interface Sentence {
  arabic: string
  translation: string // Bosnian
  translationEn: string // English
  words?: WordAnnotation[] // content words only — skip function words and proper nouns
}

export interface ContentItem {
  id: string
  category: Category
  level: Level
  sentences: Sentence[]
  metadata: ContentMetadata
}

// Helpers — derive full-text fields from sentences array
export function getFullArabic(item: ContentItem): string {
  return item.sentences.map(s => s.arabic).join(' ')
}

export function getFullTranslation(item: ContentItem, lang: 'bs' | 'en'): string {
  return item.sentences.map(s => (lang === 'en' ? s.translationEn : s.translation)).join(' ')
}

export interface ContentIndex {
  categories: CategoryIndex[]
}

export interface CategoryIndex {
  id: Category
  levels: LevelIndex[]
}

export interface LevelIndex {
  level: Level
  items: string[]
}

export interface UserProgress {
  ratings: Record<string, DifficultyRating>
  completedAt: Record<string, number>
}
