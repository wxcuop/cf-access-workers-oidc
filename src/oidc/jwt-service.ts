/**
 * JWT service for token signing and verification
 */

import { base64url } from 'rfc4648'
import { dateInSecs, generateKeyPair, obj2encStr, str2ab } from '../utils'
import { generateUUID } from '../security/security-utils'
import { PrivateKey, Jwk, User } from '../types'

export const keyAlg = {
  name: 'RSASSA-PKCS1-v1_5',
  modulusLength: 2048,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: { name: 'SHA-256' },
}

export class JWTService {
  private privateKey?: PrivateKey
  private jwks: Map<string, Jwk>
  private storage: DurableObjectStorage
  private jwtTtl: number
  private accessTokenTtl: number
  private refreshTokenTtl: number

  constructor(
    storage: DurableObjectStorage,
    jwks: Map<string, Jwk>,
    jwtTtl: number,
    accessTokenTtl: number,
    refreshTokenTtl: number
  ) {
    this.storage = storage
    this.jwks = jwks
    this.jwtTtl = jwtTtl
    this.accessTokenTtl = accessTokenTtl
    this.refreshTokenTtl = refreshTokenTtl
  }

  setPrivateKey(privateKey: PrivateKey) {
    this.privateKey = privateKey
  }

  async signJWT(payload: any): Promise<string> {
    // Generate new private key if there is none
    if (!this.privateKey) {
      const { privateKey, publicKey } = await generateKeyPair(keyAlg)
      const kid = generateUUID()

      this.privateKey = {
        id: kid,
        key: privateKey,
      }

      const newJwk: Jwk = {
        last_signature: payload.iat,
        key: {
          kid: kid,
          use: 'sig',
          kty: 'RSA',
          alg: 'RS256',
          // @ts-ignore - Web Crypto API types
          n: base64url.stringify((publicKey as any).n, { pad: false }),
          // @ts-ignore - Web Crypto API types
          e: base64url.stringify((publicKey as any).e, { pad: false }),
        },
      }

      this.jwks.set(kid, newJwk)
      await this.storage.put(kid, newJwk)
    }

    // Sign the JWT
    const encodedMessage = base64url.stringify(
      new Uint8Array(str2ab(
        JSON.stringify({
          alg: 'RS256',
          typ: 'JWT',
          kid: this.privateKey.id,
        })
      )),
      { pad: false }
    ) + '.' + base64url.stringify(new Uint8Array(str2ab(JSON.stringify(payload))), { pad: false })

    const encodedMessageArrBuf = str2ab(encodedMessage)
    const signatureArrBuf = await crypto.subtle.sign(
      {
        name: keyAlg.name,
        hash: keyAlg.hash,
      },
      this.privateKey.key,
      encodedMessageArrBuf,
    )

    const signatureUint8Array = new Uint8Array(signatureArrBuf)
    const encodedSignature = base64url.stringify(signatureUint8Array, {
      pad: false,
    })

    return `${encodedMessage}.${encodedSignature}`
  }

  async verifyJWT(token: string): Promise<any> {
    try {
      const [header, payload, signature] = token.split('.')
      
      if (!header || !payload || !signature) {
        throw new Error('Invalid JWT format')
      }

      // Decode header and payload
      const decodedHeader = JSON.parse(new TextDecoder().decode(base64url.parse(header)))
      const decodedPayload = JSON.parse(new TextDecoder().decode(base64url.parse(payload)))

      // Check expiration
      const now = dateInSecs(new Date())
      if (decodedPayload.exp && decodedPayload.exp < now) {
        throw new Error('Token expired')
      }

      // For now, return payload if not expired
      // TODO: Implement proper signature verification
      return decodedPayload
    } catch (error) {
      return null
    }
  }

  async generateAccessToken(user: User): Promise<string> {
    const timestamp = dateInSecs(new Date())
    const payload = {
      iss: 'https://your-oidc-provider.workers.dev', // TODO: Make configurable
      sub: user.id,
      email: user.email,
      name: user.name,
      groups: user.groups,
      iat: timestamp,
      exp: timestamp + Math.floor(this.accessTokenTtl),
      type: 'access_token'
    }

    return this.signJWT(payload)
  }

  async generateRefreshToken(user: User): Promise<string> {
    const timestamp = dateInSecs(new Date())
    const payload = {
      iss: 'https://your-oidc-provider.workers.dev', // TODO: Make configurable
      sub: user.id,
      email: user.email,
      iat: timestamp,
      exp: timestamp + Math.floor(this.refreshTokenTtl),
      type: 'refresh_token'
    }

    return this.signJWT(payload)
  }

  async generateOIDCToken(payload: any, generateExchangeCode: boolean = false): Promise<{ id_token: string; code?: string }> {
    const timestamp = dateInSecs(new Date())
    const newPayload = {
      ...payload,
      iat: timestamp,
      nbf: timestamp,
      exp: timestamp + this.jwtTtl,
    }

    // Generate new private key if there is none
    if (!this.privateKey) {
      const { privateKey, publicKey } = await generateKeyPair(keyAlg)
      const kid = generateUUID()

      this.privateKey = {
        id: kid,
        key: privateKey,
      }

      const newJwk: Jwk = {
        last_signature: timestamp,
        key: {
          kid,
          use: 'sig',
          kty: publicKey.kty,
          alg: publicKey.alg,
          n: publicKey.n,
          e: publicKey.e,
        },
      }

      await this.storage.put(kid, newJwk)
      this.jwks.set(kid, newJwk)
    } else {
      // otherwise just add last_signature metadata to the public key
      const jwk = this.jwks.get(this.privateKey.id)
      if (jwk) {
        jwk.last_signature = timestamp
        await this.storage.put(this.privateKey.id, jwk)
      }
    }

    // Construct and sign new JWT token
    const header = { alg: 'RS256', typ: 'JWT', kid: this.privateKey.id }
    const encodedMessage = `${obj2encStr(header)}.${obj2encStr(newPayload)}`
    const encodedMessageArrBuf = str2ab(encodedMessage)

    const signatureArrBuf = await crypto.subtle.sign(
      {
        name: keyAlg.name,
        hash: keyAlg.hash,
      },
      this.privateKey.key,
      encodedMessageArrBuf,
    )

    const signatureUint8Array = new Uint8Array(signatureArrBuf)
    const encodedSignature = base64url.stringify(signatureUint8Array, {
      pad: false,
    })
    const id_token = `${encodedMessage}.${encodedSignature}`

    let code
    if (generateExchangeCode) {
      code = generateUUID()
    }

    return { id_token, code }
  }

  getJWKS(): any[] {
    return Array.from(this.jwks, ([kid, jwk]) => jwk.key)
  }

  cleanupExpiredKeys(): void {
    this.jwks.forEach((jwk: Jwk, kid: string) => {
      if (
        this.privateKey?.id !== kid &&
        jwk.last_signature + this.jwtTtl < dateInSecs(new Date())
      ) {
        this.jwks.delete(kid)
        this.storage.delete(kid)
      }
    })
  }
}
