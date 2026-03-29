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

export interface ContentItem {
  id: string
  category: Category
  level: Level
  arabic: string
  translation: string
  translationEn: string
  metadata: ContentMetadata
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
  items: string[] // array of ids
}

export interface UserProgress {
  ratings: Record<string, DifficultyRating>
  completedAt: Record<string, number> // timestamp
}
