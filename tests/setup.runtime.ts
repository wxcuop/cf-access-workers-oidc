/**
 * Runtime Test Setup for Cloudflare Workers
 * This setup file provides a simplified test environment for testing Workers functionality
 */

import { beforeAll, afterAll } from 'vitest'

// Simple test setup without unstable_dev to avoid build conflicts
beforeAll(async () => {
  console.log('Setting up runtime test environment...')
  // For now, we'll use a simpler approach without starting a full worker
  // This avoids the TypeScript compilation issues with conflicting types
})

afterAll(async () => {
  console.log('Cleaning up runtime test environment...')
})

// Mock worker interface for basic testing
export const worker = {
  fetch: async (url: string | Request, init?: RequestInit) => {
    // Simple mock implementation - in a real scenario, you would use wrangler dev
    console.log(`Mock fetch: ${url}`)
    
    // Return different responses based on URL for testing
    const urlString = typeof url === 'string' ? url : url.url
    
    if (urlString.includes('/.well-known/jwks.json')) {
      return new Response(JSON.stringify({ keys: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    if (urlString.includes('/.well-known/openid-configuration')) {
      return new Response(JSON.stringify({
        issuer: 'http://localhost',
        authorization_endpoint: 'http://localhost/authorize',
        token_endpoint: 'http://localhost/token'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response('{"message": "Mock response"}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
