# Frontend Development Workflow

## Monorepo Setup for Frontend Development

This guide optimizes the development workflow for the frontend within the monorepo structure.

## Quick Frontend Development

### 1. Frontend-Only Development Setup

If you're working only on the frontend:

```bash
# Clone the repo
git clone https://github.com/your-username/cf-workers-oidc.git
cd cf-workers-oidc

# Work in the frontend directory
cd frontend/signin

# Start development server
../../dev-server.sh
```

### 2. Frontend-Focused Git Workflow

Create frontend-specific branches:

```bash
# Create frontend feature branches
git checkout -b frontend/improve-validation
git checkout -b frontend/add-dark-mode
git checkout -b frontend/mobile-optimizations

# Commit with clear prefixes
git commit -m "frontend: add password strength indicator"
git commit -m "frontend: improve mobile responsive design"
```

### 3. Cloudflare Pages Optimization

**Current Build Settings** (already optimized):
```
Build output directory: frontend/signin
Build command: (empty - no build needed)
Root directory: / (full repo access)
```

**Path-Based Deployments** (optional):
You can set up Pages to only deploy when frontend files change by using build hooks.

## Development Scripts

### Frontend Development Server

The existing `dev-server.sh` works great:

```bash
# Start local development server
./dev-server.sh

# Or directly
cd frontend/signin && python3 -m http.server 8080
```

### Frontend-Only Testing

Create a frontend testing script:

```bash
# Create frontend/test.sh
#!/bin/bash
cd frontend/signin
echo "🧪 Testing Frontend..."
echo "✅ HTML validation"
echo "✅ CSS validation" 
echo "✅ JavaScript syntax check"
echo "✅ Accessibility test"
```

## CI/CD Optimization

### Path-Based Triggers

You can optimize CI/CD to only run frontend deployments when frontend files change:

```yaml
# .github/workflows/frontend.yml
on:
  push:
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend.yml'
```

### Independent Versioning

Even in a monorepo, you can version frontend independently:

```json
// frontend/signin/package.json
{
  "name": "oidc-signin-frontend",
  "version": "1.0.0",
  "description": "OIDC Authentication Frontend"
}
```

## Pros of Current Monorepo Structure

### 1. **Coordinated Development**
- Backend API changes can be coordinated with frontend updates
- Shared documentation stays in sync
- Single source of truth for the entire authentication system

### 2. **Simplified Configuration Management**
- API URLs and configuration can be managed centrally
- Environment variables can be shared between frontend and backend
- Deployment can be coordinated

### 3. **Atomic Changes**
- Changes that affect both frontend and backend can be made in a single commit
- No risk of version mismatch between frontend and backend
- Easier rollbacks of coordinated changes

## When to Split (Future Considerations)

Consider splitting if you encounter:

### 1. **Team Structure Changes**
- Separate frontend and backend teams
- Different deployment schedules
- Different security/access requirements

### 2. **Scale Issues**
- Repository becomes too large
- Build times become excessive
- Too many developers causing merge conflicts

### 3. **Reuse Requirements**
- Frontend needs to work with multiple backends
- Backend needs to support multiple frontends
- Need to open-source one component independently

## Recommendation: Optimize Current Structure

For now, optimize your current monorepo structure with:

### 1. **Clear Directory Organization**
```
├── src/                 # Backend worker code
├── frontend/
│   ├── signin/         # Authentication frontend
│   └── admin/          # Future admin dashboard
├── docs/               # Shared documentation  
├── tests/              # Backend tests
└── scripts/            # Shared development scripts
```

### 2. **Path-Specific Development Scripts**
- Frontend development server (✅ already have)
- Backend development server
- Full-stack integration testing

### 3. **Independent Deployment Pipelines**
- Frontend deploys to Cloudflare Pages
- Backend deploys to Cloudflare Workers
- Both can deploy independently based on file changes

## Migration Path (If Needed Later)

If you later decide to split:

1. **Extract Frontend**:
   ```bash
   git subtree push --prefix=frontend/signin origin frontend-repo
   ```

2. **Update Documentation**:
   - Move frontend-specific docs to new repo
   - Keep shared docs in main repo
   - Cross-reference between repos

3. **Update Build Systems**:
   - Update Cloudflare Pages to point to new repo
   - Update API configurations for CORS

## Conclusion

**Stick with the monorepo for now**. Your current structure is well-organized and optimized for your development workflow. The benefits of coordinated development, shared documentation, and simplified configuration management outweigh the minor complexity of subdirectory deployments.

You can always split later if your team structure or requirements change, and the migration path is straightforward.
