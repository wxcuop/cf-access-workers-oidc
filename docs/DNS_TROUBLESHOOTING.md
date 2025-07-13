# DNS Troubleshooting Guide

## Current Issue: SSL Handshake Failure

### Error Details
```
curl: (35) OpenSSL/3.0.13: error:0A000410:SSL routines::sslv3 alert handshake failure
```

### Root Cause
The SSL certificate for `oidc.nyworking.us` is not properly provisioned or the domain routing isn't configured correctly.

### Required DNS Records

**Missing Record - Add This:**
```
Type: CNAME
Name: oidc
Target: wxc-oidc.wxcuop.workers.dev
Proxy: ✅ (Orange cloud)
```

**Already Configured:**
```
Type: CNAME
Name: oidc-login
Target: wxclogin.pages.dev
Proxy: ✅ (Orange cloud)
```

### Troubleshooting Steps

#### Step 1: Add Missing DNS Record
1. Go to Cloudflare DNS dashboard
2. Click "Add record"
3. Type: CNAME
4. Name: `oidc`
5. Target: `wxc-oidc.wxcuop.workers.dev`
6. Proxy: ✅ (Orange cloud - enabled)
7. Save

#### Step 2: Check Workers Custom Domain Status
1. Go to Cloudflare Workers dashboard
2. Select `wxc-oidc` worker
3. Go to "Triggers" tab
4. Look for `oidc.nyworking.us` 
5. Status should show "Active" (not "Pending Certificate")

#### Step 3: Wait for SSL Provisioning
- SSL certificates can take 5-15 minutes to provision
- Sometimes up to 24 hours for complex configurations
- Check status periodically

#### Step 4: Test Resolution
```bash
# Test basic connectivity
curl -I --connect-timeout 10 https://oidc.nyworking.us/.well-known/jwks

# If that fails, try:
curl -I http://oidc.nyworking.us/.well-known/jwks

# Test original endpoint (should work)
curl -I https://wxc-oidc.wxcuop.workers.dev/.well-known/jwks
```

### Expected Timeline
- **DNS Record Addition**: Immediate
- **DNS Propagation**: 1-5 minutes (Cloudflare is fast)
- **SSL Certificate**: 5-15 minutes
- **Full Resolution**: 10-30 minutes

### Verification Commands
```bash
# Test when working
curl -I https://oidc.nyworking.us/.well-known/jwks
# Should return: HTTP/2 400 (this is correct - JWKS needs proper headers)

curl -I https://oidc-login.nyworking.us
# Should return: HTTP/2 200 (frontend page)
```

## Next Steps After DNS Fix

1. **Add Frontend Custom Domain**: Add `oidc-login.nyworking.us` to Cloudflare Pages
2. **Update Code**: Update CORS and API configurations
3. **Test Full Flow**: Verify authentication works end-to-end

---
*Created: July 13, 2025*
*Issue: SSL handshake failure for custom domain*
