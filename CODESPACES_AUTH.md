# Wrangler Authentication for Codespaces

## Step 1: Get API Token

1. Go to [Cloudflare Dashboard → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template or create custom with:
   - `Account:Cloudflare Workers:Edit` (your account)
   - `Account:Account Settings:Read` (for memberships access)
   - `User:User Details:Read` (for authentication)
   - `Zone:Zone:Read` (all zones) - only if using custom domain
   - `Zone:Zone Settings:Read` (all zones) - only if using custom domain

## Step 2: Set Environment Variable

Run this command with your actual token:

```bash
export CLOUDFLARE_API_TOKEN=your_actual_token_here
```

## Step 3: Deploy

```bash
npx wrangler deploy
```

## Step 4: Get Your Worker URL

After successful deployment, copy the worker URL that's displayed:
```
https://wxc-oidc.your-subdomain.workers.dev
```

## Alternative: Global API Key Method

If API token doesn't work, use Global API Key:

```bash
export CLOUDFLARE_EMAIL=your-email@example.com
export CLOUDFLARE_API_KEY=your-global-api-key
npx wrangler deploy
```

## Troubleshooting

If you get permission errors:
1. Make sure your token has the right permissions
2. Try using the Global API Key method instead
3. Check that your account has Workers enabled

Once deployed, you'll use the worker URL in your frontend configuration!
