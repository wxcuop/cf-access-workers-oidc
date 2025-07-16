import { Router } from 'itty-router'
import { handleAuth } from '../handlers/auth-handlers'

export function authRoutes(router: Router<any>) {
  // Authentication endpoints
  router.post('/auth/login', handleAuth)
  router.post('/auth/register', handleAuth)
  router.post('/auth/logout', handleAuth)
  router.post('/auth/reset-password', handleAuth)
  router.put('/auth/reset-password/:token', handleAuth)
}
