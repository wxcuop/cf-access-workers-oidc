import { Router, Request as IttyRequest } from 'itty-router'
import {
  getAllowedOrigin,
  getClientConfig,
  getClientSecret,
  getCloudflareAccessGroups,
  getCloudflareAccessIdentity,
  getCorsHeaders,
  getDoStub,
  getIssuer,
  getResponse,
  verifyCloudflareAccessJwt,
} from './utils'
import { Env, ScheduledController, ExecutionContext } from './types'
export { OpenIDConnectDurableObject } from './oidc-do'

const router = Router()
router.get('/.well-known/openid-configuration', (req, env) =>
  handleOIDConfig(req, env),
)
router.get('/.well-known/jwks.json', (req, env) => handleGetJwks(req, env))
router.get('/authorize', (req, env) => handleAuthorize(req, env))
router.post('/token', (req, env) => handleToken(req, env))
router.get('/userinfo', (req, env) => handleUserInfo(req, env))
router.post('/userinfo', (req, env) => handleUserInfo(req, env))

// Authentication endpoints
router.post('/auth/login', (req, env) => handleAuth(req, env))
router.post('/auth/register', (req, env) => handleAuth(req, env))
router.post('/auth/logout', (req, env) => handleAuth(req, env))
router.post('/auth/reset-password', (req, env) => handleAuth(req, env))
router.put('/auth/reset-password/:token', (req, env) => handleAuth(req, env))

// User and group management endpoints
router.get('/users', (req, env) => handleAuth(req, env))
router.post('/users', (req, env) => handleAuth(req, env))
router.get('/users/:id', (req, env) => handleAuth(req, env))
router.put('/users/:id', (req, env) => handleAuth(req, env))
router.delete('/users/:id', (req, env) => handleAuth(req, env))
router.get('/groups', (req, env) => handleAuth(req, env))
router.post('/groups', (req, env) => handleAuth(req, env))
router.get('/groups/:name', (req, env) => handleAuth(req, env))
router.put('/groups/:name', (req, env) => handleAuth(req, env))
router.delete('/groups/:name', (req, env) => handleAuth(req, env))
router.post('/groups/:name/members', (req, env) => handleAuth(req, env))
router.delete('/groups/:name/members/:email', (req, env) => handleAuth(req, env))

router.options('*', (req, env) => handleOptions(req, env))
router.all('*', (req, env) => getResponse({ err: 'Bad request' }, 400))

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(request, env)
    } catch (e) {
      return new Response((e as Error).message)
    }
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const stub = getDoStub(env)

    ctx.waitUntil(
      stub.fetch('/jwks', {
        method: 'PATCH',
      }),
    )
  },
}

async function handleRequest(req: any, env: Env): Promise<Response> {
  return router.handle(req, env)
}

async function handleAuth(req: any, env: Env): Promise<Response> {
  const corsHeaders = getCorsHeaders(getAllowedOrigin(req, '*'), [
    'authorization',
    'content-type',
  ])

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const stub = getDoStub(env)

    // Create a new request with the same URL and method
    const url = new URL(req.url)
    const body = req.method !== 'GET' ? await req.text() : undefined
    const newRequest = new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: body,
    })

    // Forward the request to the Durable Object
    const response = await stub.fetch(newRequest)

    // Get the response data
    const responseData = await response.text()

    // Return response with CORS headers
    return new Response(responseData, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
}

async function handleOIDConfig(req: any, env: Env): Promise<Response> {
  const corsHeaders = getCorsHeaders(getAllowedOrigin(req, '*'))
  const issuer = getIssuer(req)

  return getResponse(
    {
      issuer: `${issuer}`,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      userinfo_endpoint: `${issuer}/userinfo`,
      jwks_uri: `${issuer}/.well-known/jwks.json`,
      response_types_supported: ['id_token', 'code', 'code id_token'],
      id_token_signing_alg_values_supported: ['RS256'],
      token_endpoint_auth_methods_supported: [
        'client_secret_post',
        //"client_secret_basic"
      ],
      claims_supported: [
        'aud',
        'email',
        'exp',
        'iat',
        'nbf',
        'iss',
        'name',
        'sub',
        'country',
      ],
      grant_types_supported: ['authorization_code'],
    },
    200,
    corsHeaders,
  )
}

async function handleUserInfo(req: any, env: Env): Promise<Response> {
  const authorization = req.headers.get('Authorization')
  const corsHeaders = getCorsHeaders(getAllowedOrigin(req, '*'), [
    'authorization',
  ])

  if (!authorization || !authorization.startsWith('Bearer '))
    return getResponse({ err: 'Missing Bearer token' }, 400, corsHeaders)
  const access_token = authorization.substring(7, authorization.length)

  const identity = await getCloudflareAccessIdentity(access_token)

  if (identity.err) {
    return getResponse(identity.err, 401, corsHeaders)
  }

  const userinfo = {
    sub: identity.user_uuid,
    name: identity.name,
    email: identity.email,
  }

  return getResponse(userinfo, 200, corsHeaders)
}

async function handleToken(req: any, env: Env): Promise<Response> {
  const body = await req.text()
  let data

  switch (req.headers.get('content-type')) {
    case 'application/json':
      data = JSON.parse(body)
      break
    case 'application/x-www-form-urlencoded':
      data = Object.fromEntries(new URLSearchParams(body))
      break
    default:
      data = Object.fromEntries(new URLSearchParams(body))
  }

  const { grant_type, client_id, client_secret, redirect_uri, code } = data
  const corsHeaders = getCorsHeaders(getAllowedOrigin(req, client_id))
  const clientConfig = getClientConfig(client_id)

  // Authorization request validation
  if (!client_id || !code || !grant_type)
    return getResponse({ err: 'Missing client_id or code or grant_type' }, 400)
  if (!clientConfig)
    return getResponse(
      { err: 'Client configuration not found' },
      404,
      corsHeaders,
    )
  if (!clientConfig?.redirect_uris.includes(redirect_uri))
    return getResponse(
      { err: 'Redirect URIs does not match' },
      400,
      corsHeaders,
    )
  if (
    !client_secret ||
    client_secret !== getClientSecret(clientConfig.client_secret_key, env)
  )
    return getResponse({ err: 'Wrong client_secret' }, 400, corsHeaders)

  // Exchange code for id_token and access code
  const stub = getDoStub(env)
  const res = await stub.fetch(`/exchange/${code}`)
  return getResponse(await res.text(), res.status, corsHeaders)
}

async function handleAuthorize(req: any, env: Env): Promise<Response> {
  const access_jwt = req.headers.get('cf-access-jwt-assertion')
  const {
    client_id,
    redirect_uri,
    response_type,
    state,
    nonce,
    justGiveJwt,
  } = req.query
  const clientConfig = getClientConfig(client_id)

  // Authorization request validation
  if (!client_id || !response_type)
    return getResponse(
      { err: 'Missing client_id or response_type or scope' },
      400,
    )
  if (!clientConfig)
    return getResponse({ err: 'Client configuration not found' }, 404)
  if (!clientConfig?.redirect_uris.includes(redirect_uri))
    return getResponse({ err: 'Redirect URIs does not match' }, 400)

  // Validate Cloudflare Access JWT token and return decoded data
  const result = await verifyCloudflareAccessJwt(access_jwt, env)
  if (!result.success) {
    return getResponse({ error: result.error }, 400)
  }

  // Get issuer
  const issuer = getIssuer(req)
  // Fetch Cloudflare API and get Cloudflare Access Groups for user email
  const groups = await getCloudflareAccessGroups(result.payload?.email || '', env)
  // Fetch Cloudflare Identity
  const identity = await getCloudflareAccessIdentity(access_jwt)
  // Construct new JWT payload
  const payload = {
    iss: issuer,
    aud: client_id,
    azp: client_id,
    name: identity.name,
    email: result.payload?.email || '',
    sub: result.payload?.sub || '',
    country: result.payload?.country || '',
    groups,
    nonce,
  }

  // Pass the payload to Durable Object and get signed JWT token back
  // Also generate exchange code in case of 'code' OIDC authorization flow
  const stub = getDoStub(env)
  const idTokenRes = await stub.fetch('/sign', {
    method: 'POST',
    body: JSON.stringify({
      payload,
      access_jwt,
      generate_exchange_code: response_type.includes('code'),
    }),
  })
  const { id_token, code } = await idTokenRes.json()

  // Prepare the redirect query
  const redirectSearchParams = new URLSearchParams()
  if (response_type.includes('code')) redirectSearchParams.set('code', code)
  if (response_type.includes('id_token'))
    redirectSearchParams.set('id_token', id_token)
  if (state) redirectSearchParams.set('state', state)
  if (nonce) redirectSearchParams.set('nonce', nonce)

  if (justGiveJwt) {
    return getResponse({ id_token })
  }

  // Redirect user back to the OIDC client
  return Response.redirect(`${redirect_uri}?${redirectSearchParams.toString()}`)
}

// Get current public keys from Durable Object for JWT validation
async function handleGetJwks(req: any, env: Env): Promise<Response> {
  const corsHeaders = getCorsHeaders(getAllowedOrigin(req, '*'))
  const stub = getDoStub(env)
  const jwksRes = await stub.fetch('/jwks')

  return getResponse(await jwksRes.text(), 200, corsHeaders)
}

async function handleOptions(req: any, env: Env): Promise<Response> {
  const { pathname } = new URL(req.url)
  
  // Determine which headers to allow based on the endpoint
  let allowedHeaders: string[] = []
  
  if (pathname === '/userinfo') {
    allowedHeaders = ['authorization']
  } else if (pathname.startsWith('/auth/') || pathname.startsWith('/users') || pathname.startsWith('/groups')) {
    allowedHeaders = ['authorization', 'content-type']
  }
  
  const corsHeaders = getCorsHeaders(
    getAllowedOrigin(req, '*'),
    allowedHeaders,
  )
  
  return getResponse(null, 200, corsHeaders)
}

// Export functions for testing
export { handleAuth, handleOptions }
