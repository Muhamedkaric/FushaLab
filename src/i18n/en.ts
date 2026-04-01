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

  conversation: { title: string; comingSoon: string }
  exercises: { title: string; comingSoon: string }
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
  }
  common: {
    loading: string
    error: string
    retry: string
    darkMode: string
    lightMode: string
    comingSoon: string
    backToHome: string
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
    title: 'Conversation',
    comingSoon: 'A1–A2 conversation practice dialogues — coming soon',
  },
  exercises: {
    title: 'Exercises',
    comingSoon: 'Grammar drills and comprehension exercises — coming soon',
  },
  progress: {
    title: 'Your Progress',
    completed: 'Completed',
    total: 'Total texts',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    resetAll: 'Reset Progress',
    resetConfirm: 'Are you sure? This will clear all your ratings.',
    streak: 'Day streak',
    today: 'Today',
    thisWeek: 'This week',
    allTime: 'All time',
    noProgress: 'No progress yet — start reading!',
    textsRead: 'texts read',
    byCategory: 'By category',
    byDifficulty: 'By difficulty',
  },
  common: {
    loading: 'Loading…',
    error: 'Failed to load content.',
    retry: 'Retry',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    comingSoon: 'Coming Soon',
    backToHome: 'Back to Home',
  },
}
