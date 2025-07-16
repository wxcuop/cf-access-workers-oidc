import { Router } from 'itty-router'
import { 
  handleAdminRedirect, 
  handleAdminFiles, 
  handleSigninRedirect, 
  handleSigninFiles 
} from '../handlers/frontend-handlers'

export function frontendRoutes(router: Router<any>) {
  // Frontend serving routes
  router.get('/admin', handleAdminRedirect)
  router.get('/admin/', handleAdminRedirect)
  router.get('/admin/*', handleAdminFiles)
  router.get('/signin', handleSigninRedirect)
  router.get('/signin/', handleSigninRedirect)
  router.get('/signin/*', handleSigninFiles)
}
