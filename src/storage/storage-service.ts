/**
 * Storage service for data persistence and initialization
 */

import { Group, User } from '../types'
import { GroupService } from '../group/group-service'

export class StorageService {
  private storage: DurableObjectStorage
  private groups: Map<string, Group>
  private users: Map<string, User>
  private groupService: GroupService

  constructor(
    storage: DurableObjectStorage,
    groups: Map<string, Group>,
    users: Map<string, User>,
    groupService: GroupService
  ) {
    this.storage = storage
    this.groups = groups
    this.users = users
    this.groupService = groupService
  }

  async loadGroupsAndUsers(): Promise<void> {
    // Load groups from storage
    this.groups.clear()
    const groupEntries = await this.storage.list({ prefix: 'group:' })
    groupEntries.forEach((group, key) => {
      const groupName = key.replace('group:', '')
      this.groups.set(groupName, group as Group)
    })

    // Load users from storage
    this.users.clear()
    const userEntries = await this.storage.list({ prefix: 'user:' })
    userEntries.forEach((user, key) => {
      const userEmail = key.replace('user:', '')
      this.users.set(userEmail, user as User)
    })

    // Initialize default groups if none exist
    if (this.groups.size === 0) {
      await this.groupService.initializeDefaultGroups()
    }

    // Initialize default admin users if none exist
    if (this.users.size === 0) {
      await this.initializeDefaultUsers()
    }
  }

  private async initializeDefaultUsers(): Promise<void> {
    const { generateUUID, hashPassword } = await import('../security/security-utils')
    
    const defaultUsers = [
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

    for (const userData of defaultUsers) {
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
      await this.storage.put(`user:${user.email}`, user)
    }
  }

  async saveUser(email: string, user: User): Promise<void> {
    await this.storage.put(`user:${email}`, user)
  }

  async saveGroup(name: string, group: Group): Promise<void> {
    await this.storage.put(`group:${name}`, group)
  }

  async deleteUser(email: string): Promise<void> {
    await this.storage.delete(`user:${email}`)
  }

  async deleteGroup(name: string): Promise<void> {
    await this.storage.delete(`group:${name}`)
  }

  async saveData(key: string, data: any): Promise<void> {
    await this.storage.put(key, data)
  }

  async loadData(key: string): Promise<any> {
    return await this.storage.get(key)
  }

  async deleteData(key: string): Promise<void> {
    await this.storage.delete(key)
  }

  async listData(options?: { prefix?: string }): Promise<Map<string, any>> {
    return await this.storage.list(options)
  }

  async savePasswordResetToken(token: string, data: any): Promise<void> {
    await this.storage.put(`reset_token:${token}`, data)
  }

  async loadPasswordResetTokens(): Promise<Map<string, any>> {
    const tokens = new Map()
    const tokenEntries = await this.storage.list({ prefix: 'reset_token:' })
    tokenEntries.forEach((tokenData, key) => {
      const token = key.replace('reset_token:', '')
      tokens.set(token, tokenData)
    })
    return tokens
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await this.storage.delete(`reset_token:${token}`)
  }
}
