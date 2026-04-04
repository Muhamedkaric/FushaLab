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
  roman: string      // romanisation guide
  bs: string         // Bosnian meaning
  en?: string        // English meaning
  note?: string      // optional clarifying note (Bosnian)
  noteEn?: string    // English note
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
  bs: string           // Bosnian translation
  en?: string          // English translation
  annotated?: AnnotatedWord[]
  note?: string        // observation (Bosnian)
  noteEn?: string      // observation (English)
}

// ── Content sections ────────────────────────────────────────────────────────

export interface IntroSection {
  type: 'intro'
  content: string     // Bosnian paragraph
  contentEn?: string  // English paragraph
}

export interface TermsSection {
  type: 'terms'
  items: GrammarTerm[]
}

export interface RuleSection {
  type: 'rule'
  titleAr?: string    // e.g. "الْقَاعِدَةُ"
  formula?: string    // Arabic formula / pattern shown large
  content: string     // explanation (Bosnian)
  contentEn?: string  // explanation (English)
}

export interface ExamplesSection {
  type: 'examples'
  title?: string      // section heading (Bosnian)
  titleEn?: string    // section heading (English)
  items: GrammarExample[]
}

export interface CalloutSection {
  type: 'callout'
  variant: 'tip' | 'warning' | 'compare' | 'root'
  title?: string      // Bosnian callout heading
  titleEn?: string    // English callout heading
  content: string     // Bosnian body
  contentEn?: string  // English body
}

export interface TableSection {
  type: 'table'
  titleAr?: string
  titleBs?: string
  titleEn?: string
  headers: string[]     // Bosnian (or Arabic) column headers
  headersEn?: string[]  // English column headers (if different)
  rows: string[][]      // cell values
  rowsEn?: string[][]   // English cell values (where non-Arabic cells differ)
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
  question: string        // Bosnian question text
  questionEn?: string     // English question text
  options: string[]       // Arabic options (no translation needed)
  correctIndex: number
  explanation: string     // Bosnian
  explanationEn?: string  // English
}

export interface ChooseQuestion {
  type: 'choose'
  question: string        // Bosnian question
  questionEn?: string     // English question
  arabic?: string         // optional sentence displayed
  options: string[]       // Bosnian (or Arabic) options
  optionsEn?: string[]    // English options (for Bosnian-language options)
  correctIndex: number
  explanation: string     // Bosnian
  explanationEn?: string  // English
}

export interface TrueFalseGrammarQuestion {
  type: 'true-false'
  statement: string       // grammatical claim (Bosnian)
  statementEn?: string    // English
  arabic?: string         // optional example
  correct: boolean
  explanation: string     // Bosnian
  explanationEn?: string  // English
}

export interface IdentifyRoleQuestion {
  type: 'identify-role'
  arabic: string            // full sentence (display only)
  question: string          // Bosnian
  questionEn?: string       // English
  words: string[]           // tokenised Arabic words (user taps one)
  correctIndex: number
  explanation: string       // Bosnian
  explanationEn?: string    // English
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
  titleEn?: string
  summary: string           // one-line teaser (Bosnian)
  summaryEn?: string        // English teaser
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
  titleEn?: string
  summary: string
  summaryEn?: string
  estimatedMinutes: number
  quizCount: number
}

export interface GrammarBlock {
  number: number
  titleAr: string
  titleBs: string
  titleEn?: string
  lessons: GrammarLessonMeta[]
}

export interface GrammarIndex {
  blocks: GrammarBlock[]
}
