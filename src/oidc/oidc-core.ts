/**
 * OIDC Core service for OpenID Connect protocol operations
 */

import { ExchangeCode, Jwk } from '../types'
import { JWTService } from './jwt-service'
import { generateUUID } from '../security/security-utils'
import { getResponse } from '../utils'

export class OIDCCoreService {
  private codes: Map<string, ExchangeCode>
  private jwks: Map<string, Jwk>
  private jwtService: JWTService

  constructor(
    codes: Map<string, ExchangeCode>,
    jwks: Map<string, Jwk>,
    jwtService: JWTService
  ) {
    this.codes = codes
    this.jwks = jwks
    this.jwtService = jwtService
  }

  async signToken(payload: any, generateExchangeCode: boolean = false, accessToken?: string): Promise<{ id_token: string; code?: string }> {
    const result = await this.jwtService.generateOIDCToken(payload, generateExchangeCode)
    
    if (result.code) {
      this.codes.set(result.code, {
        id_token: result.id_token,
        access_token: accessToken || '',
        expires_at: payload.exp, // access_token is original Cloudflare Access JWT, so pass the original exp
      })
    }

    return result
  }

  getExchangeCode(code: string): ExchangeCode | undefined {
    return this.codes.get(code)
  }

  getJWKS(): any[] {
    return this.jwtService.getJWKS()
  }

  cleanupExpiredKeys(): void {
    this.jwtService.cleanupExpiredKeys()
  }

  // Request handlers
  async handleExchangeCode(req: any): Promise<Response> {
    const { code } = req.params
    const exchange = this.codes.get(code)
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
}
