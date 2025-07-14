// Dashboard JavaScript - Clean Version
console.log('Dashboard script loading...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, initializing dashboard...');
    
    // Initialize only if we're on the dashboard page
    if (document.getElementById('dashboard')) {
        console.log('Dashboard page detected');
        initDashboard();
    } else {
        console.log('Not on dashboard page');
    }
});

function initDashboard() {
    console.log('Initializing dashboard...');
    
    // Initialize components
    initSidebar();
    loadDashboardData();
    loadRecentActivity();
    loadSystemHealth();
}

function initSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    const adminLayout = document.querySelector('.admin-layout');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            adminLayout.classList.toggle('collapsed');
        });
    }
}

function loadDashboardData() {
    console.log('Loading dashboard data...');
    
    // Simulate loading delay
    setTimeout(() => {
        // Update stats cards with sample data
        document.getElementById('total-users').textContent = '1,247';
        document.getElementById('total-groups').textContent = '8';
        document.getElementById('login-rate').textContent = '97.3%';
        document.getElementById('active-sessions').textContent = '42';
        
        console.log('Dashboard stats updated');
    }, 1000);
}

function loadRecentActivity() {
    console.log('Loading recent activity...');
    
    const activityList = document.getElementById('recent-activity');
    if (!activityList) return;
    
    // Sample activity data
    const activities = [
        {
            type: 'login',
            user: 'john.doe@example.com',
            time: '2 minutes ago',
            icon: '✅',
            message: 'User signed in successfully'
        },
        {
            type: 'user_created',
            user: 'admin@nyworking.us',
            time: '15 minutes ago',
            icon: '➕',
            message: 'Created new user account',
            details: 'Created: jane.smith@example.com'
        },
        {
            type: 'login_failed',
            user: 'unknown@example.com',
            time: '32 minutes ago',
            icon: '⚠️',
            message: 'Failed login attempt'
        },
        {
            type: 'group_update',
            user: 'admin@nyworking.us',
            time: '1 hour ago',
            icon: '🔄',
            message: 'Updated group permissions',
            details: 'Modified "Managers" group'
        },
        {
            type: 'password_reset',
            user: 'alice.johnson@example.com',
            time: '2 hours ago',
            icon: '🔑',
            message: 'Password reset completed'
        }
    ];
    
    // Clear loading message
    activityList.innerHTML = '';
    
    // Create activity items
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        activityItem.innerHTML = `
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-content">
                <div class="activity-message">
                    <strong>${activity.user}</strong> ${activity.message}
                </div>
                ${activity.details ? `<div class="activity-details">${activity.details}</div>` : ''}
                <div class="activity-time">${activity.time}</div>
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
    
    console.log('Recent activity loaded');
}

function loadSystemHealth() {
    console.log('Loading system health...');
    
    const healthList = document.getElementById('system-health');
    if (!healthList) return;
    
    // Sample health data
    const healthData = [
        { name: 'API Response Time', value: '45ms', status: 'healthy' },
        { name: 'Database Connection', value: 'Connected', status: 'healthy' },
        { name: 'Authentication Service', value: 'Operational', status: 'healthy' },
        { name: 'Session Storage', value: '34% Used', status: 'healthy' },
        { name: 'Error Rate', value: '0.1%', status: 'healthy' }
    ];
    
    // Clear loading message
    healthList.innerHTML = '';
    
    // Create health status items
    healthData.forEach(item => {
        const healthItem = document.createElement('div');
        healthItem.className = 'health-item';
        
        healthItem.innerHTML = `
            <div class="health-name">${item.name}</div>
            <div class="health-value">
                <span class="health-status ${item.status}"></span>
                ${item.value}
            </div>
        `;
        
        healthList.appendChild(healthItem);
    });
    
    console.log('System health loaded');
}

function refreshSystemHealth() {
    console.log('Refreshing system health...');
    
    const healthList = document.getElementById('system-health');
    if (healthList) {
        healthList.innerHTML = '<div class="placeholder-text">Refreshing...</div>';
        
        // Reload after a short delay
        setTimeout(() => {
            loadSystemHealth();
        }, 1000);
    }
}

console.log('Dashboard script loaded successfully');
