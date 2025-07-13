# Email Implementation Guide for Password Reset

This guide shows how to implement email sending for password reset functionality.

## Option 1: Resend (Recommended)

### Setup Steps:
1. Sign up at https://resend.com
2. Verify your domain (or use resend.dev for testing)
3. Get your API key from the dashboard
4. Add to Cloudflare Workers environment variables

### Environment Variables:
```bash
wrangler secret put RESEND_API_KEY
# Enter your API key when prompted
```

### Implementation:

```typescript
// src/services/email-service.ts
export class EmailService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userName?: string): Promise<void> {
    const resetUrl = `https://wxclogin.pages.dev/reset-password?token=${resetToken}`
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Reset Your Password</h2>
          <p>Hi ${userName || 'there'},</p>
          <p>You requested a password reset for your account. Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          
          <p><strong>This link will expire in 1 hour.</strong></p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">
            If you didn't request this reset, please ignore this email.<br>
            Your password will remain unchanged.
          </p>
        </div>
      </body>
      </html>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'OIDC Auth <noreply@resend.dev>', // Use your domain after verification
        to: email,
        subject: 'Reset Your Password - OIDC Authentication',
        html: emailHtml
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    const result = await response.json()
    console.log('Email sent successfully:', result.id)
  }
}
```

## Option 2: SendGrid

### Setup:
```bash
wrangler secret put SENDGRID_API_KEY
```

### Implementation:
```typescript
export class SendGridEmailService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userName?: string): Promise<void> {
    const resetUrl = `https://wxclogin.pages.dev/reset-password?token=${resetToken}`
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email, name: userName }],
          subject: 'Reset Your Password - OIDC Authentication'
        }],
        from: { email: 'noreply@yourdomain.com', name: 'OIDC Auth' },
        content: [{
          type: 'text/html',
          value: emailHtml // Same HTML as above
        }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to send email: ${error}`)
    }
  }
}
```

## Option 3: Mailgun

### Setup:
```bash
wrangler secret put MAILGUN_API_KEY
wrangler secret put MAILGUN_DOMAIN
```

### Implementation:
```typescript
export class MailgunEmailService {
  private apiKey: string
  private domain: string

  constructor(apiKey: string, domain: string) {
    this.apiKey = apiKey
    this.domain = domain
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userName?: string): Promise<void> {
    const resetUrl = `https://wxclogin.pages.dev/reset-password?token=${resetToken}`
    
    const formData = new FormData()
    formData.append('from', `OIDC Auth <noreply@${this.domain}>`)
    formData.append('to', email)
    formData.append('subject', 'Reset Your Password - OIDC Authentication')
    formData.append('html', emailHtml) // Same HTML as above

    const response = await fetch(`https://api.mailgun.net/v3/${this.domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${this.apiKey}`)}`
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to send email: ${error}`)
    }
  }
}
```

## Integration with Auth Service

Update your auth service to use the email service:

```typescript
// In auth-service.ts constructor
import { EmailService } from '../services/email-service'

export class AuthService {
  private emailService: EmailService

  constructor(
    // ...existing parameters...
    emailService: EmailService
  ) {
    // ...existing code...
    this.emailService = emailService
  }

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
      
      // Send email instead of console.log
      try {
        await this.emailService.sendPasswordResetEmail(email, resetToken, user.name)
        console.log(`Password reset email sent to ${email}`)
      } catch (error) {
        console.error('Failed to send password reset email:', error)
        // Don't throw error to prevent email enumeration
      }
    }
  }
}
```

## Pricing Comparison

| Service | Free Tier | Paid Plans | Best For |
|---------|-----------|------------|----------|
| **Resend** | 3,000/month | $20/month for 50k | Modern apps, developers |
| **SendGrid** | 100/day | $19.95/month for 50k | Enterprise, established |
| **Mailgun** | 1,000/month | $35/month for 50k | Developers, APIs |
| **Postmark** | 100/month | $15/month for 10k | Transactional emails |
| **Brevo** | 300/day | €25/month for 20k | Marketing + transactional |

## Recommendation

**Start with Resend** because:
- ✅ Generous free tier (3,000 emails/month)
- ✅ Modern, simple API
- ✅ Great documentation
- ✅ Built by developers for developers
- ✅ No complex setup required

You can always switch to another provider later if your needs change.
