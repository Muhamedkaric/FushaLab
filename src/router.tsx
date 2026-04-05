import {
  createRouter,
  createRoute,
  createRootRouteWithContext,
  Outlet,
} from '@tanstack/react-router'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ReadingPage } from './pages/ReadingPage'
import { LevelPage } from './pages/LevelPage'
import { ReaderPage } from './pages/ReaderPage'
import { ListeningPage } from './pages/ListeningPage'
import { ChannelPage } from './pages/ChannelPage'
import { PlaylistPage } from './pages/PlaylistPage'
import { VocabularyPage } from './pages/VocabularyPage'
import { VocabularySetPage } from './pages/VocabularySetPage'
import { VocabularyStudyPage } from './pages/VocabularyStudyPage'
import { ConversationPage } from './pages/ConversationPage'
import { DialoguePage } from './pages/DialoguePage'
import { PhrasesPage } from './pages/PhrasesPage'
import { ExercisesPage } from './pages/ExercisesPage'
import { ExerciseSessionPage } from './pages/ExerciseSessionPage'
import { GrammarPage } from './pages/GrammarPage'
import { GrammarLessonPage } from './pages/GrammarLessonPage'
import { ProgressPage } from './pages/ProgressPage'
import { SavedWordsPage } from './pages/SavedWordsPage'
import type { Category, Level } from './types/content'

export interface RouterContext {
  isDark: boolean
  onToggleTheme: () => void
}

// Root route with typed context
const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
})

// Shell route renders Layout with context values
const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'shell',
  component: function Shell() {
    const { isDark, onToggleTheme } = shellRoute.useRouteContext()
    return (
      <Layout isDark={isDark} onToggleTheme={onToggleTheme}>
        <Outlet />
      </Layout>
    )
  },
})

// Home
const homeRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/',
  component: HomePage,
})

// Reading — category overview
const readingRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/reading',
  component: ReadingPage,
})

// Level list
const levelRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/reading/$category/$level',
  component: function LevelRouteComponent() {
    const { category, level } = levelRoute.useParams()
    return <LevelPage category={category as Category} level={level as Level} />
  },
})

// Reader
const readerRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/reading/$category/$level/$id',
  component: function ReaderRouteComponent() {
    const { category, level, id } = readerRoute.useParams()
    return <ReaderPage category={category as Category} level={level as Level} id={id} />
  },
})

// Listening — channel overview
const listeningRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/listening',
  component: ListeningPage,
})

// Listening — channel playlists
const channelRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/listening/$channelId',
  component: function ChannelRouteComponent() {
    const { channelId } = channelRoute.useParams()
    return <ChannelPage channelId={channelId} />
  },
})

// Listening — playlist videos
const playlistRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/listening/$channelId/$playlistId',
  component: function PlaylistRouteComponent() {
    const { channelId, playlistId } = playlistRoute.useParams()
    return <PlaylistPage channelId={channelId} playlistId={playlistId} />
  },
})

// Vocabulary — hub
const vocabularyRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/vocabulary',
  component: VocabularyPage,
})

// Vocabulary — word set
const vocabularySetRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/vocabulary/$setId',
  component: function VocabularySetRouteComponent() {
    const { setId } = vocabularySetRoute.useParams()
    return <VocabularySetPage setId={setId} />
  },
})

// Vocabulary — study session
const vocabularyStudyRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/vocabulary/$setId/study',
  component: function VocabularyStudyRouteComponent() {
    const { setId } = vocabularyStudyRoute.useParams()
    return <VocabularyStudyPage setId={setId} />
  },
})

// Conversation — hub
const conversationRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/conversation',
  component: ConversationPage,
})

// Conversation — dialogue detail
const dialogueRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/conversation/$id',
  component: function DialogueRouteComponent() {
    const { id } = dialogueRoute.useParams()
    return <DialoguePage id={id} />
  },
})

// Conversation — phrases hub
const phrasesRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/conversation/phrases',
  component: PhrasesPage,
})

// Conversation — phrase category detail
const phraseCategoryRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/conversation/phrases/$categoryId',
  component: function PhraseCategoryRouteComponent() {
    const { categoryId } = phraseCategoryRoute.useParams()
    return <PhrasesPage initialCategoryId={categoryId} />
  },
})

// Exercises — hub
const exercisesRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/exercises',
  component: ExercisesPage,
})

// Exercises — session
const exerciseSessionRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/exercises/$packId',
  component: function ExerciseSessionRouteComponent() {
    const { packId } = exerciseSessionRoute.useParams()
    return <ExerciseSessionPage packId={packId} />
  },
})

// Grammar — hub
const grammarRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/grammar',
  component: GrammarPage,
})

// Grammar — lesson
const grammarLessonRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/grammar/$lessonId',
  component: function GrammarLessonRouteComponent() {
    const { lessonId } = grammarLessonRoute.useParams()
    return <GrammarLessonPage lessonId={lessonId} />
  },
})

// Progress
const progressRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/progress',
  component: ProgressPage,
})

// Saved Words
const savedWordsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/words',
  component: SavedWordsPage,
})

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([
    homeRoute,
    readingRoute,
    levelRoute,
    readerRoute,
    listeningRoute,
    channelRoute,
    playlistRoute,
    vocabularyRoute,
    vocabularySetRoute,
    vocabularyStudyRoute,
    conversationRoute,
    dialogueRoute,
    phrasesRoute,
    phraseCategoryRoute,
    exercisesRoute,
    exerciseSessionRoute,
    grammarRoute,
    grammarLessonRoute,
    progressRoute,
    savedWordsRoute,
  ]),
])

export function createAppRouter(context: RouterContext) {
  return createRouter({ routeTree, context })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
