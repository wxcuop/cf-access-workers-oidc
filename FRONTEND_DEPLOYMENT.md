# Frontend Deployment Guide (Step 2.1)

## 🎉 Backend Deployed Successfully!

Your OIDC backend is now live at: **https://wxc-oidc.wxcuop.workers.dev**

## Next: Deploy Frontend to Cloudflare Pages

### Step 1: Prepare for Deployment

The frontend has been updated with your worker URL and is ready to deploy!

**Files Updated:**
- ✅ `frontend/signin/js/auth.js` - Updated with your worker URL
- ✅ `config.yml` - Added CORS origins for Pages deployment

### Step 2: Deploy to Cloudflare Pages

1. **Connect Repository to Pages:**
   - Go to [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/pages)
   - Click "Create a project"
   - Choose "Connect to Git"
   - Connect your GitHub repository: `wxcuop/cf-workers-oidc`

2. **Configure Build Settings:**
   ```
   Build command: (leave empty)
   Build output directory: frontend/signin
   Root directory: (leave empty or set to root)
   ```

3. **Deploy:**
   - Click "Save and Deploy"
   - Wait for deployment to complete
   - Note your Pages URL: `https://something.pages.dev`

### Step 3: Update Configuration

Once you get your Pages URL, update these files:

1. **Update config.yml:**
   ```yaml
   cors_origins:
     - https://your-actual-pages-url.pages.dev  # Replace with actual URL
   ```

2. **Redeploy Worker:**
   ```bash
   npx wrangler deploy
   ```

### Step 4: Test Your OIDC System

1. Visit your Pages URL
2. Try the sign-in flow
3. Check browser console for any CORS errors

## Architecture Overview

```
┌─────────────────────────────────────┐
│  Frontend (Cloudflare Pages)       │
│  https://your-app.pages.dev        │
│  - Sign-in page                     │
│  - Registration                     │
│  - Password reset                   │
└─────────────────┬───────────────────┘
                  │ API calls
                  ▼
┌─────────────────────────────────────┐
│  Backend (Cloudflare Workers)      │
│  https://wxc-oidc.wxcuop.workers.dev│
│  - OIDC Provider                    │
│  - Authentication                   │
│  - User/Group Management            │
└─────────────────────────────────────┘
```

## Next Steps (Step 2.2)

After frontend deployment:
1. Set up client secret: `wrangler secret put SECRET_CLIENT_APP`
2. Configure user groups and permissions
3. Test OIDC integration with applications
4. Set up admin interface (Step 2.3)

## Troubleshooting

**CORS Errors:**
- Make sure your Pages URL is in `config.yml` cors_origins
- Redeploy worker after config changes

**Authentication Errors:**
- Check browser console for detailed errors
- Verify worker is responding at `/auth/login`

**Need Help?**
- Check worker logs: `npx wrangler tail`
- Test endpoints directly with curl
- Review browser network tab for failed requests
