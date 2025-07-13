/* ====================================
   AUTH.JS - Authentication Logic
   ==================================== */

/**
 * Main authentication application
 */
const AuthApp = {
    /**
     * Configuration
     */
    config: {
        // Your deployed worker URL
        apiBase: 'https://wxc-oidc.wxcuop.workers.dev',
        
        // For local development (update port if needed)
        localApiBase: 'http://localhost:8787',
        
        // Use local API during development
        get apiUrl() {
            return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? this.localApiBase 
                : this.apiBase;
        },
        
        // Endpoints
        endpoints: {
            login: '/auth/login',
            register: '/auth/register',
            resetPassword: '/auth/reset-password',
            confirmReset: '/auth/reset-password',
            logout: '/auth/logout',
            refresh: '/auth/refresh'
        },
        
        // OIDC Configuration
        oidc: {
            clientId: 'b78f6b19-50ca-4bab-85bf-93e6c51ff8fb', // Client ID from config.yml
            redirectUri: window.location.origin + '/oidc/callback',
            scope: 'openid profile email groups',
            responseType: 'code',
            state: null,
            codeChallenge: null,
            codeChallengeMethod: 'S256'
        }
    },

    /**
     * Current page state
     */
    currentPage: null,
    
    /**
     * Loading state
     */
    isLoading: false,

    /**
     * Initialize the application
     */
    init() {
        console.log('AuthApp initializing...');
        
        // Determine current page
        this.currentPage = this.getCurrentPage();
        
        // Initialize components
        this.initializePasswordToggles();
        this.initializeForms();
        this.initializeNavigation();
        this.handleUrlParameters();
        
        // Mark performance
        Utils.performance.mark('auth-app-initialized');
        
        console.log('AuthApp initialized for page:', this.currentPage);
    },

    /**
     * Get current page based on URL
     */
    getCurrentPage() {
        const path = window.location.pathname;
        
        if (path.includes('register')) return 'register';
        if (path.includes('reset-password')) return 'reset-password';
        return 'signin';
    },

    /**
     * Initialize password toggle functionality
     */
    initializePasswordToggles() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                const input = button.parentElement.querySelector('input');
                const icon = button.querySelector('.password-toggle-icon');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.textContent = '🙈';
                    button.setAttribute('aria-label', 'Hide password');
                } else {
                    input.type = 'password';
                    icon.textContent = '👁️';
                    button.setAttribute('aria-label', 'Show password');
                }
            });
        });
    },

    /**
     * Initialize form handling
     */
    initializeForms() {
        // Sign-in form
        const signinForm = document.getElementById('signin-form');
        if (signinForm) {
            signinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignIn(signinForm);
            });
        }

        // Registration form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(registerForm);
            });
        }

        // Password reset form
        const resetForm = document.getElementById('reset-form');
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordReset(resetForm);
            });
        }

        // Reset password form
        const resetPasswordForm = document.getElementById('reset-password-form');
        if (resetPasswordForm) {
            resetPasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordResetConfirm(resetPasswordForm);
            });
        }
    },

    /**
     * Initialize navigation
     */
    initializeNavigation() {
        // Forgot password link
        const forgotPasswordLink = document.getElementById('forgot-password');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPasswordReset();
            });
        }

        // Back to sign-in link
        const backToSigninLink = document.getElementById('back-to-signin');
        if (backToSigninLink) {
            backToSigninLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSignIn();
            });
        }
    },

    /**
     * Handle URL parameters
     */
    handleUrlParameters() {
        const urlParams = Utils.url.getAllParams();
        
        // Handle password reset token
        if (this.currentPage === 'reset-password' && urlParams.token) {
            this.validateResetToken(urlParams.token);
        }
        
        // Handle OIDC callback
        if (urlParams.code && urlParams.state) {
            this.handleOIDCCallback(urlParams);
        }
        
        // Handle error messages
        if (urlParams.error) {
            this.showToast(decodeURIComponent(urlParams.error), 'error');
        }
        
        // Handle success messages
        if (urlParams.success) {
            this.showToast(decodeURIComponent(urlParams.success), 'success');
        }
    },

    /**
     * Handle sign-in form submission
     */
    async handleSignIn(form) {
        if (this.isLoading) return;
        
        // Clear previous errors
        Validation.clearFormError(form);
        
        // Validate form
        const validation = Validation.validateForm(form);
        if (!validation.isValid) {
            Validation.showFormError(form, 'Please fix the errors above');
            return;
        }
        
        // Get form data
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const rememberMe = formData.get('remember');
        
        try {
            this.setLoading(true);
            
            const response = await this.apiCall('POST', this.config.endpoints.login, {
                email,
                password,
                rememberMe: !!rememberMe
            });
            
            if (response.success) {
                // Store tokens (response contains tokens directly, not in data property)
                this.storeTokens(response);
                
                // Show success message
                this.showToast('Sign in successful! You are now logged in.', 'success');
                
                // For now, just show success - in a real app you'd redirect to dashboard
                console.log('Sign in successful, user logged in:', response.user);
                
                // Optional: Redirect after a delay to show success message  
                setTimeout(() => {
                    // In a real app, redirect to dashboard
                    console.log('Would redirect to dashboard here');
                }, 2000);
                
            } else {
                throw new Error(response.error || 'Sign in failed');
            }
            
        } catch (error) {
            console.error('Sign in error:', error);
            
            let errorMessage = 'Sign in failed. Please try again.';
            
            if (error.message.includes('Invalid credentials')) {
                errorMessage = 'Invalid email or password. Please check your credentials.';
            } else if (error.message.includes('Account locked')) {
                errorMessage = 'Account temporarily locked due to too many failed attempts. Please try again later.';
            } else if (error.message.includes('Rate limit')) {
                errorMessage = 'Too many attempts. Please wait a few minutes before trying again.';
            }
            
            Validation.showFormError(form, errorMessage);
            
        } finally {
            this.setLoading(false);
        }
    },

    /**
     * Handle registration form submission
     */
    async handleRegister(form) {
        if (this.isLoading) return;
        
        // Clear previous errors
        Validation.clearFormError(form);
        
        // Validate form
        const validation = Validation.validateForm(form);
        if (!validation.isValid) {
            Validation.showFormError(form, 'Please fix the errors above');
            return;
        }
        
        // Get form data
        const formData = new FormData(form);
        const fullName = formData.get('fullName');
        const email = formData.get('email');
        const password = formData.get('password');
        const terms = formData.get('terms');
        
        if (!terms) {
            Validation.showFormError(form, 'You must accept the terms and conditions');
            return;
        }
        
        try {
            this.setLoading(true);
            
            const response = await this.apiCall('POST', this.config.endpoints.register, {
                name: fullName,  // Backend expects 'name', not 'fullName'
                email,
                password
            });
            
            if (response.success) {
                // Store tokens (response contains tokens directly, not in data property)
                this.storeTokens(response);
                
                // Show success message
                this.showToast('Account created successfully! You are now signed in.', 'success');
                
                // For now, just show success - in a real app you'd redirect to dashboard
                console.log('Registration successful, user logged in:', response.user);
                
                // Optional: Redirect after a delay to show success message
                setTimeout(() => {
                    // In a real app, redirect to dashboard
                    console.log('Would redirect to dashboard here');
                }, 2000);
                
            } else {
                throw new Error(response.error || 'Registration failed');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.message.includes('Email already exists') || error.message.includes('User already exists')) {
                errorMessage = 'An account with this email already exists. <a href="/" style="color: #2563eb; text-decoration: underline; font-weight: 500;">Please sign in instead</a>.';
            } else if (error.message.includes('Invalid email')) {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.message.includes('Password too weak')) {
                errorMessage = 'Password does not meet security requirements.';
            }
            
            Validation.showFormError(form, errorMessage);
            
        } finally {
            this.setLoading(false);
        }
    },

    /**
     * Handle password reset request
     */
    async handlePasswordReset(form) {
        if (this.isLoading) return;
        
        // Clear previous errors
        Validation.clearFormError(form);
        
        // Validate email
        const formData = new FormData(form);
        const email = formData.get('email');
        
        const emailValidation = Validation.validateEmail(email);
        if (!emailValidation.isValid) {
            Validation.showFormError(form, emailValidation.errors[0]);
            return;
        }
        
        try {
            this.setLoading(true);
            
            const response = await this.apiCall('POST', this.config.endpoints.resetPassword, {
                email
            });
            
            if (response.success) {
                // Show success message
                const successElement = document.getElementById('reset-success');
                if (successElement) {
                    successElement.classList.remove('hidden');
                    successElement.scrollIntoView({ behavior: 'smooth' });
                }
                
                // Hide the form
                form.style.display = 'none';
                
            } else {
                throw new Error(response.error || 'Password reset failed');
            }
            
        } catch (error) {
            console.error('Password reset error:', error);
            
            let errorMessage = 'Failed to send reset email. Please try again.';
            
            if (error.message.includes('Email not found')) {
                errorMessage = 'No account found with this email address.';
            } else if (error.message.includes('Rate limit')) {
                errorMessage = 'Reset email already sent. Please check your inbox or try again later.';
            }
            
            Validation.showFormError(form, errorMessage);
            
        } finally {
            this.setLoading(false);
        }
    },

    /**
     * Handle password reset confirmation
     */
    async handlePasswordResetConfirm(form) {
        if (this.isLoading) return;
        
        const token = Utils.url.getParam('token');
        if (!token) {
            this.showErrorCard('Reset link is invalid or missing.');
            return;
        }
        
        // Clear previous errors
        Validation.clearFormError(form);
        
        // Validate form
        const validation = Validation.validateForm(form);
        if (!validation.isValid) {
            Validation.showFormError(form, 'Please fix the errors above');
            return;
        }
        
        // Get form data
        const formData = new FormData(form);
        const password = formData.get('password');
        
        try {
            this.setLoading(true);
            
            const response = await this.apiCall('PUT', `${this.config.endpoints.confirmReset}/${token}`, {
                password
            });
            
            if (response.success) {
                this.showSuccessCard();
            } else {
                throw new Error(response.error || 'Password reset failed');
            }
            
        } catch (error) {
            console.error('Password reset confirm error:', error);
            
            if (error.message.includes('Invalid token') || error.message.includes('Expired token')) {
                this.showErrorCard('Reset link is invalid or expired.');
            } else {
                Validation.showFormError(form, 'Failed to reset password. Please try again.');
            }
            
        } finally {
            this.setLoading(false);
        }
    },

    /**
     * Validate reset token
     */
    async validateResetToken(token) {
        try {
            // This would be a separate endpoint to validate the token
            // For now, we'll assume it's valid if present
            console.log('Validating reset token:', token);
            
        } catch (error) {
            console.error('Token validation error:', error);
            this.showErrorCard('Reset link is invalid or expired.');
        }
    },

    /**
     * Initialize OIDC flow
     */
    async initiateOIDCFlow() {
        try {
            // Generate PKCE parameters
            const codeVerifier = Utils.generateSecureRandomString(128);
            const codeChallenge = await this.generateCodeChallenge(codeVerifier);
            const state = Utils.generateSecureRandomString(32);
            
            // Store PKCE parameters
            Utils.sessionStorage.set('oidc_code_verifier', codeVerifier);
            Utils.sessionStorage.set('oidc_state', state);
            
            // Update config
            this.config.oidc.state = state;
            this.config.oidc.codeChallenge = codeChallenge;
            
            // Build authorization URL
            const authUrl = this.buildAuthorizationUrl();
            
            // Redirect to authorization endpoint
            window.location.href = authUrl;
            
        } catch (error) {
            console.error('OIDC flow initiation error:', error);
            this.showToast('Authentication setup failed. Please try again.', 'error');
        }
    },

    /**
     * Generate PKCE code challenge
     */
    async generateCodeChallenge(codeVerifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    },

    /**
     * Build authorization URL
     */
    buildAuthorizationUrl() {
        const params = {
            client_id: this.config.oidc.clientId,
            redirect_uri: this.config.oidc.redirectUri,
            response_type: this.config.oidc.responseType,
            scope: this.config.oidc.scope,
            state: this.config.oidc.state,
            code_challenge: this.config.oidc.codeChallenge,
            code_challenge_method: this.config.oidc.codeChallengeMethod
        };
        
        const queryString = Utils.url.buildQueryString(params);
        return `${this.config.apiUrl}/auth/authorize?${queryString}`;
    },

    /**
     * Handle OIDC callback
     */
    async handleOIDCCallback(params) {
        try {
            const storedState = Utils.sessionStorage.get('oidc_state');
            const codeVerifier = Utils.sessionStorage.get('oidc_code_verifier');
            
            // Validate state parameter
            if (params.state !== storedState) {
                throw new Error('Invalid state parameter');
            }
            
            // Exchange code for tokens
            const response = await this.apiCall('POST', '/auth/token', {
                grant_type: 'authorization_code',
                code: params.code,
                redirect_uri: this.config.oidc.redirectUri,
                client_id: this.config.oidc.clientId,
                code_verifier: codeVerifier
            });
            
            if (response.success) {
                // Clean up session storage
                Utils.sessionStorage.remove('oidc_state');
                Utils.sessionStorage.remove('oidc_code_verifier');
                
                // Handle successful authentication
                this.handleAuthenticationSuccess(response.data);
            } else {
                throw new Error(response.error || 'Token exchange failed');
            }
            
        } catch (error) {
            console.error('OIDC callback error:', error);
            this.showToast('Authentication failed. Please try again.', 'error');
        }
    },

    /**
     * Handle successful authentication
     */
    handleAuthenticationSuccess(tokenData) {
        // Store tokens
        this.storeTokens(tokenData);
        
        // Get redirect URL from session storage or use default
        const redirectUrl = Utils.sessionStorage.get('auth_redirect_url') || '/dashboard';
        Utils.sessionStorage.remove('auth_redirect_url');
        
        // Show success message
        this.showToast('Authentication successful! Redirecting...', 'success');
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1500);
    },

    /**
     * Store authentication tokens
     */
    storeTokens(tokenData) {
        // Handle both camelCase and snake_case field names
        const accessToken = tokenData.accessToken || tokenData.access_token;
        const refreshToken = tokenData.refreshToken || tokenData.refresh_token;
        const expiresIn = tokenData.expiresIn || tokenData.expires_in;
        
        if (accessToken) {
            Utils.storage.set('access_token', accessToken);
        }
        
        if (refreshToken) {
            Utils.storage.set('refresh_token', refreshToken);
        }
        
        if (expiresIn) {
            const expiresAt = Date.now() + (expiresIn * 1000);
            Utils.storage.set('token_expires_at', expiresAt);
        }
        
        if (tokenData.user) {
            Utils.storage.set('user_profile', tokenData.user);
        }
    },

    /**
     * Make API call
     */
    async apiCall(method, endpoint, data = null) {
        const url = `${this.config.apiUrl}${endpoint}`;
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        // Add authorization header if we have a token
        const accessToken = Utils.storage.get('access_token');
        if (accessToken) {
            options.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        // Add request body for POST/PUT requests
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            // Handle network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network connection failed. Please check your internet connection.');
            }
            
            throw error;
        }
    },

    /**
     * Show/hide loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        const overlay = document.getElementById('loading-overlay');
        const buttons = document.querySelectorAll('button[type="submit"]');
        
        if (loading) {
            if (overlay) overlay.classList.remove('hidden');
            buttons.forEach(btn => {
                btn.disabled = true;
                btn.querySelector('.btn-spinner')?.classList.remove('hidden');
            });
        } else {
            if (overlay) overlay.classList.add('hidden');
            buttons.forEach(btn => {
                btn.disabled = false;
                btn.querySelector('.btn-spinner')?.classList.add('hidden');
            });
        }
    },

    /**
     * Show success card (for password reset)
     */
    showSuccessCard() {
        const resetCard = document.getElementById('reset-password-card');
        const successCard = document.getElementById('success-card');
        
        if (resetCard) resetCard.classList.add('hidden');
        if (successCard) successCard.classList.remove('hidden');
    },

    /**
     * Show error card (for password reset)
     */
    showErrorCard(message) {
        const resetCard = document.getElementById('reset-password-card');
        const errorCard = document.getElementById('error-card');
        
        if (resetCard) resetCard.classList.add('hidden');
        if (errorCard) {
            errorCard.classList.remove('hidden');
            const messageElement = errorCard.querySelector('.auth-subtitle');
            if (messageElement) messageElement.textContent = message;
        }
    },

    /**
     * Show password reset form
     */
    showPasswordReset() {
        const signinCard = document.getElementById('signin-card');
        const resetCard = document.getElementById('reset-card');
        
        if (signinCard) signinCard.classList.add('hidden');
        if (resetCard) resetCard.classList.remove('hidden');
    },

    /**
     * Show sign-in form
     */
    showSignIn() {
        const signinCard = document.getElementById('signin-card');
        const resetCard = document.getElementById('reset-card');
        
        if (resetCard) resetCard.classList.add('hidden');
        if (signinCard) signinCard.classList.remove('hidden');
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const toastId = type === 'success' ? 'success-toast' : 'error-toast';
        const toast = document.getElementById(toastId);
        
        if (!toast) return;
        
        const messageElement = toast.querySelector('.toast-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        // Show toast
        toast.classList.remove('hidden');
        toast.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 5000);
    }
};

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthApp;
}
