// user-management.js - User management functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the user management page
    if (document.getElementById('user-management')) {
        initUserManagement();
    }
});

/**
 * Initialize user management page
 */
function initUserManagement() {
    // Mock users data
    const users = [
        {
            id: 'usr_001',
            email: 'john.doe@example.com',
            name: 'John Doe',
            created: '2023-09-15',
            lastLogin: '2023-10-27',
            groups: ['Admins', 'Developers'],
            status: 'active'
        },
        {
            id: 'usr_002',
            email: 'jane.smith@example.com',
            name: 'Jane Smith',
            created: '2023-08-22',
            lastLogin: '2023-10-26',
            groups: ['Managers'],
            status: 'active'
        },
        {
            id: 'usr_003',
            email: 'alice.johnson@example.com',
            name: 'Alice Johnson',
            created: '2023-07-10',
            lastLogin: '2023-10-20',
            groups: ['Users'],
            status: 'active'
        },
        {
            id: 'usr_004',
            email: 'bob.brown@example.com',
            name: 'Bob Brown',
            created: '2023-06-05',
            lastLogin: '2023-09-30',
            groups: ['Developers'],
            status: 'inactive'
        },
        {
            id: 'usr_005',
            email: 'carol.white@example.com',
            name: 'Carol White',
            created: '2023-10-01',
            lastLogin: '2023-10-25',
            groups: ['Managers', 'Users'],
            status: 'active'
        }
    ];

    renderUserTable(users);
    setupUserSearchFilter();
    setupUserActions();
}

/**
 * Render user table with data
 * @param {Array} users - Array of user objects
 */
function renderUserTable(users) {
    const tableContainer = document.getElementById('user-table-container');
    if (!tableContainer) return;

    let tableHTML = `
        <table class="data-table" id="users-table">
            <thead>
                <tr>
                    <th>Name / Email</th>
                    <th>Created</th>
                    <th>Last Login</th>
                    <th>Groups</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    users.forEach(user => {
        const statusClass = user.status === 'active' ? 'status-active' : 'status-inactive';
        
        tableHTML += `
            <tr data-user-id="${user.id}">
                <td>
                    <div class="user-info">
                        <div class="user-name">${user.name}</div>
                        <div class="user-email">${user.email}</div>
                    </div>
                </td>
                <td>${formatDate(user.created)}</td>
                <td>${formatDate(user.lastLogin)}</td>
                <td>
                    <div class="group-tags">
                        ${user.groups.map(group => `<span class="group-tag">${group}</span>`).join('')}
                    </div>
                </td>
                <td><span class="status-badge ${statusClass}">${user.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon btn-edit" title="Edit User">✏️</button>
                        <button class="btn btn-icon btn-reset-pw" title="Reset Password">🔑</button>
                        <button class="btn btn-icon btn-toggle-status" title="${user.status === 'active' ? 'Deactivate' : 'Activate'}">
                            ${user.status === 'active' ? '❌' : '✅'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = tableHTML;

    // Add table specific styles
    const style = document.createElement('style');
    style.textContent = `
        .user-info {
            display: flex;
            flex-direction: column;
        }
        
        .user-name {
            font-weight: 500;
        }
        
        .user-email {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
        }
        
        .group-tags {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-xs);
        }
        
        .group-tag {
            background-color: var(--bg-light);
            border-radius: var(--border-radius-sm);
            padding: 2px 6px;
            font-size: var(--font-size-xs);
        }
        
        .status-badge {
            padding: 4px 8px;
            border-radius: var(--border-radius-sm);
            font-size: var(--font-size-xs);
            font-weight: 500;
            text-transform: capitalize;
        }
        
        .status-active {
            background-color: var(--success-bg);
            color: var(--success-color);
        }
        
        .status-inactive {
            background-color: var(--muted-bg);
            color: var(--text-muted);
        }
        
        .action-buttons {
            display: flex;
            gap: var(--spacing-sm);
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Set up search and filter functionality
 */
function setupUserSearchFilter() {
    const searchInput = document.getElementById('user-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const userRows = document.querySelectorAll('#users-table tbody tr');
        
        userRows.forEach(row => {
            const userName = row.querySelector('.user-name').textContent.toLowerCase();
            const userEmail = row.querySelector('.user-email').textContent.toLowerCase();
            
            if (userName.includes(searchTerm) || userEmail.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

/**
 * Set up user action buttons (edit, reset password, toggle status)
 */
function setupUserActions() {
    const userTable = document.getElementById('users-table');
    if (!userTable) return;
    
    userTable.addEventListener('click', function(e) {
        const target = e.target;
        const row = target.closest('tr');
        
        if (!row) return;
        
        const userId = row.dataset.userId;
        const userName = row.querySelector('.user-name').textContent;
        
        // Edit user button
        if (target.classList.contains('btn-edit')) {
            showModal('Edit User', `
                <form id="edit-user-form">
                    <div class="form-group">
                        <label for="edit-name">Name</label>
                        <input type="text" id="edit-name" value="${userName}" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="edit-email">Email</label>
                        <input type="email" id="edit-email" value="${row.querySelector('.user-email').textContent}" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="edit-groups">Groups</label>
                        <select id="edit-groups" multiple class="form-control">
                            <option value="Admins" ${row.querySelector('.group-tags').textContent.includes('Admins') ? 'selected' : ''}>Admins</option>
                            <option value="Developers" ${row.querySelector('.group-tags').textContent.includes('Developers') ? 'selected' : ''}>Developers</option>
                            <option value="Managers" ${row.querySelector('.group-tags').textContent.includes('Managers') ? 'selected' : ''}>Managers</option>
                            <option value="Users" ${row.querySelector('.group-tags').textContent.includes('Users') ? 'selected' : ''}>Users</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            `);
            
            document.getElementById('edit-user-form').addEventListener('submit', function(e) {
                e.preventDefault();
                // In a real app, this would send data to the backend
                showToast(`User ${userName} updated successfully`, 'success');
                hideModal();
            });
        }
        
        // Reset password button
        else if (target.classList.contains('btn-reset-pw')) {
            showModal('Reset Password', `
                <p>Send password reset email to <strong>${row.querySelector('.user-email').textContent}</strong>?</p>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancel</button>
                    <button type="button" class="btn btn-primary" id="confirm-reset">Send Reset Email</button>
                </div>
            `);
            
            document.getElementById('confirm-reset').addEventListener('click', function() {
                // In a real app, this would trigger a password reset email
                showToast(`Password reset email sent to ${row.querySelector('.user-email').textContent}`, 'success');
                hideModal();
            });
        }
        
        // Toggle status button
        else if (target.classList.contains('btn-toggle-status')) {
            const currentStatus = row.querySelector('.status-badge').textContent;
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            
            showModal(`${currentStatus === 'active' ? 'Deactivate' : 'Activate'} User`, `
                <p>Are you sure you want to change the status of <strong>${userName}</strong> to <strong>${newStatus}</strong>?</p>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancel</button>
                    <button type="button" class="btn btn-primary" id="confirm-status-change">Confirm</button>
                </div>
            `);
            
            document.getElementById('confirm-status-change').addEventListener('click', function() {
                // In a real app, this would update the user status in the database
                row.querySelector('.status-badge').textContent = newStatus;
                row.querySelector('.status-badge').className = `status-badge status-${newStatus}`;
                target.textContent = newStatus === 'active' ? '❌' : '✅';
                target.title = newStatus === 'active' ? 'Deactivate' : 'Activate';
                
                showToast(`User ${userName} is now ${newStatus}`, 'success');
                hideModal();
            });
        }
    });
}

/**
 * Show a modal dialog
 * @param {string} title - Modal title
 * @param {string} content - Modal HTML content
 */
function showModal(title, content) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('admin-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'admin-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s ease, visibility 0.2s ease;
            }
            
            .modal.visible {
                opacity: 1;
                visibility: visible;
            }
            
            .modal-content {
                background-color: var(--bg-primary);
                border-radius: var(--border-radius);
                width: 100%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            }
            
            .modal-header {
                padding: var(--spacing-md);
                border-bottom: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .modal-title {
                font-size: var(--font-size-lg);
                font-weight: 600;
                margin: 0;
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: var(--font-size-lg);
                cursor: pointer;
                padding: 0;
            }
            
            .modal-body {
                padding: var(--spacing-md);
            }
        `;
        document.head.appendChild(style);
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button type="button" class="modal-close" onclick="hideModal()">×</button>
            </div>
            <div class="modal-body">${content}</div>
        </div>
    `;
    
    // Show modal after a brief delay to ensure smooth animation
    setTimeout(() => {
        modal.classList.add('visible');
    }, 10);
    
    // Close when clicking outside modal content
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideModal();
        }
    });
}

/**
 * Hide the modal dialog
 */
function hideModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
    }
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, warning, error)
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
        
        // Add toast styles
        const style = document.createElement('style');
        style.textContent = `
            #toast-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1001;
            }
            
            .toast {
                padding: var(--spacing-md);
                margin-top: var(--spacing-md);
                border-radius: var(--border-radius);
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
                min-width: 250px;
                max-width: 350px;
                animation: toast-in 0.3s ease, toast-out 0.3s ease 3.7s forwards;
            }
            
            .toast.success {
                background-color: var(--success-bg);
                color: var(--success-color);
                border-left: 4px solid var(--success-color);
            }
            
            .toast.warning {
                background-color: var(--warning-bg);
                color: var(--warning-color);
                border-left: 4px solid var(--warning-color);
            }
            
            .toast.error {
                background-color: var(--danger-bg);
                color: var(--danger-color);
                border-left: 4px solid var(--danger-color);
            }
            
            .toast.info {
                background-color: var(--info-bg);
                color: var(--info-color);
                border-left: 4px solid var(--info-color);
            }
            
            @keyframes toast-in {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes toast-out {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Remove after animation
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

/**
 * Format date to a readable string
 * @param {string} dateStr - ISO date string
 * @returns {string} - Formatted date string
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    // If less than 7 days ago, show relative time
    if (diffDays < 7) {
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else {
            return `${diffDays} days ago`;
        }
    }
    
    // Otherwise show formatted date
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}
