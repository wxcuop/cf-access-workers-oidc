# Password Reset Email Implementation Plan

This document outlines the complete implementation plan for adding email functionality to the password reset feature.

## Overview

Currently, the password reset system generates tokens and logs email content to the console. This plan will implement actual email sending using a professional email service.

## Current State

### ✅ Already Working
- Password reset token generation and storage
- Token validation and cleanup
- Frontend password reset form
- Backend API endpoints (`POST /auth/reset-password`, `PUT /auth/reset-password/:token`)

### 🔄 Needs Implementation
- Actual email sending service
- Professional email templates
- Error handling for email failures
- Environment configuration for email API keys

## Implementation Plan

### Phase 1: Email Service Setup (Choose One)

#### Option A: Resend (Recommended)
**Why Resend:**
- ✅ 3,000 free emails/month
- ✅ Simple API design
- ✅ Great documentation
- ✅ No complex setup

**Setup Steps:**
1. Sign up at https://resend.com
2. Verify email address
3. Get API key from dashboard
4. (Optional) Add custom domain for professional sender address

#### Option B: SendGrid (Alternative)
**Why SendGrid:**
- ✅ Industry standard
- ✅ 100 free emails/day
- ✅ Advanced analytics

**Setup Steps:**
1. Sign up at https://sendgrid.com
2. Complete sender verification
3. Get API key
4. Configure sender authentication

#### Option C: Mailgun (Alternative)
**Why Mailgun:**
- ✅ Developer-friendly
- ✅ 1,000 free emails/month
- ✅ Good deliverability

**Setup Steps:**
1. Sign up at https://mailgun.com
2. Add and verify domain
3. Get API key and domain name

### Phase 2: Code Implementation

#### Step 1: Environment Configuration
```bash
# Add to Cloudflare Workers secrets
wrangler secret put RESEND_API_KEY
# Enter your API key when prompted
```

#### Step 2: Update Type Definitions
Add email service types to `src/types.ts`:
```typescript
export interface EmailService {
  sendPasswordResetEmail(email: string, token: string, userName?: string): Promise<void>
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}
```

#### Step 3: Create Email Service
Create `src/services/email-service.ts` with:
- Email service interface
- Resend implementation
- Email template generation
- Error handling

#### Step 4: Create Email Templates
Create professional HTML email templates:
- Password reset email
- Welcome email (future)
- Account verification email (future)

#### Step 5: Update Auth Service
Modify `src/auth/auth-service.ts` to:
- Inject email service dependency
- Replace console.log with actual email sending
- Handle email sending errors gracefully

#### Step 6: Update Durable Object
Modify `src/oidc-do.ts` to:
- Initialize email service
- Pass email service to auth service

### Phase 3: Testing & Deployment

#### Step 1: Local Testing
- Test with development API keys
- Verify email delivery
- Test error scenarios

#### Step 2: Production Deployment
- Deploy with production API keys
- Monitor email delivery rates
- Set up logging for email failures

## Detailed Implementation

### 1. Email Service Implementation

```typescript
// src/services/email-service.ts
export class ResendEmailService implements EmailService {
  private apiKey: string
  private fromAddress: string

  constructor(apiKey: string, fromAddress: string = 'OIDC Auth <noreply@resend.dev>') {
    this.apiKey = apiKey
    this.fromAddress = fromAddress
  }

  async sendPasswordResetEmail(email: string, token: string, userName?: string): Promise<void> {
    const resetUrl = `https://wxclogin.pages.dev/reset-password?token=${token}`
    const template = this.generatePasswordResetTemplate(resetUrl, userName)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: this.fromAddress,
        to: email,
        subject: template.subject,
        html: template.html
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    const result = await response.json()
    console.log('Password reset email sent:', result.id)
  }

  private generatePasswordResetTemplate(resetUrl: string, userName?: string): EmailTemplate {
    const subject = 'Reset Your Password - OIDC Authentication'
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .content { background: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 24px 0; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; }
          .link { word-break: break-all; color: #666; font-size: 14px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔐 OIDC Authentication</div>
          </div>
          
          <div class="content">
            <h1 style="color: #1f2937; margin-bottom: 24px;">Reset Your Password</h1>
            
            <p>Hi ${userName || 'there'},</p>
            
            <p>You requested a password reset for your account. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="link">${resetUrl}</div>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          
          <div class="footer">
            <p>This email was sent by OIDC Authentication System</p>
            <p>If you have questions, please contact your administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
Reset Your Password - OIDC Authentication

Hi ${userName || 'there'},

You requested a password reset for your account. 

Reset your password by visiting this link:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email.

--
OIDC Authentication System
    `

    return { subject, html, text }
  }
}
```

### 2. Auth Service Integration

```typescript
// In src/auth/auth-service.ts constructor
constructor(
  users: Map<string, User>,
  sessions: Map<string, UserSession>,
  passwordResetTokens: Map<string, PasswordResetToken>,
  rateLimits: Map<string, RateLimitInfo>,
  jwtService: JWTService,
  userService: UserService,
  storageService: StorageService,
  emailService: EmailService, // Add this
  accessTokenTtl: number
) {
  // ...existing code...
  this.emailService = emailService
}

// Update requestPasswordReset method
async requestPasswordReset(email: string, clientIP?: string): Promise<void> {
  // ...existing rate limiting and user validation...
  
  const user = this.users.get(email)
  if (user && user.status === 'active') {
    // Generate reset token
    const resetToken = generateUUID()
    const resetTokenData: PasswordResetToken = {
      token: resetToken,
      user_email: email,
      created_at: Date.now(),
      expires_at: Date.now() + (3600 * 1000), // 1 hour
      used: false
    }
    
    this.passwordResetTokens.set(resetToken, resetTokenData)
    await this.storageService.savePasswordResetToken(resetToken, resetTokenData)
    
    // Send email
    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken, user.name)
      console.log(`Password reset email sent to ${email}`)
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      // Don't throw error to prevent email enumeration
      // But you might want to log this for monitoring
    }
  }
  
  // Always return success message to prevent email enumeration
}
```

### 3. Durable Object Updates

```typescript
// In src/oidc-do.ts
import { ResendEmailService } from '../services/email-service'

export class OpenIDConnectDurableObject {
  private emailService!: EmailService

  private initializeServices(): void {
    // ...existing service initialization...

    // Initialize email service
    const resendApiKey = this.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not found. Email functionality will be disabled.')
      // You could create a no-op email service for development
    }
    this.emailService = new ResendEmailService(resendApiKey)

    // Update auth service constructor
    this.authService = new AuthService(
      this.users,
      this.sessions,
      this.passwordResetTokens,
      this.rateLimits,
      this.jwtService,
      this.userService,
      this.storageService,
      this.emailService, // Add this
      this.accessTokenTtl
    )
  }
}
```

### 4. Environment Variable Setup

```typescript
// In src/types.ts
export interface Env {
  DO_OIDC: DurableObjectNamespace
  RESEND_API_KEY?: string // Add this
  // ...existing environment variables...
}
```

## Timeline

### Week 1: Setup & Basic Implementation
- [ ] Choose email service (Resend recommended)
- [ ] Sign up and get API key
- [ ] Implement basic email service
- [ ] Create email templates
- [ ] Local testing

### Week 2: Integration & Testing
- [ ] Integrate with auth service
- [ ] Update Durable Object initialization
- [ ] Test end-to-end flow
- [ ] Error handling and edge cases

### Week 3: Production Deployment
- [ ] Deploy to production
- [ ] Monitor email delivery
- [ ] Performance optimization
- [ ] Documentation updates

## Success Criteria

### ✅ Must Have
- [ ] Password reset emails are sent successfully
- [ ] Professional email template with branding
- [ ] Error handling for email failures
- [ ] No email enumeration vulnerabilities
- [ ] Emails deliver to inbox (not spam)

### 🎯 Nice to Have
- [ ] Custom domain for sender address
- [ ] Email delivery tracking
- [ ] Email template customization
- [ ] Multiple email service fallback
- [ ] Email analytics and monitoring

## Cost Estimation

### Resend (Recommended)
- **Free Tier**: 3,000 emails/month
- **Paid**: $20/month for 50,000 emails
- **Estimated Monthly Usage**: 100-500 password reset emails
- **Cost**: $0 (well within free tier)

### SendGrid (Alternative)
- **Free Tier**: 100 emails/day (3,000/month)
- **Paid**: $19.95/month for 50,000 emails
- **Cost**: $0 (within free tier)

## Risk Mitigation

### Email Delivery Issues
- **Risk**: Emails going to spam
- **Mitigation**: Use reputable service, proper authentication, good templates

### Service Downtime
- **Risk**: Email service unavailable
- **Mitigation**: Graceful error handling, don't break password reset flow

### Rate Limiting
- **Risk**: Hitting email service limits
- **Mitigation**: Monitor usage, implement backoff strategies

### Security
- **Risk**: Email enumeration attacks
- **Mitigation**: Always return success message, rate limiting

## Next Steps

1. **Choose Email Service**: Sign up for Resend (recommended)
2. **Get API Key**: Configure in Cloudflare Workers secrets
3. **Implement Email Service**: Start with basic implementation
4. **Test Locally**: Verify email delivery
5. **Deploy & Monitor**: Production deployment with monitoring

## Questions & Decisions Needed

1. **Email Service Choice**: Resend vs SendGrid vs Mailgun?
2. **Custom Domain**: Do you want custom sender domain (e.g., noreply@yourdomain.com)?
3. **Email Templates**: Any specific branding requirements?
4. **Error Handling**: How to handle email failures (log only vs alert)?
5. **Testing Strategy**: Use real emails for testing or test accounts?

---

*Ready to implement when you choose an email service and get API keys!*
