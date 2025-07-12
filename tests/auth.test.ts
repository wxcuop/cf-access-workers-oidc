/**
 * Authentication Test Suite
 * Tests for the OIDC Durable Object authentication infrastructure
 */

import { OpenIDConnectDurableObject } from '../src/oidc-do'
import { User, UserSession, AuthRequest, AuthResponse } from '../src/types'
import { verifyPassword } from '../src/security/security-utils'

// Mock environment for testing
const mockEnv = {
  OIDC_DO: {
    get: (id: string) => ({
      // Mock Durable Object stub
    })
  }
} as any

// Mock Durable Object State
const mockState = {
  storage: new Map(),
  blockConcurrencyWhile: async (fn: () => Promise<void>) => await fn(),
  id: {
    toString: () => 'test-id'
  }
} as any

// Mock storage interface
mockState.storage = {
  data: new Map(),
  get: function(key: string) {
    return this.data.get(key)
  },
  put: function(key: string, value: any) {
    this.data.set(key, value)
    return Promise.resolve()
  },
  delete: function(key: string) {
    this.data.delete(key)
    return Promise.resolve()
  },
  list: function(options?: { prefix?: string }) {
    const result = new Map()
    if (options?.prefix) {
      for (const [key, value] of this.data.entries()) {
        if (key.startsWith(options.prefix)) {
          result.set(key, value)
        }
      }
    } else {
      return new Map(this.data)
    }
    return Promise.resolve(result)
  }
}

describe('OpenIDConnectDurableObject Authentication', () => {
  let oidcDO: OpenIDConnectDurableObject
  let testUser: User

  beforeEach(async () => {
    // Reset mock storage
    mockState.storage.data.clear()
    
    // Create fresh OIDC DO instance
    oidcDO = new OpenIDConnectDurableObject(mockState, mockEnv)
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Create a test user
    testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: '', // Will be set by hashPassword
      groups: ['user'],
      created_at: Date.now(),
      updated_at: Date.now(),
      status: 'active'
    }
  })

  describe('Password Hashing and Validation', () => {
    test('hashPassword should create a secure hash', async () => {
      const password = 'TestPassword123!'
      const hash = await (oidcDO as any).hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).toHaveLength(96) // 16 bytes salt + 32 bytes hash = 48 bytes = 96 hex chars
      expect(hash).toMatch(/^[0-9a-f]+$/) // Should be hex string
    })

    test('verifyPassword should work with correct password', async () => {
      const password = 'TestPassword123!'
      const hash = await (oidcDO as any).hashPassword(password)
      
      const isValid = await (oidcDO as any).verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    test('verifyPassword should fail with incorrect password', async () => {
      const password = 'TestPassword123!'
      const wrongPassword = 'WrongPassword123!'
      const hash = await (oidcDO as any).hashPassword(password)
      
      const isValid = await (oidcDO as any).verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })

    test('validatePassword should enforce password requirements', () => {
      const validate = (oidcDO as any).validatePassword.bind(oidcDO)
      
      // Valid password
      expect(validate('TestPassword123!').valid).toBe(true)
      
      // Too short
      expect(validate('Test1!').valid).toBe(false)
      expect(validate('Test1!').errors).toContain('Password must be at least 8 characters long')
      
      // Missing uppercase
      expect(validate('testpassword123!').valid).toBe(false)
      expect(validate('testpassword123!').errors).toContain('Password must contain at least one uppercase letter')
      
      // Missing lowercase
      expect(validate('TESTPASSWORD123!').valid).toBe(false)
      expect(validate('TESTPASSWORD123!').errors).toContain('Password must contain at least one lowercase letter')
      
      // Missing number
      expect(validate('TestPassword!').valid).toBe(false)
      expect(validate('TestPassword!').errors).toContain('Password must contain at least one number')
      
      // Missing special character
      expect(validate('TestPassword123').valid).toBe(false)
      expect(validate('TestPassword123').errors).toContain('Password must contain at least one special character')
    })
  })

  describe('JWT Token Generation and Verification', () => {
    test('generateAccessToken should create valid JWT', async () => {
      const token = await (oidcDO as any).generateAccessToken(testUser)
      
      expect(token).toBeDefined()
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
      
      // Verify token contains expected payload
      const payload = await (oidcDO as any).verifyJWT(token)
      expect(payload.sub).toBe(testUser.id)
      expect(payload.email).toBe(testUser.email)
      expect(payload.groups).toEqual(testUser.groups)
      expect(payload.type).toBe('access_token')
    })

    test('generateRefreshToken should create valid JWT', async () => {
      const token = await (oidcDO as any).generateRefreshToken(testUser)
      
      expect(token).toBeDefined()
      expect(token.split('.')).toHaveLength(3)
      
      const payload = await (oidcDO as any).verifyJWT(token)
      expect(payload.sub).toBe(testUser.id)
      expect(payload.email).toBe(testUser.email)
      expect(payload.type).toBe('refresh_token')
    })

    test('verifyJWT should reject expired tokens', async () => {
      // Create token with very short expiry
      const shortLivedPayload = {
        sub: testUser.id,
        email: testUser.email,
        exp: Math.floor(Date.now() / 1000) - 1 // Already expired
      }
      
      const token = await (oidcDO as any).signJWT(shortLivedPayload)
      const payload = await (oidcDO as any).verifyJWT(token)
      
      expect(payload).toBeNull()
    })

    test('verifyJWT should reject malformed tokens', async () => {
      const invalidTokens = [
        'invalid.token',
        'invalid.token.format.extra',
        'notbase64.notbase64.notbase64',
        ''
      ]
      
      for (const token of invalidTokens) {
        const payload = await (oidcDO as any).verifyJWT(token)
        expect(payload).toBeNull()
      }
    })
  })

  describe('Rate Limiting', () => {
    test('checkRateLimit should allow initial attempts', () => {
      const result = (oidcDO as any).checkRateLimit('test-user', 5, 15)
      expect(result).toBe(true)
    })

    test('checkRateLimit should block after max attempts', () => {
      const identifier = 'test-user'
      
      // Use up all attempts
      for (let i = 0; i < 5; i++) {
        (oidcDO as any).checkRateLimit(identifier, 5, 15)
      }
      
      // Next attempt should be blocked
      const result = (oidcDO as any).checkRateLimit(identifier, 5, 15)
      expect(result).toBe(false)
    })

    test('checkRateLimit should reset after window expires', () => {
      const identifier = 'test-user'
      
      // Simulate expired window by manipulating rate limit data
      const rateLimits = (oidcDO as any).rateLimits
      rateLimits.set(identifier, {
        attempts: 10,
        first_attempt: Date.now() - (16 * 60 * 1000) // 16 minutes ago
      })
      
      // Should allow new attempt after window expiry
      const result = (oidcDO as any).checkRateLimit(identifier, 5, 15)
      expect(result).toBe(true)
    })
  })

  describe('Session Management', () => {
    test('createUserSession should create valid session', async () => {
      const session = await (oidcDO as any).createUserSession(testUser, 'test-agent', '127.0.0.1')
      
      expect(session.id).toBeDefined()
      expect(session.user_id).toBe(testUser.id)
      expect(session.user_email).toBe(testUser.email)
      expect(session.access_token).toBeDefined()
      expect(session.refresh_token).toBeDefined()
      expect(session.user_agent).toBe('test-agent')
      expect(session.ip_address).toBe('127.0.0.1')
      expect(session.created_at).toBeDefined()
      expect(session.expires_at).toBeGreaterThan(session.created_at)
    })

    test('validateUser should return user for valid credentials', async () => {
      const password = 'TestPassword123!'
      testUser.passwordHash = await (oidcDO as any).hashPassword(password)
      
      // Add user to storage
      ;(oidcDO as any).users.set(testUser.email, testUser)
      
      const result = await (oidcDO as any).validateUser(testUser.email, password)
      expect(result).toEqual(testUser)
    })

    test('validateUser should return null for invalid credentials', async () => {
      const password = 'TestPassword123!'
      const wrongPassword = 'WrongPassword123!'
      testUser.passwordHash = await (oidcDO as any).hashPassword(password)
      
      // Add user to storage
      ;(oidcDO as any).users.set(testUser.email, testUser)
      
      const result = await (oidcDO as any).validateUser(testUser.email, wrongPassword)
      expect(result).toBeNull()
    })

    test('validateUser should return null for inactive user', async () => {
      const password = 'TestPassword123!'
      testUser.passwordHash = await (oidcDO as any).hashPassword(password)
      testUser.status = 'inactive'
      
      // Add user to storage
      ;(oidcDO as any).users.set(testUser.email, testUser)
      
      const result = await (oidcDO as any).validateUser(testUser.email, password)
      expect(result).toBeNull()
    })
  })

  describe('Authentication Endpoints', () => {
    describe('handleLogin', () => {
      test('should return success for valid credentials', async () => {
        const password = 'TestPassword123!'
        testUser.passwordHash = await (oidcDO as any).hashPassword(password)
        
        // Add user to storage
        ;(oidcDO as any).users.set(testUser.email, testUser)
        
        const request = new Request('http://test.com/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CF-Connecting-IP': '127.0.0.1',
            'User-Agent': 'test-agent'
          },
          body: JSON.stringify({
            email: testUser.email,
            password: password
          })
        })
        
        const response = await oidcDO.fetch(request)
        expect(response.status).toBe(200)
        
        const responseData = await response.json() as AuthResponse
        expect(responseData.success).toBe(true)
        expect(responseData.access_token).toBeDefined()
        expect(responseData.refresh_token).toBeDefined()
        expect(responseData.user?.email).toBe(testUser.email)
      })

      test('should return error for invalid credentials', async () => {
        const password = 'TestPassword123!'
        testUser.passwordHash = await (oidcDO as any).hashPassword(password)
        
        // Add user to storage
        ;(oidcDO as any).users.set(testUser.email, testUser)
        
        const request = new Request('http://test.com/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CF-Connecting-IP': '127.0.0.1'
          },
          body: JSON.stringify({
            email: testUser.email,
            password: 'WrongPassword123!'
          })
        })
        
        const response = await oidcDO.fetch(request)
        expect(response.status).toBe(401)
        
        const responseData = await response.json()
        expect(responseData.success).toBe(false)
        expect(responseData.error).toBe('Invalid email or password')
      })

      test('should return error for missing fields', async () => {
        const request = new Request('http://test.com/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CF-Connecting-IP': '127.0.0.1'
          },
          body: JSON.stringify({
            email: testUser.email
            // missing password
          })
        })
        
        const response = await oidcDO.fetch(request)
        expect(response.status).toBe(400)
        
        const responseData = await response.json()
        expect(responseData.success).toBe(false)
        expect(responseData.error).toBe('Email and password are required')
      })

      test('should enforce rate limiting', async () => {
        const request = new Request('http://test.com/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CF-Connecting-IP': '127.0.0.1'
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
        })
        
        // Make multiple failed attempts
        for (let i = 0; i < 5; i++) {
          await oidcDO.fetch(request)
        }
        
        // Next attempt should be rate limited
        const response = await oidcDO.fetch(request)
        expect(response.status).toBe(429)
        
        const responseData = await response.json()
        expect(responseData.success).toBe(false)
        expect(responseData.error).toContain('Too many login attempts')
      })
    })

    describe('handleRegister', () => {
      test('should create new user with valid data', async () => {
        const request = new Request('http://test.com/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CF-Connecting-IP': '127.0.0.1'
          },
          body: JSON.stringify({
            email: 'newuser@example.com',
            password: 'TestPassword123!',
            name: 'New User'
          })
        })
        
        const response = await oidcDO.fetch(request)
        expect(response.status).toBe(201)
        
        const responseData = await response.json() as AuthResponse
        expect(responseData.success).toBe(true)
        expect(responseData.access_token).toBeDefined()
        expect(responseData.user?.email).toBe('newuser@example.com')
        
        // Verify user was stored
        const storedUser = (oidcDO as any).users.get('newuser@example.com')
        expect(storedUser).toBeDefined()
        expect(storedUser.groups).toContain('user')
      })

      test('should reject weak passwords', async () => {
        const request = new Request('http://test.com/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CF-Connecting-IP': '127.0.0.1'
          },
          body: JSON.stringify({
            email: 'newuser@example.com',
            password: 'weak',
            name: 'New User'
          })
        })
        
        const response = await oidcDO.fetch(request)
        expect(response.status).toBe(400)
        
        const responseData = await response.json()
        expect(responseData.success).toBe(false)
        expect(responseData.error).toBe('Password requirements not met')
        expect(responseData.details).toBeDefined()
      })

      test('should reject duplicate email', async () => {
        // Add existing user
        ;(oidcDO as any).users.set(testUser.email, testUser)
        
        const request = new Request('http://test.com/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CF-Connecting-IP': '127.0.0.1'
          },
          body: JSON.stringify({
            email: testUser.email,
            password: 'TestPassword123!',
            name: 'Duplicate User'
          })
        })
        
        const response = await oidcDO.fetch(request)
        expect(response.status).toBe(409)
        
        const responseData = await response.json()
        expect(responseData.success).toBe(false)
        expect(responseData.error).toBe('User already exists')
      })

      test('should reject invalid email format', async () => {
        const request = new Request('http://test.com/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CF-Connecting-IP': '127.0.0.1'
          },
          body: JSON.stringify({
            email: 'invalid-email',
            password: 'TestPassword123!',
            name: 'New User'
          })
        })
        
        const response = await oidcDO.fetch(request)
        expect(response.status).toBe(400)
        
        const responseData = await response.json()
        expect(responseData.success).toBe(false)
        expect(responseData.error).toBe('Invalid email format')
      })
    })

    describe('handleRefreshToken', () => {
      test('should generate new access token with valid refresh token', async () => {
        const password = 'TestPassword123!'
        testUser.passwordHash = await (oidcDO as any).hashPassword(password)
        
        // Add user to storage
        ;(oidcDO as any).users.set(testUser.email, testUser)
        
        // Create session
        const session = await (oidcDO as any).createUserSession(testUser)
        
        const request = new Request('http://test.com/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            refresh_token: session.refresh_token
          })
        })
        
        const response = await oidcDO.fetch(request)
        expect(response.status).toBe(200)
        
        const responseData = await response.json() as AuthResponse
        expect(responseData.success).toBe(true)
        expect(responseData.access_token).toBeDefined()
        expect(responseData.access_token).not.toBe(session.access_token) // Should be new token
      })

      test('should reject invalid refresh token', async () => {
        const request = new Request('http://test.com/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            refresh_token: 'invalid.token.here'
          })
        })
        
        const response = await oidcDO.fetch(request)
        expect(response.status).toBe(401)
        
        const responseData = await response.json()
        expect(responseData.success).toBe(false)
        expect(responseData.error).toBe('Invalid refresh token')
      })
    })

    describe('handleLogout', () => {
      test('should successfully logout with valid token', async () => {
        const password = 'TestPassword123!'
        testUser.passwordHash = await (oidcDO as any).hashPassword(password)
        
        // Add user and create session
        ;(oidcDO as any).users.set(testUser.email, testUser)
        const session = await (oidcDO as any).createUserSession(testUser)
        
        const request = new Request('http://test.com/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        const response = await oidcDO.fetch(request)
        expect(response.status).toBe(200)
        
        const responseData = await response.json()
        expect(responseData.success).toBe(true)
        expect(responseData.message).toBe('Logged out successfully')
        
        // Verify session was removed
        expect((oidcDO as any).sessions.has(session.id)).toBe(false)
      })

      test('should reject logout without authorization header', async () => {
        const request = new Request('http://test.com/auth/logout', {
          method: 'POST'
        })
        
        const response = await oidcDO.fetch(request)
        expect(response.status).toBe(401)
        
        const responseData = await response.json()
        expect(responseData.success).toBe(false)
        expect(responseData.error).toBe('Authorization header required')
      })
    })
  })

  describe('Password Reset Flow', () => {
    test('handleRequestPasswordReset should always return success', async () => {
      const request = new Request('http://test.com/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '127.0.0.1'
        },
        body: JSON.stringify({
          email: 'test@example.com'
        })
      })
      
      const response = await oidcDO.fetch(request)
      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.message).toContain('password reset link has been sent')
    })

    test('handleResetPassword should update password with valid token', async () => {
      const password = 'TestPassword123!'
      testUser.passwordHash = await (oidcDO as any).hashPassword(password)
      
      // Add user to storage
      ;(oidcDO as any).users.set(testUser.email, testUser)
      
      // Create reset token
      const resetToken = 'test-reset-token'
      const resetTokenData = {
        token: resetToken,
        user_email: testUser.email,
        created_at: Date.now(),
        expires_at: Date.now() + (3600 * 1000),
        used: false
      }
      ;(oidcDO as any).passwordResetTokens.set(resetToken, resetTokenData)
      
      const request = new Request(`http://test.com/auth/reset-password/${resetToken}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: 'NewPassword123!'
        })
      })
      
      const response = await oidcDO.fetch(request)
      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.message).toBe('Password reset successfully')
      
      // Verify password was changed
      const updatedUser = (oidcDO as any).users.get(testUser.email)
      const isNewPasswordValid = await verifyPassword('NewPassword123!', updatedUser.passwordHash)
      expect(isNewPasswordValid).toBe(true)
      
      // Verify token was marked as used
      const usedToken = (oidcDO as any).passwordResetTokens.get(resetToken)
      expect(usedToken.used).toBe(true)
    })

    test('handleResetPassword should reject expired token', async () => {
      const resetToken = 'expired-token'
      const resetTokenData = {
        token: resetToken,
        user_email: testUser.email,
        created_at: Date.now() - (7200 * 1000), // 2 hours ago
        expires_at: Date.now() - (3600 * 1000), // 1 hour ago (expired)
        used: false
      }
      ;(oidcDO as any).passwordResetTokens.set(resetToken, resetTokenData)
      
      const request = new Request(`http://test.com/auth/reset-password/${resetToken}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: 'NewPassword123!'
        })
      })
      
      const response = await oidcDO.fetch(request)
      expect(response.status).toBe(400)
      
      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Invalid or expired reset token')
    })
  })
})
