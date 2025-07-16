import { getAllowedOrigin, getCorsHeaders, getDoStub } from '../utils'
import { Env } from '../types'

export async function handleAdminRequest(req: any, env: Env): Promise<Response> {
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
