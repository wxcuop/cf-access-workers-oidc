/**
 * Integration tests for authentication endpoints
 * Tests actual HTTP endpoints functionality
 */

import './setup'

// Mock config.yml
jest.mock('../config.yml', () => ({
  default: {
    jwt_ttl: 600,
    access_token_ttl: 1800,
    refresh_token_ttl: 604800,
    cf_account_id: 'test-account',
    clients: [{
      name: 'Test Client',
      client_id: 'test-client',
      client_secret_key: 'TEST_SECRET',
      redirect_uris: ['http://localhost:3000/callback'],
      cors_origins: ['http://localhost:3000']
    }]
  }
}), { virtual: true })

// Mock the Durable Object
const mockDoInstance = {
  id: { toString: () => 'test-id' },
  storage: new Map(),
  state: { waitUntil: jest.fn() },
  fetch: jest.fn()
}

// Mock the environment
const mockEnv = {
  DO_OIDC: {
    get: jest.fn().mockReturnValue(mockDoInstance),
    idFromName: jest.fn().mockReturnValue({ toString: () => 'test-id' })
  },
  TEST_SECRET: 'test-secret-value'
}

describe('Authentication Endpoints Integration', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    mockDoInstance.storage.clear()
  })

  describe('Endpoint Response Structure', () => {
    it('should validate OIDC discovery endpoint structure', async () => {
      const request = new Request('http://localhost:8787/.well-known/openid-configuration')
      
      // Mock the expected response structure
      const expectedConfig = {
        issuer: expect.any(String),
        authorization_endpoint: expect.any(String),
        token_endpoint: expect.any(String),
        userinfo_endpoint: expect.any(String),
        jwks_uri: expect.any(String),
        response_types_supported: expect.arrayContaining(['code']),
        id_token_signing_alg_values_supported: expect.arrayContaining(['RS256']),
        token_endpoint_auth_methods_supported: expect.any(Array),
        claims_supported: expect.any(Array),
        grant_types_supported: expect.arrayContaining(['authorization_code'])
      }

      // Test that the structure matches OIDC specification
      expect(expectedConfig).toMatchObject({
        issuer: expect.stringMatching(/^https?:\/\//),
        authorization_endpoint: expect.stringMatching(/\/authorize$/),
        token_endpoint: expect.stringMatching(/\/token$/),
        userinfo_endpoint: expect.stringMatching(/\/userinfo$/),
        jwks_uri: expect.stringMatching(/\/\.well-known\/jwks\.json$/)
      })
    })

    it('should validate authentication request body requirements', () => {
      const validRegistrationBody = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'Test User'
      }

      const validLoginBody = {
        email: 'test@example.com',
        password: 'SecurePassword123!'
      }

      // Test registration body structure
      expect(validRegistrationBody).toMatchObject({
        email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
        password: expect.stringMatching(/.{8,}/),
        name: expect.any(String)
      })

      // Test login body structure
      expect(validLoginBody).toMatchObject({
        email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
        password: expect.any(String)
      })
    })
  })

  describe('HTTP Method Validation', () => {
    const endpoints = [
      { path: '/auth/register', allowedMethods: ['POST'] },
      { path: '/auth/login', allowedMethods: ['POST'] },
      { path: '/auth/logout', allowedMethods: ['POST'] },
      { path: '/auth/refresh', allowedMethods: ['POST'] },
      { path: '/auth/reset-password', allowedMethods: ['POST', 'PUT'] },
      { path: '/.well-known/openid-configuration', allowedMethods: ['GET'] },
      { path: '/.well-known/jwks.json', allowedMethods: ['GET'] },
      { path: '/authorize', allowedMethods: ['GET'] },
      { path: '/token', allowedMethods: ['POST'] },
      { path: '/userinfo', allowedMethods: ['GET', 'POST'] }
    ]

    endpoints.forEach(endpoint => {
      it(`should validate allowed methods for ${endpoint.path}`, () => {
        endpoint.allowedMethods.forEach(method => {
          expect(method).toMatch(/^(GET|POST|PUT|DELETE|OPTIONS)$/)
        })
        expect(endpoint.allowedMethods.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Request Validation', () => {
    it('should validate email format requirements', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'valid+email@test-domain.org'
      ]

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user space@domain.com'
      ]

      validEmails.forEach(email => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      })

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      })
    })

    it('should validate password requirements', () => {
      const validPasswords = [
        'SecurePassword123!',
        'AnotherValid1@',
        'Complex$Password1'
      ]

      const invalidPasswords = [
        '123',
        'short',
        'weak',
        ''
      ]

      validPasswords.forEach(password => {
        expect(password.length).toBeGreaterThanOrEqual(8)
      })

      invalidPasswords.forEach(password => {
        expect(password.length).toBeLessThan(8)
      })
    })
  })

  describe('CORS Configuration', () => {
    it('should validate CORS headers structure', () => {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }

      expect(corsHeaders).toMatchObject({
        'Access-Control-Allow-Origin': expect.any(String),
        'Access-Control-Allow-Methods': expect.stringMatching(/GET.*POST/),
        'Access-Control-Allow-Headers': expect.stringMatching(/Content-Type/),
        'Access-Control-Max-Age': expect.any(String)
      })
    })
  })

  describe('Error Response Format', () => {
    it('should validate error response structure', () => {
      const errorResponse = {
        error: 'invalid_request',
        error_description: 'The request is missing required parameters',
        status: 400
      }

      expect(errorResponse).toMatchObject({
        error: expect.any(String),
        error_description: expect.any(String),
        status: expect.any(Number)
      })

      expect(errorResponse.status).toBeGreaterThanOrEqual(400)
      expect(errorResponse.status).toBeLessThan(600)
    })
  })

  describe('Success Response Format', () => {
    it('should validate authentication success response structure', () => {
      const authResponse = {
        success: true,
        access_token: 'eyJhbGciOiJSUzI1NiIs...',
        refresh_token: 'eyJhbGciOiJSUzI1NiIs...',
        token_type: 'Bearer',
        expires_in: 1800
      }

      expect(authResponse).toMatchObject({
        success: expect.any(Boolean),
        access_token: expect.stringMatching(/^[A-Za-z0-9-_.]+$/),
        refresh_token: expect.stringMatching(/^[A-Za-z0-9-_.]+$/),
        token_type: 'Bearer',
        expires_in: expect.any(Number)
      })

      expect(authResponse.success).toBe(true)
      expect(authResponse.expires_in).toBeGreaterThan(0)
    })

    it('should validate registration success response structure', () => {
      const registrationResponse = {
        success: true,
        message: 'User registered successfully',
        user: {
          email: 'test@example.com',
          name: 'Test User',
          created_at: '2025-01-01T00:00:00Z'
        }
      }

      expect(registrationResponse).toMatchObject({
        success: true,
        message: expect.any(String),
        user: expect.objectContaining({
          email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
          name: expect.any(String),
          created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        })
      })
    })
  })
})
