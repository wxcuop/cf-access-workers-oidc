# OIDC Backup & Restore Guide

## Overview
Since SQLite-backed Durable Objects don't have built-in point-in-time recovery, this guide provides comprehensive backup and restore strategies for your OIDC authentication system.

## Backup Strategies

### 1. **Export-Based Backups**

#### Manual Export Endpoint
```typescript
// Add to your Worker's fetch handler
if (url.pathname === '/admin/backup' && request.method === 'GET') {
  const backupData = {
    timestamp: Date.now(),
    exchange_codes: oidcCore.getAllExchangeCodes(),
    stats: oidcCore.getExchangeCodeStats(),
    jwks: await getJWKS() // if you need to backup JWKS
  }
  
  return new Response(JSON.stringify(backupData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="oidc-backup-${new Date().toISOString().split('T')[0]}.json"`
    }
  })
}
```

#### Scheduled Backups with Cron Triggers
```toml
# In wrangler.toml
[triggers]
crons = ["0 2 * * *"] # Daily at 2 AM UTC

# In your Worker
export default {
  async scheduled(event, env, ctx) {
    // Export data and send to external storage
    const backupData = await createBackup()
    await sendToExternalStorage(backupData)
  }
}
```

### 2. **Cross-Platform Replication**

#### Real-time Sync to External Database
```typescript
// After each signToken() operation
private async replicateToExternal(exchangeCode: ExchangeCode): Promise<void> {
  try {
    await fetch('https://your-backup-api.com/replicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'store_exchange_code',
        data: exchangeCode,
        timestamp: Date.now()
      })
    })
  } catch (error) {
    console.warn('Backup replication failed:', error)
    // Don't fail the main operation
  }
}
```

#### Dual-Write Strategy
```typescript
// Write to both SQLite and external storage simultaneously
async signToken(user: any, nonce?: string): Promise<ExchangeCode> {
  const exchangeCode = await this.createExchangeCode(user, nonce)
  
  // Primary write to SQLite
  await this.storeInSQLite(exchangeCode)
  
  // Secondary write to backup store (async, non-blocking)
  this.storeInBackup(exchangeCode).catch(console.warn)
  
  return exchangeCode
}
```

### 3. **External Storage Integration**

#### Cloudflare R2 Backups (Recommended for Workers)
```typescript
// R2 backup integration - seamless with Cloudflare Workers
class R2BackupService {
  private bucket: R2Bucket

  constructor(bucket: R2Bucket) {
    this.bucket = bucket
  }

  async uploadBackup(backupData: any): Promise<string> {
    const fileName = `oidc-backup-${new Date().toISOString().split('T')[0]}.json`
    const backupContent = JSON.stringify(backupData, null, 2)
    
    // Upload to R2 with metadata
    await this.bucket.put(fileName, backupContent, {
      customMetadata: {
        'backup-type': 'full',
        'source': 'oidc-provider',
        'timestamp': Date.now().toString(),
        'version': '1.0'
      },
      httpMetadata: {
        contentType: 'application/json',
        contentDisposition: `attachment; filename="${fileName}"`
      }
    })

    return fileName
  }

  async downloadBackup(fileName: string): Promise<any> {
    const object = await this.bucket.get(fileName)
    if (!object) {
      throw new Error(`Backup not found: ${fileName}`)
    }

    const backupText = await object.text()
    return JSON.parse(backupText)
  }

  async listBackups(): Promise<R2BackupInfo[]> {
    const objects = await this.bucket.list({
      prefix: 'oidc-backup-',
      limit: 100
    })

    return objects.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      metadata: obj.customMetadata
    })).sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime())
  }

  async cleanupOldBackups(keepCount: number = 30): Promise<number> {
    const backups = await this.listBackups()
    const toDelete = backups.slice(keepCount)

    let deletedCount = 0
    for (const backup of toDelete) {
      await this.bucket.delete(backup.key)
      deletedCount++
    }

    return deletedCount
  }

  async getBackupStats(): Promise<R2BackupStats> {
    const backups = await this.listBackups()
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0)
    
    return {
      totalBackups: backups.length,
      totalSize: totalSize,
      oldestBackup: backups[backups.length - 1]?.uploaded,
      newestBackup: backups[0]?.uploaded
    }
  }
}

// Scheduled backup to R2
async function scheduledR2Backup(env: Env): Promise<void> {
  try {
    // Get backup data
    const backupData = {
      timestamp: Date.now(),
      exchange_codes: await oidcCore.getAllExchangeCodes(),
      stats: await oidcCore.getExchangeCodeStats(),
      version: '1.0',
      metadata: {
        worker_version: env.WORKER_VERSION || 'unknown',
        backup_source: 'scheduled'
      }
    }

    // Initialize R2 backup service
    const r2Backup = new R2BackupService(env.BACKUP_BUCKET)

    // Upload backup
    const fileName = await r2Backup.uploadBackup(backupData)
    console.log(`Backup uploaded to R2: ${fileName}`)

    // Cleanup old backups (keep last 30)
    const deletedCount = await r2Backup.cleanupOldBackups(30)
    console.log(`Cleaned up ${deletedCount} old backups`)

    // Log backup statistics
    const stats = await r2Backup.getBackupStats()
    console.log(`Backup stats: ${stats.totalBackups} backups, ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB total`)

  } catch (error) {
    console.error('R2 backup failed:', error)
    // Send alert to monitoring system
  }
}
```

#### R2 Setup Instructions

##### 1. Create R2 Bucket
```bash
# Using wrangler CLI
wrangler r2 bucket create oidc-backups

# Or via Cloudflare Dashboard
# 1. Go to R2 Object Storage
# 2. Create Bucket
# 3. Name: oidc-backups
# 4. Location: Auto (or specific region)
```

##### 2. Configure Bucket Binding
```toml
# In wrangler.toml
[[r2_buckets]]
binding = "BACKUP_BUCKET"
bucket_name = "oidc-backups"
preview_bucket_name = "oidc-backups-preview"
```

##### 3. R2 Integration in Worker
```typescript
// Environment binding
export interface Env {
  BACKUP_BUCKET: R2Bucket
  // ...other bindings
}

// Use in scheduled backup
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    await scheduledR2Backup(env)
  },
  
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Manual backup endpoint
    if (url.pathname === '/admin/backup' && request.method === 'POST') {
      const r2Backup = new R2BackupService(env.BACKUP_BUCKET)
      const fileName = await r2Backup.uploadBackup(backupData)
      
      return new Response(JSON.stringify({
        success: true,
        fileName,
        timestamp: Date.now()
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}
```

#### R2 Backup Benefits

##### Cost Advantages (Based on Cloudflare R2 Pricing)
- **Free Tier**: 10 GB storage per month (sufficient for thousands of OIDC backups)
- **Storage Cost**: $0.015 per GB per month after free tier
- **Class A Operations**: $4.50 per million (PUT, COPY, POST, LIST)
- **Class B Operations**: $0.36 per million (GET, HEAD, all others)
- **Data Transfer**: Egress to Cloudflare Workers is FREE

##### Performance Benefits
- **Zero Latency**: Direct integration with Cloudflare Workers
- **High Availability**: 99.999999999% (11 9's) durability
- **Global Edge**: Data replicated across Cloudflare's global network
- **No API Limits**: Unlike Google Drive's 1,000 requests/100 seconds

##### Developer Experience
- **Native Integration**: Built into Cloudflare Workers runtime
- **Simple API**: Easy R2Bucket interface, no authentication needed
- **Automatic Scaling**: Handles any backup size automatically
- **Metadata Support**: Rich metadata for backup organization

##### Cost Analysis for OIDC Backups
```typescript
// Typical OIDC backup cost calculation
const dailyBackups = 1
const backupSizeKB = 50 // 50KB per backup (generous estimate)
const monthlyBackups = dailyBackups * 30
const monthlyStorageGB = (backupSizeKB * monthlyBackups) / 1024 / 1024 // ~1.5MB

// Monthly cost breakdown
const storageCost = monthlyStorageGB > 10 ? (monthlyStorageGB - 10) * 0.015 : 0
const operationsCost = (dailyBackups * 30 * 4.50) / 1000000 // PUT operations
const totalMonthlyCost = storageCost + operationsCost

console.log(`Monthly R2 cost: $${totalMonthlyCost.toFixed(4)} (likely $0.00)`)
```

#### R2 vs Other Options Comparison

| Feature | R2 | Google Drive | GitHub |
|---------|----|--------------|---------| 
| **Free Tier** | 10GB | 15GB | 1GB (LFS) |
| **Integration** | Native Workers | OAuth setup | Git workflow |
| **Performance** | Instant | API limits | Slow for backups |
| **Cost (after free)** | $0.015/GB | $1.99/100GB | $5/50GB |
| **Automation** | Built-in | Complex | Limited |
| **Metadata** | Rich support | Limited | Git only |

##### Recovery from R2
```typescript
// Easy backup recovery from R2
async function recoverFromR2(env: Env, backupDate?: string): Promise<void> {
  const r2Backup = new R2BackupService(env.BACKUP_BUCKET)
  
  // List available backups
  const backups = await r2Backup.listBackups()
  console.log('Available backups:', backups.map(b => ({ 
    file: b.key, 
    date: b.uploaded,
    size: `${(b.size / 1024).toFixed(1)}KB`
  })))
  
  // Select backup (latest or by date)
  const targetBackup = backupDate 
    ? backups.find(b => b.key.includes(backupDate))
    : backups[0] // Most recent
  
  if (!targetBackup) {
    throw new Error(`No backup found for date: ${backupDate}`)
  }
  
  // Download and restore
  const backupData = await r2Backup.downloadBackup(targetBackup.key)
  await oidcCore.restoreFromBackup(backupData)
  
  console.log(`Restored from R2 backup: ${targetBackup.key}`)
}
```

#### Database Replication (PostgreSQL/MySQL)
```typescript
// Replicate to external database
async function replicateToDatabase(data: ExchangeCode[]): Promise<void> {
  const connection = await createDatabaseConnection()
  
  for (const code of data) {
    await connection.query(
      'INSERT INTO exchange_codes_backup (code, id_token, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id_token = VALUES(id_token)',
      [code.code, code.id_token, code.expires_at]
    )
  }
}
```

#### Google Drive Backups (Free Tier Friendly)
```typescript
// Google Drive API integration for backups
class GoogleDriveBackup {
  private accessToken: string
  private folderId: string // Create a dedicated folder for OIDC backups

  constructor(accessToken: string, folderId: string) {
    this.accessToken = accessToken
    this.folderId = folderId
  }

  async uploadBackup(backupData: any): Promise<string> {
    const fileName = `oidc-backup-${new Date().toISOString().split('T')[0]}.json`
    const fileContent = JSON.stringify(backupData, null, 2)
    
    // Upload to Google Drive
    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'multipart/related; boundary="foo_bar_baz"'
      },
      body: this.createMultipartBody(fileName, fileContent)
    })

    const result = await uploadResponse.json()
    return result.id // Google Drive file ID
  }

  private createMultipartBody(fileName: string, content: string): string {
    const metadata = {
      name: fileName,
      parents: [this.folderId],
      description: `OIDC backup from ${new Date().toISOString()}`
    }

    return [
      '--foo_bar_baz',
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      '--foo_bar_baz',
      'Content-Type: application/json',
      '',
      content,
      '--foo_bar_baz--'
    ].join('\r\n')
  }

  async downloadBackup(fileId: string): Promise<any> {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    return await response.json()
  }

  async listBackups(): Promise<DriveFile[]> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${this.folderId}'+in+parents&orderBy=createdTime+desc`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    )

    const result = await response.json()
    return result.files || []
  }

  async cleanupOldBackups(keepCount: number = 30): Promise<void> {
    const backups = await this.listBackups()
    const toDelete = backups.slice(keepCount)

    for (const backup of toDelete) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${backup.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })
    }
  }
}

// Scheduled backup to Google Drive
async function scheduledGoogleDriveBackup(env: Env): Promise<void> {
  try {
    // Get backup data
    const backupData = {
      timestamp: Date.now(),
      exchange_codes: await oidcCore.getAllExchangeCodes(),
      stats: await oidcCore.getExchangeCodeStats(),
      version: '1.0'
    }

    // Initialize Google Drive client
    const driveBackup = new GoogleDriveBackup(
      env.GOOGLE_DRIVE_ACCESS_TOKEN, // Store in environment variables
      env.GOOGLE_DRIVE_FOLDER_ID
    )

    // Upload backup
    const fileId = await driveBackup.uploadBackup(backupData)
    console.log(`Backup uploaded to Google Drive: ${fileId}`)

    // Cleanup old backups (keep last 30)
    await driveBackup.cleanupOldBackups(30)

  } catch (error) {
    console.error('Google Drive backup failed:', error)
    // Send alert to monitoring system
  }
}
```

#### Google Drive Setup Instructions

##### 1. Create Google Cloud Project & Enable Drive API
```bash
# 1. Go to Google Cloud Console
# 2. Create new project or select existing
# 3. Enable Google Drive API
# 4. Create OAuth 2.0 credentials
```

##### 2. Get Refresh Token (One-time Setup)
```typescript
// Run this script locally to get refresh token
async function getRefreshToken() {
  const clientId = 'your-client-id'
  const clientSecret = 'your-client-secret'
  const redirectUri = 'http://localhost:8080/callback'
  
  // 1. Get authorization URL
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=https://www.googleapis.com/auth/drive.file&` +
    `response_type=code&` +
    `access_type=offline`
  
  console.log('Visit this URL:', authUrl)
  
  // 2. After authorization, exchange code for tokens
  const code = 'authorization-code-from-callback'
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  })
  
  const tokens = await tokenResponse.json()
  console.log('Refresh Token:', tokens.refresh_token)
}
```

##### 3. Access Token Refresh in Worker
```typescript
async function refreshGoogleDriveToken(env: Env): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  })

  const tokens = await response.json()
  return tokens.access_token
}

// Use in scheduled backup
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const accessToken = await refreshGoogleDriveToken(env)
    
    const driveBackup = new GoogleDriveBackup(accessToken, env.GOOGLE_DRIVE_FOLDER_ID)
    await scheduledGoogleDriveBackup(env)
  }
}
```

##### 4. Environment Variables Setup
```toml
# In wrangler.toml
[env.production.vars]
GOOGLE_CLIENT_ID = "your-client-id"
GOOGLE_CLIENT_SECRET = "your-client-secret"  
GOOGLE_REFRESH_TOKEN = "your-refresh-token"
GOOGLE_DRIVE_FOLDER_ID = "folder-id-for-backups"
```

#### Google Drive Backup Benefits

##### Cost & Limits
- **Free Tier**: 15GB storage (shared with Gmail, Photos)
- **Paid Plans**: 100GB ($1.99/month), 200GB ($2.99/month), 2TB ($9.99/month)
- **API Limits**: 1,000 requests per 100 seconds per user (sufficient for daily backups)

##### Security Features
- **Encryption**: Data encrypted in transit and at rest
- **Access Control**: OAuth 2.0 with scoped permissions
- **Audit Logs**: Full access history in Google Cloud Console
- **Sharing**: Can share backup folder with team members

##### Recovery Advantages
```typescript
// Easy backup browsing and recovery
async function recoverFromGoogleDrive(env: Env, backupDate?: string): Promise<void> {
  const accessToken = await refreshGoogleDriveToken(env)
  const driveBackup = new GoogleDriveBackup(accessToken, env.GOOGLE_DRIVE_FOLDER_ID)
  
  // List available backups
  const backups = await driveBackup.listBackups()
  console.log('Available backups:', backups.map(b => ({ name: b.name, created: b.createdTime })))
  
  // Select backup (latest or by date)
  const targetBackup = backupDate 
    ? backups.find(b => b.name.includes(backupDate))
    : backups[0] // Most recent
  
  if (!targetBackup) {
    throw new Error(`No backup found for date: ${backupDate}`)
  }
  
  // Download and restore
  const backupData = await driveBackup.downloadBackup(targetBackup.id)
  await oidcCore.restoreFromBackup(backupData)
  
  console.log(`Restored from backup: ${targetBackup.name}`)
}
```

#### Alternative: Google Apps Script Automation
```javascript
// Google Apps Script for automated backups (runs in Google's cloud)
function scheduleOIDCBackup() {
  const webhookUrl = 'https://your-oidc-worker.example.com/admin/backup'
  
  try {
    // Fetch backup data from your Worker
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer your-admin-token'
      }
    })
    
    const backupData = response.getContentText()
    const fileName = `oidc-backup-${new Date().toISOString().split('T')[0]}.json`
    
    // Save to Google Drive
    const folder = DriveApp.getFolderById('your-folder-id')
    const file = folder.createFile(fileName, backupData, 'application/json')
    
    console.log(`Backup saved: ${file.getId()}`)
    
    // Cleanup old backups (keep last 30 days)
    const files = folder.getFiles()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30)
    
    while (files.hasNext()) {
      const file = files.next()
      if (file.getDateCreated() < cutoffDate) {
        DriveApp.removeFile(file)
      }
    }
    
  } catch (error) {
    console.error('Backup failed:', error)
    // Send email alert
    GmailApp.sendEmail('admin@example.com', 'OIDC Backup Failed', error.toString())
  }
}

// Set up daily trigger in Google Apps Script
function createTrigger() {
  ScriptApp.newTrigger('scheduleOIDCBackup')
    .timeBased()
    .everyDays(1)
    .atHour(2) // 2 AM
    .create()
}
```

## Recovery Procedures

### Recovery Endpoint Implementation
```typescript
// Add to your Worker's fetch handler
if (url.pathname === '/admin/restore' && request.method === 'POST') {
  try {
    const backupData = await request.json()
    await this.restoreFromBackup(backupData)
    
    return new Response(JSON.stringify({
      success: true,
      restored: backupData.exchange_codes?.length || 0,
      timestamp: Date.now()
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

### Safe Restore Implementation
```typescript
async restoreFromBackup(backupData: any): Promise<RestoreResult> {
  // Validate backup data structure
  if (!backupData.exchange_codes || !Array.isArray(backupData.exchange_codes)) {
    throw new Error('Invalid backup format: missing exchange_codes array')
  }

  // Pre-restore validation
  const currentStats = this.getExchangeCodeStats()
  const backupStats = {
    total: backupData.exchange_codes.length,
    timestamp: backupData.timestamp
  }

  console.log(`Restoring ${backupStats.total} codes from backup (current: ${currentStats.total})`)

  // Create restore transaction
  this.sql.exec('BEGIN TRANSACTION')
  
  try {
    // Option 1: Merge strategy (keep existing + add from backup)
    let restored = 0
    for (const code of backupData.exchange_codes) {
      // Only restore non-expired codes
      if (code.expires_at > Math.floor(Date.now() / 1000)) {
        this.sql.exec(
          'INSERT OR IGNORE INTO exchange_codes (code, id_token, access_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
          code.code, 
          code.id_token, 
          code.access_token || '', 
          code.expires_at,
          code.created_at || Math.floor(Date.now() / 1000)
        )
        restored++
      }
    }

    this.sql.exec('COMMIT')
    return { success: true, restored, skipped: backupStats.total - restored }
    
  } catch (error) {
    this.sql.exec('ROLLBACK')
    throw new Error(`Restore failed: ${error.message}`)
  }
}

// Alternative: Complete replacement strategy
async replaceFromBackup(backupData: any): Promise<RestoreResult> {
  this.sql.exec('BEGIN TRANSACTION')
  
  try {
    // Clear ALL existing data (dangerous!)
    this.sql.exec('DELETE FROM exchange_codes')
    
    // Restore from backup
    let restored = 0
    for (const code of backupData.exchange_codes) {
      this.sql.exec(
        'INSERT INTO exchange_codes (code, id_token, access_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
        code.code, code.id_token, code.access_token || '', code.expires_at, code.created_at
      )
      restored++
    }

    this.sql.exec('COMMIT')
    return { success: true, restored, replaced: true }
    
  } catch (error) {
    this.sql.exec('ROLLBACK')
    throw error
  }
}
```

### Disaster Recovery Workflow

#### Phase 1: Immediate Response (0-5 minutes)
```bash
# 1. Assess the situation
curl https://your-oidc.example.com/health
curl https://your-oidc.example.com/admin/stats

# 2. Switch to emergency mode (if available)
# - Redirect authentication to backup provider
# - Enable maintenance mode
# - Alert stakeholders
```

#### Phase 2: Damage Assessment (5-15 minutes)
```typescript
// Check current state
const currentStats = await oidcCore.getExchangeCodeStats()
console.log(`Current state: ${currentStats.total} total, ${currentStats.expired} expired`)

// Find latest backup
const backups = await listAvailableBackups()
const latestBackup = backups[0] // Most recent

console.log(`Latest backup: ${latestBackup.timestamp}, ${latestBackup.codeCount} codes`)

// Calculate potential data loss
const dataLossWindow = Date.now() - latestBackup.timestamp
console.log(`Potential data loss window: ${dataLossWindow / 1000 / 60} minutes`)
```

#### Phase 3: Recovery Execution (15-30 minutes)
```typescript
// 1. Download backup
const backupData = await downloadBackup(latestBackup.id)

// 2. Validate backup integrity
if (!validateBackupIntegrity(backupData)) {
  throw new Error('Backup validation failed')
}

// 3. Perform restore (choose strategy based on situation)
const restoreResult = await oidcCore.restoreFromBackup(backupData)

// 4. Verify restore
const postRestoreStats = await oidcCore.getExchangeCodeStats()
console.log(`Restore complete: ${restoreResult.restored} codes restored`)
```

#### Phase 4: Validation & Testing (30-45 minutes)
```bash
# Test authentication flow
curl -X POST https://your-oidc.example.com/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Test token exchange
curl -X POST https://your-oidc.example.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=TEST_CODE"

# Run health checks
npm run test:runtime
```

#### Phase 5: Traffic Restoration (45-60 minutes)
```typescript
// Gradual traffic restoration
// 1. Internal testing (5%)
// 2. Canary users (10%)
// 3. Gradual rollout (25%, 50%, 100%)

// Monitor error rates and authentication success
const healthMetrics = await getHealthMetrics()
if (healthMetrics.errorRate < 0.01 && healthMetrics.authSuccessRate > 0.99) {
  // Proceed with full traffic restoration
}
```

### Recovery Strategies by Scenario

#### Scenario 1: Durable Object Corruption
```typescript
// Symptoms: SQLite errors, data inconsistency
// Strategy: Complete replacement from backup
await replaceFromBackup(latestBackup)
```

#### Scenario 2: Partial Data Loss
```typescript
// Symptoms: Some exchange codes missing
// Strategy: Merge restore to fill gaps
await restoreFromBackup(latestBackup) // Uses INSERT OR IGNORE
```

#### Scenario 3: Complete Infrastructure Failure
```typescript
// Symptoms: Entire Cloudflare Workers down
// Strategy: Deploy to new environment + restore
// 1. Deploy fresh Workers environment
// 2. Restore from backup
// 3. Update DNS/routing
```

#### Scenario 4: Gradual Degradation
```typescript
// Symptoms: Increasing error rates, timeouts
// Strategy: Selective restore + cleanup
await cleanupExpiredKeys() // First try cleanup
if (stillDegraded) {
  await restoreFromBackup(recentBackup)
}
```

### Recovery Time Objectives (RTO)

| Scenario | Target RTO | Actions |
|----------|------------|---------|
| Minor corruption | 15 minutes | Merge restore from latest backup |
| Major data loss | 30 minutes | Complete replacement + validation |
| Infrastructure failure | 60 minutes | Redeploy + restore + DNS updates |
| Regional outage | 120 minutes | Multi-region failover + restore |

### Recovery Point Objectives (RPO)

| Backup Strategy | RPO | Data Loss Risk |
|----------------|-----|----------------|
| Manual exports | Variable | High (depends on backup frequency) |
| Daily scheduled | 24 hours | Medium (acceptable for most OIDC use) |
| Real-time replication | < 5 minutes | Low (but higher complexity) |

### Recovery Validation Checklist

```typescript
async function validateRecovery(): Promise<ValidationResult> {
  const checks = {
    databaseHealth: await checkDatabaseHealth(),
    authenticationFlow: await testAuthenticationFlow(),
    tokenExchange: await testTokenExchange(),
    jwksEndpoint: await testJWKSEndpoint(),
    dataIntegrity: await verifyDataIntegrity()
  }
  
  const allPassed = Object.values(checks).every(check => check.passed)
  
  return {
    allPassed,
    checks,
    timestamp: Date.now()
  }
}
```

## Backup Considerations for OIDC Data

### Data Sensitivity
- **Exchange Codes**: Short-lived (5-10 minutes), moderate sensitivity
- **JWKS**: Public keys, can be regenerated, low sensitivity  
- **User Sessions**: Temporary, can be re-authenticated

### Retention Policies
```typescript
// Cleanup old backups (keep last 30 days)
const BACKUP_RETENTION_DAYS = 30
async function cleanupOldBackups(): Promise<void> {
  const cutoffDate = Date.now() - (BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  
  // Remove expired exchange codes from backups
  await this.sql.exec(
    'DELETE FROM exchange_codes WHERE expires_at < ?',
    Math.floor(cutoffDate / 1000)
  )
}
```

## Monitoring & Alerting

### Backup Health Monitoring
```typescript
async function monitorBackupHealth(): Promise<BackupStatus> {
  const stats = oidcCore.getExchangeCodeStats()
  const lastBackup = await getLastBackupTimestamp()
  
  return {
    totalCodes: stats.total,
    expiredCodes: stats.expired,
    lastBackupAge: Date.now() - lastBackup,
    backupHealthy: (Date.now() - lastBackup) < 24 * 60 * 60 * 1000 // 24 hours
  }
}
```

## Cost-Effective Strategy for Free Plan

For the Workers Free plan (5GB limit), recommend in order of preference:

### **Tier 1: Cloudflare R2 (Recommended)**
1. **Primary**: Cloudflare R2 automated backups (10GB free, native integration)
2. **Monitoring**: R2 backup health monitoring with metadata
3. **Recovery**: Automated restore from R2 with version selection

### **Tier 2: Alternative Options**
4. **Secondary**: Google Drive automated backups (15GB free storage)
5. **Manual**: Export endpoint for on-demand backups
6. **Fallback**: GitHub/external storage for redundancy

### **R2 Strategy Benefits (Ideal for Cloudflare Workers):**
- **Cost**: 10GB free (vs 5GB Workers storage limit)
- **Performance**: Zero latency, native Workers integration
- **Reliability**: 99.999999999% durability, global replication
- **Simplicity**: No OAuth, no API limits, built-in metadata
- **Automation**: Seamless scheduled backups with cleanup
- **Scalability**: Handles any backup volume automatically

### **Cost Projection for R2:**
```typescript
// Realistic OIDC backup costs
Daily backups: 1 backup/day × 50KB = ~1.5MB/month storage
Monthly operations: 30 PUT + 30 GET = 60 operations
Monthly cost: $0.00 (well within 10GB free tier)

// Even with growth to 1000 users:
Daily backups: 1 backup/day × 500KB = ~15MB/month storage  
Monthly cost: Still $0.00 (within free tier)
```

## Implementation Priority

### **Recommended Implementation Order:**

1. **High Priority**: Cloudflare R2 automated backups (native integration, free tier)
2. **Medium Priority**: Export endpoint for manual backups (development/testing)
3. **Low Priority**: Google Drive integration (alternative/redundancy)
4. **Optional**: Real-time replication (high availability scenarios)

### **R2 Implementation Advantages:**
- **Fastest to implement**: Native R2Bucket API, no external auth
- **Most cost-effective**: 10GB free tier covers typical OIDC usage
- **Best performance**: Zero latency from Workers to R2
- **Lowest maintenance**: No API keys, tokens, or rate limits to manage
- **Enterprise ready**: Scales automatically with your growth

### **Quick Start R2 Implementation:**
```bash
# 1. Create R2 bucket (1 minute)
wrangler r2 bucket create oidc-backups

# 2. Add binding to wrangler.toml (30 seconds)
[[r2_buckets]]
binding = "BACKUP_BUCKET"
bucket_name = "oidc-backups"

# 3. Deploy with backup functionality (2 minutes)
wrangler deploy
```

This multi-layered approach ensures data protection while optimizing for Cloudflare's ecosystem and cost efficiency.
