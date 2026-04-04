export type GrammarLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type GrammarTrack = 'nahw' | 'sarf'

// Grammatical word roles — drive color coding across the entire section
export type WordRole =
  | 'fail'        // فَاعِلٌ — subject of verbal sentence
  | 'mubtada'     // مُبْتَدَأٌ — subject of nominal sentence
  | 'fil'         // فِعْلٌ — verb
  | 'mafool'      // مَفْعُولٌ بِهِ — direct object
  | 'khabar'      // خَبَرٌ — predicate of nominal sentence
  | 'mudaf'       // الْمُضَافُ — first term of construct
  | 'mudaf-ilayh' // الْمُضَافُ إِلَيْهِ — second term of construct
  | 'harf'        // حَرْفٌ — particle
  | 'nat'         // نَعْتٌ — adjective
  | 'hal'         // حَالٌ — circumstantial
  | 'neutral'     // uncolored

// A single term in the key-terms table
export interface GrammarTerm {
  arabic: string
  roman: string    // romanisation guide
  bs: string       // Bosnian meaning
  note?: string    // optional clarifying note
}

// One word in a colour-annotated example sentence
export interface AnnotatedWord {
  word: string
  role?: WordRole
  label?: string   // e.g. "مُبْتَدَأٌ" — shown below the word chip
}

// A fully annotated grammar example
export interface GrammarExample {
  arabic: string
  bs: string
  annotated?: AnnotatedWord[]  // word-by-word breakdown (optional)
  note?: string                // one observation about this example
}

// ── Content sections ────────────────────────────────────────────────────────

export interface IntroSection {
  type: 'intro'
  content: string   // Bosnian paragraph
}

export interface TermsSection {
  type: 'terms'
  items: GrammarTerm[]
}

export interface RuleSection {
  type: 'rule'
  titleAr?: string  // e.g. "الْقَاعِدَةُ"
  formula?: string  // Arabic formula / pattern shown large
  content: string   // explanation in BS
}

export interface ExamplesSection {
  type: 'examples'
  title?: string
  items: GrammarExample[]
}

export interface CalloutSection {
  type: 'callout'
  variant: 'tip' | 'warning' | 'compare' | 'root'
  title?: string
  content: string
}

export interface TableSection {
  type: 'table'
  titleAr?: string
  titleBs?: string
  headers: string[]
  rows: string[][]
}

export type GrammarSection =
  | IntroSection
  | TermsSection
  | RuleSection
  | ExamplesSection
  | CalloutSection
  | TableSection

// ── Quiz question types ──────────────────────────────────────────────────────

export interface ClassifyQuestion {
  type: 'classify'
  arabic: string
  question: string    // BS question text
  options: string[]   // exactly 2 options in Arabic
  correctIndex: number
  explanation: string
}

export interface ChooseQuestion {
  type: 'choose'
  question: string    // BS question
  arabic?: string     // optional sentence displayed
  options: string[]   // 4 options
  correctIndex: number
  explanation: string
}

export interface TrueFalseGrammarQuestion {
  type: 'true-false'
  statement: string   // grammatical claim in BS
  arabic?: string     // optional example
  correct: boolean
  explanation: string
}

export interface IdentifyRoleQuestion {
  type: 'identify-role'
  arabic: string        // full sentence (display only)
  question: string      // e.g. "Tapni na الْفَاعِلَ u ovoj rečenici"
  words: string[]       // tokenised words (user taps one)
  correctIndex: number
  explanation: string
}

export type GrammarQuizQuestion =
  | ClassifyQuestion
  | ChooseQuestion
  | TrueFalseGrammarQuestion
  | IdentifyRoleQuestion

// ── Full lesson ──────────────────────────────────────────────────────────────

export interface GrammarLesson {
  id: string
  block: number
  order: number
  level: GrammarLevel
  track: GrammarTrack
  titleAr: string
  titleBs: string
  summary: string          // one-line teaser (BS)
  estimatedMinutes: number
  sections: GrammarSection[]
  quiz: GrammarQuizQuestion[]
}

// ── Index / metadata ─────────────────────────────────────────────────────────

export interface GrammarLessonMeta {
  id: string
  block: number
  order: number
  level: GrammarLevel
  track: GrammarTrack
  titleAr: string
  titleBs: string
  summary: string
  estimatedMinutes: number
  quizCount: number
}

export interface GrammarBlock {
  number: number
  titleAr: string
  titleBs: string
  lessons: GrammarLessonMeta[]
}

export interface GrammarIndex {
  blocks: GrammarBlock[]
}
