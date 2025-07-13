# Backend Deployment Guide

## Deploy Your OIDC Worker to Cloudflare

This guide will help you deploy your Phase 1 backend authentication system to Cloudflare Workers.

## Prerequisites

- ✅ Cloudflare account (you have this!)
- ✅ Completed Phase 1 backend system (you have this!)
- ✅ Node.js installed locally

## Step 1: Install Wrangler CLI

First, install the Cloudflare Wrangler CLI:

```bash
# Install Wrangler globally
npm install -g wrangler

# Or use npx (no global install needed)
npx wrangler --version
```

## Step 2: Authenticate with Cloudflare

Login to your Cloudflare account:

```bash
# Login to Cloudflare
npx wrangler login

# This will open your browser to authenticate
# Follow the prompts to authorize Wrangler
```

## Step 3: Update Configuration (Optional)

Your `wrangler.toml` is already configured. You can optionally update the worker name:

```toml
# In wrangler.toml
name = "cf-workers-oidc"  # Change this if you want a different name
```

## Step 4: Build and Deploy

Build and deploy your worker:

```bash
# Install dependencies (if not already done)
npm install

# Build the project
npm run build

# Deploy to Cloudflare Workers
npx wrangler deploy

# Alternative: use the npm script
npm run deploy
```

## Step 5: Get Your Worker URL

After deployment, Wrangler will output your worker URL:

```
Published cf-workers-oidc (1.23s)
  https://cf-workers-oidc.your-subdomain.workers.dev
```

**Copy this URL** - you'll need it for frontend configuration!

## Step 6: Test Your Deployed Worker

Test your worker endpoints:

```bash
# Test the health check
curl https://your-worker-name.your-subdomain.workers.dev/

# Test user registration
curl -X POST https://your-worker-name.your-subdomain.workers.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "fullName": "Test User"
  }'
```

## Step 7: Configure Environment Variables (If Needed)

If your worker needs environment variables:

```bash
# Set environment variables
npx wrangler secret put SOME_SECRET_KEY

# Or set non-secret variables
npx wrangler vars set NODE_ENV production
```

## Common Deployment Issues

### Build Failures

If the build fails:

```bash
# Check TypeScript compilation
npx tsc

# Check for build errors
npm run build
```

### Durable Objects Issues

If you get Durable Objects errors:

1. Make sure your account has Durable Objects enabled
2. Check that the binding is correct in `wrangler.toml`
3. Verify the migration is set up correctly

### Authentication Issues

If Wrangler can't authenticate:

```bash
# Logout and login again
npx wrangler logout
npx wrangler login

# Or use API tokens
npx wrangler auth list
```

## Verify Deployment Success

Your worker should be accessible at:
```
https://[worker-name].[your-subdomain].workers.dev
```

Test these endpoints:
- `GET /` - Health check
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /.well-known/openid_configuration` - OIDC discovery

## Next Steps

Once your backend is deployed:

1. **Copy the Worker URL** - you'll need this for frontend configuration
2. **Test the API endpoints** - make sure authentication works
3. **Deploy the frontend** - now you can proceed with Cloudflare Pages deployment

## Security Considerations

For production deployment:

1. **Environment Variables**: Store sensitive data as secrets
2. **CORS Configuration**: Update CORS headers for your frontend domain
3. **Rate Limiting**: Ensure rate limiting is properly configured
4. **Monitoring**: Set up alerts for errors and performance

## Troubleshooting

### Worker Not Responding

1. Check the deployment logs
2. Verify the worker name and URL
3. Test with a simple endpoint first

### CORS Issues

Update your CORS headers to allow your frontend domain:

```typescript
// In your worker code
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Update this after frontend deployment
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};
```

### Performance Issues

1. Check CPU usage in Cloudflare dashboard
2. Monitor Durable Objects usage
3. Optimize database queries if needed

## Production Checklist

- [ ] Worker deployed successfully
- [ ] All API endpoints responding
- [ ] Authentication flow tested
- [ ] OIDC discovery endpoint working
- [ ] Rate limiting configured
- [ ] Error handling verified
- [ ] Monitoring set up

---

**Ready for Frontend Deployment!**

Once your backend is deployed and the URL is copied, you can proceed to deploy the frontend to Cloudflare Pages.
