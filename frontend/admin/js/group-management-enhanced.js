// Enhanced Group Management Script
console.log('Enhanced group management script loading...');

// Global state
let currentGroups = [];
let currentUsers = [];
let selectedGroup = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, initializing enhanced group management...');
    
    // Initialize only if we're on the groups page
    if (document.getElementById('group-management')) {
        console.log('Group management page detected');
        setTimeout(() => {
            initEnhancedGroupManagement();
        }, 500);
    }
});

async function initEnhancedGroupManagement() {
    console.log('Initializing enhanced group management...');
    
    try {
        // Load initial data
        await Promise.all([
            loadGroups(),
            loadUsers()
        ]);
        
        setupEventListeners();
        setupModals();
        
        console.log('Enhanced group management initialization complete!');
    } catch (error) {
        console.error('Failed to initialize group management:', error);
        showError('Failed to load group data. Please refresh the page.');
    }
}

// Load groups from API
async function loadGroups() {
    try {
        console.log('Loading groups from API...');
        const groups = await AdminAPI.getGroups();
        currentGroups = groups.groups || [];
        renderGroupTable(currentGroups);
        console.log('Loaded', currentGroups.length, 'groups');
    } catch (error) {
        console.error('Failed to load groups:', error);
        currentGroups = [];
        renderGroupTable([]);
        throw error;
    }
}

// Load users from API
async function loadUsers() {
    try {
        console.log('Loading users from API...');
        const users = await AdminAPI.getUsers();
        currentUsers = users.users || [];
        console.log('Loaded', currentUsers.length, 'users');
    } catch (error) {
        console.error('Failed to load users:', error);
        currentUsers = [];
        throw error;
    }
}

// Enhanced group table rendering with user management buttons
function renderGroupTable(groups) {
    console.log('Rendering enhanced group table with', groups.length, 'groups');
    
    const container = document.getElementById('group-table-container');
    if (!container) {
        console.error('Group table container not found!');
        return;
    }
    
    if (groups.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No groups found.</p>';
        return;
    }
    
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Group Name</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Users</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    groups.forEach(group => {
        const createdDate = group.created_at ? new Date(group.created_at).toLocaleDateString() : 'N/A';
        const typeClass = group.is_system ? 'system' : 'custom';
        const typeBadge = group.is_system ? '🔒 System' : '👤 Custom';
        
        html += `
            <tr data-group-name="${group.name}">
                <td>
                    <div>
                        <div style="font-weight: 500;">
                            <span class="group-tag ${group.name}">${escapeHtml(group.name)}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">
                        ${escapeHtml(group.description || 'No description')}
                    </div>
                </td>
                <td>
                    <span class="type-badge type-${typeClass}">${typeBadge}</span>
                </td>
                <td>
                    <div class="users-container">
                        <div class="user-count">
                            <span class="count-badge">${group.user_count || 0} users</span>
                        </div>
                        <button class="btn btn-sm btn-outline" onclick="openGroupUsersModal('${escapeHtml(group.name)}')" title="Manage Group Users">
                            <span class="btn-icon">👥</span>
                            Manage Users
                        </button>
                    </div>
                </td>
                <td>${createdDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon" title="Edit Group" onclick="editGroup('${escapeHtml(group.name)}')">✏️</button>
                        <button class="btn btn-icon" title="View Group Details" onclick="viewGroupDetails('${escapeHtml(group.name)}')">👁️</button>
                        ${!group.is_system ? `<button class="btn btn-icon" title="Delete Group" onclick="deleteGroup('${escapeHtml(group.name)}')" data-danger="true">🗑️</button>` : ''}
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
    console.log('Enhanced group table rendered successfully');
}

// Open group users management modal
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
        const lastLogin = user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never';
        
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
                        <div class="user-details">
                            <span class="user-email">${escapeHtml(user.email)}</span>
                            <span class="user-last-login">Last login: ${lastLogin}</span>
                        </div>
                    </div>
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

// Setup event listeners
function setupEventListeners() {
    // Group search
    const searchInput = document.getElementById('group-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleGroupSearch, 300));
    }
    
    // Type filter
    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) {
        typeFilter.addEventListener('change', handleTypeFilter);
    }
    
    // Add group button
    const addGroupBtn = document.getElementById('add-group-btn');
    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', () => {
            console.log('Add group clicked');
            showNotification('Add group functionality coming soon', 'info');
        });
    }
}

// Setup modals
function setupModals() {
    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeGroupUsersModal();
        }
    });
    
    // Close modal when pressing Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeGroupUsersModal();
        }
    });
    
    // Group users search
    setupGroupUsersSearch();
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

// Search functionality
function handleGroupSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    if (!searchTerm) {
        renderGroupTable(currentGroups);
        return;
    }
    
    const filteredGroups = currentGroups.filter(group => 
        group.name.toLowerCase().includes(searchTerm) ||
        (group.description || '').toLowerCase().includes(searchTerm)
    );
    
    renderGroupTable(filteredGroups);
}

// Type filter functionality
function handleTypeFilter(event) {
    const filterValue = event.target.value;
    
    let filteredGroups = currentGroups;
    
    if (filterValue === 'system') {
        filteredGroups = currentGroups.filter(group => group.is_system);
    } else if (filterValue === 'custom') {
        filteredGroups = currentGroups.filter(group => !group.is_system);
    }
    
    renderGroupTable(filteredGroups);
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
function editGroup(groupName) {
    console.log('Edit group:', groupName);
    showNotification('Edit group functionality coming soon', 'info');
}

function viewGroupDetails(groupName) {
    console.log('View group details:', groupName);
    showNotification('Group details functionality coming soon', 'info');
}

function deleteGroup(groupName) {
    console.log('Delete group:', groupName);
    if (confirm(`Are you sure you want to delete group ${groupName}?`)) {
        showNotification('Delete group functionality coming soon', 'info');
    }
}

console.log('Enhanced group management script loaded');
