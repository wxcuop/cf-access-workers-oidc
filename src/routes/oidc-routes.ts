import { Router } from 'itty-router'
import { 
  handleOIDConfig, 
  handleGetJwks, 
  handleAuthorize, 
  handleToken, 
  handleUserInfo 
} from '../handlers/oidc-handlers'

export function oidcRoutes(router: Router<any>) {
  // Core OIDC endpoints
  router.get('/.well-known/openid-configuration', handleOIDConfig)
  router.get('/.well-known/jwks.json', handleGetJwks)
  router.get('/authorize', handleAuthorize)
  router.post('/token', handleToken)
  router.get('/userinfo', handleUserInfo)
  router.post('/userinfo', handleUserInfo)
}
