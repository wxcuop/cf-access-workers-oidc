# Cloudflare Workers OIDC Provider

A comprehensive OpenID Connect provider built on Cloudflare Workers and Durable Objects, featuring complete user authentication, group management, and enterprise-grade security.

## ✨ Features

### 🔐 **Authentication Infrastructure**
- **Complete User Management**: Registration, login, logout, password### Build & Deploy

#### Environment Setup
```bash
# Required: Cloudflare Account ID for deployment
export CF_ACCOUNT_ID=your-cloudflare-account-id

# Required: Cloudflare API Token with Workers permissions
export CF_API_TOKEN=your-api-token

# Optional: API Token for Cloudflare Access integration (read-only Teams permissions)
wrangler secret put CF_SECRET_API_TOKEN
```

#### Quick Deployment
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Deploy to Cloudflare Workers
wrangler deploy

# Verify deployment
curl https://your-worker.your-subdomain.workers.dev/.well-known/openid-configuration
```

#### Important Notes
- **SQLite Backend**: Uses new SQLite-backed Durable Objects (required for Workers Free plan)
- **Automatic Migration**: Existing deployments will automatically migrate to SQLite backend
- **Data Persistence**: All user data, groups, and exchange codes persist across deployments
- **Point-in-Time Recovery**: 30-day backup capability for production data- **JWT Token System**: Access tokens and refresh tokens with configurable TTLs
- **Password Security**: PBKDF2 hashing with 100,000 iterations and salt
- **Rate Limiting**: Built-in protection against brute force attacks
- **Session Management**: Persistent user sessions with tracking

### 👥 **Group Management System**
- **Dynamic Groups**: Create, update, delete user groups
- **User Assignment**: Assign users to multiple groups
- **System Groups**: Protected admin and user groups
- **Group-based Authorization**: Fine-grained access control

### 🛡️ **Security Features**
- **OIDC Compliance**: Full OpenID Connect specification support
- **JWT Signature Verification**: RSA-256 signed tokens
- **Automatic Key Rotation**: Private keys rotate with Durable Object lifecycle
- **CORS Support**: Configurable cross-origin resource sharing
- **Input Validation**: Comprehensive request validation and sanitization

### 🏗️ **Architecture**
- **SQLite Storage**: Modern SQLite-backed Durable Objects for data persistence
- **Point-in-Time Recovery**: 30-day backup and restore capability
- **Free Plan Compatible**: Works on Cloudflare Workers Free plan
- **Auto-scaling**: Cloudflare's global edge network
- **TypeScript**: Full type safety and modern development experience
- **Comprehensive Testing**: 65+ tests with full coverage (Jest + Vitest)

## 🚀 API Endpoints

### **Authentication Endpoints**
- `POST /auth/login` - User authentication with email/password
- `POST /auth/register` - New user registration
- `POST /auth/logout` - User logout and session termination
- `POST /auth/refresh` - Refresh access tokens
- `POST /auth/reset-password` - Request password reset
- `PUT /auth/reset-password/:token` - Complete password reset

### **Group Management Endpoints** (Admin only)
- `GET /admin/groups` - List all groups
- `POST /admin/groups` - Create new group
- `PUT /admin/groups/:name` - Update group
- `DELETE /admin/groups/:name` - Delete group
- `GET /admin/groups/:name/users` - List users in group

### **User Management Endpoints** (Admin only)
- `GET /admin/users` - List users with pagination and filtering
- `POST /admin/users` - Create new user
- `PUT /admin/users/:email` - Update user
- `DELETE /admin/users/:email` - Delete user
- `POST /admin/users/:email/groups` - Assign user to groups
- `DELETE /admin/users/:email/groups/:group` - Remove user from group

### **OIDC Standard Endpoints**
- `GET /.well-known/openid-configuration` - OIDC discovery
- `GET /.well-known/jwks.json` - Public keys for JWT verification
- `GET /authorize` - Authorization endpoint (Cloudflare Access protected)
- `POST /token` - Token exchange endpoint
- `GET /userinfo` - User information endpoint

## 📋 Example Usage

### User Registration
```bash
curl -X POST https://your-oidc-provider.workers.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "John Doe"
  }'
```

### User Login
```bash
curl -X POST https://your-oidc-provider.workers.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

### Create Group (Admin)
```bash
curl -X POST https://your-oidc-provider.workers.dev/admin/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "developers",
    "description": "Development team members"
  }'
```

## 🛠️ Deployment

### Prerequisites

- Cloudflare account with Workers (Durable Objects with SQLite backend)
- Node.js 21+ and npm/yarn
- Wrangler CLI installed (`npm install -g wrangler`)
- Optional: Cloudflare for Teams (for Access integration)

### Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/wxcuop/CF-WORKERS-OIDC.git
   cd CF-WORKERS-OIDC
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Set your Cloudflare Account ID
   export CF_ACCOUNT_ID=your-account-id
   
   # Set API token for deployment
   export CF_API_TOKEN=your-api-token
   
   # Optional: Set API token for Cloudflare Access integration
   wrangler secret put CF_SECRET_API_TOKEN
   ```

3. **Configure Application**
   Edit `config.yml` with your settings:
   ```yaml
   cf_account_id: your-cloudflare-account-id
   cf_access_team: your-team-name  # optional
   cf_access_aud: your-access-aud  # optional
   
   jwt_ttl: 600 # 10 minutes
   access_token_ttl: 1800 # 30 minutes  
   refresh_token_ttl: 604800 # 7 days
   
   clients:
     - name: 'Your Application'
       client_id: unique-client-id
       client_secret_key: SECRET_KEY_NAME
       redirect_uris:
         - https://your-app.example.com/auth/callback
       cors_origins:
         - https://your-app.example.com
   ```

4. **Set Client Secrets**
   ```bash
   wrangler secret put SECRET_KEY_NAME
   # Enter your client secret when prompted
   ```

5. **Build and Deploy**
   ```bash
   npm run build
   wrangler deploy
   ```

6. **Verify Deployment**
   ```bash
   # Test the OIDC discovery endpoint
   curl https://your-worker.your-subdomain.workers.dev/.well-known/openid-configuration
   
   # Check health status
   curl https://your-worker.your-subdomain.workers.dev/health
   ```

### Development

#### **Prerequisites for Development**
- Node.js 21+ and npm/yarn
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with Workers enabled
- Git for version control

#### **Setup Development Environment**
```bash
# Clone the repository
git clone https://github.com/wxcuop/CF-WORKERS-OIDC.git
cd CF-WORKERS-OIDC

# Install dependencies
npm install

# Login to Cloudflare (if not already done)
wrangler login

# Set up local environment
cp config.yml.example config.yml  # Edit with your settings
```

#### **Available Commands**
```bash
# Development and Testing
npm test                    # Run all tests (Jest + Vitest)
npm run test:jest          # Run Jest unit/integration tests
npm run test:runtime       # Run Vitest runtime tests
npm run test:all           # Run both Jest and runtime tests
npm run test:watch         # Run tests in watch mode

# Individual Test Suites
npm run test:routes        # Test route configuration
npm run test:endpoints     # Test endpoint validation
npm run test:unit          # Test unit tests only
npm run test:integration   # Test integration tests only

# Code Quality
npm run type-check         # TypeScript type checking
npm run lint               # Code linting
npm run format             # Code formatting

# Build and Deployment
npm run build              # Build the project
npm run dev                # Local development server
wrangler dev               # Local development with Wrangler
wrangler deploy            # Deploy to Cloudflare Workers

# Utilities
npm run clean              # Clean build artifacts
npm run docs               # Generate documentation
```

#### **Local Development**
```bash
# Start local development server
wrangler dev

# The server will be available at:
# http://localhost:8787

# Test endpoints locally:
curl http://localhost:8787/.well-known/openid-configuration
```

## 🧪 Testing

### **Comprehensive Test Suite**
The project includes a robust testing infrastructure with 65+ tests:

#### **Test Architecture**
- **Jest Tests (60 tests)**: Unit and integration tests for Node.js environment
- **Vitest Runtime Tests (5 tests)**: Workers runtime-specific tests
- **Complete Coverage**: All authentication flows, OIDC endpoints, and admin operations

#### **Running Tests**
```bash
# Run all tests (Jest + Vitest)
npm run test:all

# Run individual test suites
npm run test:jest          # Node.js environment tests
npm run test:runtime       # Workers runtime tests

# Specific test categories
npm run test:routes        # Route configuration tests
npm run test:endpoints     # API endpoint validation
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only

# Development workflow
npm run test:watch         # Watch mode for development
npm run test:ci            # CI/CD pipeline tests
```

#### **Test Results Summary**
- ✅ **Routes Test Suite**: 28/28 tests passing (OIDC endpoints, auth endpoints, admin endpoints)
- ✅ **Endpoints Integration**: 18/18 tests passing (validation, CORS, error handling)
- ✅ **Auth Unit Tests**: 14/14 tests passing (authentication flows, security)
- ✅ **Runtime Tests**: 5/5 tests passing (Workers-specific functionality)
- ✅ **Total**: 65/65 tests passing

#### **Project Structure**
```
src/
├── main.ts                 # Worker entry point
├── oidc-do.ts              # SQLite-backed Durable Object orchestrator
├── types.ts                # TypeScript type definitions
├── utils.ts                # Utility functions
├── auth/                   # Authentication service
│   └── auth-service.ts
├── group/                  # Group management service
│   └── group-service.ts
├── oidc/                   # OIDC core and JWT services
│   ├── oidc-core.ts        # SQLite-backed OIDC operations
│   └── jwt-service.ts
├── security/               # Security utilities
│   └── security-utils.ts
├── storage/                # Data persistence service
│   └── storage-service.ts
└── user/                   # User management service
    └── user-service.ts

tests/                      # Test files
├── auth.unit.test.ts       # Jest unit tests
├── auth.runtime.test.ts    # Vitest runtime tests
├── endpoints.integration.test.ts  # API endpoint tests
├── routes.test.ts          # Route configuration tests
├── setup.ts                # Jest test setup
├── setup.runtime.ts        # Vitest runtime setup
└── README.md               # Test documentation

docs/                       # Documentation
├── IMPLEMENTATION_PLAN.md  # Development roadmap
├── SQLITE_REFACTORING_SUMMARY.md  # SQLite migration details
└── *.md                    # Additional guides

config.yml                  # Configuration file
config.yml.example         # Configuration template
wrangler.toml              # Wrangler configuration (SQLite backend)
package.json               # Dependencies and scripts
tsconfig.json              # TypeScript configuration
jest.config.json           # Jest test configuration
vitest.config.ts           # Vitest configuration
```

#### **Development Workflow**
1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Make Changes**: Edit code, add tests
3. **Run Tests**: `npm test` to ensure all tests pass
4. **Type Check**: `npm run type-check` for TypeScript validation
5. **Local Testing**: `wrangler dev` to test locally
6. **Commit Changes**: `git commit -m "descriptive message"`
7. **Push Branch**: `git push origin feature/your-feature`
8. **Create PR**: Open pull request for review

#### **Debugging**
```bash
# Enable debug logging in development
export DEBUG=true
wrangler dev

# View logs in production
wrangler tail

# Debug specific services
export DEBUG_SERVICE=auth
wrangler dev
```

#### **Configuration for Development**
```yaml
# config.yml for local development
cf_account_id: your-dev-account-id
jwt_ttl: 600
access_token_ttl: 1800
refresh_token_ttl: 604800

clients:
  - name: 'Local Development'
    client_id: dev-client-id
    client_secret_key: SECRET_DEV_CLIENT
    redirect_uris:
      - http://localhost:3000/auth/callback
    cors_origins:
      - http://localhost:3000
```

## 💾 SQLite Storage & Modern Features

### **SQLite-Backed Durable Objects**
This OIDC provider has been refactored to use Cloudflare's new SQLite-backed Durable Objects, providing:

- **📊 Persistent Storage**: All data survives Worker restarts and deployments
- **🔄 Point-in-Time Recovery**: 30-day backup and restore capability
- **💰 Free Plan Compatible**: Works on Cloudflare Workers Free plan
- **⚡ Performance**: SQL indexes for efficient queries and automatic cleanup
- **📈 Scalability**: Better handling of large datasets compared to in-memory storage

### **Data Storage**
```sql
-- Exchange codes for OAuth2 flows
exchange_codes (
  code TEXT PRIMARY KEY,
  id_token TEXT NOT NULL,
  access_token TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
)

-- Automatic cleanup of expired data
-- Indexes on expires_at for efficient queries
```

## ⚙️ Configuration

### config.yml Structure

```yaml
# Cloudflare Account Settings
cf_account_id: your-cloudflare-account-id
cf_access_team: your-team-name      # Optional: for Access integration
cf_access_aud: your-access-aud      # Optional: for Access integration

# Token Lifetimes (in seconds)
jwt_ttl: 600                        # JWT token TTL (10 minutes)
access_token_ttl: 1800              # Access token TTL (30 minutes)
refresh_token_ttl: 604800           # Refresh token TTL (7 days)

# Client Applications
clients:
  - name: 'Your Application'
    client_id: unique-client-id
    client_secret_key: SECRET_KEY_NAME   # Reference to Wrangler secret
    redirect_uris:
      - https://your-app.example.com/auth/callback
      - https://your-app.example.com/auth/silent-callback
    cors_origins:
      - https://your-app.example.com
    # Optional: Restrict to specific groups
    allowed_groups:
      - admins
      - users
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CF_ACCOUNT_ID` | Cloudflare Account ID | Yes |
| `CF_API_TOKEN` | Cloudflare API Token (for deployment) | Yes |
| `CF_SECRET_API_TOKEN` | Cloudflare API Token (for Access integration) | No |
| `CLIENT_SECRET_*` | Client secrets referenced in config.yml | Yes |

### Cloudflare Access Integration

For enhanced security, you can integrate with Cloudflare Access:

1. **Create Access Application**
   - Path: `/authorize/*` (protect authorization endpoints)
   - Other endpoints remain public for JWT verification

2. **Configure Access**
   ```yaml
   cf_access_team: your-team-name
   cf_access_aud: your-access-application-aud
   ```

3. **Set API Token**
   ```bash
   wrangler secret put CF_SECRET_API_TOKEN
   ```

## 🔧 Advanced Configuration

### **SQLite Storage Configuration**
The OIDC provider uses SQLite-backed Durable Objects with automatic table creation and management:

```typescript
// Automatic table initialization
CREATE TABLE IF NOT EXISTS exchange_codes (
  code TEXT PRIMARY KEY,
  id_token TEXT NOT NULL,
  access_token TEXT NOT NULL DEFAULT '',
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

// Performance indexes
CREATE INDEX IF NOT EXISTS idx_exchange_codes_expires 
ON exchange_codes(expires_at);
```

### **Monitoring and Statistics**
New SQLite backend provides enhanced monitoring capabilities:

```typescript
// Get exchange code statistics
const stats = await oidcService.getExchangeCodeStats();
// Returns: { total: number, expired: number }

// List all active exchange codes
const codes = await oidcService.getAllExchangeCodes();
```

### Custom Password Policy

Password requirements can be customized in the security service:

```typescript
// Minimum requirements
const MIN_PASSWORD_LENGTH = 8;
const REQUIRE_UPPERCASE = true;
const REQUIRE_LOWERCASE = true;
const REQUIRE_NUMBER = true;
const REQUIRE_SPECIAL = true;
```

### Rate Limiting

Built-in rate limiting for security:

```typescript
// Failed login attempts
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Password reset attempts
const MAX_RESET_ATTEMPTS = 3;
const RESET_LOCKOUT_DURATION = 60 * 60 * 1000; // 1 hour
```

### Group Management

Groups can be managed via API or admin interface:

```typescript
// Create group
await fetch('/admin/groups', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
  },
  body: JSON.stringify({
    name: 'developers',
    description: 'Development team'
  })
});

// Assign user to group
await fetch('/admin/users/user@example.com/groups', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
  },
  body: JSON.stringify({
    groups: ['developers']
  })
});
```

## 🌐 Endpoints

### OIDC Standard Endpoints

Once deployed, your OIDC provider exposes the following standard endpoints:

- **`/.well-known/openid-configuration`** - OIDC configuration discovery
- **`/.well-known/jwks.json`** - Public endpoint with public keys used to verify JWTs
- **`/authorize`** - Authorization endpoint (protected by Cloudflare Access)
- **`/token`** - Token endpoint for exchanging authorization codes
- **`/userinfo`** - User information endpoint

### Worker Routes

The Worker is not deployed to any domain by default. Configure [wrangler.toml](wrangler.toml) to expose it on one of your domains _(or use the Workers UI)_.

## 🚀 Getting Started

Once deployed, your OIDC provider is ready to use! Configure your applications to use the discovery endpoint at `/.well-known/openid-configuration` for automatic configuration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](license/LICENSE.md) file for details.

## 🙏 Acknowledgments

- Built on [Cloudflare Workers](https://workers.cloudflare.com/) and [Durable Objects](https://developers.cloudflare.com/workers/learning/using-durable-objects/)
- Implements [OpenID Connect](https://openid.net/connect/) standard
- Inspired by the need for self-hosted OIDC providers
- Enhanced with SQLite-backed storage for improved persistence and scalability
