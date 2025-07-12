/**
 * Authentication Integration Tests
 * Tests for authentication endpoints with the main worker
 */

import './setup'

// Mock config.yml first
jest.mock('../config.yml', () => ({
  default: {
    jwt_ttl: 600,
    access_token_ttl: 1800,
    refresh_token_ttl: 604800,
    clients: []
  }
}), { virtual: true })

import { getAllowedOrigin, getCorsHeaders, getDoStub } from '../src/utils'
import { handleAuth, handleOptions } from '../src/main'

// Mock the utils module
jest.mock('../src/utils', () => ({
  getAllowedOrigin: jest.fn(() => '*'),
  getCorsHeaders: jest.fn((origin: string, allowedHeaders?: string[]) => ({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': allowedHeaders?.join(', ') || 'content-type',
    'Access-Control-Max-Age': '86400'
  })),
  getDoStub: jest.fn(() => ({
    fetch: jest.fn()
  })),
  getResponse: jest.fn((data: any, status?: number, headers?: any) => {
    return new Response(typeof data === 'string' ? data : JSON.stringify(data), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json', ...headers }
    })
  })
}))

describe('Authentication Endpoints Integration Tests', () => {
  let mockEnv: any

  beforeEach(() => {
    // Create a mock environment
    mockEnv = {
      OIDC_DO: {
        get: jest.fn().mockReturnValue({
          fetch: jest.fn()
        })
      }
    }

    // Reset mocks
    jest.clearAllMocks()
  })

  describe('handleAuth function', () => {
    it('should handle POST requests with CORS headers', async () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost:8787/auth/login',
        headers: new Headers({
          'Content-Type': 'application/json',
          'Origin': 'https://example.com'
        }),
        text: jest.fn().mockResolvedValue(JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }))
      }

      const mockStubResponse = new Response(JSON.stringify({
        success: true,
        access_token: 'mock-token',
        user: { email: 'test@example.com' }
      }), { status: 200 })

      const mockStub = (getDoStub as jest.Mock)()
      mockStub.fetch.mockResolvedValue(mockStubResponse)

      const response = await handleAuth(mockRequest, mockEnv)

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Content-Type')).toBe('application/json')
      
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.access_token).toBe('mock-token')
    })

    it('should handle OPTIONS requests for CORS preflight', async () => {
      const mockRequest = {
        method: 'OPTIONS',
        url: 'http://localhost:8787/auth/login',
        headers: new Headers({
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST'
        })
      }

      const response = await handleAuth(mockRequest, mockEnv)

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    })

    it('should handle errors gracefully', async () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost:8787/auth/login',
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        text: jest.fn().mockResolvedValue('{"email": "test@example.com"}')
      }

      const mockStub = (getDoStub as jest.Mock)()
      mockStub.fetch.mockRejectedValue(new Error('Network error'))

      const response = await handleAuth(mockRequest, mockEnv)

      expect(response.status).toBe(500)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      
      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Internal server error')
    })
  })

  describe('handleOptions function', () => {
    it('should return correct CORS headers for auth endpoints', async () => {
      const mockRequest = {
        url: 'http://localhost:8787/auth/login',
        headers: new Headers({
          'Origin': 'https://example.com'
        })
      }

      const response = await handleOptions(mockRequest, mockEnv)

      expect(response.status).toBe(200)
      expect(getCorsHeaders).toHaveBeenCalledWith('*', ['authorization', 'content-type'])
    })

    it('should return correct CORS headers for user endpoints', async () => {
      const mockRequest = {
        url: 'http://localhost:8787/users',
        headers: new Headers({
          'Origin': 'https://example.com'
        })
      }

      const response = await handleOptions(mockRequest, mockEnv)

      expect(response.status).toBe(200)
      expect(getCorsHeaders).toHaveBeenCalledWith('*', ['authorization', 'content-type'])
    })

    it('should return correct CORS headers for userinfo endpoint', async () => {
      const mockRequest = {
        url: 'http://localhost:8787/userinfo',
        headers: new Headers({
          'Origin': 'https://example.com'
        })
      }

      const response = await handleOptions(mockRequest, mockEnv)

      expect(response.status).toBe(200)
      expect(getCorsHeaders).toHaveBeenCalledWith('*', ['authorization'])
    })
  })

  describe('Route handling', () => {
    it('should proxy authentication requests correctly', async () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost:8787/auth/register',
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        text: jest.fn().mockResolvedValue(JSON.stringify({
          email: 'newuser@example.com',
          password: 'StrongPassword123!',
          name: 'New User'
        }))
      }

      const mockStubResponse = new Response(JSON.stringify({
        success: true,
        access_token: 'new-user-token',
        user: { email: 'newuser@example.com', name: 'New User' }
      }), { status: 201 })

      const mockStub = (getDoStub as jest.Mock)()
      mockStub.fetch.mockResolvedValue(mockStubResponse)

      const response = await handleAuth(mockRequest, mockEnv)

      expect(response.status).toBe(201)
      expect(mockStub.fetch).toHaveBeenCalledWith(
        expect.any(Request)
      )
      
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.access_token).toBe('new-user-token')
    })
  })
})

describe('Request Forwarding Tests', () => {
  let mockEnv: any

  beforeEach(() => {
    mockEnv = {
      OIDC_DO: {
        get: jest.fn().mockReturnValue({
          fetch: jest.fn()
        })
      }
    }
    jest.clearAllMocks()
  })

  it('should preserve request method and headers when forwarding', async () => {
    const mockRequest = {
      method: 'PUT',
      url: 'http://localhost:8787/auth/reset-password/token123',
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }),
      text: jest.fn().mockResolvedValue(JSON.stringify({
        password: 'NewPassword123!'
      }))
    }

    const mockStubResponse = new Response(JSON.stringify({
      success: true,
      message: 'Password reset successfully'
    }), { status: 200 })

    const mockStub = (getDoStub as jest.Mock)()
    mockStub.fetch.mockResolvedValue(mockStubResponse)

    const response = await handleAuth(mockRequest, mockEnv)

    expect(response.status).toBe(200)
    expect(mockStub.fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PUT',
        headers: expect.any(Headers)
      })
    )
    
    const responseData = await response.json()
    expect(responseData.success).toBe(true)
    expect(responseData.message).toBe('Password reset successfully')
  })
})
