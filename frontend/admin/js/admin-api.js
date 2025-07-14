/**
 * Admin Backend API Integration
 * Handles all backend API calls for admin functionality
 */

class AdminAPI {
    constructor() {
        // Configuration - these would come from environment variables in production
        this.baseURL = this.getBaseURL();
        this.endpoints = {
            auth: {
                login: '/admin/auth/login',
                logout: '/admin/auth/logout',
                refresh: '/admin/auth/refresh',
                verify: '/admin/auth/verify'
            },
            users: {
                list: '/admin/users',
                create: '/admin/users',
                get: '/admin/users/:id',
                update: '/admin/users/:id',
                delete: '/admin/users/:id',
                activate: '/admin/users/:id/activate',
                deactivate: '/admin/users/:id/deactivate'
            },
            groups: {
                list: '/admin/groups',
                create: '/admin/groups',
                get: '/admin/groups/:id',
                update: '/admin/groups/:id',
                delete: '/admin/groups/:id',
                members: '/admin/groups/:id/members',
                addMember: '/admin/groups/:id/members',
                removeMember: '/admin/groups/:id/members/:userId'
            },
            system: {
                health: '/admin/system/health',
                metrics: '/admin/system/metrics',
                logs: '/admin/system/logs'
            }
        };
    }

    /**
     * Get the base URL for API calls
     */
    getBaseURL() {
        // In development, use local server
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8787'; // Cloudflare Workers local dev
        }
        
        // In production, use the actual API URL
        return window.location.origin;
    }

    /**
     * Make authenticated API requests
     */
    async request(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
        const token = this.getAuthToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            console.log(`API Request: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, finalOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new APIError(data.error || 'API request failed', response.status, data);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            
            // Handle network errors
            if (error instanceof TypeError) {
                throw new APIError('Network error - please check your connection', 0);
            }
            
            throw error;
        }
    }

    /**
     * Get authentication token from storage
     */
    getAuthToken() {
        try {
            const session = localStorage.getItem('admin_session');
            if (session) {
                const sessionData = JSON.parse(session);
                return sessionData.token;
            }
        } catch (error) {
            console.error('Error reading auth token:', error);
        }
        return null;
    }

    /**
     * Authentication API calls
     */
    async login(email, password) {
        try {
            const response = await this.request(this.endpoints.auth.login, {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            // Store session data
            if (response.success && response.token) {
                const sessionData = {
                    user: response.user,
                    token: response.token,
                    loginTime: Date.now(),
                    lastActivity: Date.now(),
                    role: response.user.role
                };
                localStorage.setItem('admin_session', JSON.stringify(sessionData));
            }

            return response;
        } catch (error) {
            console.error('Login API call failed:', error);
            
            // Fallback to mock authentication for development
            if (this.isDevelopmentMode()) {
                console.log('Falling back to mock authentication');
                return this.mockLogin(email, password);
            }
            
            throw error;
        }
    }

    async logout() {
        const token = this.getAuthToken();
        
        try {
            if (token) {
                await this.request(this.endpoints.auth.logout, {
                    method: 'POST'
                });
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            // Always clear local session
            localStorage.removeItem('admin_session');
        }
    }

    async verifyToken() {
        try {
            const response = await this.request(this.endpoints.auth.verify, {
                method: 'GET'
            });
            return response.valid === true;
        } catch (error) {
            console.error('Token verification failed:', error);
            return false;
        }
    }

    /**
     * User management API calls
     */
    async getUsers(page = 1, limit = 50, search = '') {
        try {
            const params = new URLSearchParams({ page, limit, search });
            const response = await this.request(`${this.endpoints.users.list}?${params}`);
            return response;
        } catch (error) {
            console.error('Get users API call failed:', error);
            
            // Fallback to mock data for development
            if (this.isDevelopmentMode()) {
                return this.mockGetUsers();
            }
            
            throw error;
        }
    }

    async createUser(userData) {
        try {
            const response = await this.request(this.endpoints.users.create, {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            return response;
        } catch (error) {
            console.error('Create user API call failed:', error);
            
            // Fallback to mock for development
            if (this.isDevelopmentMode()) {
                return this.mockCreateUser(userData);
            }
            
            throw error;
        }
    }

    async updateUser(userId, userData) {
        try {
            const endpoint = this.endpoints.users.update.replace(':id', userId);
            const response = await this.request(endpoint, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            return response;
        } catch (error) {
            console.error('Update user API call failed:', error);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            const endpoint = this.endpoints.users.delete.replace(':id', userId);
            const response = await this.request(endpoint, {
                method: 'DELETE'
            });
            return response;
        } catch (error) {
            console.error('Delete user API call failed:', error);
            throw error;
        }
    }

    /**
     * Group management API calls
     */
    async getGroups() {
        try {
            const response = await this.request(this.endpoints.groups.list);
            return response;
        } catch (error) {
            console.error('Get groups API call failed:', error);
            
            // Fallback to mock data for development
            if (this.isDevelopmentMode()) {
                return this.mockGetGroups();
            }
            
            throw error;
        }
    }

    async createGroup(groupData) {
        try {
            const response = await this.request(this.endpoints.groups.create, {
                method: 'POST',
                body: JSON.stringify(groupData)
            });
            return response;
        } catch (error) {
            console.error('Create group API call failed:', error);
            
            // Fallback to mock for development
            if (this.isDevelopmentMode()) {
                return this.mockCreateGroup(groupData);
            }
            
            throw error;
        }
    }

    /**
     * System API calls
     */
    async getSystemHealth() {
        try {
            const response = await this.request(this.endpoints.system.health);
            return response;
        } catch (error) {
            console.error('Get system health failed:', error);
            
            if (this.isDevelopmentMode()) {
                return this.mockSystemHealth();
            }
            
            throw error;
        }
    }

    async getSystemMetrics() {
        try {
            const response = await this.request(this.endpoints.system.metrics);
            return response;
        } catch (error) {
            console.error('Get system metrics failed:', error);
            
            if (this.isDevelopmentMode()) {
                return this.mockSystemMetrics();
            }
            
            throw error;
        }
    }

    /**
     * Development mode helpers
     */
    isDevelopmentMode() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.search.includes('dev=true');
    }

    /**
     * Mock API responses for development
     */
    async mockLogin(email, password) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockAdmins = [
            {
                email: 'admin@example.com',
                password: 'admin123',
                user: { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'super_admin' },
                token: 'mock_jwt_token_' + Date.now()
            },
            {
                email: 'manager@example.com',
                password: 'manager123',
                user: { id: '2', name: 'Manager User', email: 'manager@example.com', role: 'admin' },
                token: 'mock_jwt_token_' + Date.now()
            }
        ];

        const admin = mockAdmins.find(a => a.email === email && a.password === password);
        
        if (admin) {
            return { success: true, user: admin.user, token: admin.token };
        } else {
            throw new APIError('Invalid email or password', 401);
        }
    }

    async mockGetUsers() {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            success: true,
            users: [
                { id: 'usr_001', email: 'john.doe@example.com', name: 'John Doe', status: 'active', groups: ['Admins', 'Developers'], created: '2023-09-15', lastLogin: '2023-10-27' },
                { id: 'usr_002', email: 'jane.smith@example.com', name: 'Jane Smith', status: 'active', groups: ['Managers'], created: '2023-08-22', lastLogin: '2023-10-26' }
            ],
            total: 2,
            page: 1,
            limit: 50
        };
    }

    async mockCreateUser(userData) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return {
            success: true,
            user: {
                id: 'usr_' + Date.now(),
                ...userData,
                created: new Date().toISOString(),
                lastLogin: 'Never'
            }
        };
    }

    async mockGetGroups() {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return {
            success: true,
            groups: [
                { id: 'grp_001', name: 'Admins', description: 'System administrators', memberCount: 3, permissions: ['Full Access'] },
                { id: 'grp_002', name: 'Developers', description: 'Development team', memberCount: 12, permissions: ['App Access', 'API Access'] }
            ]
        };
    }

    async mockCreateGroup(groupData) {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        return {
            success: true,
            group: {
                id: 'grp_' + Date.now(),
                ...groupData,
                memberCount: 0,
                created: new Date().toISOString()
            }
        };
    }

    async mockSystemHealth() {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        return {
            success: true,
            status: 'healthy',
            components: {
                auth: { status: 'operational', uptime: '99.9%' },
                database: { status: 'operational', uptime: '99.8%' },
                email: { status: 'operational', uptime: '99.7%' },
                storage: { status: 'operational', uptime: '99.9%' }
            }
        };
    }

    async mockSystemMetrics() {
        await new Promise(resolve => setTimeout(resolve, 400));
        
        return {
            success: true,
            metrics: {
                totalUsers: 156,
                activeGroups: 12,
                recentLogins: 47,
                systemHealth: 98
            }
        };
    }
}

/**
 * Custom API Error class
 */
class APIError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// Export for use in other modules
window.AdminAPI = AdminAPI;
window.APIError = APIError;

// Create global instance
window.adminAPI = new AdminAPI();

console.log('Admin API integration loaded');
