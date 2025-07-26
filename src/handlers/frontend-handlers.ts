import { getAllowedOrigin, getCorsHeaders } from '../utils'
import { Env } from '../types'
import { 
  getAdminLoginHTML, 
  getAdminDashboardHTML, 
  getAdminUsersHTML, 
  getAdminGroupsHTML, 
  getEnhancedUsersHTML,
  getEnhancedGroupsHTML,
  getEnhancedDemoHTML,
  getAdminCSS, 
  getAdminJS 
} from '../frontend/admin-templates'

export async function handleAdminRedirect(req: any, env: Env): Promise<Response> {
  return Response.redirect(new URL('/admin/login.html', req.url).toString(), 302)
}

export async function handleAdminFiles(req: any, env: Env): Promise<Response> {
  const url = new URL(req.url)
  const pathname = url.pathname
  
  // Remove /admin prefix
  const filePath = pathname.replace('/admin/', '')
  
  // Default to login.html for admin root
  const actualPath = filePath === '' ? 'login.html' : filePath
  
  return serveAdminFile(actualPath, req, env)
}

export async function handleSigninRedirect(req: any, env: Env): Promise<Response> {
  return Response.redirect(new URL('/signin/index.html', req.url).toString(), 302)
}

export async function handleSigninFiles(req: any, env: Env): Promise<Response> {
  const url = new URL(req.url)
  const pathname = url.pathname
  
  // Remove /signin prefix
  const filePath = pathname.replace('/signin/', '')
  
  // Default to index.html for signin root
  const actualPath = filePath === '' ? 'index.html' : filePath
  
  return serveSigninFile(actualPath, req, env)
}

async function serveAdminFile(filePath: string, req: any, env: Env): Promise<Response> {
  const corsHeaders = getCorsHeaders(getAllowedOrigin(req, '*'), [])
  
  // Enhanced admin HTML files
  if (filePath === 'login.html') {
    return new Response(getAdminLoginHTML(), {
      headers: { ...corsHeaders, 'content-type': 'text/html' }
    })
  }
  if (filePath === 'dashboard.html' || filePath === 'index.html' || filePath === '') {
    return new Response(getAdminDashboardHTML(), {
      headers: { ...corsHeaders, 'content-type': 'text/html' }
    })
  }
  if (filePath === 'users.html' || filePath === 'users-enhanced.html') {
    return new Response(getEnhancedUsersHTML(), {
      headers: { ...corsHeaders, 'content-type': 'text/html' }
    })
  }
  if (filePath === 'groups.html' || filePath === 'groups-enhanced.html') {
    return new Response(getEnhancedGroupsHTML(), {
      headers: { ...corsHeaders, 'content-type': 'text/html' }
    })
  }
  if (filePath === 'demo.html') {
    return new Response(getEnhancedDemoHTML(), {
      headers: { ...corsHeaders, 'content-type': 'text/html' }
    })
  }
  // CSS
  if (filePath.endsWith('.css')) {
    return new Response(getAdminCSS(), {
      headers: { ...corsHeaders, 'content-type': 'text/css' }
    })
  }
  // JS
  if (filePath.endsWith('.js')) {
    return new Response(getAdminJS(filePath), {
      headers: { ...corsHeaders, 'content-type': 'application/javascript' }
    })
  }
  // Components and other files
  if (filePath.startsWith('components/')) {
    // Return empty HTML for component requests since they're inline in enhanced pages
    return new Response('<!-- Component served inline -->', {
      headers: { ...corsHeaders, 'content-type': 'text/html' }
    })
  }
  
  return new Response(`Admin file not found: ${filePath}`, {
    status: 404,
    headers: { ...corsHeaders, 'content-type': 'text/plain' }
  })
}

async function serveSigninFile(filePath: string, req: any, env: Env): Promise<Response> {
  // This is a placeholder - in a real deployment, you would serve from a bundle
  const corsHeaders = getCorsHeaders(getAllowedOrigin(req, '*'), [])
  
  return new Response(`Signin file: ${filePath}`, {
    headers: { ...corsHeaders, 'content-type': 'text/plain' }
  })
}
