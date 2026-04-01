export type ExerciseLevel = 'A1' | 'A2' | 'B1' | 'B2'

export type ExerciseType =
  | 'word-meaning'
  | 'word-arabic'
  | 'fill-blank'
  | 'sentence-order'
  | 'match-pairs'
  | 'odd-one-out'
  | 'listen-select'

export interface WordMeaningExercise {
  type: 'word-meaning'
  arabic: string
  root?: string
  options: string[]      // 4 BS/EN options
  correctIndex: number
}

export interface WordArabicExercise {
  type: 'word-arabic'
  word: string           // BS/EN word shown to user
  options: string[]      // 4 Arabic options
  correctIndex: number
}

export interface FillBlankExercise {
  type: 'fill-blank'
  sentence: string       // Arabic sentence with ___ placeholder
  sentenceBs: string     // BS translation for context
  options: string[]      // 4 Arabic word options
  correctIndex: number
}

export interface SentenceOrderExercise {
  type: 'sentence-order'
  translation: string    // BS translation shown to user
  words: string[]        // scrambled Arabic words (word bank)
  correct: string[]      // same words in correct order
}

export interface MatchPairsExercise {
  type: 'match-pairs'
  pairs: Array<{ arabic: string; bs: string }>  // exactly 4 pairs
}

export interface OddOneOutExercise {
  type: 'odd-one-out'
  words: string[]        // 4 Arabic words
  translations: string[] // 4 BS/EN translations (same order)
  oddIndex: number
  reason: string         // BS explanation
}

export interface ListenSelectExercise {
  type: 'listen-select'
  word: string           // Arabic word to speak via TTS
  options: string[]      // 4 Arabic options (word is one of them)
  correctIndex: number
}

export type Exercise =
  | WordMeaningExercise
  | WordArabicExercise
  | FillBlankExercise
  | SentenceOrderExercise
  | MatchPairsExercise
  | OddOneOutExercise
  | ListenSelectExercise

export interface ExercisePack {
  id: string
  level: ExerciseLevel
  topic: string
  title: string
  titleAr: string
  titleBs: string
  estimatedMinutes: number
  exercises: Exercise[]
}

export interface ExercisePackMeta {
  id: string
  level: ExerciseLevel
  topic: string
  title: string
  titleAr: string
  titleBs: string
  exerciseCount: number
  estimatedMinutes: number
  types: ExerciseType[]
}

export interface ExercisesIndex {
  packs: ExercisePackMeta[]
}
