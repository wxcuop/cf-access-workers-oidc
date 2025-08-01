/**
 * Authentication service for login, registration, and session management
 */

import { User, UserSession, AuthRequest, AuthResponse, PasswordResetToken, RateLimitInfo, EmailService } from '../types'
import { generateUUID, checkRateLimit, isValidEmail, validatePassword } from '../security/security-utils'
import { JWTService } from '../oidc/jwt-service'
import { UserService } from '../user/user-service'
import { StorageService } from '../storage/storage-service'
import { GroupService } from '../group/group-service'

export class AuthService {
  private users: Map<string, User>
  private sessions: Map<string, UserSession>
  private passwordResetTokens: Map<string, PasswordResetToken>
  private rateLimits: Map<string, RateLimitInfo>
  private jwtService: JWTService
  private userService: UserService
  private storageService: StorageService
  private groupService: GroupService
  private emailService: EmailService
  private accessTokenTtl: number

  constructor(
    users: Map<string, User>,
    sessions: Map<string, UserSession>,
    passwordResetTokens: Map<string, PasswordResetToken>,
    rateLimits: Map<string, RateLimitInfo>,
    jwtService: JWTService,
    userService: UserService,
    storageService: StorageService,
    groupService: GroupService,
    emailService: EmailService,
    accessTokenTtl: number
  ) {
    this.users = users
    this.sessions = sessions
    this.passwordResetTokens = passwordResetTokens
    this.rateLimits = rateLimits
    this.jwtService = jwtService
    this.userService = userService
    this.storageService = storageService
    this.groupService = groupService
    this.emailService = emailService
    this.accessTokenTtl = accessTokenTtl
  }

  async createUserSession(user: User, userAgent?: string, ipAddress?: string): Promise<UserSession> {
    const sessionId = generateUUID()
    const accessToken = await this.jwtService.generateAccessToken(user)
    const refreshToken = await this.jwtService.generateRefreshToken(user)
    
    const session: UserSession = {
      id: sessionId,
      user_id: user.id,
      user_email: user.email,
      access_token: accessToken,
      refresh_token: refreshToken,
      created_at: Date.now(),
      expires_at: Date.now() + (this.accessTokenTtl * 1000),
      last_activity: Date.now(),
      user_agent: userAgent,
      ip_address: ipAddress
    }
    
    this.sessions.set(sessionId, session)
    return session
  }

  async login(email: string, password: string, clientIP?: string, userAgent?: string): Promise<AuthResponse> {
    // Check rate limiting
    if (clientIP && !checkRateLimit(this.rateLimits, `login:${clientIP}`, 5, 15)) {
      throw new Error('Too many login attempts. Please try again later.')
    }
    
    if (!checkRateLimit(this.rateLimits, `login:${email}`, 3, 15)) {
      throw new Error('Too many login attempts for this account. Please try again later.')
    }
    
    // Validate user credentials
    const user = await this.userService.validateUser(email, password)
    if (!user) {
      throw new Error('Invalid email or password')
    }
    
    // Create session
    const session = await this.createUserSession(user, userAgent, clientIP)
    
    return {
      success: true,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: this.accessTokenTtl,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        groups: user.groups
      }
    }
  }

  async register(email: string, password: string, name: string, clientIP?: string, userAgent?: string): Promise<AuthResponse> {
    // Check rate limiting
    if (clientIP && !checkRateLimit(this.rateLimits, `register:${clientIP}`, 3, 60)) {
      throw new Error('Too many registration attempts. Please try again later.')
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format')
    }
    
    // Check if user already exists
    if (this.users.has(email)) {
      throw new Error('User already exists')
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`)
    }
    
    // Create user
    const user = await this.userService.createUser(email, name, password)
    
    // Create initial session
    const session = await this.createUserSession(user, userAgent, clientIP)
    
    return {
      success: true,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: this.accessTokenTtl,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        groups: user.groups
      }
    }
  }

  async logout(token: string): Promise<void> {
    const payload = await this.jwtService.verifyJWT(token)
    
    if (!payload) {
      throw new Error('Invalid token')
    }
    
    // Find and remove session
    for (const [sessionId, session] of Array.from(this.sessions.entries())) {
      if (session.access_token === token || session.refresh_token === token) {
        this.sessions.delete(sessionId)
        break
      }
    }
  }

  async refreshToken(refresh_token: string): Promise<AuthResponse> {
    const payload = await this.jwtService.verifyJWT(refresh_token)
    
    if (!payload || payload.type !== 'refresh_token') {
      throw new Error('Invalid refresh token')
    }
    
    // Find user and session
    const user = this.users.get(payload.email)
    if (!user || user.status !== 'active') {
      throw new Error('User not found or inactive')
    }
    
    // Generate new access token
    const newAccessToken = await this.jwtService.generateAccessToken(user)
    
    // Update session
    for (const [sessionId, session] of Array.from(this.sessions.entries())) {
      if (session.refresh_token === refresh_token) {
        session.access_token = newAccessToken
        session.expires_at = Date.now() + (this.accessTokenTtl * 1000)
        session.last_activity = Date.now()
        this.sessions.set(sessionId, session)
        break
      }
    }
    
    return {
      success: true,
      access_token: newAccessToken,
      expires_in: this.accessTokenTtl,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        groups: user.groups
      }
    }
  }

  async requestPasswordReset(email: string, clientIP?: string): Promise<void> {
    // Check rate limiting
    if (clientIP && !checkRateLimit(this.rateLimits, `reset:${clientIP}`, 3, 60)) {
      throw new Error('Too many password reset attempts. Please try again later.')
    }
    
    // Always return success to prevent email enumeration
    // But only actually send reset if user exists
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
      
      // Save to persistent storage
      await this.storageService.savePasswordResetToken(resetToken, resetTokenData)
      
      // Send password reset email
      try {
        await this.emailService.sendPasswordResetEmail(email, resetToken, user.name)
        console.log(`Password reset email sent successfully to ${email}`)
      } catch (error) {
        console.error('Failed to send password reset email:', error)
        // Don't throw error to prevent email enumeration
        // The user will still get a success message, but the email failed to send
        // In production, you might want to alert administrators about email failures
      }
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    // Find reset token
    const resetTokenData = this.passwordResetTokens.get(token)
    
    if (!resetTokenData) {
      throw new Error('Invalid or expired reset token')
    }
    
    // Check if token is expired or used
    const currentTime = Date.now()
    
    if (resetTokenData.used || currentTime > resetTokenData.expires_at) {
      throw new Error('Invalid or expired reset token')
    }
    
    // Validate new password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`)
    }
    
    // Update user password
    await this.userService.updatePassword(resetTokenData.user_email, password)
    
    // Mark token as used
    resetTokenData.used = true
    this.passwordResetTokens.set(token, resetTokenData)
    
    // Remove from persistent storage since it's now used
    await this.storageService.deletePasswordResetToken(token)
    
    // Invalidate all sessions for this user
    for (const [sessionId, session] of Array.from(this.sessions.entries())) {
      if (session.user_email === resetTokenData.user_email) {
        this.sessions.delete(sessionId)
      }
    }
  }

  async isAdminRequest(request: any): Promise<boolean> {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return false

    const token = authHeader.replace('Bearer ', '')
    // TODO: Verify JWT and check if user has admin group
    // For now, simplified check - implement proper JWT verification
    try {
      // This is a simplified check - implement proper JWT verification based on your auth flow
      return true // Allow all for now, implement proper admin check
    } catch (error) {
      return false
    }
  }

  // Request handlers
  async handleLogin(request: any): Promise<Response> {
    try {
      const { email, password, remember_me } = await request.json() as AuthRequest
      
      if (!email || !password) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Email and password are required'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
      
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
      const userAgent = request.headers.get('User-Agent')
      
      const response = await this.login(email, password, clientIP, userAgent)
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), { status: 429, headers: { 'Content-Type': 'application/json' } })
        }
        
        if (error.message === 'Invalid email or password') {
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), { status: 401, headers: { 'Content-Type': 'application/json' } })
        }
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  async handleRegister(request: any): Promise<Response> {
    try {
      const { email, password, name } = await request.json()
      
      if (!email || !password || !name) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Email, password, and name are required'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
      
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
      const userAgent = request.headers.get('User-Agent')
      
      const response = await this.register(email, password, name, clientIP, userAgent)
      
      return new Response(JSON.stringify(response), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      })
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), { status: 429, headers: { 'Content-Type': 'application/json' } })
        }
        
        if (error.message === 'User already exists') {
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), { status: 409, headers: { 'Content-Type': 'application/json' } })
        }
        
        if (error.message.includes('Invalid email') || error.message.includes('Password requirements')) {
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), { status: 400, headers: { 'Content-Type': 'application/json' } })
        }
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  async handleLogout(request: any): Promise<Response> {
    try {
      const authHeader = request.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authorization header required'
        }), { status: 401, headers: { 'Content-Type': 'application/json' } })
      }
      
      const token = authHeader.replace('Bearer ', '')
      await this.logout(token)
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Logged out successfully'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid token') {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), { status: 401, headers: { 'Content-Type': 'application/json' } })
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  async handleRefreshToken(request: any): Promise<Response> {
    try {
      const { refresh_token } = await request.json()
      
      if (!refresh_token) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Refresh token required'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
      
      const response = await this.refreshToken(refresh_token)
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid') || error.message.includes('not found')) {
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), { status: 401, headers: { 'Content-Type': 'application/json' } })
        }
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  async handleRequestPasswordReset(request: any): Promise<Response> {
    try {
      const { email } = await request.json()
      
      if (!email) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Email is required'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
      
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
      await this.requestPasswordReset(email, clientIP)
      
      return new Response(JSON.stringify({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), { status: 429, headers: { 'Content-Type': 'application/json' } })
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  async handleResetPassword(request: any): Promise<Response> {
    try {
      const token = request.url.split('/').pop()
      const { password } = await request.json()
      
      if (!token || !password) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Token and password are required'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
      
      await this.resetPassword(token, password)
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Password reset successfully'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid') || error.message.includes('expired')) {
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), { status: 400, headers: { 'Content-Type': 'application/json' } })
        }
        
        if (error.message.includes('Password requirements')) {
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), { status: 400, headers: { 'Content-Type': 'application/json' } })
        }
        
        if (error.message === 'User not found') {
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), { status: 404, headers: { 'Content-Type': 'application/json' } })
        }
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  /**
   * Clean up expired password reset tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    const currentTime = Date.now()
    const expiredTokens: string[] = []
    
    // Find expired tokens
    for (const [token, tokenData] of this.passwordResetTokens.entries()) {
      if (tokenData.used || currentTime > tokenData.expires_at) {
        expiredTokens.push(token)
      }
    }
    
    // Remove expired tokens from memory and storage
    for (const token of expiredTokens) {
      this.passwordResetTokens.delete(token)
      await this.storageService.deletePasswordResetToken(token)
    }
  }

  /**
   * Development: Get all password reset tokens
   */
  async getResetTokens(): Promise<any> {
    // Clean up expired tokens first
    await this.cleanupExpiredTokens()
    
    // Return all tokens (for dev only)
    const tokens = Array.from(this.passwordResetTokens.values()).map(t => ({
      token: t.token,
      email: t.user_email,
      created_at: t.created_at,
      expires_at: t.expires_at,
      used: t.used
    }))
    return {
      success: true,
      tokens,
      count: tokens.length
    }
  }

  /**
   * Development: Get all users for debugging
   */
  async getDevUsers(): Promise<any> {
    const users = Array.from(this.users.values()).map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      groups: u.groups,
      status: u.status,
      created_at: u.created_at,
      last_login: u.last_login,
      hasPassword: !!u.passwordHash
    }))
    
    return {
      success: true,
      users,
      count: users.length
    }
  }

  /**
   * Get all groups for development debugging
   */
  async handleGetDevGroups(request: any): Promise<Response> {
    try {
      const groups = this.groupService.getGroups()
      
      return new Response(JSON.stringify({
        success: true,
        groups: groups.map(group => ({
          name: group.name,
          description: group.description,
          user_count: group.user_count,
          is_system: group.is_system,
          created: group.created_at,
          updated: group.updated_at
        }))
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      })
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to get groups'
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  async handleGetResetTokens(request: any): Promise<Response> {
    // WARNING: This is for development only!
    // In production, remove this endpoint or add proper authentication
    try {
      const result = await this.getResetTokens()
      
      return new Response(JSON.stringify(result), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      })
      
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to retrieve reset tokens'
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  async handleGetDevUsers(request: any): Promise<Response> {
    // WARNING: This is for development only!
    // In production, remove this endpoint or add proper authentication
    try {
      const result = await this.getDevUsers()
      
      return new Response(JSON.stringify(result), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      })
      
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to retrieve users'
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  async handleInitAdmin(request: any): Promise<Response> {
    // WARNING: This is for development only!
    // Force creates admin users regardless of existing users
    try {
      const { generateUUID, hashPassword } = await import('../security/security-utils')
      
      const defaultAdminUsers = [
        {
          email: 'admin@example.com',
          password: 'admin123',
          name: 'System Administrator',
          groups: ['admin']
        },
        {
          email: 'admin2@example.com',
          password: 'admin123',
          name: 'Administrator',
          groups: ['admin']
        },
        {
          email: 'manager@example.com',
          password: 'manager123',
          name: 'Manager',
          groups: ['manager']
        }
      ]

      const createdUsers = []
      for (const userData of defaultAdminUsers) {
        // Check if user already exists
        if (this.users.has(userData.email)) {
          continue
        }
        
        const user = {
          id: generateUUID(),
          email: userData.email,
          name: userData.name,
          passwordHash: await hashPassword(userData.password),
          groups: userData.groups,
          status: 'active' as const,
          created_at: Date.now(),
          updated_at: Date.now(),
          last_login: undefined
        }
        
        this.users.set(user.email, user)
        await this.storageService.saveUser(user.email, user)
        createdUsers.push({
          email: user.email,
          name: user.name,
          groups: user.groups
        })
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Admin users initialized',
        created: createdUsers,
        count: createdUsers.length
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      })
      
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to initialize admin users'
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }
}
