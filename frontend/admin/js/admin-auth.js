/**
 * Admin Authentication System
 * Handles admin login, logout, session management, and role-based access control
 */

class AdminAuth {
    constructor() {
        this.sessionKey = 'admin_session';
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.checkInterval = null;
        this.init();
    }

    init() {
        this.checkSession();
        this.startSessionCheck();
        this.bindEvents();
    }

    /**
     * Authenticate admin user
     */
    async login(email, password) {
        try {
            // Use the AdminAPI for authentication
            const response = await window.adminAPI.login(email, password);
            
            if (response.success) {
                const session = {
                    user: response.user,
                    token: response.token,
                    loginTime: Date.now(),
                    lastActivity: Date.now(),
                    role: response.user.role
                };
                
                this.setSession(session);
                this.redirectToDashboard();
                return { success: true };
            } else {
                return { success: false, error: response.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            
            if (error instanceof window.APIError) {
                return { success: false, error: error.message };
            }
            
            return { success: false, error: 'Authentication failed' };
        }
    }

    /**
     * Mock authentication API - replace with real backend call
     */
    async mockAuthAPI(email, password) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock admin credentials
        const mockAdmins = [
            {
                email: 'admin@example.com',
                password: 'admin123',
                user: {
                    id: '1',
                    name: 'Admin User',
                    email: 'admin@example.com',
                    role: 'super_admin',
                    avatar: null
                },
                token: 'mock_jwt_token_' + Date.now()
            },
            {
                email: 'manager@example.com',
                password: 'manager123',
                user: {
                    id: '2',
                    name: 'Manager User',
                    email: 'manager@example.com',
                    role: 'admin',
                    avatar: null
                },
                token: 'mock_jwt_token_' + Date.now()
            }
        ];

        const admin = mockAdmins.find(a => a.email === email && a.password === password);
        
        if (admin) {
            return {
                success: true,
                user: admin.user,
                token: admin.token
            };
        } else {
            return {
                success: false,
                error: 'Invalid email or password'
            };
        }
    }

    /**
     * Logout admin user
     */
    async logout() {
        try {
            // Call backend logout API
            await window.adminAPI.logout();
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Always clear local session
            this.clearSession();
            this.redirectToLogin();
        }
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        const session = this.getSession();
        if (!session) return false;
        
        // Check if session is expired
        const now = Date.now();
        const sessionAge = now - session.loginTime;
        const inactivityTime = now - session.lastActivity;
        
        if (sessionAge > this.sessionTimeout || inactivityTime > this.sessionTimeout) {
            this.clearSession();
            return false;
        }
        
        // Verify token with backend if AdminAPI is available
        if (window.adminAPI && session.token) {
            try {
                const isValid = await window.adminAPI.verifyToken();
                if (!isValid) {
                    this.clearSession();
                    return false;
                }
            } catch (error) {
                console.error('Token verification failed:', error);
                // In development, continue without verification
                if (!window.adminAPI.isDevelopmentMode()) {
                    this.clearSession();
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Get current session
     */
    getSession() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (error) {
            console.error('Error reading session:', error);
            return null;
        }
    }

    /**
     * Set session data
     */
    setSession(session) {
        try {
            localStorage.setItem(this.sessionKey, JSON.stringify(session));
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    /**
     * Clear session data
     */
    clearSession() {
        localStorage.removeItem(this.sessionKey);
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }

    /**
     * Update last activity timestamp
     */
    updateActivity() {
        const session = this.getSession();
        if (session) {
            session.lastActivity = Date.now();
            this.setSession(session);
        }
    }

    /**
     * Check user role permissions
     */
    hasPermission(requiredRole) {
        const session = this.getSession();
        if (!session) return false;
        
        const roleHierarchy = {
            'super_admin': 3,
            'admin': 2,
            'manager': 1,
            'user': 0
        };
        
        const userLevel = roleHierarchy[session.user.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;
        
        return userLevel >= requiredLevel;
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        const session = this.getSession();
        return session ? session.user : null;
    }

    /**
     * Start session monitoring
     */
    startSessionCheck() {
        this.checkInterval = setInterval(() => {
            if (!this.isAuthenticated()) {
                this.redirectToLogin();
            }
        }, 60000); // Check every minute
    }

    /**
     * Check initial session and redirect if needed
     */
    async checkSession() {
        const currentPage = window.location.pathname;
        const isLoginPage = currentPage.includes('login.html');
        
        const authenticated = await this.isAuthenticated();
        
        if (authenticated) {
            this.updateActivity();
            if (isLoginPage) {
                this.redirectToDashboard();
            }
        } else {
            if (!isLoginPage) {
                this.redirectToLogin();
            }
        }
    }

    /**
     * Bind authentication events
     */
    bindEvents() {
        // Update activity on user interaction
        ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
            document.addEventListener(event, () => {
                if (this.isAuthenticated()) {
                    this.updateActivity();
                }
            }, { passive: true });
        });

        // Handle logout button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('logout-btn')) {
                e.preventDefault();
                this.logout();
            }
        });
    }

    /**
     * Redirect to login page
     */
    redirectToLogin() {
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    /**
     * Redirect to dashboard
     */
    redirectToDashboard() {
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'index.html';
        }
    }

    /**
     * Show session timeout warning
     */
    showTimeoutWarning() {
        if (confirm('Your session is about to expire. Click OK to extend it.')) {
            this.updateActivity();
        } else {
            this.logout();
        }
    }
}

// Initialize admin authentication
const adminAuth = new AdminAuth();

// Initialize auth system when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await adminAuth.checkSession();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminAuth;
}
