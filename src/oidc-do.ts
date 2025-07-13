/**
 * Refactored OpenID Connect Durable Object
 * Orchestrates all services and handles routing
 */

import { Router } from 'itty-router'
import { getResponse } from './utils'

// @ts-ignore
import config from './../config.yml'
import { 
  Env, 
  ExchangeCode, 
  Jwk, 
  PrivateKey, 
  Group, 
  User, 
  UserSession, 
  PasswordResetToken, 
  RateLimitInfo,
  EmailService
} from './types'

// Services
import { JWTService } from './oidc/jwt-service'
import { OIDCCoreService } from './oidc/oidc-core'
import { UserService } from './user/user-service'
import { GroupService } from './group/group-service'
import { AuthService } from './auth/auth-service'
import { StorageService } from './storage/storage-service'
import { ResendEmailService, NoOpEmailService } from './services/email-service'

/**
 * OpenID Connect Durable Object
 * 
 * Main orchestrator for the OIDC authentication system. This class:
 * - Manages the lifecycle of authentication services
 * - Handles request routing to appropriate services
 * - Maintains shared data stores for services
 * - Provides a unified interface for OIDC operations
 */
export class OpenIDConnectDurableObject {
  state: DurableObjectState
  storage: DurableObjectStorage
  env: Env

  // Configuration
  private jwtTtl!: number
  private accessTokenTtl!: number
  private refreshTokenTtl!: number

  // Data stores - managed by services but initialized here
  // Note: codes Map removed - now handled by SQLite in OIDCCoreService
  private jwks!: Map<string, Jwk>
  private groups!: Map<string, Group>
  private users!: Map<string, User>
  private sessions!: Map<string, UserSession>
  private passwordResetTokens!: Map<string, PasswordResetToken>
  private rateLimits!: Map<string, RateLimitInfo>

  // Services
  private jwtService!: JWTService
  private oidcService!: OIDCCoreService
  private userService!: UserService
  private groupService!: GroupService
  private authService!: AuthService
  private storageService!: StorageService
  private emailService!: EmailService

  private router!: Router<any>

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.storage = state.storage
    this.env = env

    // `blockConcurrencyWhile()` ensures no requests are delivered until
    // initialization completes.
    this.state.blockConcurrencyWhile(async () => {
      await this.initialize()
    })
  }

  private async initialize(): Promise<void> {
    // Load configuration
    this.jwtTtl = config.jwt_ttl || 600 // 10 minutes default
    this.accessTokenTtl = config.access_token_ttl || 1800 // 30 minutes default
    this.refreshTokenTtl = config.refresh_token_ttl || 86400 * 7 // 7 days default

    // Initialize data stores
    // Note: codes Map removed - now handled by SQLite in OIDCCoreService
    this.sessions = new Map()
    this.passwordResetTokens = new Map()
    this.rateLimits = new Map()
    this.groups = new Map()
    this.users = new Map()
    this.jwks = await this.storage.list()

    // Initialize services in dependency order
    this.initializeServices()

    // Load persistent data
    await this.storageService.loadGroupsAndUsers()
    
    // Load password reset tokens from storage
    const storedTokens = await this.storageService.loadPasswordResetTokens()
    this.passwordResetTokens.clear()
    storedTokens.forEach((tokenData, token) => {
      this.passwordResetTokens.set(token, tokenData)
    })

    // Set up routing
    this.setupRouting()
  }

  private initializeEmailService(): EmailService {
    const resendApiKey = this.env.RESEND_API_KEY
    
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not found. Using No-Op email service (emails will be logged only).')
      return new NoOpEmailService()
    }
    
    console.log('Initializing Resend email service with verified domain')
    // Use your verified domain for professional email sending
    return new ResendEmailService(resendApiKey, 'noreply@nyworking.us')
  }

  private initializeServices(): void {
    // Core services
    this.jwtService = new JWTService(
      this.storage,
      this.jwks,
      this.jwtTtl,
      this.accessTokenTtl,
      this.refreshTokenTtl
    )

    this.oidcService = new OIDCCoreService(
      this.storage.sql,
      this.jwtService
    )

    // Data management services
    this.groupService = new GroupService(
      this.groups,
      this.users,
      this.storage
    )

    this.storageService = new StorageService(
      this.storage,
      this.groups,
      this.users,
      this.groupService
    )

    this.userService = new UserService(
      this.users,
      this.groups,
      this.storage,
      this.rateLimits
    )

    // Initialize email service
    this.emailService = this.initializeEmailService()

    // Authentication service (depends on other services)
    this.authService = new AuthService(
      this.users,
      this.sessions,
      this.passwordResetTokens,
      this.rateLimits,
      this.jwtService,
      this.userService,
      this.storageService,
      this.emailService,
      this.accessTokenTtl
    )
  }

  private setupRouting(): void {
    const router = Router()

    // Core OIDC endpoints
    router.post('/sign', req => this.oidcService.handleSign(req))
    router.get('/exchange/:code', req => this.oidcService.handleExchangeCode(req))
    router.get('/jwks', req => this.oidcService.handleGetJwks(req))
    router.patch('/jwks', req => this.oidcService.handleCleanupJwks(req))

    // Authentication endpoints
    router.post('/auth/login', req => this.handleAuthRequest(req, 'login'))
    router.post('/auth/register', req => this.handleAuthRequest(req, 'register'))
    router.post('/auth/logout', req => this.handleAuthRequest(req, 'logout'))
    router.post('/auth/refresh', req => this.handleAuthRequest(req, 'refresh'))
    router.post('/auth/reset-password', req => this.handleAuthRequest(req, 'requestReset'))
    router.put('/auth/reset-password/:token', req => this.handleAuthRequest(req, 'resetPassword'))

    // Development endpoints (remove in production)
    router.get('/dev/reset-tokens', req => this.handleAuthRequest(req, 'getResetTokens'))
    router.get('/dev/debug-token/:token', req => this.handleAuthRequest(req, 'debugToken'))

    // Admin endpoints - Group management
    router.get('/admin/groups', req => this.handleAdminRequest(req, 'getGroups'))
    router.post('/admin/groups', req => this.handleAdminRequest(req, 'createGroup'))
    router.put('/admin/groups/:groupName', req => this.handleAdminRequest(req, 'updateGroup'))
    router.delete('/admin/groups/:groupName', req => this.handleAdminRequest(req, 'deleteGroup'))
    router.get('/admin/groups/:groupName/users', req => this.handleAdminRequest(req, 'getGroupUsers'))

    // Admin endpoints - User management
    router.get('/admin/users', req => this.handleAdminRequest(req, 'getUsers'))
    router.post('/admin/users', req => this.handleAdminRequest(req, 'createUser'))
    router.put('/admin/users/:email', req => this.handleAdminRequest(req, 'updateUser'))
    router.delete('/admin/users/:email', req => this.handleAdminRequest(req, 'deleteUser'))

    // Admin endpoints - User group assignments
    router.post('/admin/users/:email/groups', req => this.handleAdminRequest(req, 'assignUserGroups'))
    router.delete('/admin/users/:email/groups/:groupName', req => this.handleAdminRequest(req, 'removeUserFromGroup'))

    // Default route
    router.all('*', () => getResponse({ error: 'Not found' }, 404))

    this.router = router
  }

  async fetch(request: Request): Promise<Response> {
    try {
      return await this.router.handle(request)
    } catch (error) {
      console.error('Error handling request:', error)
      return getResponse({ error: 'Internal server error' }, 500)
    }
  }

  // Centralized auth request handler
  private async handleAuthRequest(request: any, action: string): Promise<Response> {
    try {
      switch (action) {
        case 'login':
          return await this.authService.handleLogin(request)
        case 'register':
          return await this.authService.handleRegister(request)
        case 'logout':
          return await this.authService.handleLogout(request)
        case 'refresh':
          return await this.authService.handleRefreshToken(request)
        case 'requestReset':
          return await this.authService.handleRequestPasswordReset(request)
        case 'resetPassword':
          return await this.authService.handleResetPassword(request)
        case 'getResetTokens':
          return await this.authService.handleGetResetTokens(request)
        default:
          return getResponse({ error: 'Unknown authentication action' }, 400)
      }
    } catch (error) {
      console.error(`Error handling auth request [${action}]:`, error)
      return getResponse({ error: 'Authentication service error' }, 500)
    }
  }

  // Centralized admin request handler
  private async handleAdminRequest(request: any, action: string): Promise<Response> {
    try {
      // Check admin permissions
      if (!await this.authService.isAdminRequest(request)) {
        return getResponse({ error: 'Unauthorized' }, 401)
      }

      // Route to appropriate service
      switch (action) {
        // Group management
        case 'getGroups':
          return await this.groupService.handleGetGroups(request)
        case 'createGroup':
          return await this.groupService.handleCreateGroup(request)
        case 'updateGroup':
          return await this.groupService.handleUpdateGroup(request)
        case 'deleteGroup':
          return await this.groupService.handleDeleteGroup(request)
        case 'getGroupUsers':
          return await this.groupService.handleGetGroupUsers(request)
        
        // User management
        case 'getUsers':
          return await this.userService.handleGetUsers(request)
        case 'createUser':
          return await this.userService.handleCreateUser(request)
        case 'updateUser':
          return await this.userService.handleUpdateUser(request)
        case 'deleteUser':
          return await this.userService.handleDeleteUser(request)
        
        // User group assignments
        case 'assignUserGroups':
          return await this.userService.handleAssignUserGroups(request)
        case 'removeUserFromGroup':
          return await this.userService.handleRemoveUserFromGroup(request)
        
        default:
          return getResponse({ error: 'Unknown admin action' }, 400)
      }
    } catch (error) {
      console.error(`Error handling admin request [${action}]:`, error)
      return getResponse({ error: 'Admin service error' }, 500)
    }
  }
}
