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

export interface Sentence {
  arabic: string
  translation: string // Bosnian
  translationEn: string // English
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
