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
import { ConversationPage } from './pages/ConversationPage'
import { ExercisesPage } from './pages/ExercisesPage'
import { ProgressPage } from './pages/ProgressPage'
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

// Vocabulary
const vocabularyRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/vocabulary',
  component: VocabularyPage,
})

// Conversation
const conversationRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/conversation',
  component: ConversationPage,
})

// Exercises
const exercisesRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/exercises',
  component: ExercisesPage,
})

// Progress
const progressRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/progress',
  component: ProgressPage,
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
    conversationRoute,
    exercisesRoute,
    progressRoute,
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
