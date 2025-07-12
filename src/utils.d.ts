// Type definitions for utils.js
export interface ClientConfig {
  client_id: string
  client_secret_key: string
  redirect_uris: string[]
  cors_origins?: string[]
}

export interface CloudflareAccessPayload {
  aud: string[]
  iss: string
  exp: number
  iat: number
  nbf: number
  sub: string
  email: string
  country?: string
  user_uuid: string
}

export interface CloudflareAccessHeader {
  kid: string
  alg: string
  typ: string
}

export interface VerifyJwtResult {
  success: boolean
  header?: CloudflareAccessHeader
  payload?: CloudflareAccessPayload
  error?: string
}

export interface CloudflareAccessIdentity {
  user_uuid: string
  name: string
  email: string
  err?: any
}

// Re-export types from other modules
export * from './types'

// Function type declarations for utils.js
export declare function getClientConfig(clientId: string): ClientConfig | undefined
export declare function getClientSecret(clientSecretKey: string, env: any): string
export declare function dateInSecs(d: Date): number
export declare function getResponse(body: any, status?: number, headers?: Record<string, string>): Response
export declare function getCorsHeaders(origin: string | null, headers?: string[]): Record<string, string>
export declare function getAllowedOrigin(req: Request, clientId: string): string | null
export declare function verifyJwtSignature(jwsObject: string, jwk: any): Promise<boolean>
export declare function obj2encStr(object: any): string
export declare function str2ab(str: string): ArrayBuffer
export declare function getIssuer(req: Request): string
export declare function generateKeyPair(keyAlg: any): Promise<{ privateKey: CryptoKey; publicKey: any }>
export declare function getDoStub(env: any): any
export declare function verifyCloudflareAccessJwt(jwtToken: string, env: any): Promise<VerifyJwtResult>
export declare function getCloudflareAccessIdentity(access_token: string): Promise<CloudflareAccessIdentity>
export declare function getCloudflareAccessGroups(email: string, env: any): Promise<string[]>

// Key algorithm export
export declare const keyAlg: {
  name: string
  modulusLength: number
  publicExponent: Uint8Array
  hash: { name: string }
}
