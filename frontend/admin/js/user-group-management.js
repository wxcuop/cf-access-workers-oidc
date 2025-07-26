// Enhanced User-Group Management Script
console.log('Enhanced user-group management script loading...');

// Global state
let currentUsers = [];
let currentGroups = [];
let selectedUser = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, initializing enhanced user-group management...');
    
    // Initialize only if we're on the users page
    if (document.getElementById('user-management')) {
        console.log('User management page detected');
        setTimeout(() => {
            initEnhancedUserManagement();
        }, 500);
    }
});

async function initEnhancedUserManagement() {
    console.log('Initializing enhanced user management...');
    
    try {
        // Load initial data
        await Promise.all([
            loadUsers(),
            loadGroups()
        ]);
        
        setupEventListeners();
        setupModals();
        
        console.log('Enhanced user management initialization complete!');
    } catch (error) {
        console.error('Failed to initialize user management:', error);
        showError('Failed to load user data. Please refresh the page.');
    }
}

// Load users from API
async function loadUsers() {
    try {
        console.log('Loading users from API...');
        const users = await AdminAPI.getUsers();
        currentUsers = users.users || [];
        renderUserTable(currentUsers);
        console.log('Loaded', currentUsers.length, 'users');
    } catch (error) {
        console.error('Failed to load users:', error);
        currentUsers = [];
        renderUserTable([]);
        throw error;
    }
}

// Load groups from API
async function loadGroups() {
    try {
        console.log('Loading groups from API...');
        const groups = await AdminAPI.getGroups();
        currentGroups = groups.groups || [];
        console.log('Loaded', currentGroups.length, 'groups');
    } catch (error) {
        console.error('Failed to load groups:', error);
        currentGroups = [];
        throw error;
    }
}

// Enhanced user table rendering with group management buttons
function renderUserTable(users) {
    console.log('Rendering enhanced user table with', users.length, 'users');
    
    const container = document.getElementById('user-table-container');
    if (!container) {
        console.error('User table container not found!');
        return;
    }
    
    if (users.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No users found.</p>';
        return;
    }
    
    let html = `
        <table class="data-table">
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
        const statusClass = user.status === 'active' ? 'success' : 'warning';
        const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';
        const lastLoginDate = user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never';
        
        html += `
            <tr data-user-id="${user.id}" data-user-email="${user.email}">
                <td>
                    <div>
                        <div style="font-weight: 500;">${escapeHtml(user.name)}</div>
                        <div style="font-size: 0.875rem; color: var(--text-gray-600);">${escapeHtml(user.email)}</div>
                    </div>
                </td>
                <td>${createdDate}</td>
                <td>${lastLoginDate}</td>
                <td>
                    <div class="groups-container">
                        <div class="group-tags">
                            ${(user.groups || []).map(group => 
                                `<span class="group-tag" data-group="${escapeHtml(group)}">${escapeHtml(group)}</span>`
                            ).join(' ')}
                        </div>
                        <button class="btn btn-sm btn-outline" onclick="openUserGroupsModal('${user.email}')" title="Manage User Groups">
                            <span class="btn-icon">👥</span>
                            Edit Groups
                        </button>
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${user.status}">${user.status}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon" title="Edit User" onclick="editUser('${user.email}')">✏️</button>
                        <button class="btn btn-icon" title="Reset Password" onclick="resetPassword('${user.email}')">🔑</button>
                        <button class="btn btn-icon" title="Delete User" onclick="deleteUser('${user.email}')" data-danger="true">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
    console.log('Enhanced user table rendered successfully');
}

// Open user groups management modal
async function openUserGroupsModal(userEmail) {
    try {
        const user = currentUsers.find(u => u.email === userEmail);
        if (!user) {
            showError('User not found');
            return;
        }
        
        selectedUser = user;
        console.log('Opening groups modal for user:', user.email);
        
        // Populate modal
        document.getElementById('userGroupsModalTitle').textContent = `Manage Groups for ${user.name}`;
        document.getElementById('userGroupsModalEmail').textContent = user.email;
        
        // Render available groups
        renderGroupCheckboxes(user.groups || []);
        
        // Show modal
        document.getElementById('userGroupsModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Failed to open user groups modal:', error);
        showError('Failed to open groups management');
    }
}

// Render group checkboxes in the modal
function renderGroupCheckboxes(userGroups = []) {
    const container = document.getElementById('userGroupsCheckboxes');
    if (!container) {
        console.error('Groups checkboxes container not found');
        return;
    }
    
    let html = '';
    currentGroups.forEach(group => {
        const isChecked = userGroups.includes(group.name);
        const isSystem = group.is_system;
        const description = group.description || '';
        
        html += `
            <div class="checkbox-item ${isSystem ? 'system-group' : ''}">
                <input type="checkbox" 
                       id="group-${group.name}" 
                       name="groups" 
                       value="${escapeHtml(group.name)}"
                       ${isChecked ? 'checked' : ''}
                       onchange="handleGroupToggle(this, '${escapeHtml(group.name)}')">
                <label for="group-${group.name}" class="checkbox-label">
                    <div class="group-info">
                        <span class="group-name">${escapeHtml(group.name)}</span>
                        ${isSystem ? '<span class="system-badge">System</span>' : ''}
                    </div>
                    ${description ? `<div class="group-description">${escapeHtml(description)}</div>` : ''}
                </label>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Handle individual group toggle
async function handleGroupToggle(checkbox, groupName) {
    if (!selectedUser) return;
    
    const isChecked = checkbox.checked;
    const userEmail = selectedUser.email;
    
    try {
        if (isChecked) {
            // Add user to group
            console.log('Adding user to group:', userEmail, '->', groupName);
            await AdminAPI.addUserToGroup(userEmail, [groupName]);
        } else {
            // Remove user from group
            console.log('Removing user from group:', userEmail, '->', groupName);
            await AdminAPI.removeUserFromGroup(userEmail, groupName);
        }
        
        // Update local data
        await loadUsers();
        
        // Show success message
        showSuccess(isChecked ? 
            `Added ${selectedUser.name} to ${groupName}` : 
            `Removed ${selectedUser.name} from ${groupName}`
        );
        
    } catch (error) {
        console.error('Failed to toggle group membership:', error);
        // Revert checkbox state
        checkbox.checked = !isChecked;
        showError(`Failed to ${isChecked ? 'add to' : 'remove from'} group: ${error.message}`);
    }
}

// Save all group changes at once
async function saveUserGroups() {
    if (!selectedUser) return;
    
    try {
        // Get checked groups
        const checkboxes = document.querySelectorAll('#userGroupsCheckboxes input[type="checkbox"]:checked');
        const selectedGroups = Array.from(checkboxes).map(cb => cb.value);
        
        console.log('Saving user groups:', selectedUser.email, selectedGroups);
        
        // Update user groups
        await AdminAPI.updateUserGroups(selectedUser.email, selectedGroups);
        
        // Refresh user data
        await loadUsers();
        
        // Close modal
        closeUserGroupsModal();
        
        showSuccess(`Updated groups for ${selectedUser.name}`);
        
    } catch (error) {
        console.error('Failed to save user groups:', error);
        showError('Failed to save group changes: ' + error.message);
    }
}

// Close user groups modal
function closeUserGroupsModal() {
    document.getElementById('userGroupsModal').style.display = 'none';
    selectedUser = null;
}

// Setup event listeners
function setupEventListeners() {
    // User search
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleUserSearch, 300));
    }
    
    // Add user button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            // Existing add user functionality
            console.log('Add user clicked');
        });
    }
}

// Setup modals
function setupModals() {
    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeUserGroupsModal();
        }
    });
    
    // Close modal when pressing Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeUserGroupsModal();
        }
    });
}

// Search functionality
function handleUserSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    if (!searchTerm) {
        renderUserTable(currentUsers);
        return;
    }
    
    const filteredUsers = currentUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        (user.groups || []).some(group => group.toLowerCase().includes(searchTerm))
    );
    
    renderUserTable(filteredUsers);
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${escapeHtml(message)}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add to page
    let container = document.getElementById('notifications');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifications';
        container.className = 'notifications-container';
        document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Placeholder functions for existing functionality
function editUser(userEmail) {
    console.log('Edit user:', userEmail);
    showNotification('Edit user functionality coming soon', 'info');
}

function resetPassword(userEmail) {
    console.log('Reset password for:', userEmail);
    showNotification('Password reset functionality coming soon', 'info');
}

function deleteUser(userEmail) {
    console.log('Delete user:', userEmail);
    if (confirm(`Are you sure you want to delete user ${userEmail}?`)) {
        showNotification('Delete user functionality coming soon', 'info');
    }
}

// Quick action functions for user groups modal
function selectAllGroups() {
    const checkboxes = document.querySelectorAll('#userGroupsCheckboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            checkbox.checked = true;
            // Trigger change event for each checkbox
            checkbox.dispatchEvent(new Event('change'));
        }
    });
}

function deselectAllGroups() {
    const checkboxes = document.querySelectorAll('#userGroupsCheckboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            checkbox.checked = false;
            // Trigger change event for each checkbox
            checkbox.dispatchEvent(new Event('change'));
        }
    });
}

function selectSystemGroups() {
    const checkboxes = document.querySelectorAll('#userGroupsCheckboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const groupName = checkbox.value;
        const group = currentGroups.find(g => g.name === groupName);
        const shouldBeChecked = group && group.is_system;
        
        if (checkbox.checked !== shouldBeChecked) {
            checkbox.checked = shouldBeChecked;
            // Trigger change event for each checkbox
            checkbox.dispatchEvent(new Event('change'));
        }
    });
}

// Group Users Management (for groups page)
let selectedGroup = null;

async function openGroupUsersModal(groupName) {
    try {
        const group = currentGroups.find(g => g.name === groupName);
        if (!group) {
            showError('Group not found');
            return;
        }
        
        selectedGroup = group;
        console.log('Opening users modal for group:', group.name);
        
        // Populate modal
        document.getElementById('groupUsersModalTitle').textContent = `Manage Users in ${group.name}`;
        document.getElementById('groupUsersModalName').textContent = group.name;
        document.getElementById('groupUsersModalDescription').textContent = group.description || 'No description';
        
        // Get users in group
        const groupUsers = await AdminAPI.getGroupUsers(group.name);
        const userEmails = groupUsers.users ? groupUsers.users.map(u => u.email) : [];
        
        // Render available users
        renderUserCheckboxes(userEmails);
        
        // Show modal
        document.getElementById('groupUsersModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Failed to open group users modal:', error);
        showError('Failed to open users management');
    }
}

function renderUserCheckboxes(groupUserEmails = []) {
    const container = document.getElementById('groupUsersCheckboxes');
    if (!container) {
        console.error('Users checkboxes container not found');
        return;
    }
    
    let html = '';
    currentUsers.forEach(user => {
        const isChecked = groupUserEmails.includes(user.email);
        const statusBadge = user.status === 'active' ? '🟢' : '🔴';
        
        html += `
            <div class="checkbox-item">
                <input type="checkbox" 
                       id="user-${user.email}" 
                       name="users" 
                       value="${escapeHtml(user.email)}"
                       ${isChecked ? 'checked' : ''}
                       onchange="handleUserToggle(this, '${escapeHtml(user.email)}')">
                <label for="user-${user.email}" class="checkbox-label">
                    <div class="user-info">
                        <span class="user-name">${escapeHtml(user.name)} ${statusBadge}</span>
                    </div>
                    <div class="user-email">${escapeHtml(user.email)}</div>
                </label>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function handleUserToggle(checkbox, userEmail) {
    if (!selectedGroup) return;
    
    const isChecked = checkbox.checked;
    const groupName = selectedGroup.name;
    
    try {
        if (isChecked) {
            // Add user to group
            console.log('Adding user to group:', userEmail, '->', groupName);
            await AdminAPI.addUserToGroupFromGroup(groupName, userEmail);
        } else {
            // Remove user from group
            console.log('Removing user from group:', userEmail, '->', groupName);
            await AdminAPI.removeUserFromGroupFromGroup(groupName, userEmail);
        }
        
        // Update local data
        await Promise.all([loadUsers(), loadGroups()]);
        
        // Show success message
        const user = currentUsers.find(u => u.email === userEmail);
        const userName = user ? user.name : userEmail;
        showSuccess(isChecked ? 
            `Added ${userName} to ${groupName}` : 
            `Removed ${userName} from ${groupName}`
        );
        
    } catch (error) {
        console.error('Failed to toggle user membership:', error);
        // Revert checkbox state
        checkbox.checked = !isChecked;
        showError(`Failed to ${isChecked ? 'add to' : 'remove from'} group: ${error.message}`);
    }
}

function closeGroupUsersModal() {
    document.getElementById('groupUsersModal').style.display = 'none';
    selectedGroup = null;
}

async function saveGroupUsers() {
    if (!selectedGroup) return;
    
    try {
        // This functionality is handled by individual toggles
        // Just close the modal
        closeGroupUsersModal();
        showSuccess(`Updated users for ${selectedGroup.name}`);
        
    } catch (error) {
        console.error('Failed to save group users:', error);
        showError('Failed to save user changes: ' + error.message);
    }
}

// Group users search functionality
function setupGroupUsersSearch() {
    const searchInput = document.getElementById('groupUsersSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleGroupUsersSearch, 300));
    }
}

function handleGroupUsersSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const checkboxItems = document.querySelectorAll('#groupUsersCheckboxes .checkbox-item');
    
    checkboxItems.forEach(item => {
        const label = item.querySelector('.checkbox-label');
        const text = label.textContent.toLowerCase();
        
        if (!searchTerm || text.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Initialize group users search when modal opens
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for group users search
    setTimeout(() => {
        setupGroupUsersSearch();
    }, 1000);
});

console.log('Enhanced user-group management script loaded');
