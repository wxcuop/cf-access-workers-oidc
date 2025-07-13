# Configuration Guide for Frontend-Backend Integration

## Overview

This guide helps you configure the frontend sign-in page to work with your deployed backend worker.

## Frontend Configuration Updates

### 1. Update API Configuration

Edit `frontend/signin/js/auth.js` and update the configuration object:

```javascript
config: {
    // Replace with your actual worker URL (found in Wrangler or Cloudflare dashboard)
    apiBase: 'https://your-worker-name.your-subdomain.workers.dev',
    
    // For local development, keep this pointing to your local worker
    localApiBase: 'http://localhost:8787',
    
    // Auto-detection logic remains the same
    get apiUrl() {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? this.localApiBase 
            : this.apiBase;
    },
    
    // Update OIDC configuration
    oidc: {
        clientId: 'your-client-id', // Configure this in your worker
        redirectUri: window.location.origin + '/oidc/callback',
        scope: 'openid profile email groups',
        responseType: 'code',
        state: null,
        codeChallenge: null,
        codeChallengeMethod: 'S256'
    }
}
```

### 2. Update Worker Configuration

In your backend worker, update the CORS and OIDC configuration to allow your frontend domain:

```typescript
// In your worker code (src/oidc-do.ts or main.ts)

// Update CORS configuration
const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://your-pages-project.pages.dev',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
};

// For development, you might want to allow localhost
if (request.headers.get('Origin')?.includes('localhost')) {
    corsHeaders['Access-Control-Allow-Origin'] = 'http://localhost:8080';
}
```

### 3. OIDC Redirect URI Configuration

Update your worker's OIDC configuration to include your Pages.dev domain:

```typescript
// In your OIDC configuration
const oidcConfig = {
    // ... other config
    redirectUris: [
        'https://your-pages-project.pages.dev/oidc/callback',
        'http://localhost:8080/oidc/callback' // For development
    ]
};
```

## Backend Configuration Updates

### 1. Environment Variables

Set these environment variables in your worker (via Wrangler or dashboard):

```bash
# Production environment variables
FRONTEND_ORIGIN=https://your-pages-project.pages.dev
ENVIRONMENT=production

# Development environment variables (for local testing)
FRONTEND_ORIGIN=http://localhost:8080
ENVIRONMENT=development
```

### 2. Worker Deployment

Make sure your worker is deployed with the updated configuration:

```bash
# Deploy your worker
npx wrangler deploy

# Or if using a specific config file
npx wrangler deploy --config wrangler.toml
```

### 3. Update wrangler.toml

Add environment-specific configurations:

```toml
[env.production.vars]
FRONTEND_ORIGIN = "https://your-pages-project.pages.dev"
ENVIRONMENT = "production"

[env.development.vars]
FRONTEND_ORIGIN = "http://localhost:8080"
ENVIRONMENT = "development"
```

## Testing the Integration

### 1. Local Development Testing

1. Start your backend worker locally:
   ```bash
   npm run dev
   # or
   npx wrangler dev
   ```

2. Start the frontend development server:
   ```bash
   ./dev-server.sh
   ```

3. Open your browser to `http://localhost:8080`

4. Test the authentication flow:
   - Try registering a new account
   - Test sign-in with existing credentials
   - Verify error handling

### 2. Production Testing

1. Deploy your frontend to Cloudflare Pages
2. Deploy your backend worker
3. Test the complete authentication flow
4. Verify OIDC redirect handling

## Common Configuration Issues

### CORS Errors

If you see CORS errors in the browser console:

1. Check that your worker is allowing the correct origin
2. Verify the frontend is making requests to the correct API URL
3. Ensure credentials are being sent if required

### OIDC Redirect Issues

If OIDC redirects aren't working:

1. Verify the redirect URI in both frontend and backend
2. Check that the state parameter is being handled correctly
3. Ensure the authorization URL is being built correctly

### API Connection Issues

If the frontend can't connect to the backend:

1. Check the API base URL in the frontend configuration
2. Verify your worker is deployed and accessible
3. Test API endpoints directly with curl or Postman

## Security Considerations

### 1. HTTPS Requirements

- All production deployments must use HTTPS
- Update all configurations to use `https://` URLs
- Ensure cookies are marked as secure

### 2. Content Security Policy

The frontend includes CSP headers that allow:
- Scripts from same origin
- Styles from same origin and Google Fonts
- Connections to your worker domain

Update the CSP in `_headers` if you need to allow additional domains.

### 3. Environment-Specific Configuration

Use different configurations for development and production:
- Development: Allow localhost origins
- Production: Restrict to your specific domains

## Deployment Checklist

- [ ] Backend worker deployed with updated CORS configuration
- [ ] Frontend deployed to Cloudflare Pages
- [ ] API base URL updated in frontend configuration
- [ ] OIDC redirect URIs updated in both frontend and backend
- [ ] Environment variables configured
- [ ] CORS headers allow the frontend domain
- [ ] End-to-end authentication flow tested
- [ ] Error handling verified
- [ ] Security headers configured

## Getting Your URLs

### Backend Worker URL

Find your worker URL in:
1. Cloudflare Dashboard → Workers → Your Worker → Triggers
2. Or in the output of `npx wrangler deploy`

Format: `https://your-worker-name.your-subdomain.workers.dev`

### Frontend Pages URL

Find your Pages URL in:
1. Cloudflare Dashboard → Pages → Your Project
2. Or during the initial deployment

Format: `https://your-project-name.pages.dev`

## Next Steps

After configuration is complete:

1. **Test Registration Flow**: Create a new account and verify it works
2. **Test Sign-In Flow**: Sign in with existing credentials
3. **Test Password Reset**: Verify the password reset email flow
4. **Test OIDC Integration**: Complete the full OIDC authorization flow
5. **Monitor Logs**: Check both worker and Pages logs for any issues

For any issues, check the browser console and worker logs for detailed error messages.
