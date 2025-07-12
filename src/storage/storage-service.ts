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
}
