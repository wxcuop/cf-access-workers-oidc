# Local Development Setup Guide

This guide will walk you through setting up the Cloudflare Workers OIDC Provider for local development and testing.

## 🚀 Quick Start

If you want to get started immediately:

```bash
# Install dependencies
npm install

# Install Wrangler CLI globally
npm install -g wrangler

# Build the project
npm run build

# Start development server
wrangler dev
```

The server will be available at `http://localhost:8787`

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** and **npm**
- **Git** for version control
- **Cloudflare account** (for production deployment)

## 🔧 Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/wxcuop/cf-workers-oidc.git
cd cf-workers-oidc

# Install project dependencies
npm install

# Install Wrangler CLI globally
npm install -g wrangler
```

### 2. Configure Your Environment

#### Option A: Use Example Configuration (Recommended for testing)
The project comes with a working `config.yml` file with example settings that work out of the box for local development.

#### Option B: Customize Configuration
Edit `config.yml` to match your requirements:

```yaml
# Cloudflare Account Configuration
cf_account_id: your-cloudflare-account-id
cf_access_team: your-team-name # Optional
cf_access_aud: your-access-application-aud # Optional

# Token Lifetime Configuration (in seconds)
jwt_ttl: 600 # 10 minutes
access_token_ttl: 1800 # 30 minutes
refresh_token_ttl: 604800 # 7 days

# OIDC Client Applications
clients:
  - name: "Your Web Application"
    client_id: your-unique-client-id
    client_secret_key: SECRET_CLIENT_APP
    redirect_uris:
      - https://your-app.example.com/auth/callback
    cors_origins:
      - https://your-app.example.com
```

### 3. Build the Project

```bash
npm run build
```

This command:
- Compiles TypeScript to JavaScript
- Bundles the worker code
- Generates `dist/main.mjs` for Wrangler

### 4. Start Local Development Server

```bash
wrangler dev
```

The development server will:
- Start on `http://localhost:8787`
- Watch for file changes and rebuild automatically
- Provide local Durable Objects storage
- Show real-time logs

## 🧪 Testing Your Setup

### Quick Test Script

Run the included test script:

```bash
./test-local.sh
```

### Manual Testing

#### 1. Test OIDC Discovery
```bash
curl http://localhost:8787/.well-known/openid-configuration
```

Expected response:
```json
{
  "issuer": "https://localhost",
  "authorization_endpoint": "https://localhost/authorize",
  "token_endpoint": "https://localhost/token",
  "userinfo_endpoint": "https://localhost/userinfo",
  "jwks_uri": "https://localhost/.well-known/jwks.json",
  "response_types_supported": ["id_token", "code", "code id_token"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "token_endpoint_auth_methods_supported": ["client_secret_post"],
  "claims_supported": ["aud", "email", "exp", "iat", "nbf", "iss", "name", "sub", "country"],
  "grant_types_supported": ["authorization_code"]
}
```

#### 2. Test User Registration
```bash
curl -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "name": "Test User"
  }'
```

#### 3. Test User Login
```bash
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

## 📚 Available Endpoints

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access tokens
- `POST /auth/reset-password` - Request password reset
- `PUT /auth/reset-password/:token` - Complete password reset

### OIDC Standard Endpoints
- `GET /.well-known/openid-configuration` - OIDC discovery
- `GET /.well-known/jwks.json` - Public keys for JWT verification
- `GET /authorize` - Authorization endpoint
- `POST /token` - Token exchange endpoint
- `GET /userinfo` - User information endpoint

### Admin Endpoints (Protected)
- `GET /admin/users` - List users
- `POST /admin/users` - Create new user
- `PUT /admin/users/:email` - Update user
- `DELETE /admin/users/:email` - Delete user
- `GET /admin/groups` - List groups
- `POST /admin/groups` - Create new group
- `PUT /admin/groups/:name` - Update group
- `DELETE /admin/groups/:name` - Delete group

## 🛠️ Development Commands

### Build and Development
```bash
npm run build              # Build the project
npm run dev                # Start development server (alternative to wrangler dev)
wrangler dev               # Start Wrangler development server
```

### Testing
```bash
npm test                   # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

### Code Quality
```bash
npm run format             # Format code with Prettier
```

### Deployment
```bash
wrangler publish           # Deploy to Cloudflare Workers
```

## 🔍 Development Tips

### 1. Hot Reloading
Wrangler automatically watches your `src/` directory and rebuilds when files change.

### 2. Debugging
- Use `console.log()` in your code - output appears in the terminal
- Check the Wrangler logs for errors and debugging information
- Use browser DevTools to inspect HTTP requests/responses

### 3. Environment Variables
For production deployment, set secrets using:
```bash
wrangler secret put SECRET_NAME
```

### 4. Local Storage
Durable Objects data is stored locally and persists between restarts during development.

## 🔧 Configuration Files

### `wrangler.toml`
Main Wrangler configuration file:
```toml
name = "cf-workers-oidc"
main = "dist/main.mjs"
compatibility_date = "2024-11-01"

[durable_objects]
bindings = [
  { name = "DO_OIDC", class_name = "OpenIDConnectDurableObject" },
]

[[migrations]]
tag = "v1"
new_classes = ["OpenIDConnectDurableObject"]

[build]
command = "npm run build"
cwd = "."
watch_dir = ["src"]
```

### `config.yml`
Application configuration:
- JWT and token lifetimes
- OIDC client configurations
- Cloudflare account settings

### `package.json`
Node.js dependencies and build scripts.

## 🚨 Troubleshooting

### Common Issues

#### 1. "wrangler: command not found"
```bash
npm install -g wrangler
```

#### 2. "Build failed"
```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

#### 3. "Port already in use"
```bash
# Stop existing processes
pkill -f "wrangler dev"
# Or use a different port
wrangler dev --port 8788
```

#### 4. "TypeError: Cannot read properties of undefined"
This usually indicates a configuration issue. Check:
- `config.yml` syntax
- Build completed successfully
- All dependencies installed

### Getting Help

1. Check the [Wrangler documentation](https://developers.cloudflare.com/workers/wrangler/)
2. Review the project's `README.md`
3. Check the `tests/` directory for usage examples
4. Look at the source code in `src/` for implementation details

## 🎯 Next Steps

1. **Explore the API** - Use the test endpoints to understand the functionality
2. **Customize Configuration** - Modify `config.yml` for your use case
3. **Add Your Application** - Configure your app to use the OIDC provider
4. **Deploy to Production** - Use `wrangler publish` when ready

## 📖 Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Durable Objects Guide](https://developers.cloudflare.com/workers/learning/using-durable-objects/)
- [OpenID Connect Specification](https://openid.net/connect/)
- [JWT.io](https://jwt.io/) - JWT debugger

Happy coding! 🚀
