import { getAllowedOrigin, getCorsHeaders, getResponse } from '../utils'
import { Env } from '../types'

export async function handleOptions(req: any, env: Env): Promise<Response> {
  const allowedHeaders = [
    'authorization',
    'content-type',
    'x-forwarded-for',
    'cf-connecting-ip',
    'user-agent',
  ]
  
  const corsHeaders = getCorsHeaders(
    getAllowedOrigin(req, '*'),
    allowedHeaders,
  )
  
  return getResponse(null, 200, corsHeaders)
}
