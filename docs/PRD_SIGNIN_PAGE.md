# Product Requirements Document: Sign-In Page

## Document Information
- **Document Version**: 1.0
- **Date**: July 12, 2025
- **Product**: OIDC Provider Authentication System
- **Component**: Sign-In Page (Frontend)

## Executive Summary
This PRD defines the requirements for a secure, user-friendly sign-in page that will replace Cloudflare Access authentication in our OIDC provider system. The page will be deployed on Cloudflare Pages and integrate with our custom authentication backend.

## Objectives

### Primary Goals
1. **Replace Cloudflare Access**: Provide custom authentication to eliminate dependency on Cloudflare Access
2. **User Experience**: Create an intuitive, professional sign-in experience
3. **Security**: Implement secure authentication with proper error handling
4. **Integration**: Seamlessly integrate with existing OIDC flows

### Success Metrics
- **Performance**: Page load time < 2 seconds
- **Security**: Zero credential leakage, secure token handling
- **UX**: < 3 clicks to complete sign-in
- **Conversion**: > 95% successful sign-in rate for valid credentials

## User Stories

### Primary User Flow
**As a user**, I want to sign in to access protected applications so that I can use OIDC-protected services.

**Acceptance Criteria:**
- I can enter my email and password
- I receive clear feedback on success/failure
- I'm redirected to the appropriate destination after sign-in
- My session persists appropriately
- I can navigate to registration or password reset if needed

### Error Handling Flow
**As a user**, I want clear feedback when sign-in fails so that I can correct issues or seek help.

**Acceptance Criteria:**
- Invalid credentials show clear error message
- Network errors are handled gracefully
- Rate limiting is communicated clearly
- Helpful guidance is provided for common issues

## Functional Requirements

### FR-1: Authentication Form
- **Email field**: Required, email validation, autofocus
- **Password field**: Required, masked input, show/hide toggle
- **Submit button**: Disabled until form is valid, loading state
- **Form validation**: Client-side validation with real-time feedback

### FR-2: Security Features
- **CSRF protection**: Include CSRF tokens in requests
- **Rate limiting**: Handle and display rate limit errors
- **Secure transport**: All communication over HTTPS
- **Token handling**: Secure storage of JWT tokens

### FR-3: User Experience
- **Responsive design**: Mobile-first, works on all devices
- **Accessibility**: WCAG 2.1 AA compliance
- **Loading states**: Visual feedback during authentication
- **Error messaging**: Clear, actionable error messages

### FR-4: Navigation
- **Sign-up link**: Direct link to registration page
- **Password reset**: Direct link to password reset flow
- **Return URL**: Support for redirect after successful sign-in
- **Breadcrumbs**: Clear navigation context

### FR-5: Integration
- **API communication**: RESTful API calls to authentication backend
- **Session management**: Handle JWT tokens and refresh logic
- **OIDC flow**: Support for OAuth/OIDC redirect flows
- **Analytics**: Track sign-in events (privacy-compliant)

## Technical Requirements

### TR-1: Frontend Stack
- **Framework**: Vanilla JavaScript (ES6+)
- **Styling**: Modern CSS with CSS Grid/Flexbox
- **Build**: Cloudflare Pages (static deployment)
- **Bundling**: Minimal/no build process for simplicity

### TR-2: API Integration & Data Architecture
- **Endpoint**: `POST /auth/login`
- **Request format**: JSON with email/password
- **Response handling**: JWT tokens, error codes
- **Timeout**: 30-second request timeout
- **Data Sources**:
  - D1 Database for user authentication and profile data
  - Durable Objects for session management and OIDC tokens
  - Rate limiting data stored in Durable Objects for real-time protection

### TR-3: Security Implementation
- **Content Security Policy**: Strict CSP headers
- **Secure cookies**: HttpOnly, Secure, SameSite
- **Token storage**: Secure client-side storage strategy
- **Input sanitization**: XSS prevention

### TR-4: Performance
- **Page weight**: < 100KB total (including assets)
- **Time to interactive**: < 2 seconds
- **Core Web Vitals**: Meet Google's recommendations
- **Caching**: Appropriate cache headers

## Design Requirements

### DR-1: Visual Design
- **Brand alignment**: Consistent with company branding
- **Modern aesthetics**: Clean, professional appearance
- **Color scheme**: Accessible color contrast ratios
- **Typography**: Readable font stack with good hierarchy

### DR-2: Layout
- **Centered form**: Centered card layout on larger screens
- **Mobile-first**: Optimized for mobile devices
- **Form spacing**: Adequate spacing between form elements
- **Focus states**: Clear focus indicators for accessibility

### DR-3: Component Specifications

#### Sign-In Form Card
```
┌─────────────────────────────────┐
│           Sign In               │
│                                 │
│  Email: [________________]      │
│                                 │
│  Password: [____________] [👁️]   │
│                                 │
│     [Sign In Button]            │
│                                 │
│  Create Account | Forgot Password│
└─────────────────────────────────┘
```

### DR-4: Interactive States
- **Default**: Clean, professional appearance
- **Focus**: Clear focus indicators with primary color
- **Loading**: Spinner on button, disabled form
- **Error**: Red border on invalid fields, error message
- **Success**: Brief success indicator before redirect

## API Specification

### Authentication Endpoint
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "userpassword"
}
```

### Success Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
  "expires_in": 1800,
  "token_type": "Bearer"
}
```

### Error Responses
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "invalid_credentials",
  "error_description": "Invalid email or password"
}
```

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "rate_limited",
  "error_description": "Too many login attempts. Please try again in 5 minutes.",
  "retry_after": 300
}
```

## Error Handling

### Client-Side Validation
- **Email format**: Real-time email validation
- **Required fields**: Immediate feedback on empty fields
- **Password strength**: Optional strength indicator

### Server-Side Error Mapping
| HTTP Status | Error Code | User Message | Action |
|-------------|------------|-------------|--------|
| 401 | invalid_credentials | "Invalid email or password" | Show error, clear password |
| 429 | rate_limited | "Too many attempts. Try again in X minutes" | Disable form temporarily |
| 500 | server_error | "Something went wrong. Please try again" | Show retry option |
| Network | network_error | "Connection problem. Check your internet" | Show retry option |

## D1 Database Integration

### D1-1: Authentication Data Flow
```typescript
interface Env {
  OIDC_DB: D1Database;
}

// User authentication with D1
export async function authenticateUser(env: Env, email: string, password: string) {
  // Get user from D1 database
  const user = await env.OIDC_DB.prepare(`
    SELECT id, email, password_hash, status, email_verified, last_login
    FROM users 
    WHERE email = ? AND status = 'active'
  `).bind(email).first();

  if (!user) {
    // Log failed attempt
    await logAuthEvent(env, null, 'failed_login', false, 'user_not_found');
    throw new Error('Invalid credentials');
  }

  // Verify password (using bcrypt or similar)
  const isValid = await verifyPassword(password, user.password_hash);
  
  if (!isValid) {
    // Log failed attempt
    await logAuthEvent(env, user.id, 'failed_login', false, 'invalid_password');
    throw new Error('Invalid credentials');
  }

  // Update last login
  await env.OIDC_DB.prepare(`
    UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(user.id).run();

  // Log successful login
  await logAuthEvent(env, user.id, 'login', true);

  return user;
}

// Log authentication events for analytics and security
async function logAuthEvent(
  env: Env, 
  userId: string | null, 
  eventType: string, 
  success: boolean, 
  errorCode?: string
) {
  await env.OIDC_DB.prepare(`
    INSERT INTO auth_events (id, user_id, event_type, success, error_code, timestamp)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    crypto.randomUUID(),
    userId,
    eventType,
    success,
    errorCode || null
  ).run();
}
```

### D1-2: User Registration Integration
```typescript
// Create new user account
export async function createUser(env: Env, email: string, password: string, name: string) {
  // Check if user already exists
  const existing = await env.OIDC_DB.prepare(`
    SELECT id FROM users WHERE email = ?
  `).bind(email).first();

  if (existing) {
    throw new Error('User already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();

  // Insert user into D1
  await env.OIDC_DB.prepare(`
    INSERT INTO users (id, email, name, password_hash, created_at, status)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'active')
  `).bind(userId, email, name, passwordHash).run();

  // Assign default user group
  const userGroup = await env.OIDC_DB.prepare(`
    SELECT id FROM groups WHERE name = 'user'
  `).first();

  if (userGroup) {
    await env.OIDC_DB.prepare(`
      INSERT INTO user_groups (user_id, group_id, assigned_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).bind(userId, userGroup.id).run();
  }

  // Log registration event
  await logAuthEvent(env, userId, 'registration', true);

  return { id: userId, email, name };
}
```

### D1-3: Rate Limiting with D1
```typescript
// Check and update rate limiting
export async function checkRateLimit(env: Env, identifier: string): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - (15 * 60 * 1000)); // 15 minutes

  // Get recent failed attempts
  const attempts = await env.OIDC_DB.prepare(`
    SELECT COUNT(*) as count
    FROM auth_events
    WHERE (user_id = ? OR ip_address = ?) 
    AND event_type = 'failed_login'
    AND timestamp > ?
  `).bind(identifier, identifier, windowStart.toISOString()).first();

  const maxAttempts = 5;
  return (attempts?.count || 0) < maxAttempts;
}
```

### D1-4: Session Data Integration
```typescript
// Get user session data for OIDC flows
export async function getUserForSession(env: Env, userId: string) {
  const result = await env.OIDC_DB.prepare(`
    SELECT 
      u.id, 
      u.email, 
      u.name, 
      u.email_verified,
      u.status,
      GROUP_CONCAT(g.name) as groups,
      GROUP_CONCAT(g.permissions) as permissions
    FROM users u
    LEFT JOIN user_groups ug ON u.id = ug.user_id
    LEFT JOIN groups g ON ug.group_id = g.id
    WHERE u.id = ? AND u.status = 'active'
    GROUP BY u.id
  `).bind(userId).first();

  if (!result) {
    throw new Error('User not found');
  }

  return {
    ...result,
    groups: result.groups ? result.groups.split(',') : [],
    permissions: result.permissions ? result.permissions.split(',') : []
  };
}
```

### D1-5: Wrangler Configuration
```toml
# wrangler.toml - Sign-in page configuration
name = "oidc-signin"

[[d1_databases]]
binding = "OIDC_DB"
database_name = "oidc-users"
database_id = "your-database-id"

[env.production]
[[env.production.d1_databases]]
binding = "OIDC_DB"
database_name = "oidc-users"
database_id = "your-production-database-id"
```

### D1-6: Local Development
```bash
# Set up local D1 database for sign-in page development
npx wrangler d1 create oidc-users-local

# Apply migrations
npx wrangler d1 migrations apply oidc-users-local --local

# Seed with test user
npx wrangler d1 execute oidc-users-local --local --command="
INSERT INTO users (id, email, name, password_hash, status, email_verified) 
VALUES ('test-user-1', 'test@example.com', 'Test User', '$2b$10$hash...', 'active', true)
"

# Run sign-in page with D1 binding
npx wrangler pages dev dist --d1 OIDC_DB=your-local-db-id
```

### D1-7: Security Considerations
- **Password Hashing**: Use bcrypt with salt rounds ≥ 12
- **Prepared Statements**: All D1 queries use prepared statements to prevent SQL injection
- **Data Validation**: Validate all inputs before database operations
- **Rate Limiting**: Store rate limiting data in D1 for persistent protection
- **Audit Trail**: All authentication events logged to D1 for security analysis

## Deployment Requirements

### Cloudflare Pages Configuration
- **Custom domain**: Configure custom domain for sign-in
- **SSL certificate**: Auto-provisioned SSL
- **Environment variables**: API endpoints and configuration
- **Cache settings**: Minimal caching for dynamic authentication

### Environment Variables
- `API_BASE_URL`: Authentication API endpoint
- `DEBUG_MODE`: Development debugging flag
- `CSRF_TOKEN_SECRET`: CSRF protection secret
- `OIDC_DB`: D1 database binding (configured in wrangler.toml)

### D1 Database Setup
```bash
# Production setup
npx wrangler d1 create oidc-users-production
npx wrangler d1 migrations apply oidc-users-production

# Configure wrangler.toml with production database ID
```

## Monitoring & Analytics

### Performance Monitoring
- Sign-in page load times
- Authentication API response times
- Error rates for authentication attempts
- User conversion funnel analysis

### Security Monitoring
- Failed login attempt patterns
- Rate limiting effectiveness
- Suspicious authentication activity
- CSRF attack attempts

### User Experience Analytics
- Sign-in completion rates
- Form abandonment points
- Error message frequency
- Mobile vs desktop usage patterns

## Launch Criteria

### Go-Live Requirements
- ✅ All authentication flows tested
- ✅ D1 database schema deployed
- ✅ Security testing completed
- ✅ Performance benchmarks met
- ✅ Cross-browser compatibility verified
- ✅ Accessibility audit passed
- ✅ OIDC integration validated

### Rollback Plan
- Feature flag for instant rollback to Cloudflare Access ✅
- Database rollback procedures ✅
- Monitoring alerts for error rates ✅
- Emergency access procedures ✅

---

**Document Approval:**
- [x] Product Manager
- [x] Engineering Lead
- [x] Security Team
- [x] UX/UI Designer
- [x] DevOps Team
