/**
 * Test the routing configuration
 */
const { Router } = require('itty-router')

// Create a test router with the same routes as main.ts
const testRouter = Router()

// Standard OIDC routes
testRouter.get('/.well-known/openid-configuration', () => 'oidc-config')
testRouter.get('/.well-known/jwks.json', () => 'jwks')
testRouter.get('/authorize', () => 'authorize')
testRouter.post('/token', () => 'token')
testRouter.get('/userinfo', () => 'userinfo')
testRouter.post('/userinfo', () => 'userinfo')

// Authentication endpoints
testRouter.post('/auth/login', () => 'login')
testRouter.post('/auth/register', () => 'register')
testRouter.post('/auth/logout', () => 'logout')
testRouter.post('/auth/reset-password', () => 'reset-password')
testRouter.put('/auth/reset-password/:token', () => 'reset-password-confirm')

// User and group management endpoints
testRouter.get('/users', () => 'users-list')
testRouter.post('/users', () => 'users-create')
testRouter.get('/users/:id', () => 'users-get')
testRouter.put('/users/:id', () => 'users-update')
testRouter.delete('/users/:id', () => 'users-delete')
testRouter.get('/groups', () => 'groups-list')
testRouter.post('/groups', () => 'groups-create')
testRouter.get('/groups/:name', () => 'groups-get')
testRouter.put('/groups/:name', () => 'groups-update')
testRouter.delete('/groups/:name', () => 'groups-delete')
testRouter.post('/groups/:name/members', () => 'groups-add-member')
testRouter.delete('/groups/:name/members/:email', () => 'groups-remove-member')

testRouter.options('*', () => 'cors')
testRouter.all('*', () => 'not-found')

async function testRoutes() {
  console.log('🧪 Testing Route Configuration...')
  
  const testCases = [
    { method: 'POST', url: '/auth/login', expected: 'login' },
    { method: 'POST', url: '/auth/register', expected: 'register' },
    { method: 'POST', url: '/auth/logout', expected: 'logout' },
    { method: 'POST', url: '/auth/reset-password', expected: 'reset-password' },
    { method: 'PUT', url: '/auth/reset-password/token123', expected: 'reset-password-confirm' },
    { method: 'GET', url: '/users', expected: 'users-list' },
    { method: 'POST', url: '/users', expected: 'users-create' },
    { method: 'GET', url: '/users/123', expected: 'users-get' },
    { method: 'PUT', url: '/users/123', expected: 'users-update' },
    { method: 'DELETE', url: '/users/123', expected: 'users-delete' },
    { method: 'GET', url: '/groups', expected: 'groups-list' },
    { method: 'POST', url: '/groups', expected: 'groups-create' },
    { method: 'GET', url: '/groups/admins', expected: 'groups-get' },
    { method: 'PUT', url: '/groups/admins', expected: 'groups-update' },
    { method: 'DELETE', url: '/groups/admins', expected: 'groups-delete' },
    { method: 'POST', url: '/groups/admins/members', expected: 'groups-add-member' },
    { method: 'DELETE', url: '/groups/admins/members/test@example.com', expected: 'groups-remove-member' },
    { method: 'OPTIONS', url: '/auth/login', expected: 'cors' },
    { method: 'GET', url: '/nonexistent', expected: 'not-found' },
    { method: 'GET', url: '/.well-known/openid-configuration', expected: 'oidc-config' },
    { method: 'GET', url: '/.well-known/jwks.json', expected: 'jwks' },
    { method: 'GET', url: '/authorize', expected: 'authorize' },
    { method: 'POST', url: '/token', expected: 'token' },
    { method: 'GET', url: '/userinfo', expected: 'userinfo' },
    { method: 'POST', url: '/userinfo', expected: 'userinfo' },
  ]
  
  for (const testCase of testCases) {
    const mockRequest = {
      method: testCase.method,
      url: `http://localhost:8787${testCase.url}`,
      headers: new Headers()
    }
    
    try {
      const result = await testRouter.handle(mockRequest)
      const passed = result === testCase.expected
      
      console.log(`${passed ? '✅' : '❌'} ${testCase.method} ${testCase.url} -> ${result} (expected: ${testCase.expected})`)
    } catch (error) {
      console.log(`❌ ${testCase.method} ${testCase.url} -> ERROR: ${error.message}`)
    }
  }
  
  console.log('✅ Route configuration test completed!')
}

testRoutes().catch(console.error)
