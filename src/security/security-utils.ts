/**
 * Security utilities for password validation, rate limiting, and security helpers
 */

import { RateLimitInfo } from '../types'

// UUID generator for environments without crypto.randomUUID
export function generateUUID(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // Variant 10
  
  const hexBytes = Array.from(bytes, b => b.toString(16).padStart(2, '0'))
  return [
    hexBytes.slice(0, 4).join(''),
    hexBytes.slice(4, 6).join(''),
    hexBytes.slice(6, 8).join(''),
    hexBytes.slice(8, 10).join(''),
    hexBytes.slice(10, 16).join('')
  ].join('-')
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16))
  
  // Import password as key material
  const encoder = new TextEncoder()
  const passwordData = encoder.encode(password)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  
  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )
  
  // Combine salt and derived key
  const hashArray = new Uint8Array(salt.length + derivedBits.byteLength)
  hashArray.set(salt)
  hashArray.set(new Uint8Array(derivedBits), salt.length)
  
  // Convert to hex string
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Convert hex string back to bytes
    const hashBytes = new Uint8Array(hash.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
    
    // Extract salt (first 16 bytes) and stored hash
    const salt = hashBytes.slice(0, 16)
    const storedHash = hashBytes.slice(16)
    
    // Import password as key material
    const encoder = new TextEncoder()
    const passwordData = encoder.encode(password)
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    )
    
    // Derive key using same parameters
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    )
    
    const computedHash = new Uint8Array(derivedBits)
    
    // Compare hashes
    if (computedHash.length !== storedHash.length) return false
    
    let result = 0
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash[i] ^ storedHash[i]
    }
    
    return result === 0
  } catch (error) {
    return false
  }
}

export function checkRateLimit(
  rateLimits: Map<string, RateLimitInfo>,
  identifier: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): boolean {
  const now = Date.now()
  const windowMs = windowMinutes * 60 * 1000
  
  let rateLimit = rateLimits.get(identifier)
  
  if (!rateLimit) {
    // First attempt
    rateLimit = {
      attempts: 1,
      first_attempt: now
    }
    rateLimits.set(identifier, rateLimit)
    return true
  }
  
  // Check if window has expired
  if (now - rateLimit.first_attempt > windowMs) {
    // Reset window
    rateLimit = {
      attempts: 1,
      first_attempt: now
    }
    rateLimits.set(identifier, rateLimit)
    return true
  }
  
  // Check if locked
  if (rateLimit.locked_until && now < rateLimit.locked_until) {
    return false
  }
  
  // Increment attempts
  rateLimit.attempts++
  
  // Lock if too many attempts
  if (rateLimit.attempts > maxAttempts) {
    rateLimit.locked_until = now + (windowMs * 2) // Lock for double the window
    rateLimits.set(identifier, rateLimit)
    return false
  }
  
  rateLimits.set(identifier, rateLimit)
  return true
}

export function isValidGroupName(name: string): boolean {
  return /^[a-z0-9_-]+$/.test(name) && name.length >= 2 && name.length <= 50
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
