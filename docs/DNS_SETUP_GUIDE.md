# DNS Setup Guide for nyworking.us Custom Domains

## Quick DNS Configuration

### DNS Records to Add

You need to add these **2 CNAME records** to your `nyworking.us` domain:

#### Record 1: Frontend (Cloudflare Pages)
```
Type: CNAME
Name: oidc-login
Value: wxclogin.pages.dev
TTL: Auto (or 300)
Proxy Status: Proxied (Orange cloud if using Cloudflare DNS)
```

#### Record 2: Backend (Cloudflare Workers)  
```
Type: CNAME
Name: oidc
Value: wxc-oidc.wxcuop.workers.dev
TTL: Auto (or 300)
Proxy Status: Proxied (Orange cloud if using Cloudflare DNS)
```

### Result After DNS Setup

Once DNS propagates (usually 5-15 minutes), these URLs will work:
- `https://oidc-login.nyworking.us` → Points to your frontend
- `https://oidc.nyworking.us` → Points to your backend API

### DNS Provider Instructions

#### If using Cloudflare DNS:
1. Go to Cloudflare Dashboard → Domains → nyworking.us → DNS
2. Click "Add record"
3. Select "CNAME" 
4. Add the records above
5. Make sure "Proxy status" is enabled (orange cloud)

#### If using other DNS providers:
1. Log into your DNS provider (where you manage nyworking.us)
2. Find the DNS management section
3. Add the CNAME records above
4. Save changes

### Verification

After adding DNS records, test them:

```bash
# Test DNS resolution
nslookup oidc-login.nyworking.us
nslookup oidc.nyworking.us

# Or use dig
dig oidc-login.nyworking.us
dig oidc.nyworking.us
```

### Next Steps After DNS

1. **Wait for DNS propagation** (5-60 minutes)
2. **Configure custom domains in Cloudflare dashboards**
3. **Deploy updated code**
4. **Test the new URLs**

---

**Time Estimate**: 5 minutes to add DNS records + 15-60 minutes for propagation
