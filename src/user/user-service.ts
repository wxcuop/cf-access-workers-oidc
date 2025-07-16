/**
 * User service for user management operations
 */

import { User, Group, RateLimitInfo } from '../types'
import { generateUUID, hashPassword, verifyPassword, validatePassword, checkRateLimit, isValidEmail } from '../security/security-utils'
import { getResponse } from '../utils'

export class UserService {
  private users: Map<string, User>
  private groups: Map<string, Group>
  private storage: DurableObjectStorage
  private rateLimits: Map<string, RateLimitInfo>

  constructor(
    users: Map<string, User>,
    groups: Map<string, Group>,
    storage: DurableObjectStorage,
    rateLimits: Map<string, RateLimitInfo>
  ) {
    this.users = users
    this.groups = groups
    this.storage = storage
    this.rateLimits = rateLimits
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = this.users.get(email)
    if (!user) {
      return null
    }
    
    if (user.status !== 'active') {
      return null
    }
    
    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return null
    }
    
    // Update last login
    user.last_login = Date.now()
    user.updated_at = Date.now()
    this.users.set(email, user)
    await this.storage.put(`user:${email}`, user)
    
    return user
  }

  async createUser(email: string, name: string, password: string, groups: string[] = ['user']): Promise<User> {
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

    // Validate groups exist
    for (const groupName of groups) {
      if (!this.groups.has(groupName)) {
        throw new Error(`Group '${groupName}' does not exist`)
      }
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const user: User = {
      id: generateUUID(),
      email,
      name,
      passwordHash,
      groups,
      created_at: Date.now(),
      updated_at: Date.now(),
      status: 'active'
    }

    // Store user
    this.users.set(email, user)
    await this.storage.put(`user:${email}`, user)

    return user
  }

  async updateUser(email: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(email)
    if (!user) {
      throw new Error('User not found')
    }

    // Validate groups exist if updating groups
    if (updates.groups) {
      for (const groupName of updates.groups) {
        if (!this.groups.has(groupName)) {
          throw new Error(`Group '${groupName}' does not exist`)
        }
      }
    }

    // Update user fields
    if (updates.name) user.name = updates.name
    if (updates.groups) user.groups = updates.groups
    if (updates.status) user.status = updates.status
    user.updated_at = Date.now()

    this.users.set(email, user)
    await this.storage.put(`user:${email}`, user)

    return user
  }

  async deleteUser(email: string): Promise<void> {
    if (!this.users.has(email)) {
      throw new Error('User not found')
    }

    this.users.delete(email)
    await this.storage.delete(`user:${email}`)
  }

  async updatePassword(email: string, newPassword: string): Promise<void> {
    const user = this.users.get(email)
    if (!user) {
      throw new Error('User not found')
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`)
    }

    const newPasswordHash = await hashPassword(newPassword)
    user.passwordHash = newPasswordHash
    user.updated_at = Date.now()

    this.users.set(email, user)
    await this.storage.put(`user:${email}`, user)
  }

  getUsers(options: {
    page?: number
    limit?: number
    search?: string
    filter?: string
  } = {}): {
    users: Array<Omit<User, 'passwordHash'>>
    total: number
    page: number
    limit: number
    pages: number
  } {
    const { page = 1, limit = 50, search = '', filter = 'all' } = options
    
    let users = Array.from(this.users.values())

    // Apply search filter
    if (search) {
      users = users.filter(user => 
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Apply status filter
    if (filter !== 'all') {
      users = users.filter(user => user.status === filter)
    }

    // Pagination
    const total = users.length
    const pages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const paginatedUsers = users.slice(startIndex, startIndex + limit)

    // Remove sensitive data
    const safeUsers = paginatedUsers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      groups: user.groups,
      created_at: user.created_at,
      last_login: user.last_login,
      status: user.status,
      updated_at: user.updated_at
    }))

    return {
      users: safeUsers,
      total,
      page,
      limit,
      pages
    }
  }

  getUser(email: string): Omit<User, 'passwordHash'> | null {
    const user = this.users.get(email)
    if (!user) {
      return null
    }

    // Return user without password hash
    const { passwordHash, ...safeUser } = user
    return safeUser
  }

  getUsersInGroup(groupName: string): Array<Omit<User, 'passwordHash'>> {
    return Array.from(this.users.values())
      .filter(user => user.groups.includes(groupName))
      .map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        groups: user.groups,
        status: user.status,
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at
      }))
  }

  async assignUserToGroups(email: string, groups: string[]): Promise<User> {
    const user = this.users.get(email)
    if (!user) {
      throw new Error('User not found')
    }

    // Validate all groups exist
    for (const groupName of groups) {
      if (!this.groups.has(groupName)) {
        throw new Error(`Group '${groupName}' does not exist`)
      }
    }

    user.groups = groups
    user.updated_at = Date.now()
    this.users.set(email, user)
    await this.storage.put(`user:${email}`, user)

    return user
  }

  async removeUserFromGroup(email: string, groupName: string): Promise<User> {
    const user = this.users.get(email)
    if (!user) {
      throw new Error('User not found')
    }

    user.groups = user.groups.filter(g => g !== groupName)
    user.updated_at = Date.now()
    this.users.set(email, user)
    await this.storage.put(`user:${email}`, user)

    return user
  }

  // Request handlers
  async handleGetUsers(request: any): Promise<Response> {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const search = url.searchParams.get('search') || ''
    const filter = url.searchParams.get('filter') || 'all'

    const result = this.getUsers({ page, limit, search, filter })
    return getResponse(result)
  }

  async handleCreateUser(request: any): Promise<Response> {
    const { email, name, password, groups } = await request.json()

    if (!email || !name || !password) {
      return getResponse({ error: 'Email, name, and password are required' }, 400)
    }

    try {
      const user = await this.createUser(email, name, password, groups)
      const { passwordHash, ...safeUser } = user
      return getResponse({ success: true, user: safeUser })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User already exists') {
          return getResponse({ error: error.message }, 409)
        }
        return getResponse({ error: error.message }, 400)
      }
      return getResponse({ error: 'Internal server error' }, 500)
    }
  }

  async handleUpdateUser(request: any): Promise<Response> {
    const email = decodeURIComponent(request.url.split('/').pop() || '')
    if (!email) {
      return getResponse({ error: 'Email required' }, 400)
    }

    const { name, groups, status } = await request.json()

    try {
      const user = await this.updateUser(email, { name, groups, status })
      const { passwordHash, ...safeUser } = user
      return getResponse({ success: true, user: safeUser })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return getResponse({ error: error.message }, 404)
        }
        return getResponse({ error: error.message }, 400)
      }
      return getResponse({ error: 'Internal server error' }, 500)
    }
  }

  async handleDeleteUser(request: any): Promise<Response> {
    const email = decodeURIComponent(request.url.split('/').pop() || '')
    if (!email) {
      return getResponse({ error: 'Email required' }, 400)
    }

    try {
      await this.deleteUser(email)
      return getResponse({ success: true, message: 'User deleted successfully' })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return getResponse({ error: error.message }, 404)
        }
        return getResponse({ error: error.message }, 400)
      }
      return getResponse({ error: 'Internal server error' }, 500)
    }
  }

  async handleAssignUserGroups(request: any): Promise<Response> {
    const email = decodeURIComponent(request.url.split('/')[request.url.split('/').length - 2])
    if (!email) {
      return getResponse({ success: false, error: 'Email required' }, 400)
    }

    const { groups } = await request.json()

    try {
      const user = await this.assignUserToGroups(email, groups)
      const { passwordHash, ...safeUser } = user
      return getResponse({ success: true, user: safeUser })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return getResponse({ success: false, error: error.message }, 404)
        }
        return getResponse({ success: false, error: error.message }, 400)
      }
      return getResponse({ success: false, error: 'Internal server error' }, 500)
    }
  }

  async handleRemoveUserFromGroup(request: any): Promise<Response> {
    const urlParts = request.url.split('/')
    const email = decodeURIComponent(urlParts[urlParts.length - 3])
    const groupName = urlParts[urlParts.length - 1]

    if (!email || !groupName) {
      return getResponse({ success: false, error: 'Email and group name required' }, 400)
    }

    try {
      const user = await this.removeUserFromGroup(email, groupName)
      const { passwordHash, ...safeUser } = user
      return getResponse({ success: true, user: safeUser })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return getResponse({ success: false, error: error.message }, 404)
        }
        return getResponse({ success: false, error: error.message }, 400)
      }
      return getResponse({ success: false, error: 'Internal server error' }, 500)
    }
  }
}
