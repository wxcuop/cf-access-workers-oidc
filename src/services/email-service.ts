/**
 * Email service for sending transactional emails
 */

import { EmailService, EmailTemplate } from '../types'

/**
 * Resend Email Service Implementation
 * Sends emails using the Resend API
 */
export class ResendEmailService implements EmailService {
  private apiKey: string
  private fromAddress: string

  constructor(apiKey: string, fromAddress: string = 'OIDC Auth <noreply@resend.dev>') {
    this.apiKey = apiKey
    this.fromAddress = fromAddress
  }

  async sendPasswordResetEmail(email: string, token: string, userName?: string): Promise<void> {
    const resetUrl = `https://oidc-login.nyworking.us/reset-password?token=${token}` // Updated to custom domain
    const template = this.generatePasswordResetTemplate(resetUrl, userName)

    try {
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
          html: template.html,
          text: template.text // Add text version for better compatibility
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || errorText
        } catch {
          errorMessage = errorText
        }
        
        // Handle common Resend testing limitations
        if (response.status === 403 && errorMessage.includes('You can only send testing emails')) {
          console.warn(`⚠️  RESEND TESTING MODE: Can only send emails to verified address. Email for ${email} was blocked.`)
          console.warn(`📧 For testing: Use your verified email address to receive password reset emails.`)
          console.warn(`🔧 For production: Verify a custom domain at https://resend.com/domains`)
          
          // Don't throw an error in testing mode - just log it
          return
        }
        
        throw new Error(`Resend API error (${response.status}): ${errorMessage}`)
      }

      const result = await response.json() as { id: string }
      console.log(`✅ Password reset email sent successfully to ${email} (ID: ${result.id})`)
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      throw error
    }
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
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 40px 20px; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
          }
          .logo { 
            font-size: 24px; 
            font-weight: bold; 
            color: #2563eb; 
            margin-bottom: 8px;
          }
          .content { 
            background: #ffffff; 
            border-radius: 8px; 
            padding: 40px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            border: 1px solid #e5e7eb;
          }
          .button { 
            display: inline-block; 
            background: #2563eb; 
            color: white !important; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 500; 
            margin: 24px 0;
            text-align: center;
          }
          .button:hover {
            background: #1d4ed8;
          }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            color: #666; 
            font-size: 14px; 
          }
          .link { 
            word-break: break-all; 
            color: #666; 
            font-size: 14px; 
            margin: 20px 0; 
            background: #f9f9f9;
            padding: 12px;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
          }
          .warning {
            background: #fef3cd;
            border: 1px solid #fbbf24;
            color: #92400e;
            padding: 12px;
            border-radius: 4px;
            margin: 16px 0;
          }
          h1 {
            color: #1f2937;
            margin-bottom: 24px;
            font-size: 28px;
          }
          p {
            margin-bottom: 16px;
          }
          .security-note {
            font-size: 13px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔐 OIDC Authentication</div>
            <div style="color: #6b7280; font-size: 14px;">Secure Identity Provider</div>
          </div>
          
          <div class="content">
            <h1>Reset Your Password</h1>
            
            <p>Hi ${userName || 'there'},</p>
            
            <p>You requested a password reset for your account. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="link">${resetUrl}</div>
            
            <div class="warning">
              <strong>⏰ This link will expire in 1 hour.</strong>
            </div>
            
            <div class="security-note">
              <p><strong>Security Notice:</strong></p>
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>If you didn't request this password reset, you can safely ignore this email</li>
                <li>Your password will remain unchanged unless you click the link above</li>
                <li>Never share this reset link with anyone</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>This email was sent by <strong>OIDC Authentication System</strong></p>
            <p style="font-size: 12px; color: #9ca3af;">
              If you have questions, please contact your system administrator.
            </p>
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

⏰ This link will expire in 1 hour.

SECURITY NOTICE:
- If you didn't request this password reset, you can safely ignore this email
- Your password will remain unchanged unless you click the link above
- Never share this reset link with anyone

--
OIDC Authentication System

If you have questions, please contact your system administrator.
    `

    return { subject, html, text }
  }
}

/**
 * No-Op Email Service for Development
 * Logs email content instead of sending actual emails
 */
export class NoOpEmailService implements EmailService {
  async sendPasswordResetEmail(email: string, token: string, userName?: string): Promise<void> {
    const resetUrl = `https://oidc-login.nyworking.us/reset-password?token=${token}` // Updated to custom domain
    
    console.log('=== EMAIL SERVICE: NO-OP MODE ===')
    console.log('Would send password reset email:')
    console.log(`To: ${email}`)
    console.log(`Subject: Reset Your Password - OIDC Authentication`)
    console.log(`Reset URL: ${resetUrl}`)
    console.log(`User Name: ${userName || 'N/A'}`)
    console.log('=====================================')
  }
}
