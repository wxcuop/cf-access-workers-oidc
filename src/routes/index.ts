import { Router } from 'itty-router'
import { oidcRoutes } from './oidc-routes'
import { authRoutes } from './auth-routes'
import { adminRoutes } from './admin-routes'
import { frontendRoutes } from './frontend-routes'
import { devRoutes } from './dev-routes'
import { handleOptions } from '../middleware/cors-middleware'
import { getResponse } from '../utils'

export function createRouter(): Router<any> {
  const router = Router()

  // Add route groups
  oidcRoutes(router)
  authRoutes(router)
  adminRoutes(router)
  frontendRoutes(router)
  devRoutes(router)

  // Global middleware
  router.options('*', handleOptions)
  router.all('*', () => getResponse({ err: 'Bad request' }, 400))

  return router
}
