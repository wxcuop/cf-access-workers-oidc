import { Router } from 'itty-router'
import { handleAuth } from '../handlers/auth-handlers'

export function adminRoutes(router: Router<any>) {
  // User and group management endpoints
  router.get('/users', handleAuth)
  router.post('/users', handleAuth)
  router.get('/users/:id', handleAuth)
  router.put('/users/:id', handleAuth)
  router.delete('/users/:id', handleAuth)
  router.get('/groups', handleAuth)
  router.post('/groups', handleAuth)
  router.get('/groups/:name', handleAuth)
  router.put('/groups/:name', handleAuth)
  router.delete('/groups/:name', handleAuth)
  router.post('/groups/:name/members', handleAuth)
  router.delete('/groups/:name/members/:email', handleAuth)
}
