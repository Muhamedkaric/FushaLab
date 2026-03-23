export interface Translations {
  appName: string
  tagline: string
  nav: { home: string; learn: string; progress: string }
  home: {
    hero: string
    heroSub: string
    startLearning: string
    chooseCategory: string
    levels: string
  }
  categories: {
    travel: string
    culture: string
    news: string
    literature: string
    religion: string
  }
  levels: { B1: string; B2: string; C1: string; C2: string }
  reader: {
    showHarakat: string
    hideHarakat: string
    showTranslation: string
    hideTranslation: string
    playAudio: string
    stopAudio: string
    noVoice: string
    next: string
    prev: string
    backToList: string
    completed: string
    showCompleted: string
    hideCompleted: string
  }
  difficulty: {
    label: string
    easy: string
    medium: string
    hard: string
    saved: string
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
  }
  common: {
    loading: string
    error: string
    retry: string
    darkMode: string
    lightMode: string
  }
}

export const en: Translations = {
  appName: 'FushaLab',
  tagline: 'Master Modern Standard Arabic',
  nav: { home: 'Home', learn: 'Learn', progress: 'Progress' },
  home: {
    hero: 'Learn Modern Standard Arabic',
    heroSub: 'Interactive reading practice for B1–C2 learners',
    startLearning: 'Start Learning',
    chooseCategory: 'Choose a Category',
    levels: 'Levels',
  },
  categories: {
    travel: 'Travel',
    culture: 'Culture',
    news: 'News',
    literature: 'Literature',
    religion: 'Religion',
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
    playAudio: 'Play Audio',
    stopAudio: 'Stop Audio',
    noVoice: 'No Arabic voice available',
    next: 'Next',
    prev: 'Previous',
    backToList: 'Back to list',
    completed: 'Completed',
    showCompleted: 'Show completed',
    hideCompleted: 'Hide completed',
  },
  difficulty: {
    label: 'How was this text?',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    saved: 'Rating saved!',
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
  },
  common: {
    loading: 'Loading…',
    error: 'Failed to load content.',
    retry: 'Retry',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
  },
}
