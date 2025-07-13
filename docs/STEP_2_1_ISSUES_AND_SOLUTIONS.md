# Step 2.1 Issues and Solutions

This document outlines the issues encountered during Step 2.1 (Sign-In Page Foundation) implementation and their solutions.

## Overview

Step 2.1 involved creating a professional frontend authentication system and deploying it to Cloudflare Pages without using a custom domain. The implementation was successful but encountered several technical challenges that required debugging and fixes.

## Timeline Summary

1. **Frontend Creation**: Complete authentication UI with HTML, CSS, and JavaScript
2. **Backend Deployment**: Cloudflare Workers deployment to `https://wxc-oidc.wxcuop.workers.dev`
3. **JWKS Endpoint Fix**: Resolved Durable Object URL issues
4. **Frontend Deployment**: Cloudflare Pages deployment to `https://wxclogin.pages.dev`
5. **Authentication Flow Debugging**: Fixed registration and login issues

## Issues Encountered and Solutions

### 1. TypeScript Compilation Errors

**Issue**: TypeScript compilation failed with conflicting type definitions between Node.js and Cloudflare Workers.

**Error Messages**:
```
src/main.ts:1:1 - error TS6200: Definitions of the following identifiers conflict with those in another file
error TS2304: Cannot find name 'URLSearchParams'
```

**Root Cause**: Conflicting type definitions in `tsconfig.json` between Node.js types and Cloudflare Workers types.

**Solution**: Updated `tsconfig.json` to use only Cloudflare Workers types:
```json
{
  "compilerOptions": {
    "types": ["@cloudflare/workers-types"]
  }
}
```

**Files Modified**: `tsconfig.json`

---

### 2. JWKS Endpoint "Invalid URL" Error

**Issue**: The JWKS endpoint was returning "Invalid URL: /jwks" when accessed via `https://wxc-oidc.wxcuop.workers.dev/.well-known/jwks`.

**Error Messages**:
```bash
curl https://wxc-oidc.wxcuop.workers.dev/.well-known/jwks
# Response: "Invalid URL: /jwks"
```

**Root Cause**: Durable Objects `stub.fetch()` calls were using relative URLs (`'/jwks'`) instead of full URLs when making internal requests.

**Technical Details**: Cloudflare Workers Durable Objects require full URLs in fetch calls, not relative paths. The code was calling:
```javascript
const response = await stub.fetch('/jwks');  // ❌ Invalid
```

**Solution**: Updated all `stub.fetch()` calls in `src/main.ts` to use full URLs:
```javascript
const response = await stub.fetch('https://fake-host/jwks');  // ✅ Valid
```

**Files Modified**: 
- `src/main.ts` - Updated `handleGetJwks`, `handleToken`, and other Durable Object calls
- Created `docs/JWKS_ENDPOINT_FIX.md` for detailed documentation

---

### 3. Frontend Registration Field Name Mismatch

**Issue**: Registration was failing because the frontend was sending `fullName` but the backend expected `name`.

**Error Symptoms**: Registration requests would fail with field validation errors.

**Root Cause**: Inconsistent field naming between frontend form data and backend API expectations.

**Frontend Code (Original)**:
```javascript
const response = await this.apiCall('POST', this.config.endpoints.register, {
    fullName: fullName,  // ❌ Backend doesn't recognize this field
    email,
    password
});
```

**Solution**: Updated frontend to use correct field name:
```javascript
const response = await this.apiCall('POST', this.config.endpoints.register, {
    name: fullName,  // ✅ Backend expects 'name'
    email,
    password
});
```

**Files Modified**: `frontend/signin/js/auth.js`

---

### 4. OIDC Client ID Configuration

**Issue**: Frontend was using placeholder client ID instead of the actual configured client ID.

**Problem**: The OIDC configuration in the frontend had a placeholder value that didn't match the backend configuration.

**Solution**: Updated frontend OIDC configuration with correct client ID from `config.yml`:
```javascript
oidc: {
    clientId: 'b78f6b19-50ca-4bab-85bf-93e6c51ff8fb', // ✅ Actual client ID from config.yml
    redirectUri: window.location.origin + '/oidc/callback',
    scope: 'openid profile email groups',
    responseType: 'code',
    // ...
}
```

**Files Modified**: `frontend/signin/js/auth.js`

---

### 5. CORS Configuration for Pages Domain

**Issue**: CORS errors when frontend at `wxclogin.pages.dev` tried to communicate with backend.

**Solution**: Updated `config.yml` to include the Pages domain in CORS origins:
```yaml
cors:
  origins:
    - "https://wxclogin.pages.dev"
    - "http://localhost:*"
  # ...
```

**Files Modified**: `config.yml`

---

### 6. Authentication Success Handling

**Issue**: After successful authentication, users were seeing "signin failed" messages despite successful registration/login.

**Problem**: The frontend was over-complicating the success flow and not properly handling the response.

**Solution**: Simplified authentication success handling:
```javascript
if (response.success) {
    // Store tokens
    this.storeTokens(response.data);
    
    // Show success message
    this.showToast('Sign in successful! You are now logged in.', 'success');
    
    // Log success for debugging
    console.log('Sign in successful, user logged in:', response.data.user);
}
```

**Files Modified**: `frontend/signin/js/auth.js`

### 7. Authentication Response Structure Mismatch

**Issue**: Frontend showing "Sign in failed" even when backend returned successful authentication with tokens.

**Error Symptoms**: Browser network tab showed successful API response with `"success": true` and tokens, but frontend displayed error message.

**Root Cause**: Mismatch between backend response structure and frontend expectations:
- Backend returned: `{ success: true, access_token: "...", refresh_token: "...", user: {...} }`
- Frontend expected: `{ success: true, data: { accessToken: "...", refreshToken: "..." } }`

**Technical Details**: 
1. Frontend was trying to access `response.data.accessToken` but tokens were at root level
2. Backend used snake_case (`access_token`) but frontend expected camelCase (`accessToken`)

**Solution**: 
1. Updated authentication handlers to access tokens directly from response
2. Modified `storeTokens()` method to handle both naming conventions

```javascript
// Before (❌ Incorrect)
this.storeTokens(response.data);

// After (✅ Correct)  
this.storeTokens(response);

// Updated storeTokens method to handle both formats
storeTokens(tokenData) {
    const accessToken = tokenData.accessToken || tokenData.access_token;
    const refreshToken = tokenData.refreshToken || tokenData.refresh_token;
    // ...
}
```

**Files Modified**: `frontend/signin/js/auth.js`

### 8. User Already Exists During Registration Testing

**Issue**: Registration fails with "User already exists" error when trying to register the same email address multiple times during testing.

**Error Symptoms**: 
- Registration form shows "Registration failed. Please try again."
- Network response shows `{"success":false,"error":"User already exists"}`
- This occurs when testing with the same email address after successful initial registration

**Root Cause**: The authentication system correctly prevents duplicate user registration with the same email address.

**Solutions**:
1. **For Testing**: Use different email addresses for each registration test
2. **For Production**: This is correct behavior - users should be directed to sign in instead
3. **Enhanced UX**: ✅ **IMPLEMENTED** - Frontend detects "User already exists" and shows helpful message with sign-in link

**Frontend Enhancement** (✅ **IMPLEMENTED**):
```javascript
if (error.message.includes('User already exists') || error.message.includes('Email already exists')) {
    errorMessage = 'An account with this email already exists. <a href="/" style="color: #2563eb; text-decoration: underline; font-weight: 500;">Please sign in instead</a>.';
}
```

**Additional Changes**:
- Updated `validation.js` to support HTML content in error messages
- Added proper styling for the sign-in link
- Enhanced user experience for duplicate registration attempts

**Status**: ✅ **COMPLETE** - Enhanced UX implemented. Users now get helpful guidance when trying to register existing accounts.

---

### 9. Password Reset Token Validation Issues

**Issue**: Password reset tokens were showing as "Invalid or expired reset token" even when tokens were valid and recently generated.

**Error Symptoms**:
- User could reach password reset page with valid token in URL
- Backend was responding with "Invalid or expired reset token" when attempting to reset password
- Debug logs showed `All tokens: []` and `Found token data: null`

**Root Cause**: Password reset tokens were stored in memory only and not being persisted to Durable Object storage. When the Durable Object reinitialized (which happens frequently in Cloudflare Workers), the tokens map was reset to empty, losing all previously generated tokens.

**Technical Details**:
1. `passwordResetTokens` was initialized as `new Map()` on every DO initialization
2. Tokens were saved to memory but not to persistent storage
3. No loading of tokens from storage during initialization
4. Token validation always failed because tokens didn't persist between DO instances

**Solution**: Implemented complete password reset token persistence:

1. **Added Storage Methods** (`storage-service.ts`):
```typescript
async savePasswordResetToken(token: string, data: any): Promise<void>
async loadPasswordResetTokens(): Promise<Map<string, any>>
async deletePasswordResetToken(token: string): Promise<void>
```

2. **Updated Initialization** (`oidc-do.ts`):
```typescript
// Load password reset tokens from storage
const storedTokens = await this.storageService.loadPasswordResetTokens()
this.passwordResetTokens.clear()
storedTokens.forEach((tokenData, token) => {
  this.passwordResetTokens.set(token, tokenData)
})
```

3. **Enhanced Auth Service** (`auth-service.ts`):
- Added storage service injection to constructor
- Save tokens to persistent storage when created: `await this.storageService.savePasswordResetToken(resetToken, resetTokenData)`
- Delete tokens from storage when used: `await this.storageService.deletePasswordResetToken(token)`
- Added cleanup method for expired tokens

4. **Added Token Cleanup**:
```typescript
async cleanupExpiredTokens(): Promise<void> {
  // Remove expired/used tokens from memory and storage
}
```

**Files Modified**:
- `src/storage/storage-service.ts` - Added token persistence methods
- `src/oidc-do.ts` - Updated initialization and service injection
- `src/auth/auth-service.ts` - Enhanced with storage persistence and cleanup

**Status**: ✅ **COMPLETE** - Password reset functionality fully operational with persistent token storage.

---

## Deployment Workflow Clarifications

### Cloudflare Pages (Frontend)
- **Automatic Deployment**: Connected to GitHub, deploys automatically on push to main branch
- **URL**: `https://wxclogin.pages.dev`
- **Process**: Git push → Automatic build and deploy
- **No manual intervention required**

### Cloudflare Workers (Backend)
- **Manual Deployment**: Requires `wrangler deploy` command
- **URL**: `https://wxc-oidc.wxcuop.workers.dev`
- **Process**: Code changes → `wrangler deploy` → Live update
- **Manual deployment required for each update**

## Testing and Validation

### Successful Endpoints
- ✅ `https://wxc-oidc.wxcuop.workers.dev/.well-known/jwks` - Returns proper JWKS
- ✅ `https://wxc-oidc.wxcuop.workers.dev/auth/register` - User registration
- ✅ `https://wxc-oidc.wxcuop.workers.dev/auth/login` - User authentication
- ✅ `https://wxc-oidc.wxcuop.workers.dev/auth/reset-password` - Password reset request
- ✅ `https://wxc-oidc.wxcuop.workers.dev/auth/reset-password/:token` - Password reset completion
- ✅ `https://wxclogin.pages.dev` - Frontend authentication pages

### Authentication Flow
1. User visits `https://wxclogin.pages.dev`
2. User fills out registration or login form
3. Frontend sends API request to `https://wxc-oidc.wxcuop.workers.dev`
4. Backend processes authentication and returns tokens
5. Frontend stores tokens and shows success message

### Password Reset Flow
1. User requests password reset via email
2. Backend generates token and stores in persistent storage
3. User clicks reset link with token
4. Frontend validates token and allows password change
5. Backend validates token, updates password, and removes token from storage

## Key Learnings

1. **Durable Objects URL Requirements**: Always use full URLs in `stub.fetch()` calls
2. **Field Name Consistency**: Ensure frontend and backend use matching field names
3. **CORS Configuration**: Update CORS settings when adding new frontend domains
4. **Deployment Workflows**: Understand the difference between automatic (Pages) and manual (Workers) deployment
5. **Error Handling**: Implement comprehensive error handling for better debugging
6. **Response Structure Validation**: Always verify frontend expectations match backend response format
7. **Field Naming Conventions**: Handle both snake_case and camelCase in API responses
8. **Durable Object Persistence**: Critical data like tokens must be stored in persistent storage, not just memory
9. **State Management**: Initialize data from storage during Durable Object startup to maintain state across instances

## Files Created/Modified

### New Files
- `frontend/signin/index.html` - Main sign-in page
- `frontend/signin/register.html` - Registration page  
- `frontend/signin/reset-password.html` - Password reset page
- `frontend/signin/css/main.css` - Main stylesheet (500+ lines)
- `frontend/signin/css/auth.css` - Authentication-specific styles (800+ lines)
- `frontend/signin/js/auth.js` - Main authentication logic (800+ lines)
- `frontend/signin/js/validation.js` - Form validation utilities
- `frontend/signin/js/utils.js` - Utility functions
- `docs/JWKS_ENDPOINT_FIX.md` - JWKS debugging documentation

### Modified Files
- `src/main.ts` - Fixed Durable Object fetch calls
- `src/auth/auth-service.ts` - Enhanced with password reset persistence and cleanup
- `src/storage/storage-service.ts` - Added password reset token persistence methods
- `src/oidc-do.ts` - Updated initialization and service injection
- `config.yml` - Updated CORS and redirect URIs
- `tsconfig.json` - Fixed TypeScript configuration

## Current Status

✅ **Complete**: Step 2.1 Sign-In Page Foundation
- Professional authentication UI deployed to Cloudflare Pages
- Working backend API with proper OIDC endpoints
- Successful authentication flows (registration and login)
- **Complete password reset functionality with persistent token storage**
- Comprehensive error handling and validation
- Mobile-responsive design with accessibility features

**Next Steps**: Ready for Step 2.2 implementation (client secrets, user groups, OIDC integration testing) + Custom domain migration to nyworking.us

## Support Information

- **Frontend URL**: https://wxclogin.pages.dev → **Migrating to**: `https://auth.nyworking.us`
- **Backend URL**: https://wxc-oidc.wxcuop.workers.dev → **Migrating to**: `https://auth-api.nyworking.us`
- **Repository**: https://github.com/wxcuop/cf-workers-oidc
- **Deployment**: Cloudflare Pages (auto) + Cloudflare Workers (manual)
- **Migration Plan**: See `docs/CUSTOM_DOMAIN_MIGRATION_PLAN.md`

---

*Document created: January 2025*
*Updated: July 2025 - Added custom domain migration plan*
*Status: Step 2.1 Complete - Authentication system fully operational with password reset + email service*
