export type VocabLevel = 'B1' | 'B2' | 'C1' | 'C2'

export type WordType =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'particle'
  | 'phrase'

export type RootFormType =
  | 'verb-past'
  | 'verb-present'
  | 'verbal-noun'
  | 'noun'
  | 'active-participle'
  | 'passive-participle'
  | 'noun-place'
  | 'adjective'
  | 'elative'

export interface VocabWord {
  arabic: string
  root: string
  type: WordType
  bs: string
  en: string
  exampleArabic: string
  exampleBs: string
  exampleEn: string
}

export interface VocabSet {
  id: string
  title: string
  titleAr: string
  level: VocabLevel
  topic: string
  words: VocabWord[]
}

export interface VocabSetMeta {
  id: string
  title: string
  titleAr: string
  level: VocabLevel
  topic: string
  wordCount: number
}

export interface RootForm {
  arabic: string
  type: RootFormType
  bs: string
  en: string
}

export interface VocabRoot {
  id: string
  root: string
  rootMeaning: string
  level: VocabLevel
  forms: RootForm[]
  exampleSentence: { arabic: string; bs: string; en: string }
  tags: string[]
}

export interface VocabRootMeta {
  id: string
  root: string
  rootMeaning: string
  level: VocabLevel
  formCount: number
}

export interface VocabIndex {
  sets: VocabSetMeta[]
  roots: VocabRootMeta[]
}
