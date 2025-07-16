import { Router } from 'itty-router'
import { handleAdminRequest } from '../handlers/admin-handlers'

export function adminRoutes(router: Router<any>) {
  // User management endpoints
  router.get('/admin/users', handleAdminRequest)
  router.post('/admin/users', handleAdminRequest)
  router.put('/admin/users/:email', handleAdminRequest)
  router.delete('/admin/users/:email', handleAdminRequest)
  router.post('/admin/users/:email/groups', handleAdminRequest)
  router.delete('/admin/users/:email/groups/:groupName', handleAdminRequest)
  router.put('/admin/users/:email/groups', handleAdminRequest)
  
  // Group management endpoints
  router.get('/admin/groups', handleAdminRequest)
  router.post('/admin/groups', handleAdminRequest)
  router.put('/admin/groups/:groupName', handleAdminRequest)
  router.delete('/admin/groups/:groupName', handleAdminRequest)
  router.get('/admin/groups/:groupName/users', handleAdminRequest)
  router.post('/admin/groups/:groupName/users', handleAdminRequest)
  router.delete('/admin/groups/:groupName/users/:email', handleAdminRequest)
}
