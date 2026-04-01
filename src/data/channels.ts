export type ChannelTier = 1 | 2 | 3
export type ChannelLanguage = 'en' | 'bs' | 'ar'

export interface Channel {
  id: string
  name: string
  channelUrl: string
  language: ChannelLanguage
  levels: string[]
  subscribers: string | null
  tier: ChannelTier
  description: string
  recommended: boolean
  note?: string
}

export interface OtherResource {
  name: string
  url: string
  levels: string[]
  description: string
}

export const CHANNELS: Channel[] = [
  {
    id: 'khasu',
    name: 'Learn Arabic with Khasu',
    channelUrl: 'https://www.youtube.com/@LearnArabicKhasu',
    language: 'en',
    levels: ['A1', 'A2', 'B1', 'B2'],
    subscribers: '677K',
    tier: 1,
    description:
      "One of the best MSA-only channels on YouTube. Creator studied in Jordan, holds a degree in Sharia and is pursuing a Master's in Teaching Arabic to Non-Native Speakers. Exclusively Fusha — no dialects. Clear, practical explanations.",
    recommended: true,
  },
  {
    id: 'mrkonjic',
    name: 'Hfz. Adnan Mrkonjic — Nauči Arapski Jezik',
    channelUrl: 'https://www.youtube.com/results?search_query=Adnan+Mrkonjic+arapski+jezik',
    language: 'bs',
    levels: ['A1', 'A2', 'B1', 'B2'],
    subscribers: null,
    tier: 1,
    description:
      'The only substantial structured Arabic course in the Bosnian language on YouTube. Hafiz Adnan Mrkonjic studied Arabic in Kuwait and taught in the Arab world for 5 years. Grammar-first approach with Quranic examples. 3 levels: 78 + 65 + 63 lessons.',
    recommended: true,
  },
  {
    id: 'imran-alawiye',
    name: 'Imran Alawiye — Gateway to Arabic',
    channelUrl: 'https://www.youtube.com/@ImranAlawiye-gatewaytoarabic',
    language: 'en',
    levels: ['A1', 'A2', 'B1', 'B2'],
    subscribers: '630K',
    tier: 1,
    description:
      'Author of the Gateway to Arabic textbook series. Most grammar-complete free MSA channel. Classroom-style delivery, very structured. Best for learners who want a thorough grammar foundation.',
    recommended: true,
  },
  {
    id: 'arabic-khatawaat',
    name: 'Arabic Khatawaat',
    channelUrl: 'https://www.youtube.com/@ArabicKhatawaat',
    language: 'en',
    levels: ['A1', 'A2', 'B1'],
    subscribers: '259K',
    tier: 1,
    description:
      'Step-by-step MSA/Fusha: script, alphabet, sounds, grammar, vocabulary, conversation. Three clear levels. Very good for systematic beginners.',
    recommended: true,
  },
  {
    id: 'madinah-arabic',
    name: 'Madinah Arabic',
    channelUrl: 'https://www.youtube.com/@MadinahArabicTuition',
    language: 'en',
    levels: ['A1', 'A2', 'B1', 'B2'],
    subscribers: '107K',
    tier: 2,
    description:
      'Large library of MSA content with slow-speed explanations and dual subtitles. Good secondary resource for beginners and intermediate learners.',
    recommended: true,
  },
  {
    id: 'arabic-with-angela',
    name: 'Learning Arabic with Angela',
    channelUrl: 'https://learningarabicwithangela.com',
    language: 'en',
    levels: ['A2', 'B1'],
    subscribers: '59K',
    tier: 2,
    description:
      'Dedicated Fusha-only channel. Practical, topic-based approach with real-life scenarios and short stories. Directly complements FushaLab reading texts.',
    recommended: true,
  },
  {
    id: 'arabic-student',
    name: 'The Arabic Student',
    channelUrl: 'https://www.youtube.com/@saxquiz',
    language: 'en',
    levels: ['B1', 'B2', 'C1'],
    subscribers: null,
    tier: 2,
    description:
      'Authentic Arabic materials — TV shows, interviews, news clips analysed in English. Excellent comprehensible input for intermediate learners who want real Arabic.',
    recommended: true,
  },
  {
    id: 'aljazeera',
    name: 'Al Jazeera Arabic',
    channelUrl: 'https://www.youtube.com/@aljazeera',
    language: 'ar',
    levels: ['B2', 'C1', 'C2'],
    subscribers: '20M+',
    tier: 3,
    description:
      'The largest Arabic-language YouTube channel. Formal journalistic MSA. Not structured for learners — use as authentic input for advanced level. News, analysis, documentaries, interviews.',
    recommended: true,
    note: 'No learner scaffolding. Best used as a listening challenge — play a clip, then check your understanding.',
  },
  {
    id: 'dw-arabic',
    name: 'DW عربية',
    channelUrl: 'https://www.youtube.com/@dw_arabic',
    language: 'ar',
    levels: ['B2', 'C1', 'C2'],
    subscribers: null,
    tier: 3,
    description:
      "Deutsche Welle's Arabic service. Dubbed documentaries and news in formal MSA. Excellent production quality. Slightly slower and clearer than Al Jazeera — better for B2 learners.",
    recommended: true,
  },
]

export const OTHER_RESOURCES: OtherResource[] = [
  {
    name: 'Aswaat Arabiyya — University of Texas',
    url: 'https://www.laits.utexas.edu/aswaat/video_s.php',
    levels: ['B1', 'B2', 'C1', 'C2'],
    description:
      'Academic listening materials at 6 levels with speed control. Excellent leveled content.',
  },
  {
    name: 'Al Jazeera Learning Platform',
    url: 'https://learning.aljazeera.net/en',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    description:
      '7-level structured Arabic course — a full learning platform separate from the YouTube channel.',
  },
]
