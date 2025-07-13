# Wrangler CLI Commands for Custom Domains

## Modern Wrangler Syntax (2024+)

### Add Custom Domain Route
```bash
# Add a custom domain route to your worker
wrangler triggers add --name wxc-oidc --route "oidc.nyworking.us/*"
```

### List Current Triggers
```bash
# View all current triggers for your worker
wrangler triggers list --name wxc-oidc
```

### Remove Triggers
```bash
# Remove a specific route
wrangler triggers remove --name wxc-oidc --route "oidc.nyworking.us/*"
```

## Alternative: Deploy with Custom Routes

### Update wrangler.toml
Add routes to your `wrangler.toml`:
```toml
name = "wxc-oidc"
main = "src/main.ts"

# Add custom domain routes
routes = [
  { pattern = "oidc.nyworking.us/*", custom_domain = true }
]
```

### Deploy with Routes
```bash
wrangler deploy
```

## Dashboard Method (Recommended)

Since CLI syntax can change, the dashboard method is more reliable:

1. **Cloudflare Workers Dashboard**
2. **Select Worker**: `wxc-oidc`
3. **Triggers Tab**
4. **"+ Add" Button**
5. **Select "Custom Domain"**
6. **Enter Domain**: `oidc.nyworking.us`

## Troubleshooting

### Common CLI Errors:
- `Unknown arguments: domains, add` → Old syntax, use `triggers add`
- `Authentication error` → Run `wrangler login` first
- `Domain not found` → Check DNS CNAME record exists

### Check Wrangler Version:
```bash
wrangler --version
```

### Update Wrangler:
```bash
npm update -g wrangler
# or
npx wrangler@latest --version
```

---
*Updated: July 2025*
*Modern Wrangler CLI syntax for custom domains*
