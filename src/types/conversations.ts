export type ConversationLevel = 'B1' | 'B2' | 'C1' | 'C2'

export type SpeakerLabel = 'A' | 'B'

export interface ConversationLine {
  speaker: SpeakerLabel
  role: string
  roleAr: string
  arabic: string
  bs: string
  en: string
}

export interface Dialogue {
  id: string
  level: ConversationLevel
  situation: string
  title: string
  titleAr: string
  titleBs: string
  estimatedMinutes: number
  lines: ConversationLine[]
  grammarFocus?: string
  tags: string[]
}

export interface DialogueMeta {
  id: string
  level: ConversationLevel
  situation: string
  title: string
  titleAr: string
  titleBs: string
  lineCount: number
  estimatedMinutes: number
  tags: string[]
}

export interface Phrase {
  arabic: string
  bs: string
  en: string
  context?: string
  contextBs?: string
  register: 'formal' | 'neutral' | 'informal'
}

export interface PhraseSet {
  id: string
  title: string
  titleAr: string
  titleBs: string
  phrases: Phrase[]
}

export interface PhraseCategoryMeta {
  id: string
  title: string
  titleAr: string
  titleBs: string
  phraseCount: number
}

export interface ConversationsIndex {
  dialogues: DialogueMeta[]
  phraseCategories: PhraseCategoryMeta[]
}
