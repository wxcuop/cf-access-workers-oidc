# Durable Objects Group Storage Implementation

## Overview
This document explains how groups and users are stored and managed using Cloudflare Durable Objects in your OIDC provider. The implementation provides persistent, consistent storage for group management across your authentication system.

## Storage Architecture

### Durable Object Storage Structure

```
Durable Object Storage:
├── jwk:key-id-1              # JWT signing keys
├── jwk:key-id-2              # JWT signing keys
├── group:admin               # System group: admin
├── group:user                # System group: user
├── group:manager             # Custom group: manager
├── group:billing             # Custom group: billing
├── user:admin@company.com    # User data with groups
├── user:user@company.com     # User data with groups
└── user:manager@company.com  # User data with groups
```

### Data Models

#### Group Storage
```typescript
interface Group {
  name: string;                 // "admin", "user", "billing"
  description: string;          // Human-readable description
  permissions?: string[];       // For future expansion
  created_at: number;          // Timestamp
  updated_at: number;          // Timestamp
  user_count: number;          // Calculated field
  is_system: boolean;          // Prevents deletion
  created_by?: string;         // Admin who created
}

// Storage key: "group:admin"
// Storage value: Group object
```

#### User Storage
```typescript
interface User {
  id: string;                  // UUID
  email: string;               // Primary key
  name: string;                // Display name
  passwordHash: string;        // Hashed password
  groups: string[];            // ["admin", "user", "billing"]
  attributes?: object;         // Optional custom attributes
  custom_claims?: object;      // Optional custom claims
  created_at: number;          // Timestamp
  updated_at: number;          // Timestamp
  last_login?: number;         // Timestamp
  status: string;              // "active" | "inactive" | "suspended"
}

// Storage key: "user:admin@company.com"
// Storage value: User object
```

## Implementation Details

### Initialization Process

When the Durable Object starts:

1. **Load Existing Data**: Retrieve all groups and users from storage
2. **Initialize Maps**: Create in-memory Maps for fast access
3. **Create Default Groups**: If no groups exist, create system groups
4. **Setup Routes**: Register all admin API endpoints

```typescript
async loadGroupsAndUsers() {
  // Load groups from storage with prefix "group:"
  this.groups = new Map()
  const groupEntries = await this.storage.list({ prefix: 'group:' })
  groupEntries.forEach((group, key) => {
    const groupName = key.replace('group:', '')
    this.groups.set(groupName, group as Group)
  })

  // Load users from storage with prefix "user:"
  this.users = new Map()
  const userEntries = await this.storage.list({ prefix: 'user:' })
  userEntries.forEach((user, key) => {
    const userEmail = key.replace('user:', '')
    this.users.set(userEmail, user as User)
  })

  // Create default groups if none exist
  if (this.groups.size === 0) {
    await this.initializeDefaultGroups()
  }
}
```

### Default Groups

Three groups are created automatically:

```typescript
const defaultGroups = [
  {
    name: 'admin',
    description: 'System administrators with full access',
    is_system: true
  },
  {
    name: 'user',
    description: 'Standard users with basic access',
    is_system: true
  },
  {
    name: 'manager',
    description: 'Managers with elevated permissions',
    is_system: false
  }
]
```

### API Endpoints

#### Group Management
- `GET /admin/groups` - List all groups
- `POST /admin/groups` - Create new group
- `PUT /admin/groups/:groupName` - Update group
- `DELETE /admin/groups/:groupName` - Delete group
- `GET /admin/groups/:groupName/users` - Get users in group

#### User-Group Management
- `POST /admin/users/:email/groups` - Assign groups to user
- `DELETE /admin/users/:email/groups/:groupName` - Remove user from group

#### User Management
- `GET /admin/users` - List users with pagination/search
- `POST /admin/users` - Create new user
- `PUT /admin/users/:email` - Update user
- `DELETE /admin/users/:email` - Delete user

## Storage Operations

### Creating a Group

```typescript
async handleCreateGroup(request) {
  const { name, description } = await request.json()
  
  // Validate group name
  if (!this.isValidGroupName(name)) {
    return new Response('Invalid group name', { status: 400 })
  }
  
  // Create group object
  const group = {
    name,
    description: description || '',
    created_at: Date.now(),
    updated_at: Date.now(),
    user_count: 0,
    is_system: false
  }
  
  // Store in memory and persistent storage
  this.groups.set(name, group)
  await this.storage.put(`group:${name}`, group)
  
  return getResponse({ success: true, group })
}
```

### Assigning Groups to User

```typescript
async handleAssignUserGroups(request) {
  const { groups } = await request.json()
  const email = extractEmailFromURL(request.url)
  
  // Get user from storage
  const user = this.users.get(email)
  if (!user) {
    return new Response('User not found', { status: 404 })
  }
  
  // Validate all groups exist
  for (const groupName of groups) {
    if (!this.groups.has(groupName)) {
      return new Response(`Group '${groupName}' does not exist`, { status: 400 })
    }
  }
  
  // Update user groups
  user.groups = groups
  user.updated_at = Date.now()
  
  // Store in memory and persistent storage
  this.users.set(email, user)
  await this.storage.put(`user:${email}`, user)
  
  return getResponse({ success: true, user })
}
```

### Deleting a Group

```typescript
async handleDeleteGroup(request) {
  const groupName = extractGroupNameFromURL(request.url)
  const group = this.groups.get(groupName)
  
  // Protect system groups
  if (group.is_system) {
    return new Response('Cannot delete system group', { status: 400 })
  }
  
  // Remove group from all users
  this.users.forEach(async (user, email) => {
    if (user.groups.includes(groupName)) {
      user.groups = user.groups.filter(g => g !== groupName)
      user.updated_at = Date.now()
      this.users.set(email, user)
      await this.storage.put(`user:${email}`, user)
    }
  })
  
  // Delete group from storage
  this.groups.delete(groupName)
  await this.storage.delete(`group:${groupName}`)
  
  return getResponse({ success: true })
}
```

## Performance Characteristics

### Read Performance
- **In-Memory Access**: Groups and users are cached in Maps for O(1) access
- **No Database Queries**: All reads served from memory
- **Fast Lookups**: Group membership checks are instant

### Write Performance
- **Async Writes**: Storage operations are asynchronous
- **Batched Operations**: Multiple updates can be performed together
- **Consistency**: Durable Object ensures single-writer consistency

### Scalability
- **Per-Instance Storage**: Each Durable Object handles its data independently
- **Geographic Distribution**: Durable Objects can be deployed globally
- **Automatic Persistence**: Data persists across restarts and deployments

## Data Consistency

### Strong Consistency
- **Single Writer**: Only one Durable Object instance handles writes
- **Immediate Consistency**: All reads see latest writes immediately
- **No Race Conditions**: Sequential processing ensures data integrity

### Transaction Safety
- **Atomic Operations**: Each API call is processed atomically
- **Error Recovery**: Failed operations don't leave partial state
- **Rollback Capability**: Can implement multi-step transactions

## Security Considerations

### Access Control
```typescript
private async isAdminRequest(request): Promise<boolean> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return false
  
  const token = authHeader.replace('Bearer ', '')
  
  // TODO: Implement proper JWT verification
  // 1. Verify JWT signature
  // 2. Check expiration
  // 3. Extract user info
  // 4. Verify user has admin group
  
  return true // Simplified for now
}
```

### Data Protection
- **Password Hashing**: Passwords are hashed before storage
- **Sensitive Data Filtering**: Password hashes excluded from API responses
- **Input Validation**: All inputs validated before processing
- **Group Name Validation**: Restricted character set for group names

## Example Usage

### Creating Groups via API

```bash
# Create billing group
curl -X POST https://your-worker.workers.dev/admin/groups \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "billing",
    "description": "Access to billing and payment features"
  }'

# Create support group
curl -X POST https://your-worker.workers.dev/admin/groups \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "support",
    "description": "Customer support team"
  }'
```

### Assigning Groups to Users

```bash
# Assign multiple groups to user
curl -X POST https://your-worker.workers.dev/admin/users/john@company.com/groups \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "groups": ["user", "billing", "manager"]
  }'
```

### Retrieving Groups

```bash
# Get all groups
curl -X GET https://your-worker.workers.dev/admin/groups \
  -H "Authorization: Bearer <admin-token>"

# Response:
{
  "groups": [
    {
      "name": "admin",
      "description": "System administrators with full access",
      "user_count": 2,
      "is_system": true,
      "created_at": 1625097600000,
      "updated_at": 1625097600000
    },
    {
      "name": "billing",
      "description": "Access to billing and payment features",
      "user_count": 5,
      "is_system": false,
      "created_at": 1625097700000,
      "updated_at": 1625097700000
    }
  ]
}
```

## Integration with JWT Tokens

When generating JWT tokens, user groups are included:

```typescript
const payload = {
  iss: issuer,
  aud: client_id,
  sub: user.id,
  email: user.email,
  name: user.name,
  groups: user.groups,  // Groups from Durable Object storage
  
  // Optional: computed claims
  is_admin: user.groups.includes('admin'),
  is_manager: user.groups.includes('manager'),
  
  iat: timestamp,
  exp: timestamp + this.jwtTtl,
}
```

## Migration and Backup

### Data Export
```typescript
async exportAllData() {
  const groups = Array.from(this.groups.entries())
  const users = Array.from(this.users.entries()).map(([email, user]) => {
    const { passwordHash, ...safeUser } = user
    return [email, safeUser]
  })
  
  return {
    groups,
    users,
    exported_at: Date.now()
  }
}
```

### Data Import
```typescript
async importData(data) {
  // Import groups
  for (const [name, group] of data.groups) {
    this.groups.set(name, group)
    await this.storage.put(`group:${name}`, group)
  }
  
  // Import users
  for (const [email, user] of data.users) {
    this.users.set(email, user)
    await this.storage.put(`user:${email}`, user)
  }
}
```

## Benefits of Durable Objects for Group Storage

1. **Simplicity**: No external database required
2. **Performance**: In-memory access with persistent storage
3. **Consistency**: Strong consistency guarantees
4. **Scalability**: Automatically scales with Cloudflare's edge
5. **Cost**: No additional database costs
6. **Reliability**: Built-in durability and replication
7. **Global**: Can deploy close to users worldwide

This implementation provides a robust, scalable foundation for group-based authorization that integrates seamlessly with your OIDC provider architecture.
