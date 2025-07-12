# Refactoring Plan: Remove Cloudflare Access Dependencies

## Overview
This plan outlines the steps to refactor the OIDC provider to remove Cloudflare Access dependencies and implement a custom authentication system with JWT issuance.

## Current Dependencies to Remove
- `cf-access-jwt-assertion` header validation
- `getCloudflareAccessIdentity()` function calls
- `getCloudflareAccessGroups()` function calls  
- `verifyCloudflareAccessJwt()` function calls

## Phase 1: Authentication System Foundation

### 1.1 User Storage Schema
Create user storage structure in Durable Object:
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  country?: string;
  groups?: string[];
  createdAt: number;
  lastLogin?: number;
}

// Storage strategy: Use email as key, keep user objects under 128KB
// Format: storage.put(email, user)
```

**✅ Durable Object Compatibility:**
- Current DO already handles persistent storage
- Web Crypto API available for password hashing
- In-memory Maps work well for sessions

### 1.2 Password Hashing Utilities
Implement secure password hashing:
- Use Web Crypto API for password hashing (PBKDF2 or scrypt)
- Salt generation and verification
- Password strength validation

### 1.3 Session Management
Design JWT-based session management:
- Short-lived access tokens (15-30 minutes)
- Longer-lived refresh tokens (days/weeks)
- Token blacklisting for logout

## Phase 2: Authentication Endpoints

### 2.1 Add `/login` Endpoint
```typescript
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_jwt",
  "expires_in": 1800
}
```

### 2.2 Add `/register` Endpoint
```typescript
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}

Response:
{
  "success": true,
  "user_id": "user_uuid"
}
```

### 2.3 Add `/reset-password` Endpoints
```typescript
// Request password reset
POST /auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Reset email sent"
}

// Confirm password reset
POST /auth/reset-password/confirm
Content-Type: application/json

{
  "token": "reset_token",
  "new_password": "newpassword"
}

Response:
{
  "success": true
}
```

### 2.4 Add `/logout` Endpoint
```typescript
POST /auth/logout
Authorization: Bearer <token>

Response:
{
  "success": true
}
```

### 2.5 Add `/refresh` Endpoint
```typescript
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "refresh_jwt"
}

Response:
{
  "access_token": "new_jwt_token",
  "expires_in": 1800
}
```

### 2.6 Add Admin Endpoints
```typescript
// Get all users (admin only)
GET /admin/users
Authorization: Bearer <admin_token>

Response:
{
  "users": [...],
  "total": 42,
  "page": 1
}

// Create user (admin only)  
POST /admin/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "User Name", 
  "password": "temp_password",
  "groups": ["user"]
}

// Update user (admin only)
PUT /admin/users/:email
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "groups": ["user", "admin"]
}

// Delete user (admin only)
DELETE /admin/users/:email
Authorization: Bearer <admin_token>

// Get system stats (admin only)
GET /admin/stats
Authorization: Bearer <admin_token>

Response:
{
  "total_users": 42,
  "active_sessions": 15,
  "today_logins": 8
}
```
```typescript
POST /refresh
Content-Type: application/json

{
  "refresh_token": "refresh_jwt"
}

Response:
{
  "access_token": "new_jwt_token",
  "expires_in": 1800
}
```

## Phase 3: Update Existing Endpoints

### 3.1 Refactor `/authorize` Endpoint
**Current Flow:**
1. Validates `cf-access-jwt-assertion` header
2. Calls `verifyCloudflareAccessJwt()`
3. Fetches user groups via `getCloudflareAccessGroups()`
4. Gets identity via `getCloudflareAccessIdentity()`

**New Flow:**
1. Check for session cookie or Authorization header
2. Validate custom JWT token
3. Extract user info from JWT payload
4. Proceed with OIDC authorization flow

**Changes Required:**
```typescript
// OLD
const access_jwt = req.headers.get('cf-access-jwt-assertion')
const result = await verifyCloudflareAccessJwt(access_jwt, env)
const groups = await getCloudflareAccessGroups(result.payload.email, env)
const identity = await getCloudflareAccessIdentity(access_jwt)

// NEW
const authHeader = req.headers.get('Authorization')
const sessionToken = authHeader?.replace('Bearer ', '') || getCookieValue(req, 'session')
const user = await validateSessionToken(sessionToken, env)
if (!user) return redirectToLogin(redirect_uri, state)
```

### 3.2 Refactor `/userinfo` Endpoint
**Current Flow:**
1. Extracts Bearer token from Authorization header
2. Calls `getCloudflareAccessIdentity()` with the token

**New Flow:**
1. Validate JWT token (issued by our system)
2. Return user info from JWT payload

**Changes Required:**
```typescript
// OLD
const identity = await getCloudflareAccessIdentity(access_token)

// NEW
const tokenPayload = await validateJWT(access_token, env)
const userinfo = {
  sub: tokenPayload.sub,
  name: tokenPayload.name,
  email: tokenPayload.email,
  // ... other claims
}
```

### 3.3 Update `/token` Endpoint
**Minimal Changes:**
- The token exchange logic can remain mostly the same
- Ensure the Durable Object handles our custom JWT format

## Phase 4: Utility Functions

### 4.1 Create New Utility Functions
Add to `src/utils.js`:

```typescript
// Authentication utilities
async function hashPassword(password: string): Promise<string>
async function verifyPassword(password: string, hash: string): Promise<boolean>
async function generateSessionToken(user: User): Promise<string>
async function validateSessionToken(token: string, env: any): Promise<User | null>
async function validateJWT(token: string, env: any): Promise<any>

// User management
async function createUser(userData: CreateUserData, env: any): Promise<User>
async function findUserByEmail(email: string, env: any): Promise<User | null>
async function updateUserLastLogin(userId: string, env: any): Promise<void>

// Session management
async function blacklistToken(token: string, env: any): Promise<void>
async function isTokenBlacklisted(token: string, env: any): Promise<boolean>
```

### 4.2 Remove Cloudflare Access Utilities
Remove from `src/utils.js`:
- `getCloudflareAccessIdentity()`
- `getCloudflareAccessGroups()`
- `verifyCloudflareAccessJwt()`

## Phase 5: Durable Object Updates

### 5.1 User Storage in Durable Object
Add user management methods to `oidc-do.ts`:
```typescript
class OpenIDConnectDurableObject {
  // ... existing code ...
  users: Map<string, User> // In-memory cache
  
  constructor(state: DurableObjectState, env: Env) {
    // ... existing initialization ...
    this.state.blockConcurrencyWhile(async () => {
      // Load users from storage
      this.users = new Map()
      const userEntries = await this.storage.list({ prefix: 'user:' })
      userEntries.forEach((user, key) => {
        const email = key.replace('user:', '')
        this.users.set(email, user)
      })
      
      // ... existing router setup ...
      router.post('/auth/register', req => this.handleRegister(req))
      router.post('/auth/login', req => this.handleLogin(req))
      router.post('/auth/verify', req => this.handleVerifyToken(req))
      router.post('/auth/logout', req => this.handleLogout(req))
      router.post('/auth/reset-password', req => this.handleResetPassword(req))
      router.post('/auth/reset-password/confirm', req => this.handleResetPasswordConfirm(req))
      
      // Admin routes
      router.get('/admin/users', req => this.handleGetUsers(req))
      router.post('/admin/users', req => this.handleCreateUser(req))
      router.put('/admin/users/:email', req => this.handleUpdateUser(req))
      router.delete('/admin/users/:email', req => this.handleDeleteUser(req))
      router.get('/admin/stats', req => this.handleGetStats(req))
    })
  }
  
  async createUser(userData: CreateUserData): Promise<User>
  async getUserByEmail(email: string): Promise<User | null>
  async updateUser(email: string, updates: Partial<User>): Promise<User>
  async deleteUser(email: string): Promise<boolean>
  
  // Password reset functionality
  async createResetToken(email: string): Promise<string>
  async validateResetToken(token: string): Promise<string | null> // returns email
  
  // Admin functionality
  async getUserStats(): Promise<AdminStats>
  async getAllUsers(page: number, limit: number): Promise<PaginatedUsers>
  async isUserAdmin(email: string): Promise<boolean>
  
  // Leverage existing JWT signing for sessions
  async generateSessionToken(user: User): Promise<string>
}
```

**✅ Leverages Existing Capabilities:**
- Reuse current JWT signing infrastructure
- Extend existing router pattern
- Use proven storage patterns

### 5.2 Token Management
Add JWT validation and blacklisting:
```typescript
async function handleVerifyToken(request: Request): Promise<Response>
async function handleBlacklistToken(request: Request): Promise<Response>
```

## Phase 6: Cloudflare Pages Frontend

### 6.1 Project Structure
Create a new Cloudflare Pages project with the following structure:
```
auth-frontend/
├── public/
│   ├── index.html          # Landing page
│   ├── login.html          # Login form
│   ├── signup.html         # Registration form
│   ├── reset.html          # Password reset request
│   ├── reset-confirm.html  # Password reset confirmation
│   └── admin/
│       ├── index.html      # Admin dashboard
│       ├── users.html      # User management
│       └── settings.html   # System settings
├── src/
│   ├── js/
│   │   ├── auth.js         # Authentication utilities
│   │   ├── api.js          # API communication
│   │   ├── admin.js        # Admin functionality
│   │   └── utils.js        # Common utilities
│   └── css/
│       ├── main.css        # Main styles
│       └── admin.css       # Admin styles
└── functions/              # Cloudflare Pages Functions (optional)
    └── api/
        └── proxy.js        # API proxy if needed
```

### 6.2 Authentication Pages

#### 6.2.1 Login Page (`login.html`)
```html
<!DOCTYPE html>
<html>
<head>
    <title>Login - OIDC Provider</title>
    <link rel="stylesheet" href="/src/css/main.css">
</head>
<body>
    <div class="auth-container">
        <form id="loginForm" class="auth-form">
            <h2>Sign In</h2>
            <div class="form-group">
                <input type="email" id="email" placeholder="Email" required>
            </div>
            <div class="form-group">
                <input type="password" id="password" placeholder="Password" required>
            </div>
            <button type="submit">Sign In</button>
            <div class="auth-links">
                <a href="/signup.html">Create Account</a>
                <a href="/reset.html">Forgot Password?</a>
            </div>
        </form>
    </div>
    <script src="/src/js/auth.js"></script>
</body>
</html>
```

#### 6.2.2 Signup Page (`signup.html`)
```html
<!DOCTYPE html>
<html>
<head>
    <title>Sign Up - OIDC Provider</title>
    <link rel="stylesheet" href="/src/css/main.css">
</head>
<body>
    <div class="auth-container">
        <form id="signupForm" class="auth-form">
            <h2>Create Account</h2>
            <div class="form-group">
                <input type="text" id="name" placeholder="Full Name" required>
            </div>
            <div class="form-group">
                <input type="email" id="email" placeholder="Email" required>
            </div>
            <div class="form-group">
                <input type="password" id="password" placeholder="Password" required>
                <div class="password-requirements">
                    <small>Password must be at least 8 characters with special characters</small>
                </div>
            </div>
            <div class="form-group">
                <input type="password" id="confirmPassword" placeholder="Confirm Password" required>
            </div>
            <button type="submit">Create Account</button>
            <div class="auth-links">
                <a href="/login.html">Already have an account?</a>
            </div>
        </form>
    </div>
    <script src="/src/js/auth.js"></script>
</body>
</html>
```

#### 6.2.3 Password Reset Pages
**Reset Request (`reset.html`):**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Reset Password - OIDC Provider</title>
    <link rel="stylesheet" href="/src/css/main.css">
</head>
<body>
    <div class="auth-container">
        <form id="resetForm" class="auth-form">
            <h2>Reset Password</h2>
            <p>Enter your email to receive password reset instructions.</p>
            <div class="form-group">
                <input type="email" id="email" placeholder="Email" required>
            </div>
            <button type="submit">Send Reset Link</button>
            <div class="auth-links">
                <a href="/login.html">Back to Login</a>
            </div>
        </form>
    </div>
    <script src="/src/js/auth.js"></script>
</body>
</html>
```

### 6.3 Admin Interface

#### 6.3.1 Admin Dashboard (`admin/index.html`)
```html
<!DOCTYPE html>
<html>
<head>
    <title>Admin Dashboard - OIDC Provider</title>
    <link rel="stylesheet" href="/src/css/main.css">
    <link rel="stylesheet" href="/src/css/admin.css">
</head>
<body>
    <div class="admin-layout">
        <nav class="admin-nav">
            <h3>OIDC Admin</h3>
            <ul>
                <li><a href="/admin/index.html" class="active">Dashboard</a></li>
                <li><a href="/admin/users.html">Users</a></li>
                <li><a href="/admin/settings.html">Settings</a></li>
                <li><a href="#" id="logoutBtn">Logout</a></li>
            </ul>
        </nav>
        <main class="admin-content">
            <h1>Dashboard</h1>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Users</h3>
                    <span id="totalUsers">Loading...</span>
                </div>
                <div class="stat-card">
                    <h3>Active Sessions</h3>
                    <span id="activeSessions">Loading...</span>
                </div>
                <div class="stat-card">
                    <h3>Today's Logins</h3>
                    <span id="todayLogins">Loading...</span>
                </div>
            </div>
        </main>
    </div>
    <script src="/src/js/admin.js"></script>
</body>
</html>
```

#### 6.3.2 User Management (`admin/users.html`)
```html
<!DOCTYPE html>
<html>
<head>
    <title>User Management - OIDC Provider</title>
    <link rel="stylesheet" href="/src/css/main.css">
    <link rel="stylesheet" href="/src/css/admin.css">
</head>
<body>
    <div class="admin-layout">
        <nav class="admin-nav">
            <!-- Same nav as dashboard -->
        </nav>
        <main class="admin-content">
            <div class="page-header">
                <h1>User Management</h1>
                <button id="createUserBtn" class="btn-primary">Create User</button>
            </div>
            
            <div class="search-bar">
                <input type="search" id="userSearch" placeholder="Search users...">
            </div>
            
            <table id="usersTable" class="admin-table">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Created</th>
                        <th>Last Login</th>
                        <th>Groups</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Populated by JavaScript -->
                </tbody>
            </table>
            
            <div class="pagination">
                <button id="prevPage">Previous</button>
                <span id="pageInfo">Page 1 of 1</span>
                <button id="nextPage">Next</button>
            </div>
        </main>
    </div>
    
    <!-- User Edit Modal -->
    <div id="userModal" class="modal">
        <div class="modal-content">
            <h3>Edit User</h3>
            <form id="userForm">
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="userEmail" required>
                </div>
                <div class="form-group">
                    <label>Name:</label>
                    <input type="text" id="userName" required>
                </div>
                <div class="form-group">
                    <label>Groups:</label>
                    <input type="text" id="userGroups" placeholder="comma,separated,groups">
                </div>
                <div class="form-actions">
                    <button type="submit">Save</button>
                    <button type="button" id="cancelEdit">Cancel</button>
                    <button type="button" id="deleteUser" class="btn-danger">Delete</button>
                </div>
            </form>
        </div>
    </div>
    
    <script src="/src/js/admin.js"></script>
</body>
</html>
```

### 6.4 JavaScript Utilities

#### 6.4.1 Authentication (`src/js/auth.js`)
```javascript
class AuthManager {
    constructor() {
        this.apiBase = 'https://your-worker.your-subdomain.workers.dev';
        this.init();
    }
    
    init() {
        // Handle login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        
        // Handle signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', this.handleSignup.bind(this));
        }
        
        // Handle reset form
        const resetForm = document.getElementById('resetForm');
        if (resetForm) {
            resetForm.addEventListener('submit', this.handleReset.bind(this));
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                
                // Redirect based on query params or default
                const redirect = new URLSearchParams(window.location.search).get('redirect');
                window.location.href = redirect || '/admin/';
            } else {
                this.showError(data.error || 'Login failed');
            }
        } catch (error) {
            this.showError('Network error occurred');
        }
    }
    
    async handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            if (response.ok) {
                this.showSuccess('Account created successfully! Please login.');
                setTimeout(() => window.location.href = '/login.html', 2000);
            } else {
                this.showError(data.error || 'Registration failed');
            }
        } catch (error) {
            this.showError('Network error occurred');
        }
    }
    
    showError(message) {
        // Create/update error display
        let errorDiv = document.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            document.querySelector('.auth-form').prepend(errorDiv);
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    
    showSuccess(message) {
        // Create/update success display
        let successDiv = document.querySelector('.success-message');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            document.querySelector('.auth-form').prepend(successDiv);
        }
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => new AuthManager());
```

### 6.5 Session Management & Security
- Store JWT tokens in httpOnly cookies (set by Worker)
- Implement automatic token refresh
- Add CSRF protection
- Secure session handling with proper headers

## Phase 7: Configuration Updates

### 7.1 Environment Variables
Add new environment variables:
```
JWT_SECRET_KEY=your-secret-key-for-jwt-signing
SESSION_DURATION=1800
REFRESH_TOKEN_DURATION=604800
PASSWORD_SALT_ROUNDS=12
```

### 7.2 Update `config.yml`
Remove Cloudflare Access specific configuration and add:
```yaml
auth:
  jwt_expiry: 1800
  refresh_expiry: 604800
  password_policy:
    min_length: 8
    require_special_chars: true
```

## Phase 8: Security Considerations

### 8.1 Rate Limiting
Implement rate limiting for:
- Login attempts
- Registration attempts
- Token refresh requests

### 8.2 Security Headers
Add security headers:
- CSRF protection
- Content Security Policy
- Secure cookie settings

### 8.3 Input Validation
Add validation for:
- Email format
- Password strength
- User input sanitization

## ✅ Feasibility Analysis: Cloudflare Workers + Durable Objects

### **Confirmed Capabilities**
1. **JWT Infrastructure**: Current DO already handles RSA key generation, JWT signing, and key rotation
2. **Persistent Storage**: DO storage can handle user accounts, session blacklisting, and configuration
3. **Crypto Support**: Web Crypto API available for secure password hashing (PBKDF2)
4. **Router Pattern**: Existing itty-router setup can be extended for auth endpoints

### **Limitations & Mitigations**
1. **Storage Limits**: 128KB per key limit
   - **Mitigation**: Use email as storage key, keep user objects lightweight
2. **Request Serialization**: DO instances handle requests serially
   - **Impact**: Acceptable for auth workloads, consider sharding for high-volume scenarios
3. **Regional Distribution**: DOs are region-specific
   - **Impact**: Minimal for auth systems, users expect some latency

### **Architecture Advantages**
- **Reuse Existing Code**: JWT signing, storage patterns, and routing already proven
- **Security**: Isolated execution environment with Web Crypto APIs
- **Scalability**: Edge distribution with persistent state
- **Cost**: No additional database costs, leverages existing DO infrastructure

### **Recommended Approach**
Extend the existing `OpenIDConnectDurableObject` rather than creating new infrastructure:
- Add user management routes to existing router
- Reuse JWT signing for session tokens
- Extend storage patterns for user data
- Leverage existing CORS and response utilities

## Implementation Order

1. **Phase 1**: Set up user storage and password utilities
2. **Phase 4**: Create new utility functions  
3. **Phase 5**: Update Durable Object for user management
4. **Phase 2**: Implement authentication endpoints (including admin endpoints)
5. **Phase 3**: Refactor existing OIDC endpoints
6. **Phase 6**: Create Cloudflare Pages frontend (auth + admin)
7. **Phase 9**: Deploy and configure Cloudflare Pages
8. **Phase 7**: Update configuration and environment variables
9. **Phase 8**: Add security features and rate limiting

## Testing Strategy

### Unit Tests
- Password hashing/verification
- JWT token generation/validation
- User CRUD operations

### Integration Tests
- Complete OIDC flow with custom auth
- Login/logout functionality
- Token refresh flow

### Security Tests
- Password brute force protection
- JWT token security
- Session management security

## Migration Strategy

### Development Phase
1. Create feature branch
2. Implement alongside existing Cloudflare Access code
3. Add feature flag to switch between systems

### Production Migration
1. Deploy with feature flag disabled
2. Test thoroughly in production environment
3. Gradually enable for subset of users
4. Full migration once stable
5. Remove Cloudflare Access code

## Rollback Plan

- Keep Cloudflare Access code until fully migrated
- Feature flag allows instant rollback
- Database backups before migration
- Monitoring and alerting for auth failures

---

This plan provides a comprehensive roadmap for removing Cloudflare Access dependencies while maintaining security and functionality. Each phase can be implemented incrementally with proper testing and validation.

## Phase 9: Cloudflare Pages Deployment

### 9.1 Project Setup
```bash
# Create new directory for frontend
mkdir auth-frontend
cd auth-frontend

# Initialize package.json for build dependencies
npm init -y
npm install --save-dev @cloudflare/wrangler
```

### 9.2 Build Configuration
Create `wrangler.toml` for Pages:
```toml
name = "oidc-auth-frontend"
compatibility_date = "2023-05-18"

[env.production]
account_id = "your-account-id"
pages_build_output_dir = "public"

[env.production.vars]
API_BASE_URL = "https://your-worker.your-subdomain.workers.dev"
```

### 9.3 Environment-Specific Configuration
```javascript
// src/js/config.js
const config = {
  development: {
    apiBase: 'http://localhost:8787',
    debug: true
  },
  production: {
    apiBase: 'https://your-worker.your-subdomain.workers.dev',
    debug: false
  }
};

export default config[process.env.NODE_ENV || 'production'];
```

### 9.4 CSS Styling (`src/css/main.css`)
```css
/* Modern, clean styling for auth pages */
:root {
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  --error-color: #dc2626;
  --success-color: #059669;
  --border-color: #d1d5db;
  --text-color: #374151;
  --bg-color: #f9fafb;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-color);
  margin: 0;
  padding: 0;
}

.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.auth-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

button[type="submit"] {
  width: 100%;
  background: var(--primary-color);
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button[type="submit"]:hover {
  background: var(--primary-hover);
}

.error-message {
  background: #fef2f2;
  color: var(--error-color);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: none;
}

.success-message {
  background: #f0fdf4;
  color: var(--success-color);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: none;
}

.auth-links {
  text-align: center;
  margin-top: 1rem;
}

.auth-links a {
  color: var(--primary-color);
  text-decoration: none;
  margin: 0 10px;
}
```

### 9.5 Deployment Scripts
Add to `package.json`:
```json
{
  "scripts": {
    "dev": "wrangler pages dev public",
    "deploy": "wrangler pages publish public"
  }
}
```
