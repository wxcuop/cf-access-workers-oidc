declare global {
    interface DurableObjectState {
        blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>
    }
}

export interface Env {}

// Cloudflare Worker Types
export interface ScheduledController {
    scheduledTime: number;
    cron: string;
    noRetry(): void;
}

export interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
}

export interface ExchangeCode {
    id_token: string,
    access_token: string,
    expires_at: number
}

export interface PrivateKey {
    id: string,
    key: CryptoKey,
}

export interface JwkKey {
    kid: string,
    use: string,
    kty: string,
    alg: string,
    n: string,
    e: string
}

export interface Jwk {
    last_signature: number,
    key: JwkKey,
}

// Group Management Types
export interface Group {
    name: string;
    description: string;
    permissions?: string[];  // For future expansion
    created_at: number;
    updated_at: number;
    user_count: number;
    is_system: boolean;  // Prevent deletion of system groups
    created_by?: string; // Admin who created the group
}

export interface User {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    groups: string[];
    attributes?: {
        department?: string;
        cost_center?: string;
        clearance_level?: string;
        region?: string;
        manager_email?: string;
    };
    custom_claims?: Record<string, any>;
    created_at: number;
    updated_at: number;
    last_login?: number;
    status: 'active' | 'inactive' | 'suspended';
}

export interface GroupAssignment {
    user_email: string;
    group_name: string;
    assigned_at: number;
    assigned_by: string;  // Admin who assigned
}

// Authentication and Session Types
export interface UserSession {
    id: string;
    user_id: string;
    user_email: string;
    access_token: string;
    refresh_token: string;
    created_at: number;
    expires_at: number;
    last_activity: number;
    user_agent?: string;
    ip_address?: string;
}

export interface AuthRequest {
    email: string;
    password: string;
    remember_me?: boolean;
}

export interface AuthResponse {
    success: boolean;
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: {
        id: string;
        email: string;
        name: string;
        groups: string[];
    };
    error?: string;
}

export interface PasswordResetToken {
    token: string;
    user_email: string;
    created_at: number;
    expires_at: number;
    used: boolean;
}

export interface RateLimitInfo {
    attempts: number;
    first_attempt: number;
    locked_until?: number;
}