# Cloudflare Pages Deployment Instructions

## Quick Deployment Steps

### 1. Go to Cloudflare Pages
Visit: **https://dash.cloudflare.com/pages**

### 2. Create New Project
- Click **"Create a project"**
- Select **"Connect to Git"**

### 3. Connect Repository
- Choose **GitHub**
- Select repository: **`wxcuop/cf-workers-oidc`**
- Click **"Begin setup"**

### 4. Configure Build Settings

```
Project name: cf-workers-oidc-frontend (or your preferred name)
Production branch: main
Build command: (leave empty)
Build output directory: frontend/signin
Root directory: (leave empty)
Environment variables: (none needed)
```

### 5. Deploy
- Click **"Save and Deploy"**
- Wait for deployment (usually 1-2 minutes)
- Copy your Pages URL (will be something like `https://cf-workers-oidc-frontend.pages.dev`)

### 6. Update CORS Configuration

Once you get your Pages URL, you need to update the worker configuration:

1. **Edit config.yml** and replace:
   ```yaml
   cors_origins:
     - https://your-frontend.pages.dev
   ```
   
   With your actual Pages URL:
   ```yaml
   cors_origins:
     - https://cf-workers-oidc-frontend.pages.dev  # Your actual URL
   ```

2. **Redeploy worker:**
   ```bash
   npx wrangler deploy
   ```

### 7. Test Your Deployment

1. Visit your Pages URL
2. Try the sign-in form
3. Check browser console for any errors
4. Verify CORS is working properly

## Expected File Structure

Cloudflare Pages will serve files from `frontend/signin/`:
```
frontend/signin/
├── index.html          # Main sign-in page
├── register.html       # Registration page  
├── reset-password.html # Password reset page
├── css/
│   ├── main.css       # Core styles
│   └── auth.css       # Authentication styles
├── js/
│   ├── auth.js        # Main authentication logic
│   ├── validation.js  # Form validation
│   └── utils.js       # Utility functions
└── assets/
    ├── favicon.svg    # Favicon
    └── logo.svg       # Logo
```

## Troubleshooting

**If deployment fails:**
- Check that `frontend/signin/index.html` exists
- Verify the build output directory is set to `frontend/signin`
- Make sure your GitHub repository is public or Cloudflare has access

**If CORS errors occur:**
- Update `config.yml` with your actual Pages URL
- Redeploy the worker with `npx wrangler deploy`
- Clear browser cache and try again

## Next Steps After Deployment

1. Set up client secret for OIDC
2. Configure user groups and permissions  
3. Test full authentication flow
4. Set up custom domain (optional)

---

Your frontend will be available at: `https://[project-name].pages.dev`
