/**
 * Group service for group management operations
 */

import { Group, User } from '../types'
import { isValidGroupName } from '../security/security-utils'
import { getResponse } from '../utils'

export class GroupService {
  private groups: Map<string, Group>
  private users: Map<string, User>
  private storage: DurableObjectStorage

  constructor(
    groups: Map<string, Group>,
    users: Map<string, User>,
    storage: DurableObjectStorage
  ) {
    this.groups = groups
    this.users = users
    this.storage = storage
  }

  async initializeDefaultGroups(): Promise<void> {
    const defaultGroups: Group[] = [
      {
        name: 'admin',
        description: 'System administrators with full access',
        created_at: Date.now(),
        updated_at: Date.now(),
        user_count: 0,
        is_system: true
      },
      {
        name: 'user',
        description: 'Standard users with basic access',
        created_at: Date.now(),
        updated_at: Date.now(),
        user_count: 0,
        is_system: true
      },
      {
        name: 'manager',
        description: 'Managers with elevated permissions',
        created_at: Date.now(),
        updated_at: Date.now(),
        user_count: 0,
        is_system: false
      }
    ]

    for (const group of defaultGroups) {
      this.groups.set(group.name, group)
      await this.storage.put(`group:${group.name}`, group)
    }
  }

  async createGroup(name: string, description: string = ''): Promise<Group> {
    // Validate group name
    if (!name || !isValidGroupName(name)) {
      throw new Error('Invalid group name. Use lowercase letters, numbers, underscores, and hyphens only.')
    }

    if (this.groups.has(name)) {
      throw new Error('Group already exists')
    }

    const group: Group = {
      name,
      description,
      created_at: Date.now(),
      updated_at: Date.now(),
      user_count: 0,
      is_system: false
    }

    this.groups.set(name, group)
    await this.storage.put(`group:${name}`, group)

    return group
  }

  async updateGroup(name: string, updates: Partial<Group>): Promise<Group> {
    const group = this.groups.get(name)
    if (!group) {
      throw new Error('Group not found')
    }

    // Update group fields
    if (updates.description !== undefined) group.description = updates.description
    group.updated_at = Date.now()

    this.groups.set(name, group)
    await this.storage.put(`group:${name}`, group)

    return group
  }

  async deleteGroup(name: string): Promise<void> {
    const group = this.groups.get(name)
    if (!group) {
      throw new Error('Group not found')
    }

    if (group.is_system) {
      throw new Error('Cannot delete system group')
    }

    // Remove group from all users
    for (const [email, user] of this.users.entries()) {
      if (user.groups.includes(name)) {
        user.groups = user.groups.filter(g => g !== name)
        user.updated_at = Date.now()
        this.users.set(email, user)
        await this.storage.put(`user:${email}`, user)
      }
    }

    this.groups.delete(name)
    await this.storage.delete(`group:${name}`)
  }

  getGroups(): Group[] {
    return Array.from(this.groups.values()).map(group => ({
      ...group,
      user_count: this.getUserCountForGroup(group.name)
    }))
  }

  getGroup(name: string): Group | null {
    const group = this.groups.get(name)
    if (!group) {
      return null
    }

    return {
      ...group,
      user_count: this.getUserCountForGroup(group.name)
    }
  }

  private getUserCountForGroup(groupName: string): number {
    let count = 0
    this.users.forEach(user => {
      if (user.groups.includes(groupName)) {
        count++
      }
    })
    return count
  }

  getUsersInGroup(groupName: string): Array<Omit<User, 'passwordHash'>> {
    if (!this.groups.has(groupName)) {
      throw new Error('Group not found')
    }

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

  // Request handlers
  async handleGetGroups(request: any): Promise<Response> {
    const groups = this.getGroups()
    return getResponse({ groups })
  }

  async handleCreateGroup(request: any): Promise<Response> {
    const { name, description } = await request.json()

    try {
      const group = await this.createGroup(name, description)
      return getResponse({ success: true, group })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Group already exists') {
          return getResponse({ success: false, error: error.message }, 409)
        }
        return getResponse({ success: false, error: error.message }, 400)
      }
      return getResponse({ success: false, error: 'Internal server error' }, 500)
    }
  }

  async handleUpdateGroup(request: any): Promise<Response> {
    const groupName = request.url.split('/').pop()
    if (!groupName) {
      return getResponse({ success: false, error: 'Group name required' }, 400)
    }

    const { description } = await request.json()

    try {
      const group = await this.updateGroup(groupName, { description })
      return getResponse({ success: true, group })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Group not found') {
          return getResponse({ success: false, error: error.message }, 404)
        }
        return getResponse({ success: false, error: error.message }, 400)
      }
      return getResponse({ success: false, error: 'Internal server error' }, 500)
    }
  }

  async handleDeleteGroup(request: any): Promise<Response> {
    const groupName = request.url.split('/').pop()
    if (!groupName) {
      return getResponse({ success: false, error: 'Group name required' }, 400)
    }

    try {
      await this.deleteGroup(groupName)
      return getResponse({ success: true })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Group not found') {
          return getResponse({ success: false, error: error.message }, 404)
        }
        return getResponse({ success: false, error: error.message }, 400)
      }
      return getResponse({ success: false, error: 'Internal server error' }, 500)
    }
  }

  async handleGetGroupUsers(request: any): Promise<Response> {
    const groupName = request.url.split('/')[request.url.split('/').length - 2]
    if (!groupName) {
      return getResponse({ success: false, error: 'Group name required' }, 400)
    }

    try {
      const users = this.getUsersInGroup(groupName)
      return getResponse({ users })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Group not found') {
          return getResponse({ success: false, error: error.message }, 404)
        }
        return getResponse({ success: false, error: error.message }, 400)
      }
      return getResponse({ success: false, error: 'Internal server error' }, 500)
    }
  }

  async handleAddUserToGroup(request: any): Promise<Response> {
    const groupName = request.url.split('/')[request.url.split('/').length - 2]
    if (!groupName) {
      return getResponse({ success: false, error: 'Group name required' }, 400)
    }

    const { email } = await request.json()
    if (!email) {
      return getResponse({ success: false, error: 'Email required' }, 400)
    }

    try {
      const group = this.groups.get(groupName)
      if (!group) {
        return getResponse({ success: false, error: 'Group not found' }, 404)
      }

      const user = this.users.get(email)
      if (!user) {
        return getResponse({ success: false, error: 'User not found' }, 404)
      }

      if (!user.groups.includes(groupName)) {
        user.groups.push(groupName)
        user.updated_at = Date.now()
        await this.storage.put(`user:${email}`, user)

        // Update group user count
        group.user_count = (group.user_count || 0) + 1
        group.updated_at = Date.now()
        await this.storage.put(`group:${groupName}`, group)
      }

      return getResponse({ success: true, group })
    } catch (error) {
      if (error instanceof Error) {
        return getResponse({ success: false, error: error.message }, 400)
      }
      return getResponse({ success: false, error: 'Internal server error' }, 500)
    }
  }

  async handleRemoveUserFromGroup(request: any): Promise<Response> {
    const urlParts = request.url.split('/')
    const groupName = urlParts[urlParts.length - 3]
    const email = decodeURIComponent(urlParts[urlParts.length - 1])

    if (!groupName || !email) {
      return getResponse({ success: false, error: 'Group name and email required' }, 400)
    }

    try {
      const group = this.groups.get(groupName)
      if (!group) {
        return getResponse({ success: false, error: 'Group not found' }, 404)
      }

      const user = this.users.get(email)
      if (!user) {
        return getResponse({ success: false, error: 'User not found' }, 404)
      }

      if (user.groups.includes(groupName)) {
        user.groups = user.groups.filter(g => g !== groupName)
        user.updated_at = Date.now()
        await this.storage.put(`user:${email}`, user)

        // Update group user count
        group.user_count = Math.max(0, (group.user_count || 0) - 1)
        group.updated_at = Date.now()
        await this.storage.put(`group:${groupName}`, group)
      }

      return getResponse({ success: true, group })
    } catch (error) {
      if (error instanceof Error) {
        return getResponse({ success: false, error: error.message }, 400)
      }
      return getResponse({ success: false, error: 'Internal server error' }, 500)
    }
  }
}
