export interface Translations {
  appName: string
  tagline: string
  nav: {
    home: string
    reading: string
    listening: string
    vocabulary: string
    conversation: string
    exercises: string
    grammar: string
    progress: string
  }
  home: {
    hero: string
    heroSub: string
    startLearning: string
    chooseCategory: string
    levels: string
    wordOfDay: string
    wordRoot: string
    welcomeBack: string
    continueReading: string
    dailyGoal: string
    goalReached: string
    reviewQueue: string
    exploreSection: string
    sections: {
      reading: { title: string; desc: string }
      listening: { title: string; desc: string }
      vocabulary: { title: string; desc: string }
      conversation: { title: string; desc: string }
      exercises: { title: string; desc: string }
      progress: { title: string; desc: string }
    }
  }
  categories: {
    travel: string
    culture: string
    news: string
    literature: string
    religion: string
    health: string
    work: string
    technology: string
    social: string
    food: string
    education: string
    finance: string
    mysteries: string
    history: string
    psychology: string
    conversations: string
    idioms: string
    stories: string
    opinions: string
  }
  levels: { B1: string; B2: string; C1: string; C2: string }
  reader: {
    showHarakat: string
    hideHarakat: string
    showTranslation: string
    hideTranslation: string
    pinTranslation: string
    unpinTranslation: string
    sentenceMode: string
    fullMode: string
    sentenceOf: string
    playAudio: string
    stopAudio: string
    noVoice: string
    next: string
    prev: string
    backToList: string
    completed: string
    showCompleted: string
    hideCompleted: string
    noContent: string
    textsTotal: string
  }
  difficulty: {
    label: string
    easy: string
    medium: string
    hard: string
    saved: string
  }
  listening: {
    title: string
    subtitle: string
    tier1: string
    tier2: string
    tier3: string
    openYouTube: string
    language: string
    subscribers: string
    comingSoon: string
    backToChannels: string
    backToPlaylists: string
    playlists: string
    videos: string
    noVideos: string
    level: string
    filterAll: string
    filterBs: string
    filterEn: string
    selectVideo: string
    noContentForLocale: string
    approach: {
      structuredCourse: string
      authenticInput: string
      mixed: string
    }
  }
  vocabulary: {
    title: string
    subtitle: string
    sets: string
    rootExplorer: string
    viewAllRoots: string
    words: string
    known: string
    studySet: string
    backToVocab: string
    study: {
      cardOf: string
      tapToFlip: string
      knew: string
      notYet: string
      done: string
      wordsKnown: string
      tryAgain: string
      finish: string
    }
  }

  conversation: {
    title: string
    subtitle: string
    dialogues: string
    phrases: string
    viewAllPhrases: string
    backToConversations: string
    lines: string
    minutes: string
    grammarFocus: string
    noDialogues: string
    filterAll: string
    modes: {
      read: string
      rolePlayA: string
      rolePlayB: string
      shadow: string
    }
    tapToReveal: string
    register: {
      formal: string
      neutral: string
      informal: string
    }
  }
  exercises: {
    title: string
    subtitle: string
    totalXp: string
    start: string
    continue: string
    review: string
    mastered: string
    showMastered: string
    hideMastered: string
    backToExercises: string
    correct: string
    wrong: string
    comboLabel: string
    next: string
    check: string
    complete: string
    starsEarned: string
    tryAgain: string
    finish: string
    exercises: string
    minutes: string
    tapToListen: string
    tapToSelect: string
    levels: { A1: string; A2: string; B1: string; B2: string }
    prompts: {
      whatMeans: string
      selectArabic: string
      fillGap: string
      orderWords: string
      matchPairs: string
      oddOneOut: string
      listenSelect: string
      sentenceTranslate: string
      trueFalse: string
    }
    trueFalseTrue: string
    trueFalseFalse: string
    done: {
      perfect: string
      great: string
      good: string
      keep: string
    }
  }
  grammar: {
    title: string
    subtitle: string
    totalXp: string
    completed: string
    lessons: string
    minutes: string
    startLesson: string
    continueLesson: string
    reviewLesson: string
    mastered: string
    takeQuiz: string
    quizTitle: string
    quizSubtitle: string
    correct: string
    wrong: string
    next: string
    finish: string
    tryAgain: string
    backToGrammar: string
    keyTerms: string
    examples: string
    rule: string
    tip: string
    warning: string
    compare: string
    rootNote: string
    identify: string
    classify: string
    questions: string
    quizDone: {
      perfect: string
      great: string
      good: string
      keep: string
    }
    tracks: {
      nahw: string
      sarf: string
    }
    levels: {
      A1: string
      A2: string
      B1: string
      B2: string
      C1: string
      C2: string
    }
  }
  progress: {
    title: string
    completed: string
    total: string
    easy: string
    medium: string
    hard: string
    resetAll: string
    resetConfirm: string
    streak: string
    today: string
    thisWeek: string
    allTime: string
    noProgress: string
    textsRead: string
    byCategory: string
    byDifficulty: string
    rank: string
    xpToNext: string
    activity: string
    last35Days: string
    achievements: string
    wordsKnown: string
    vocabSection: string
    exerciseSection: string
    readingSection: string
    packsDone: string
    starsCollected: string
    outOf: string
  }
  common: {
    loading: string
    error: string
    retry: string
    darkMode: string
    lightMode: string
    comingSoon: string
    backToHome: string
    loadMore: string
  }
  auth: {
    signIn: string
    signUp: string
    signOut: string
    email: string
    password: string
    checkEmail: string
    passwordHint: string
    forgotPassword: string
    sendResetLink: string
    backToSignIn: string
  }
}

export const en: Translations = {
  appName: 'FushaLab',
  tagline: 'Master Modern Standard Arabic',
  nav: {
    home: 'Home',
    reading: 'Reading',
    listening: 'Listening',
    vocabulary: 'Vocabulary',
    conversation: 'Conversation',
    exercises: 'Exercises',
    grammar: 'Grammar',
    progress: 'Progress',
  },
  home: {
    hero: 'Learn Modern Standard Arabic',
    heroSub: 'Reading, listening and vocabulary practice for serious learners',
    startLearning: 'Start Reading',
    chooseCategory: 'Choose a Category',
    levels: 'Levels',
    wordOfDay: 'Word of the Day',
    wordRoot: 'Root',
    welcomeBack: 'Continue your journey',
    continueReading: 'Continue reading',
    dailyGoal: 'today',
    goalReached: 'Goal reached!',
    reviewQueue: 'Review hard texts',
    exploreSection: 'Explore',
    sections: {
      reading: {
        title: 'Reading',
        desc: 'Authentic MSA texts with full diacritics at B1–C2 level',
      },
      listening: { title: 'Listening', desc: 'Curated YouTube courses in Modern Standard Arabic' },
      vocabulary: {
        title: 'Vocabulary',
        desc: 'Build your Arabic vocabulary with spaced repetition',
      },
      conversation: {
        title: 'Conversation',
        desc: 'Practice A1–A2 dialogues and basic sentence patterns',
      },
      exercises: { title: 'Exercises', desc: 'Grammar drills and comprehension questions' },
      progress: { title: 'Progress', desc: 'Track your learning streak and achievements' },
    },
  },
  categories: {
    travel: 'Travel',
    culture: 'Culture',
    news: 'News',
    literature: 'Literature',
    religion: 'Religion',
    health: 'Health',
    work: 'Work',
    technology: 'Technology',
    social: 'Social Media',
    food: 'Food',
    education: 'Education',
    finance: 'Finance',
    mysteries: 'Mysteries',
    history: 'History',
    psychology: 'Psychology',
    conversations: 'Conversations',
    idioms: 'Idioms & Proverbs',
    stories: 'Short Stories',
    opinions: 'Opinions',
  },
  levels: {
    B1: 'B1 – Intermediate',
    B2: 'B2 – Upper-Intermediate',
    C1: 'C1 – Advanced',
    C2: 'C2 – Mastery',
  },
  reader: {
    showHarakat: 'Show Diacritics',
    hideHarakat: 'Hide Diacritics',
    showTranslation: 'Show Translation',
    hideTranslation: 'Hide Translation',
    pinTranslation: 'Always show translation',
    unpinTranslation: 'Click to toggle translation',
    sentenceMode: 'Sentence-by-sentence mode',
    fullMode: 'Full text mode',
    sentenceOf: 'of',
    playAudio: 'Play Audio',
    stopAudio: 'Stop Audio',
    noVoice: 'No Arabic voice available',
    next: 'Next',
    prev: 'Previous',
    backToList: 'Back to list',
    completed: 'Completed',
    showCompleted: 'Show completed',
    hideCompleted: 'Hide completed',
    noContent: 'Coming soon',
    textsTotal: 'texts',
  },
  difficulty: {
    label: 'How was this text?',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    saved: 'Rating saved!',
  },
  listening: {
    title: 'Listening Practice',
    subtitle: 'Curated YouTube courses in Modern Standard Arabic',
    tier1: 'Recommended',
    tier2: 'Good',
    tier3: 'Authentic Input',
    openYouTube: 'Open on YouTube',
    language: 'Language',
    subscribers: 'subscribers',
    comingSoon: 'Embedded player coming soon',
    backToChannels: 'Channels',
    backToPlaylists: 'Playlists',
    playlists: 'Playlists',
    videos: 'Videos',
    noVideos: 'No videos added yet',
    level: 'Level',
    filterAll: 'All',
    filterBs: 'Bosnian',
    filterEn: 'English',
    selectVideo: 'Select a video to start watching',
    noContentForLocale: 'No content available for this language yet',
    approach: {
      structuredCourse: 'Structured Course',
      authenticInput: 'Authentic Input',
      mixed: 'Mixed',
    },
  },
  vocabulary: {
    title: 'Vocabulary',
    subtitle: 'Word sets and root families for MSA learners',
    sets: 'Word Sets',
    rootExplorer: 'Root Explorer',
    viewAllRoots: 'View all roots',
    words: 'words',
    known: 'known',
    studySet: 'Study',
    backToVocab: 'Back to Vocabulary',
    study: {
      cardOf: 'of',
      tapToFlip: 'Tap to flip',
      knew: 'I knew it',
      notYet: 'Not yet',
      done: 'Session complete',
      wordsKnown: 'words known',
      tryAgain: 'Try again',
      finish: 'Finish',
    },
  },
  conversation: {
    title: 'Conversations',
    subtitle: 'Scripted MSA dialogues, functional phrases, and role-play practice',
    dialogues: 'Dialogues',
    phrases: 'Functional Phrases',
    viewAllPhrases: 'View all phrases',
    backToConversations: 'Back to Conversations',
    lines: 'lines',
    minutes: 'min',
    grammarFocus: 'Grammar focus',
    noDialogues: 'No dialogues available yet',
    filterAll: 'All levels',
    modes: {
      read: 'Read',
      rolePlayA: 'Role: Speaker A',
      rolePlayB: 'Role: Speaker B',
      shadow: 'Shadow',
    },
    tapToReveal: 'Tap to reveal',
    register: {
      formal: 'Formal',
      neutral: 'Neutral',
      informal: 'Informal',
    },
  },
  exercises: {
    title: 'Exercises',
    subtitle: 'Practice Arabic with interactive drills at every level',
    totalXp: 'XP',
    start: 'Start',
    continue: 'Continue',
    review: 'Review',
    mastered: 'Mastered',
    showMastered: 'Show mastered',
    hideMastered: 'Hide mastered',
    backToExercises: 'Back to Exercises',
    correct: 'Correct!',
    wrong: 'Not quite',
    comboLabel: 'Combo',
    next: 'Next →',
    check: 'Check',
    complete: 'Complete!',
    starsEarned: 'stars earned',
    tryAgain: 'Try again',
    finish: 'Finish',
    exercises: 'exercises',
    minutes: 'min',
    tapToListen: 'Tap to listen',
    tapToSelect: 'Select the word you heard',
    levels: {
      A1: 'A1 — Beginner',
      A2: 'A2 — Elementary',
      B1: 'B1 — Intermediate',
      B2: 'B2 — Upper-Intermediate',
    },
    prompts: {
      whatMeans: 'What does this word mean?',
      selectArabic: 'Select the Arabic word',
      fillGap: 'Fill in the missing word',
      orderWords: 'Arrange the words in correct order',
      matchPairs: 'Match each word to its translation',
      oddOneOut: 'Which word does NOT belong?',
      listenSelect: 'Listen and select the word you heard',
      sentenceTranslate: 'What does this sentence mean?',
      trueFalse: 'True or false?',
    },
    trueFalseTrue: 'True',
    trueFalseFalse: 'False',
    done: {
      perfect: 'Perfect! Flawless run!',
      great: 'Excellent work!',
      good: 'Good job — keep it up!',
      keep: 'Keep practicing!',
    },
  },
  grammar: {
    title: 'Grammar',
    subtitle: 'Arabic grammar through Arabic terminology — from sentence to mastery',
    totalXp: 'XP',
    completed: 'completed',
    lessons: 'lessons',
    minutes: 'min',
    startLesson: 'Start',
    continueLesson: 'Continue',
    reviewLesson: 'Review',
    mastered: 'Mastered',
    takeQuiz: 'Take the quiz',
    quizTitle: 'الِاخْتِبَارُ',
    quizSubtitle: 'Test what you learned',
    correct: 'Correct!',
    wrong: 'Not quite',
    next: 'Next →',
    finish: 'Finish',
    tryAgain: 'Try again',
    backToGrammar: 'Back to Grammar',
    keyTerms: 'Key terms',
    examples: 'Examples',
    rule: 'الْقَاعِدَةُ',
    tip: 'Tip',
    warning: 'Important',
    compare: 'Compare',
    rootNote: 'Root',
    identify: 'Tap the correct word',
    classify: 'Classify this sentence',
    questions: 'questions',
    quizDone: {
      perfect: 'Flawless — you own this!',
      great: 'Excellent work!',
      good: 'Good — keep going!',
      keep: 'Review the lesson and try again',
    },
    tracks: {
      nahw: 'النَّحْوُ — Syntax',
      sarf: 'الصَّرْفُ — Morphology',
    },
    levels: {
      A1: 'A1',
      A2: 'A2',
      B1: 'B1',
      B2: 'B2',
      C1: 'C1',
      C2: 'C2',
    },
  },
  progress: {
    title: 'Your Progress',
    completed: 'Completed',
    total: 'Total texts',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    resetAll: 'Reset All Progress',
    resetConfirm: 'This will clear all your reading, vocabulary and exercise progress. Are you sure?',
    streak: 'Day streak',
    today: 'Today',
    thisWeek: 'This week',
    allTime: 'All time',
    noProgress: 'No progress yet — start reading!',
    textsRead: 'texts read',
    byCategory: 'By category',
    byDifficulty: 'By difficulty',
    rank: 'Rank',
    xpToNext: 'XP to next rank',
    activity: 'Reading Activity',
    last35Days: 'Last 5 weeks',
    achievements: 'Achievements',
    wordsKnown: 'words known',
    vocabSection: 'Vocabulary',
    exerciseSection: 'Exercises',
    readingSection: 'Reading',
    packsDone: 'packs done',
    starsCollected: 'stars',
    outOf: 'of',
  },
  common: {
    loading: 'Loading…',
    error: 'Failed to load content.',
    retry: 'Retry',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    comingSoon: 'Coming Soon',
    backToHome: 'Back to Home',
    loadMore: 'Load more',
  },
  auth: {
    signIn: 'Sign in',
    signUp: 'Sign up',
    signOut: 'Sign out',
    email: 'Email',
    password: 'Password',
    checkEmail: 'Check your email.',
    passwordHint: 'Minimum 6 characters.',
    forgotPassword: 'Forgot password?',
    sendResetLink: 'Send reset link',
    backToSignIn: 'Back to sign in',
  },
}
