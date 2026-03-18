import {
  createRouter,
  createRoute,
  createRootRouteWithContext,
  Outlet,
} from '@tanstack/react-router'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { LevelPage } from './pages/LevelPage'
import { ReaderPage } from './pages/ReaderPage'
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

// Level list
const levelRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/learn/$category/$level',
  component: function LevelRouteComponent() {
    const { category, level } = levelRoute.useParams()
    return <LevelPage category={category as Category} level={level as Level} />
  },
})

// Reader
const readerRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/learn/$category/$level/$id',
  component: function ReaderRouteComponent() {
    const { category, level, id } = readerRoute.useParams()
    return <ReaderPage category={category as Category} level={level as Level} id={id} />
  },
})

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([homeRoute, levelRoute, readerRoute]),
])

export function createAppRouter(context: RouterContext) {
  return createRouter({ routeTree, context })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
