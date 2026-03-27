export interface WordEntry {
  arabic: string
  root: string
  bs: string
  en: string
}

// 60 words — seeded by day so the same word shows for all users on the same day
export const WORDS_OF_DAY: WordEntry[] = [
  { arabic: 'الْعِلْمُ', root: 'ع ل م', bs: 'znanje', en: 'knowledge' },
  { arabic: 'الصَّبْرُ', root: 'ص ب ر', bs: 'strpljivost', en: 'patience' },
  { arabic: 'الْقَلْبُ', root: 'ق ل ب', bs: 'srce', en: 'heart' },
  { arabic: 'النُّورُ', root: 'ن و ر', bs: 'svjetlost', en: 'light' },
  { arabic: 'الْوَقْتُ', root: 'و ق ت', bs: 'vrijeme', en: 'time' },
  { arabic: 'الْكِتَابُ', root: 'ك ت ب', bs: 'knjiga', en: 'book' },
  { arabic: 'اللُّغَةُ', root: 'ل غ و', bs: 'jezik', en: 'language' },
  { arabic: 'الطَّرِيقُ', root: 'ط ر ق', bs: 'put', en: 'road, path' },
  { arabic: 'الْعَدْلُ', root: 'ع د ل', bs: 'pravda', en: 'justice' },
  { arabic: 'الْإِنْسَانُ', root: 'أ ن س', bs: 'čovjek', en: 'human being' },
  { arabic: 'الْبَيْتُ', root: 'ب ي ت', bs: 'kuća', en: 'house, home' },
  { arabic: 'الْمَدِينَةُ', root: 'م د ن', bs: 'grad', en: 'city' },
  { arabic: 'السَّمَاءُ', root: 'س م و', bs: 'nebo', en: 'sky, heaven' },
  { arabic: 'الْبَحْرُ', root: 'ب ح ر', bs: 'more', en: 'sea' },
  { arabic: 'الشَّجَرَةُ', root: 'ش ج ر', bs: 'drvo', en: 'tree' },
  { arabic: 'الْمَاءُ', root: 'م و ه', bs: 'voda', en: 'water' },
  { arabic: 'الْحَيَاةُ', root: 'ح ي و', bs: 'život', en: 'life' },
  { arabic: 'الْحُبُّ', root: 'ح ب ب', bs: 'ljubav', en: 'love' },
  { arabic: 'الصِّدْقُ', root: 'ص د ق', bs: 'istinitost', en: 'truthfulness' },
  { arabic: 'الْكَرَمُ', root: 'ك ر م', bs: 'velikodušnost', en: 'generosity' },
  { arabic: 'الشُّجَاعَةُ', root: 'ش ج ع', bs: 'hrabrost', en: 'courage' },
  { arabic: 'الْفَرَحُ', root: 'ف ر ح', bs: 'radost', en: 'joy' },
  { arabic: 'الْحُزْنُ', root: 'ح ز ن', bs: 'tuga', en: 'sadness' },
  { arabic: 'الذَّاكِرَةُ', root: 'ذ ك ر', bs: 'sjećanje', en: 'memory' },
  { arabic: 'الْحَقِيقَةُ', root: 'ح ق ق', bs: 'istina', en: 'truth, reality' },
  { arabic: 'الْأَمَلُ', root: 'أ م ل', bs: 'nada', en: 'hope' },
  { arabic: 'السَّلَامُ', root: 'س ل م', bs: 'mir', en: 'peace' },
  { arabic: 'الْعَقْلُ', root: 'ع ق ل', bs: 'razum', en: 'reason, mind' },
  { arabic: 'الرَّحْمَةُ', root: 'ر ح م', bs: 'milost', en: 'mercy, compassion' },
  { arabic: 'الْجَمَالُ', root: 'ج م ل', bs: 'ljepota', en: 'beauty' },
  { arabic: 'الشَّرَفُ', root: 'ش ر ف', bs: 'čast', en: 'honour' },
  { arabic: 'الْمُسْتَقْبَلُ', root: 'ق ب ل', bs: 'budućnost', en: 'future' },
  { arabic: 'الْمَاضِي', root: 'م ض ي', bs: 'prošlost', en: 'past' },
  { arabic: 'السَّفَرُ', root: 'س ف ر', bs: 'putovanje', en: 'travel, journey' },
  { arabic: 'الْفِكْرُ', root: 'ف ك ر', bs: 'misao', en: 'thought, idea' },
  { arabic: 'الطَّبِيعَةُ', root: 'ط ب ع', bs: 'priroda', en: 'nature' },
  { arabic: 'الثَّقَافَةُ', root: 'ث ق ف', bs: 'kultura', en: 'culture' },
  { arabic: 'الدِّرَاسَةُ', root: 'د ر س', bs: 'učenje, studij', en: 'study, learning' },
  { arabic: 'الْعَمَلُ', root: 'ع م ل', bs: 'rad, posao', en: 'work, deed' },
  { arabic: 'الصَّلَاةُ', root: 'ص ل و', bs: 'molitva', en: 'prayer' },
  { arabic: 'الْكَلِمَةُ', root: 'ك ل م', bs: 'riječ', en: 'word' },
  { arabic: 'الشِّعْرُ', root: 'ش ع ر', bs: 'poezija', en: 'poetry' },
  { arabic: 'الْقِصَّةُ', root: 'ق ص ص', bs: 'priča', en: 'story' },
  { arabic: 'الصَّحَّةُ', root: 'ص ح ح', bs: 'zdravlje', en: 'health' },
  { arabic: 'الصَّدِيقُ', root: 'ص د ق', bs: 'prijatelj', en: 'friend' },
  { arabic: 'الْعَائِلَةُ', root: 'ع و ل', bs: 'porodica', en: 'family' },
  { arabic: 'الْمَعْرِفَةُ', root: 'ع ر ف', bs: 'spoznaja', en: 'knowledge, cognition' },
  { arabic: 'الْإِرَادَةُ', root: 'ر و د', bs: 'volja', en: 'will, determination' },
  { arabic: 'الْغَايَةُ', root: 'غ ي و', bs: 'cilj', en: 'goal, purpose' },
  { arabic: 'الْبِدَايَةُ', root: 'ب د أ', bs: 'početak', en: 'beginning' },
  { arabic: 'الْمَعْنَى', root: 'ع ن و', bs: 'značenje', en: 'meaning' },
  { arabic: 'الْأَمَانَةُ', root: 'أ م ن', bs: 'pouzdanost', en: 'trustworthiness' },
  { arabic: 'الْحِكْمَةُ', root: 'ح ك م', bs: 'mudrost', en: 'wisdom' },
  { arabic: 'الرِّيحُ', root: 'ر و ح', bs: 'vjetar', en: 'wind' },
  { arabic: 'الزَّمَانُ', root: 'ز م ن', bs: 'doba, era', en: 'era, time' },
  { arabic: 'الْمَوْجُ', root: 'م و ج', bs: 'talas, val', en: 'wave' },
  { arabic: 'الْقَمَرُ', root: 'ق م ر', bs: 'Mjesec', en: 'moon' },
  { arabic: 'الشَّمْسُ', root: 'ش م س', bs: 'Sunce', en: 'sun' },
  { arabic: 'الأَرْضُ', root: 'أ ر ض', bs: 'zemlja', en: 'earth, land' },
  { arabic: 'الصَّمْتُ', root: 'ص م ت', bs: 'tišina', en: 'silence' },
  { arabic: 'الْقِيمَةُ', root: 'ق و م', bs: 'vrijednost', en: 'value' },
]

export function getTodaysWord(): WordEntry {
  const dayIndex = Math.floor(Date.now() / 86_400_000)
  return WORDS_OF_DAY[dayIndex % WORDS_OF_DAY.length]
}
