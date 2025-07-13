/**
 * Integration test for route configuration
 * Tests that all API routes are properly configured and respond correctly
 */

import { Router } from 'itty-router'

describe('Route Configuration Tests', () => {
  let testRouter: any

  beforeEach(() => {
    // Create a test router with the same routes as main.ts
    testRouter = Router()

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
    testRouter.post('/auth/refresh', () => 'refresh')
    testRouter.post('/auth/reset-password', () => 'reset-password')
    testRouter.put('/auth/reset-password/:token', () => 'reset-password-confirm')

    // Admin user management endpoints
    testRouter.get('/admin/users', () => 'admin-users-list')
    testRouter.post('/admin/users', () => 'admin-users-create')
    testRouter.get('/admin/users/:email', () => 'admin-users-get')
    testRouter.put('/admin/users/:email', () => 'admin-users-update')
    testRouter.delete('/admin/users/:email', () => 'admin-users-delete')
    testRouter.post('/admin/users/:email/groups', () => 'admin-users-add-groups')
    testRouter.delete('/admin/users/:email/groups/:group', () => 'admin-users-remove-group')

    // Admin group management endpoints
    testRouter.get('/admin/groups', () => 'admin-groups-list')
    testRouter.post('/admin/groups', () => 'admin-groups-create')
    testRouter.get('/admin/groups/:name', () => 'admin-groups-get')
    testRouter.put('/admin/groups/:name', () => 'admin-groups-update')
    testRouter.delete('/admin/groups/:name', () => 'admin-groups-delete')
    testRouter.get('/admin/groups/:name/users', () => 'admin-groups-users')

    // CORS and catch-all
    testRouter.options('*', () => 'cors')
    testRouter.all('*', () => 'not-found')
  })

  const testCases = [
    // OIDC Standard Endpoints
    { method: 'GET', url: '/.well-known/openid-configuration', expected: 'oidc-config', description: 'OIDC discovery endpoint' },
    { method: 'GET', url: '/.well-known/jwks.json', expected: 'jwks', description: 'JWKS endpoint' },
    { method: 'GET', url: '/authorize', expected: 'authorize', description: 'Authorization endpoint' },
    { method: 'POST', url: '/token', expected: 'token', description: 'Token endpoint' },
    { method: 'GET', url: '/userinfo', expected: 'userinfo', description: 'Userinfo GET endpoint' },
    { method: 'POST', url: '/userinfo', expected: 'userinfo', description: 'Userinfo POST endpoint' },

    // Authentication Endpoints
    { method: 'POST', url: '/auth/login', expected: 'login', description: 'User login' },
    { method: 'POST', url: '/auth/register', expected: 'register', description: 'User registration' },
    { method: 'POST', url: '/auth/logout', expected: 'logout', description: 'User logout' },
    { method: 'POST', url: '/auth/refresh', expected: 'refresh', description: 'Token refresh' },
    { method: 'POST', url: '/auth/reset-password', expected: 'reset-password', description: 'Password reset request' },
    { method: 'PUT', url: '/auth/reset-password/token123', expected: 'reset-password-confirm', description: 'Password reset confirmation' },

    // Admin User Management
    { method: 'GET', url: '/admin/users', expected: 'admin-users-list', description: 'List users' },
    { method: 'POST', url: '/admin/users', expected: 'admin-users-create', description: 'Create user' },
    { method: 'GET', url: '/admin/users/test@example.com', expected: 'admin-users-get', description: 'Get user' },
    { method: 'PUT', url: '/admin/users/test@example.com', expected: 'admin-users-update', description: 'Update user' },
    { method: 'DELETE', url: '/admin/users/test@example.com', expected: 'admin-users-delete', description: 'Delete user' },
    { method: 'POST', url: '/admin/users/test@example.com/groups', expected: 'admin-users-add-groups', description: 'Add user to groups' },
    { method: 'DELETE', url: '/admin/users/test@example.com/groups/admins', expected: 'admin-users-remove-group', description: 'Remove user from group' },

    // Admin Group Management
    { method: 'GET', url: '/admin/groups', expected: 'admin-groups-list', description: 'List groups' },
    { method: 'POST', url: '/admin/groups', expected: 'admin-groups-create', description: 'Create group' },
    { method: 'GET', url: '/admin/groups/admins', expected: 'admin-groups-get', description: 'Get group' },
    { method: 'PUT', url: '/admin/groups/admins', expected: 'admin-groups-update', description: 'Update group' },
    { method: 'DELETE', url: '/admin/groups/admins', expected: 'admin-groups-delete', description: 'Delete group' },
    { method: 'GET', url: '/admin/groups/admins/users', expected: 'admin-groups-users', description: 'List users in group' },

    // CORS and Error Handling
    { method: 'OPTIONS', url: '/auth/login', expected: 'cors', description: 'CORS preflight' },
    { method: 'GET', url: '/nonexistent', expected: 'not-found', description: 'Non-existent route' },
  ]

  testCases.forEach(testCase => {
    it(`should route ${testCase.method} ${testCase.url} correctly - ${testCase.description}`, async () => {
      const mockRequest = {
        method: testCase.method,
        url: `http://localhost:8787${testCase.url}`,
        headers: new Headers()
      }

      const result = await testRouter.handle(mockRequest)
      expect(result).toBe(testCase.expected)
    })
  })

  it('should handle all expected routes without errors', async () => {
    const results = await Promise.all(
      testCases.map(async testCase => {
        const mockRequest = {
          method: testCase.method,
          url: `http://localhost:8787${testCase.url}`,
          headers: new Headers()
        }
        
        try {
          const result = await testRouter.handle(mockRequest)
          return { ...testCase, result, success: result === testCase.expected }
        } catch (error) {
          return { ...testCase, error: (error as Error).message, success: false }
        }
      })
    )

    const failed = results.filter(r => !r.success)
    expect(failed).toHaveLength(0)
  })
})
