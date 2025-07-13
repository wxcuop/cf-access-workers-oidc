/**
 * OIDC Core service for OpenID Connect protocol operations
 * Refactored to use SQLite storage backend for Durable Objects
 */

import { ExchangeCode, Jwk } from '../types'
import { JWTService } from './jwt-service'
import { generateUUID } from '../security/security-utils'
import { getResponse } from '../utils'

// TypeScript interfaces for SQL results
interface ExchangeCodeRow extends Record<string, SqlStorageValue> {
  code: string;
  id_token: string;
  access_token: string;
  expires_at: number;
  created_at: number;
}

export class OIDCCoreService {
  private sql: SqlStorage
  private jwtService: JWTService

  constructor(sql: SqlStorage, jwtService: JWTService) {
    this.sql = sql
    this.jwtService = jwtService
    
    // Initialize SQLite tables
    this.initializeTables()
  }

  private initializeTables(): void {
    // Create exchange_codes table for OAuth2 authorization codes
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS exchange_codes (
        code TEXT PRIMARY KEY,
        id_token TEXT NOT NULL,
        access_token TEXT NOT NULL DEFAULT '',
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `)

    // Create indexes for better performance
    this.sql.exec(`
      CREATE INDEX IF NOT EXISTS idx_exchange_codes_expires 
      ON exchange_codes(expires_at)
    `)

    // Clean up any expired codes on initialization
    this.cleanupExpiredCodes()
  }

  private cleanupExpiredCodes(): void {
    // Remove expired exchange codes
    this.sql.exec(`
      DELETE FROM exchange_codes 
      WHERE expires_at <= unixepoch()
    `)
  }

  async signToken(payload: any, generateExchangeCode: boolean = false, accessToken?: string): Promise<{ id_token: string; code?: string }> {
    const result = await this.jwtService.generateOIDCToken(payload, generateExchangeCode)
    
    if (result.code) {
      // Store exchange code in SQLite
      this.sql.exec(`
        INSERT OR REPLACE INTO exchange_codes (code, id_token, access_token, expires_at)
        VALUES (?, ?, ?, ?)
      `, result.code, result.id_token, accessToken || '', payload.exp)
    }

    return result
  }

  getExchangeCode(code: string): ExchangeCode | undefined {
    // Query SQLite for the exchange code
    const cursor = this.sql.exec<ExchangeCodeRow>(`
      SELECT code, id_token, access_token, expires_at, created_at
      FROM exchange_codes 
      WHERE code = ? AND expires_at > unixepoch()
    `, code)

    const result = cursor.toArray()[0]
    if (!result) {
      return undefined
    }

    return {
      id_token: result.id_token,
      access_token: result.access_token,
      expires_at: result.expires_at
    }
  }

  getJWKS(): any[] {
    return this.jwtService.getJWKS()
  }

  cleanupExpiredKeys(): void {
    this.jwtService.cleanupExpiredKeys()
    this.cleanupExpiredCodes()
  }

  // Request handlers
  async handleExchangeCode(req: any): Promise<Response> {
    const { code } = req.params
    const exchange = this.getExchangeCode(code)
    return getResponse(exchange, exchange ? 200 : 404)
  }

  async handleSign(req: any): Promise<Response> {
    const {
      payload,
      generate_exchange_code: generateExchangeCode,
      access_jwt: access_token,
    } = await req.json()

    const result = await this.signToken(payload, generateExchangeCode, access_token)

    return getResponse(result)
  }

  handleGetJwks(req: any): Response {
    const keys = this.getJWKS()
    return getResponse({ keys })
  }

  handleCleanupJwks(req: any): Response {
    this.cleanupExpiredKeys()
    return getResponse('ok')
  }

  // Additional SQLite-specific methods
  getAllExchangeCodes(): ExchangeCode[] {
    const cursor = this.sql.exec<ExchangeCodeRow>(`
      SELECT code, id_token, access_token, expires_at, created_at
      FROM exchange_codes 
      WHERE expires_at > unixepoch()
      ORDER BY created_at DESC
    `)

    return cursor.toArray().map(row => ({
      id_token: row.id_token,
      access_token: row.access_token,
      expires_at: row.expires_at
    }))
  }

  getExchangeCodeStats(): { total: number; expired: number } {
    const totalCursor = this.sql.exec(`SELECT COUNT(*) as count FROM exchange_codes`)
    const expiredCursor = this.sql.exec(`SELECT COUNT(*) as count FROM exchange_codes WHERE expires_at <= unixepoch()`)
    
    const totalResult = totalCursor.toArray()[0] as any
    const expiredResult = expiredCursor.toArray()[0] as any
    
    return {
      total: totalResult?.count || 0,
      expired: expiredResult?.count || 0
    }
  }
}
