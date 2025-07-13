# Custom Domain Migration Plan: nyworking.us

## Overview

This document outlines the migration plan to move from Cloudflare Pages default domains to your custom domain `nyworking.us`.

## Current State

### Current URLs
- **Frontend**: `https://wxclogin.pages.dev`
- **Backend**: `https://wxc-oidc.wxcuop.workers.dev`
- **Email From**: `noreply@nyworking.us` ✅ (Already configured)

### Target URLs
- **Frontend**: `https://oidc-login.nyworking.us`
- **Backend**: `https://oidc.nyworking.us`
- **Email From**: `noreply@nyworking.us` ✅ (Already configured)

## Migration Plan

### Phase 1: DNS and Domain Setup

#### Step 1.1: Choose Subdomain Structure
**Selected Structure:**
- `https://oidc-login.nyworking.us` - Frontend authentication pages
- `https://oidc.nyworking.us` - Backend OIDC API

This structure is ideal because:
- Clear OIDC branding and purpose
- Professional naming convention
- Descriptive and intuitive for developers
- Industry standard OIDC terminology
- Easy to remember and manage

#### Step 1.2: DNS Configuration
You'll need to add these DNS records to your `nyworking.us` domain:

**⚠️ Important**: You have 3 options for DNS management:

**Option A: Transfer DNS to Cloudflare (Recommended)**
- Keep domain registered where it is
- Only change DNS nameservers to Cloudflare
- Get full control over subdomains
- See `docs/SQUARESPACE_DNS_MIGRATION.md` for details

**Option B: Use Current DNS Provider**
- Try adding CNAME records directly
- May have limitations (especially Squarespace)
- Less control and features

**Option C: Domain Transfer**
- Transfer entire domain to Cloudflare
- Most expensive option
- Not necessary for this project

**Recommended DNS Records (Option A - Cloudflare DNS):**
```
Type: CNAME
Name: oidc-login
Value: wxclogin.pages.dev
Proxy: Yes (Orange cloud)
```

**For Cloudflare Workers (Backend):**
```
Type: CNAME  
Name: oidc
Value: wxc-oidc.wxcuop.workers.dev
Proxy: Yes (Orange cloud)
```

### Phase 2: Cloudflare Configuration

#### Step 2.1: Add Custom Domain to Cloudflare Pages ✅ **COMPLETED**
1. Go to Cloudflare Pages dashboard
2. Select your `wxclogin` project
3. Go to "Custom domains" tab
4. Click "Set up a custom domain"
5. Enter `oidc-login.nyworking.us`
6. Follow the verification process

**Status**: ✅ **Domain added successfully**: `oidc-login.nyworking.us` - **Active**

#### Step 2.2: Add Custom Domain to Cloudflare Workers ✅ **COMPLETED**

1. Go to Cloudflare Workers dashboard
2. Select your `wxc-oidc` worker
3. Find **"Domains & Routes"** section
4. Click the blue "+ Add" button
5. Enter `oidc.nyworking.us`
6. Wait for SSL certificate provisioning (usually 5-15 minutes)

**Status**: ✅ **Domain added successfully**: `oidc.nyworking.us`

### Phase 3: Code Updates ✅ **COMPLETED**

#### Step 3.1: Update Frontend Configuration ✅ **COMPLETED**
**File**: `frontend/signin/js/auth.js`

✅ **Status**: Frontend configured to use `https://oidc.nyworking.us` with fallback support

#### Step 3.2: Update Backend CORS Configuration ✅ **COMPLETED**
**File**: `config.yml`

✅ **Status**: CORS configured for both `https://oidc-login.nyworking.us` and transition support

#### Step 3.3: Update Email Reset URL ✅ **COMPLETED**
**File**: `src/services/email-service.ts`

✅ **Status**: Password reset emails use `https://oidc-login.nyworking.us/reset-password`

#### Step 3.4: Update OIDC Redirect URIs ✅ **COMPLETED**
**File**: `config.yml`

✅ **Status**: Redirect URIs configured for both custom and legacy domains

#### Step 3.5: Update Deployment Configuration ✅ **COMPLETED**
**File**: `wrangler.toml`

✅ **Status**: Deployment configuration updated and worker redeployed

### Phase 4: SSL and Security

#### Step 4.1: SSL Certificate
- Cloudflare will automatically provision SSL certificates for your custom domains
- HTTPS verified and active for both domains ✅
- Certificate validity tested ✅

**Status**: ✅ **SSL and HTTPS fully verified**

#### Step 4.2: Security Headers
- HSTS headers configured ✅
- CORS policies verified ✅
- Authentication flows tested ✅

**Status**: ✅ **Security headers and CORS fully verified**

### Phase 5: Testing and Validation

#### Step 5.1: Pre-Migration Testing
1. **Test current system**: Ensure everything works with current URLs ✅
2. **DNS propagation**: Verify DNS records are properly configured ✅
3. **SSL verification**: Confirm SSL certificates are active ✅

#### Step 5.2: Post-Migration Testing
1. **Frontend access**: Visit `https://oidc-login.nyworking.us` ✅
2. **API endpoints**: Test all authentication endpoints ✅
3. **Email functionality**: Test password reset emails ✅
4. **OIDC flow**: Complete full authentication flow ✅
5. **Cross-browser testing**: Verify compatibility ✅

**Status**: ✅ **All pre- and post-migration tests completed**

### Phase 6: Deployment and Migration

#### Step 6.1: Deployment Order
1. **Update DNS records** (allow time for propagation) ✅
2. **Configure custom domains** in Cloudflare dashboards ✅
3. **Update backend code** and deploy worker ✅
4. **Update frontend code** and deploy pages ✅
5. **Test thoroughly** ✅

**Status**: ✅ **Deployment and migration completed**

#### Step 6.2: Migration Strategy
**Option A: Blue-Green Deployment (Recommended)**
 Keep old URLs working during transition ✅
 Gradually migrate services ✅
 Monitor for issues ✅
 Complete cutover when stable ✅

**Option B: Direct Migration**
 Update all configurations at once (not used)
 Faster but higher risk
 Requires coordination

**Status**: ✅ **Migration strategy executed successfully**

## Implementation Steps

### Immediate Actions Needed

#### 1. DNS Setup
```bash
# Add these DNS records to nyworking.us domain:
# CNAME oidc-login -> wxclogin.pages.dev
# CNAME oidc -> wxc-oidc.wxcuop.workers.dev
```

#### 2. Cloudflare Dashboard Configuration
- Add custom domain to Pages project
- Add custom domain to Workers project
- Verify SSL certificate provisioning

#### 3. Code Updates (Gradual)
- Update CORS to include new domains
- Update frontend API base URL
- Update email reset URLs
- Test each change

### Risk Mitigation

#### Potential Issues
1. **DNS propagation delay** (24-48 hours)
2. **SSL certificate provisioning** (few minutes to hours)
3. **CORS configuration errors**
4. **Broken authentication flows**

#### Mitigation Strategies
1. **Dual-domain support**: Keep both old and new URLs working
2. **Gradual rollout**: Update components incrementally
3. **Rollback plan**: Keep old configuration ready
4. **Monitoring**: Watch for errors during transition

## Updated Architecture

### Post-Migration URLs
```
Frontend: https://oidc-login.nyworking.us
├── /                    # Sign-in page
├── /register           # Registration page
├── /reset-password     # Password reset page
└── /oidc/callback      # OIDC callback

Backend: https://oidc.nyworking.us
├── /auth/*             # Authentication endpoints
├── /admin/*            # Admin endpoints
├── /.well-known/jwks   # JWKS endpoint
└── /sign               # OIDC sign endpoint
```

### Benefits of Custom Domain

1. **Professional Branding**: `oidc-login.nyworking.us` instead of random `.pages.dev`
2. **Full Control**: Complete ownership of domains and certificates
3. **SEO Benefits**: Better for search engine optimization
4. **Trust**: Users trust custom domains more than generic subdomains
5. **Flexibility**: Can easily change hosting while keeping same URLs
6. **Email Consistency**: Email and web domains match

## Next Steps

1. **Choose subdomain names** ✅ **SELECTED**: `oidc-login.nyworking.us` + `oidc.nyworking.us`
2. **Set up DNS records** in your domain registrar
3. **Configure custom domains** in Cloudflare dashboards
4. **Update code configurations** gradually
5. **Test thoroughly** before full migration

## Estimated Timeline

- **DNS Setup**: 15 minutes
- **Cloudflare Configuration**: 30 minutes
- **Code Updates**: 1-2 hours
- **Testing**: 2-3 hours
- **Full Migration**: 1-2 days (including DNS propagation)

---

*Migration Plan created: July 2025*
*Target: Move from .pages.dev/.workers.dev to nyworking.us custom domain*
