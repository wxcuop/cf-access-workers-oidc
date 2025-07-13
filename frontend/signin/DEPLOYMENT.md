# Cloudflare Pages Deployment Guide

## Step 2.1: Sign-In Page Foundation - Cloudflare Pages Setup

This guide will help you deploy the sign-in page to Cloudflare Pages without a custom domain.

### Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://www.cloudflare.com/) if you don't have one
2. **GitHub Repository**: Your code should be pushed to a GitHub repository
3. **Completed Backend**: Phase 1 backend system should be deployed and running

### Deployment Steps

#### 1. Create Cloudflare Pages Project

1. **Log in to Cloudflare Dashboard**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com/)
   - Navigate to "Pages" in the sidebar

2. **Connect to Git**
   - Click "Create a project"
   - Select "Connect to Git"
   - Choose your GitHub repository
   - Authorize Cloudflare to access your repository

3. **Configure Build Settings**
   ```
   Project name: cf-workers-oidc-signin
   Production branch: main
   Build command: (leave empty)
   Build output directory: frontend/signin
   Root directory: / (or leave empty)
   ```

4. **Environment Variables** (set these in Pages dashboard)
   ```
   NODE_ENV=production
   API_BASE_URL=https://your-worker-domain.your-subdomain.workers.dev
   ```

#### 2. Update Configuration

After deployment, you'll need to update the API configuration in your frontend:

1. **Get your Pages URL**
   - Your site will be available at: `https://cf-workers-oidc-signin.pages.dev`
   - Or similar based on your project name

2. **Update Worker Configuration**
   - Update your worker's CORS settings to allow your Pages domain
   - Update OIDC redirect URIs to include your Pages URL

3. **Update Frontend Configuration**
   - Edit `frontend/signin/js/auth.js`
   - Update the `apiBase` configuration:
   ```javascript
   config: {
       // Update with your actual worker URL
       apiBase: 'https://your-worker-name.your-subdomain.workers.dev',
       
       // Your Pages.dev URL will be used as redirect URI
       oidc: {
           redirectUri: 'https://your-project-name.pages.dev/oidc/callback',
           // ... other config
       }
   }
   ```

#### 3. Deployment Process

1. **Automatic Deployment**
   - Push changes to your main branch
   - Cloudflare Pages will automatically build and deploy
   - Monitor the deployment in the Pages dashboard

2. **Manual Deployment** (if needed)
   - Go to your Pages project dashboard
   - Click "Create deployment"
   - Upload your `frontend/signin` folder

#### 4. Verify Deployment

1. **Access your site**
   - Visit your `*.pages.dev` URL
   - Test the sign-in form
   - Verify all assets load correctly

2. **Test API Integration**
   - Try registering a new account
   - Test sign-in functionality
   - Check browser console for any errors

#### 5. Domain Configuration (Optional for later)

If you want to add a custom domain later:

1. **Add Custom Domain**
   - Go to Pages project → Custom domains
   - Click "Set up a custom domain"
   - Follow the DNS configuration steps

2. **Update Configurations**
   - Update worker CORS settings
   - Update OIDC redirect URIs
   - Update frontend API configuration

### Troubleshooting

#### Common Issues

1. **Build Failures**
   - Check build logs in Pages dashboard
   - Ensure build output directory is correct
   - Verify all files are in the repository

2. **API Connection Issues**
   - Check CORS configuration in worker
   - Verify API base URL in frontend config
   - Check browser network tab for failed requests

3. **OIDC Flow Issues**
   - Verify redirect URI configuration
   - Check state parameter handling
   - Ensure worker OIDC endpoints are working

#### Performance Optimization

1. **Enable Cloudflare Analytics**
   - Go to Pages project → Analytics
   - Monitor page views and performance

2. **Optimize Assets**
   - CSS and JS files are automatically cached
   - Consider minification for production

3. **Monitor Core Web Vitals**
   - Use Pages Analytics to track performance
   - Optimize based on real user metrics

### Security Considerations

1. **Content Security Policy**
   - Headers are configured in `_headers` file
   - Update CSP if adding external resources

2. **Environment Variables**
   - Never commit API keys or secrets
   - Use Pages environment variables for configuration

3. **HTTPS**
   - All Pages deployments use HTTPS by default
   - Ensure all API calls use HTTPS

### Next Steps

After successful deployment:

1. **Test End-to-End Flow**
   - Complete user registration
   - Test sign-in process
   - Verify OIDC integration

2. **Update Documentation**
   - Document your Pages URL
   - Update deployment procedures
   - Create user guides

3. **Monitor Performance**
   - Set up analytics
   - Monitor error rates
   - Track user engagement

### Pages.dev URL Structure

Your deployed site will be available at:
```
https://[PROJECT-NAME].pages.dev
```

For example:
- `https://cf-workers-oidc-signin.pages.dev`
- `https://my-auth-system.pages.dev`

The URL is automatically generated based on your project name and will remain consistent across deployments.

### Production Readiness Checklist

- [ ] Frontend deployed to Cloudflare Pages
- [ ] API endpoints responding correctly
- [ ] CORS configured for Pages domain
- [ ] OIDC redirect URIs updated
- [ ] Security headers configured
- [ ] Error handling tested
- [ ] Performance monitoring enabled
- [ ] User testing completed

### Support Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Pages Troubleshooting Guide](https://developers.cloudflare.com/pages/troubleshooting/)
- [Cloudflare Community](https://community.cloudflare.com/)

---

**Note**: This setup uses the free `pages.dev` subdomain. For production applications, consider setting up a custom domain for better branding and user trust.
