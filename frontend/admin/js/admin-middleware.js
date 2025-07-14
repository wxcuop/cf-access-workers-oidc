/**
 * Authentication Middleware for Admin Pages
 * Include this script on all protected admin pages
 */

// Ensure AdminAuth is loaded
if (typeof adminAuth === 'undefined') {
    console.error('AdminAuth not loaded. Please include admin-auth.js before this script.');
}

// Page protection and user info initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication but don't block for testing
    if (typeof adminAuth !== 'undefined' && !adminAuth.isAuthenticated()) {
        console.log('User not authenticated. In production, would redirect to login.');
        // For now, just log instead of redirecting
        // adminAuth.redirectToLogin();
        // return;
    }

    console.log('Auth middleware: Authentication check complete');

    // Initialize user info in header if elements exist
    const user = adminAuth ? adminAuth.getCurrentUser() : null;
    if (user) {
        // Update user name and avatar in header
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');
        const userProfileEl = document.getElementById('userProfile');

        if (userNameEl) {
            userNameEl.textContent = user.name;
        }
        
        if (userAvatarEl) {
            userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
        }

        if (userProfileEl) {
            const roleDisplay = user.role === 'super_admin' ? 'Super Admin' : 
                               user.role === 'admin' ? 'Admin' : 'Manager';
            userProfileEl.textContent = `${user.name} (${roleDisplay})`;
        }

        // Show/hide elements based on permissions
        applyPermissions(user.role);
    }

    // Initialize sidebar toggle functionality
    initSidebarToggle();
});

/**
 * Apply role-based permissions to UI elements
 */
function applyPermissions(userRole) {
    const permissionElements = document.querySelectorAll('[data-permission]');
    
    permissionElements.forEach(element => {
        const requiredRole = element.getAttribute('data-permission');
        
        if (adminAuth && !adminAuth.hasPermission(requiredRole)) {
            element.style.display = 'none';
        }
    });
}

/**
 * Initialize sidebar toggle functionality
 */
function initSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Handle dropdown toggle
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (dropdownToggle && dropdownMenu) {
        dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdownMenu.classList.remove('show');
        });
    }
}

// Global utility functions for admin pages
window.AdminUtils = {
    /**
     * Check if current user has permission for an action
     */
    hasPermission: (role) => {
        return adminAuth ? adminAuth.hasPermission(role) : false;
    },

    /**
     * Get current user info
     */
    getCurrentUser: () => {
        return adminAuth ? adminAuth.getCurrentUser() : null;
    },

    /**
     * Format timestamp for display
     */
    formatTimestamp: (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    },

    /**
     * Show success message
     */
    showSuccess: (message) => {
        // Simple success notification - can be enhanced with a toast library
        console.log('Success:', message);
        alert(`Success: ${message}`);
    },

    /**
     * Show error message
     */
    showError: (message) => {
        // Simple error notification - can be enhanced with a toast library
        console.error('Error:', message);
        alert(`Error: ${message}`);
    },

    /**
     * Confirm action with user
     */
    confirm: (message) => {
        return confirm(message);
    }
};

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.AdminUtils;
}
