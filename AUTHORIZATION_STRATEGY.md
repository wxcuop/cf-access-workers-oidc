# Authorization Strategy Guide: Groups vs Claims vs RBAC

## Overview
This guide outlines different authorization approaches for your OIDC provider, comparing groups, claims, and role-based access control (RBAC) to help you choose the best strategy for your use case.

## Authorization Models Comparison

### 1. Groups-Based Authorization (Recommended Start)

**What it is:**
Simple group membership model where users belong to one or more groups, and applications make authorization decisions based on group membership.

**Example Structure:**
```yaml
# In your config.yml or user database
users:
  - email: "admin@company.com"
    groups: ["admin", "users", "billing"]
  - email: "user@company.com" 
    groups: ["users"]
  - email: "manager@company.com"
    groups: ["managers", "users"]
```

**JWT Token Claims:**
```json
{
  "sub": "user-123",
  "email": "admin@company.com",
  "name": "John Admin",
  "groups": ["admin", "users", "billing"],
  "iat": 1625097600,
  "exp": 1625101200
}
```

**Pros:**
- ✅ Simple to understand and implement
- ✅ Easy to manage in admin interface
- ✅ Maps well to organizational structure
- ✅ Widely supported by applications
- ✅ Good for small to medium organizations

**Cons:**
- ❌ Can become unwieldy with many groups
- ❌ Less granular than other approaches
- ❌ Group explosion problem in large orgs

### 2. Claims-Based Authorization (Advanced)

**What it is:**
Fine-grained authorization using custom claims that represent specific permissions or attributes.

**Example Structure:**
```json
{
  "sub": "user-123",
  "email": "admin@company.com",
  "name": "John Admin",
  "department": "engineering",
  "clearance_level": "secret",
  "permissions": [
    "users:read", 
    "users:write", 
    "billing:read",
    "admin:settings"
  ],
  "features": ["beta_testing", "advanced_reporting"],
  "custom_claims": {
    "cost_center": "eng-001",
    "manager": "jane@company.com",
    "region": "us-west"
  }
}
```

**Pros:**
- ✅ Very granular control
- ✅ Flexible and extensible
- ✅ Application-specific authorization
- ✅ Good for microservices architecture
- ✅ Supports complex business rules

**Cons:**
- ❌ More complex to implement
- ❌ Harder to manage and audit
- ❌ Can lead to large JWT tokens
- ❌ Applications need custom logic

### 3. Role-Based Access Control (RBAC) (Enterprise)

**What it is:**
Hierarchical model with roles that contain permissions, users are assigned roles.

**Example Structure:**
```yaml
roles:
  admin:
    permissions:
      - "users:*"
      - "settings:*"
      - "billing:*"
    inherits: ["manager"]
  
  manager:
    permissions:
      - "users:read"
      - "users:update"
      - "reports:*"
    inherits: ["user"]
  
  user:
    permissions:
      - "profile:read"
      - "profile:update"

users:
  - email: "admin@company.com"
    roles: ["admin"]
  - email: "manager@company.com"
    roles: ["manager", "billing_manager"]
```

**JWT Token Claims:**
```json
{
  "sub": "user-123",
  "email": "admin@company.com",
  "roles": ["admin"],
  "permissions": [
    "users:create", "users:read", "users:update", "users:delete",
    "settings:read", "settings:write",
    "billing:read", "billing:write"
  ]
}
```

**Pros:**
- ✅ Scalable for large organizations
- ✅ Clear separation of concerns
- ✅ Supports inheritance and hierarchies
- ✅ Industry standard approach
- ✅ Good audit trail

**Cons:**
- ❌ Most complex to implement
- ❌ Requires more admin infrastructure
- ❌ Can be over-engineered for simple use cases

## Recommended Implementation Strategy

### Phase 1: Start with Groups (Immediate)

For your initial implementation, start with a simple groups-based approach:

**User Schema Update:**
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  groups: string[];  // Simple array of group names
  country?: string;
  createdAt: number;
  lastLogin?: number;
  status: 'active' | 'inactive' | 'suspended';
}
```

**Common Group Structure:**
```typescript
// Standard groups for most organizations
const STANDARD_GROUPS = [
  'admin',           // Full system access
  'manager',         // Management permissions
  'user',            // Basic user access
  'billing',         // Billing access
  'support',         // Support team access
  'readonly',        // Read-only access
  'api_access',      // API access
];

// Department-based groups
const DEPARTMENT_GROUPS = [
  'engineering',
  'sales',
  'marketing',
  'hr',
  'finance'
];
```

**JWT Claims Implementation:**
```typescript
// In your JWT payload generation
const payload = {
  iss: issuer,
  aud: client_id,
  sub: user.id,
  email: user.email,
  name: user.name,
  groups: user.groups,
  // Optional: flatten common patterns
  is_admin: user.groups.includes('admin'),
  is_manager: user.groups.includes('manager'),
  departments: user.groups.filter(g => DEPARTMENT_GROUPS.includes(g)),
  iat: timestamp,
  exp: timestamp + this.jwtTtl,
};
```

### Phase 2: Add Custom Claims (Later)

As your needs grow, add application-specific claims:

**Extended User Schema:**
```typescript
interface User {
  // ...existing fields...
  groups: string[];
  attributes: {
    department?: string;
    cost_center?: string;
    clearance_level?: string;
    region?: string;
    manager_email?: string;
  };
  custom_claims: Record<string, any>;
}
```

**JWT with Custom Claims:**
```typescript
const payload = {
  // ...standard claims...
  groups: user.groups,
  
  // Custom attributes
  department: user.attributes.department,
  region: user.attributes.region,
  
  // Application-specific claims
  ...user.custom_claims,
  
  // Computed claims
  effective_permissions: computePermissions(user),
};
```

## Implementation Examples

### 1. Admin Interface for Groups Management

**Admin API Endpoints:**
```typescript
// Get available groups
GET /admin/groups
Response: {
  "groups": [
    {
      "name": "admin",
      "description": "Full system administrators",
      "user_count": 5,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}

// Create new group
POST /admin/groups
{
  "name": "support_tier2",
  "description": "Tier 2 support team",
  "default_permissions": ["users:read", "tickets:write"]
}

// Assign user to groups
PUT /admin/users/:email/groups
{
  "groups": ["user", "support", "billing"]
}
```

**Admin UI for Group Management:**
```html
<!-- User Edit Modal -->
<div class="user-groups-section">
  <h4>Groups</h4>
  <div class="groups-container">
    <div class="available-groups">
      <h5>Available Groups</h5>
      <div class="group-list">
        <label><input type="checkbox" value="admin"> Admin</label>
        <label><input type="checkbox" value="manager"> Manager</label>
        <label><input type="checkbox" value="billing"> Billing</label>
        <label><input type="checkbox" value="support"> Support</label>
      </div>
    </div>
    <div class="user-groups">
      <h5>User's Groups</h5>
      <div class="assigned-groups">
        <span class="group-tag">user <button class="remove">×</button></span>
        <span class="group-tag">billing <button class="remove">×</button></span>
      </div>
    </div>
  </div>
</div>
```

### 2. Application Authorization Examples

**Next.js Middleware Authorization:**
```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Admin routes
    if (pathname.startsWith('/admin')) {
      if (!token?.groups?.includes('admin')) {
        return new Response('Unauthorized', { status: 401 })
      }
    }

    // Manager routes
    if (pathname.startsWith('/manager')) {
      if (!token?.groups?.some(g => ['admin', 'manager'].includes(g))) {
        return new Response('Unauthorized', { status: 401 })
      }
    }

    // Billing routes
    if (pathname.startsWith('/billing')) {
      if (!token?.groups?.some(g => ['admin', 'billing', 'manager'].includes(g))) {
        return new Response('Unauthorized', { status: 401 })
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)
```

**React Component Authorization:**
```typescript
// hooks/useAuthorization.ts
import { useSession } from 'next-auth/react'

export function useAuthorization() {
  const { data: session } = useSession()

  const hasGroup = (group: string) => {
    return session?.user?.groups?.includes(group) || false
  }

  const hasAnyGroup = (groups: string[]) => {
    return groups.some(group => hasGroup(group))
  }

  const isAdmin = () => hasGroup('admin')
  const isManager = () => hasAnyGroup(['admin', 'manager'])

  return {
    hasGroup,
    hasAnyGroup,
    isAdmin,
    isManager,
    groups: session?.user?.groups || []
  }
}

// Component usage
function AdminPanel() {
  const { isAdmin } = useAuthorization()

  if (!isAdmin()) {
    return <div>Access Denied</div>
  }

  return <div>Admin content...</div>
}
```

**API Route Authorization:**
```typescript
// pages/api/admin/users.ts
import { getServerSession } from "next-auth/next"

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.groups?.includes('admin')) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  // Admin logic here
}
```

### 3. Backend Authorization Middleware

**Express.js Authorization Middleware:**
```typescript
// auth-middleware.ts
export function requireGroups(requiredGroups: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      const userGroups = decoded.groups || []
      
      const hasPermission = requiredGroups.some(group => 
        userGroups.includes(group)
      )

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: requiredGroups,
          user_groups: userGroups
        })
      }

      req.user = decoded
      next()
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' })
    }
  }
}

// Usage
app.get('/admin/users', requireGroups(['admin']), (req, res) => {
  // Admin only endpoint
})

app.get('/billing/reports', requireGroups(['admin', 'billing']), (req, res) => {
  // Admin or billing team
})
```

## Group Design Best Practices

### 1. Hierarchical Group Structure
```typescript
const GROUP_HIERARCHY = {
  'admin': {
    inherits: ['manager', 'user'],
    description: 'Full system access'
  },
  'manager': {
    inherits: ['user'],
    description: 'Management permissions'
  },
  'user': {
    inherits: [],
    description: 'Basic user access'
  }
}

function getEffectiveGroups(userGroups: string[]): string[] {
  const effective = new Set(userGroups)
  
  for (const group of userGroups) {
    const inherits = GROUP_HIERARCHY[group]?.inherits || []
    inherits.forEach(inherited => effective.add(inherited))
  }
  
  return Array.from(effective)
}
```

### 2. Application-Specific Groups
```typescript
// Prefix groups by application for multi-tenant scenarios
const APP_GROUPS = {
  // Core system groups
  'system:admin',
  'system:user',
  
  // Application-specific groups
  'billing:admin',
  'billing:readonly',
  'crm:sales',
  'crm:manager',
  'wiki:editor',
  'wiki:reader'
}
```

### 3. Dynamic Group Evaluation
```typescript
// Evaluate groups based on user attributes
function getDynamicGroups(user: User): string[] {
  const groups = [...user.groups]
  
  // Department-based groups
  if (user.attributes.department) {
    groups.push(`dept:${user.attributes.department}`)
  }
  
  // Region-based groups
  if (user.attributes.region) {
    groups.push(`region:${user.attributes.region}`)
  }
  
  // Clearance-based groups
  if (user.attributes.clearance_level) {
    groups.push(`clearance:${user.attributes.clearance_level}`)
  }
  
  return groups
}
```

## Migration Path

### Start Simple (Groups)
1. Implement basic group membership
2. Add groups to JWT claims
3. Update admin interface for group management
4. Implement application-side authorization

### Add Attributes (Claims)
1. Add user attributes table/schema
2. Include common attributes in JWT
3. Support custom claims per application
4. Add attribute management to admin UI

### Scale to RBAC (Enterprise)
1. Design role and permission schema
2. Implement role inheritance
3. Build role management interface
4. Migrate existing groups to roles

## Recommendation

**Start with Groups** for your OIDC provider because:

1. **Simplicity**: Easy to implement and understand
2. **Compatibility**: Works with most applications out of the box
3. **Manageability**: Simple admin interface
4. **Scalability**: Can evolve to more complex models later
5. **Standards**: Follows common OIDC practices

You can always add custom claims and evolve to RBAC as your requirements grow. The key is to design your user schema and JWT structure to support future expansion without breaking existing integrations.

Would you like me to start implementing the groups-based authorization system in your codebase?
