// admin-dashboard.js - Main dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard components
    initDashboard();
    initSidebar();
});

/**
 * Initialize dashboard data and components
 */
function initDashboard() {
    // Simulate loading dashboard data
    setTimeout(() => {
        // Update stats cards with sample data
        document.getElementById('total-users').textContent = '156';
        document.getElementById('total-groups').textContent = '8';
        document.getElementById('login-rate').textContent = '97%';
        document.getElementById('active-sessions').textContent = '42';
        
        // Add trends to stats cards
        const trendsElements = document.querySelectorAll('.stats-trend');
        trendsElements[0].textContent = '↑ 12% this month';
        trendsElements[0].style.color = 'var(--success-color)';
        
        trendsElements[1].textContent = '↑ 2 new groups';
        trendsElements[1].style.color = 'var(--success-color)';
        
        trendsElements[2].textContent = '↑ 3% improvement';
        trendsElements[2].style.color = 'var(--success-color)';
        
        trendsElements[3].textContent = '↓ 5% from yesterday';
        trendsElements[3].style.color = 'var(--text-muted)';
        
        // Load recent activity
        loadRecentActivity();
        
        // Load system health
        loadSystemHealth();
    }, 1000);
}

/**
 * Initialize sidebar functionality
 */
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

/**
 * Load recent activity data
 */
function loadRecentActivity() {
    const activityList = document.getElementById('recent-activity');
    
    if (!activityList) return;
    
    // Sample activity data
    const activities = [
        {
            type: 'login',
            user: 'john.doe@example.com',
            time: '10 minutes ago',
            status: 'success'
        },
        {
            type: 'group_update',
            user: 'admin@nyworking.us',
            time: '25 minutes ago',
            status: 'info',
            details: 'Updated "Managers" group permissions'
        },
        {
            type: 'login_failed',
            user: 'jane.smith@example.com',
            time: '45 minutes ago',
            status: 'warning'
        },
        {
            type: 'user_created',
            user: 'admin@nyworking.us',
            time: '1 hour ago',
            status: 'info',
            details: 'Created new user: richard.roe@example.com'
        },
        {
            type: 'password_reset',
            user: 'alice.johnson@example.com',
            time: '2 hours ago',
            status: 'info'
        }
    ];
    
    // Clear loading message
    activityList.innerHTML = '';
    
    // Create activity items
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = `activity-item ${activity.status}`;
        
        let icon = '';
        let message = '';
        
        switch(activity.type) {
            case 'login':
                icon = '✅';
                message = `<strong>${activity.user}</strong> signed in successfully`;
                break;
            case 'login_failed':
                icon = '⚠️';
                message = `Failed login attempt for <strong>${activity.user}</strong>`;
                break;
            case 'user_created':
                icon = '➕';
                message = `<strong>${activity.user}</strong> created a new user account`;
                if (activity.details) {
                    message += `<div class="activity-details">${activity.details}</div>`;
                }
                break;
            case 'group_update':
                icon = '🔄';
                message = `<strong>${activity.user}</strong> updated group settings`;
                if (activity.details) {
                    message += `<div class="activity-details">${activity.details}</div>`;
                }
                break;
            case 'password_reset':
                icon = '🔑';
                message = `<strong>${activity.user}</strong> reset their password`;
                break;
            default:
                icon = 'ℹ️';
                message = `Activity by <strong>${activity.user}</strong>`;
        }
        
        activityItem.innerHTML = `
            <div class="activity-icon">${icon}</div>
            <div class="activity-content">
                <div class="activity-message">${message}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
    
    // Add activity styles
    const style = document.createElement('style');
    style.textContent = `
        .activity-item {
            padding: var(--spacing-md);
            border-bottom: 1px solid var(--border-light);
            display: flex;
            align-items: flex-start;
        }
        
        .activity-icon {
            margin-right: var(--spacing-md);
            font-size: var(--font-size-lg);
        }
        
        .activity-content {
            flex: 1;
        }
        
        .activity-message {
            margin-bottom: var(--spacing-xs);
        }
        
        .activity-time {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
        }
        
        .activity-details {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            margin-top: var(--spacing-xs);
        }
        
        .activity-item.success .activity-message {
            color: var(--success-color);
        }
        
        .activity-item.warning .activity-message {
            color: var(--warning-color);
        }
        
        .activity-item.danger .activity-message {
            color: var(--danger-color);
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Load system health data
 */
function loadSystemHealth() {
    const healthContainer = document.getElementById('system-health');
    
    if (!healthContainer) return;
    
    // Sample health data
    const healthData = [
        { name: 'API Response Time', value: '45ms', status: 'good' },
        { name: 'Database Status', value: 'Connected', status: 'good' },
        { name: 'Storage Usage', value: '34%', status: 'good' },
        { name: 'Worker CPU Usage', value: '78%', status: 'warning' },
        { name: 'Memory Usage', value: '52%', status: 'good' }
    ];
    
    // Clear loading message
    healthContainer.innerHTML = '';
    
    // Create health status items
    healthData.forEach(item => {
        const healthItem = document.createElement('div');
        healthItem.className = `health-item status-${item.status}`;
        
        let statusIcon = '';
        switch(item.status) {
            case 'good':
                statusIcon = '🟢';
                break;
            case 'warning':
                statusIcon = '🟠';
                break;
            case 'error':
                statusIcon = '🔴';
                break;
            default:
                statusIcon = '⚪';
        }
        
        healthItem.innerHTML = `
            <div class="health-name">${item.name}</div>
            <div class="health-value">
                <span class="status-icon">${statusIcon}</span>
                ${item.value}
            </div>
        `;
        
        healthContainer.appendChild(healthItem);
    });
    
    // Add health styles
    const style = document.createElement('style');
    style.textContent = `
        .health-item {
            padding: var(--spacing-sm) 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-light);
        }
        
        .health-name {
            font-weight: 500;
        }
        
        .health-value {
            display: flex;
            align-items: center;
        }
        
        .status-icon {
            margin-right: var(--spacing-sm);
        }
        
        .status-good .health-value {
            color: var(--success-color);
        }
        
        .status-warning .health-value {
            color: var(--warning-color);
        }
        
        .status-error .health-value {
            color: var(--danger-color);
        }
    `;
    
    document.head.appendChild(style);
}
