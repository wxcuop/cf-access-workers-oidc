import { Router } from 'itty-router'
import { handleAuth } from '../handlers/auth-handlers'

export function devRoutes(router: Router<any>) {
  // Development endpoints (remove in production)
  router.get('/dev/reset-tokens', handleAuth)
  router.get('/dev/debug-token/:token', handleAuth)
  router.get('/dev/users', handleAuth)
  router.get('/dev/groups', handleAuth)
  router.post('/dev/init-admin', handleAuth)
}
