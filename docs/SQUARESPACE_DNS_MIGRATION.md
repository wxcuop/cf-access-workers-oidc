# Squarespace DNS Migration to Cloudflare

## Issue: Squarespace DNS CNAME Limitations

Squarespace DNS doesn't allow custom CNAME records for subdomains, which prevents us from setting up:
- `auth.nyworking.us` 
- `auth-api.nyworking.us`

## Solution: Transfer DNS Management to Cloudflare

### Benefits of Using Cloudflare DNS
- ✅ Full CNAME record support
- ✅ Better performance (faster DNS resolution)
- ✅ Advanced DNS features (proxying, caching)
- ✅ Free service
- ✅ Integration with your existing Cloudflare services

### Step-by-Step Migration Process

#### Step 1: Add Domain to Cloudflare
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click "Add a site"
3. Enter `nyworking.us`
4. Choose the Free plan
5. Cloudflare will scan your existing DNS records

#### Step 2: Review and Import DNS Records
1. Cloudflare will show your current DNS records from Squarespace
2. Review them to ensure all important records are included
3. Add any missing records manually if needed

#### Step 3: Get Cloudflare Nameservers
Cloudflare will provide you with nameservers like:
```
nameserver1.cloudflare.com
nameserver2.cloudflare.com
```
(Your actual nameservers will be different)

#### Step 4: Update Nameservers at Domain Registrar
**Important**: You need to update nameservers where you bought the domain (not Squarespace)

**If you bought nyworking.us through Squarespace:**
1. Go to Squarespace Settings → Domains
2. Click on nyworking.us
3. Go to DNS Settings
4. Look for "Custom Nameservers" or "Use External DNS"
5. Replace with Cloudflare nameservers

**If you bought elsewhere (GoDaddy, Namecheap, etc.):**
1. Log into your domain registrar
2. Find DNS/Nameserver settings
3. Replace nameservers with Cloudflare's

#### Step 5: Add Custom DNS Records
Once Cloudflare is managing DNS, add these records:

```
Type: CNAME
Name: auth
Value: wxclogin.pages.dev
Proxy: Yes (Orange cloud)

Type: CNAME  
Name: auth-api
Value: wxc-oidc.wxcuop.workers.dev
Proxy: Yes (Orange cloud)
```

### Timeline
- **Nameserver update**: 5 minutes to configure
- **DNS propagation**: 1-24 hours globally
- **Total time**: Usually 2-6 hours for full propagation

## Alternative Options (If You Must Keep Squarespace DNS)

### Option A: Use Different Subdomains
If Squarespace allows certain subdomains, try:
- `www.nyworking.us/auth` (redirect to Pages)
- Different subdomain patterns

### Option B: Use A Records Instead
**Note**: This is more complex and less flexible

1. Get IP addresses of your services:
```bash
# Get Cloudflare Pages IP
nslookup wxclogin.pages.dev

# Get Cloudflare Workers IP  
nslookup wxc-oidc.wxcuop.workers.dev
```

2. Add A records in Squarespace:
```
Type: A
Name: auth
Value: [IP from above]

Type: A
Name: auth-api  
Value: [IP from above]
```

**Problems with A records**:
- IPs can change (Cloudflare updates them)
- No automatic SSL certificate management
- Less reliable than CNAME

### Option C: Use Different Domain Structure
```
https://nyworking.us/auth      # Main site with auth subdirectory
https://api-nyworking.us       # Separate domain (if available)
```

## Recommended Action Plan

### Immediate (Recommended): Transfer to Cloudflare DNS
1. **Add nyworking.us to Cloudflare** (5 minutes)
2. **Update nameservers** at your domain registrar (5 minutes)
3. **Wait for propagation** (2-24 hours)
4. **Add CNAME records** in Cloudflare (2 minutes)
5. **Continue with migration plan** as originally planned

### Why Cloudflare DNS is Better
- **Full control**: Complete DNS management
- **Better performance**: Faster resolution worldwide  
- **Free service**: No additional cost
- **Integration**: Works seamlessly with your existing Cloudflare services
- **Advanced features**: Traffic management, security, analytics

## Need Help?

Let me know:
1. **Where did you register nyworking.us?** (Squarespace, GoDaddy, Namecheap, etc.)
2. **What specific error are you seeing** in Squarespace DNS?
3. **Are you comfortable transferring DNS to Cloudflare?**

I can provide specific instructions based on your domain registrar and comfort level.

---

**Recommendation**: Transfer DNS to Cloudflare for full control and better performance. This is a one-time setup that will give you complete flexibility for future DNS needs.
