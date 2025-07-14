// Simple Group Management - Clean Version
console.log('Group management script loading...');

// Global groups array
let globalGroups = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, initializing group management...');
    
    // Initialize only if we're on the groups page
    if (document.getElementById('group-management')) {
        console.log('Group management page detected');
        initGroupManagement();
    } else {
        console.log('Not on group management page');
    }
});

function initGroupManagement() {
    console.log('Initializing group management...');
    
    // Sample data
    globalGroups = [
        {
            id: 'grp_001',
            name: 'Admins',
            description: 'Full system access administrators',
            memberCount: 3,
            permissions: ['Full Access', 'User Management', 'Group Management', 'Settings Management'],
            createdAt: '2023-06-15'
        },
        {
            id: 'grp_002',
            name: 'Developers',
            description: 'Development team members',
            memberCount: 12,
            permissions: ['App Access', 'API Access'],
            createdAt: '2023-06-20'
        },
        {
            id: 'grp_003',
            name: 'Managers',
            description: 'Team managers and supervisors',
            memberCount: 5,
            permissions: ['User Management', 'View Reports', 'App Access'],
            createdAt: '2023-07-05'
        },
        {
            id: 'grp_004',
            name: 'Users',
            description: 'Standard application users',
            memberCount: 136,
            permissions: ['App Access'],
            createdAt: '2023-07-10'
        }
    ];
    
    // Render the table
    renderGroupTable(globalGroups);
    
    // Setup add group button
    setupAddGroupButton();
}

function renderGroupTable(groups) {
    console.log('Rendering group table with', groups.length, 'groups');
    
    const container = document.getElementById('group-table-container');
    if (!container) {
        console.error('Group table container not found!');
        return;
    }
    
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Group Name</th>
                    <th>Description</th>
                    <th>Members</th>
                    <th>Permissions</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    groups.forEach(group => {
        html += `
            <tr>
                <td><strong>${group.name}</strong></td>
                <td>${group.description}</td>
                <td>${group.memberCount} members</td>
                <td>
                    ${group.permissions.map(perm => `<span class="permission-tag">${perm}</span>`).join(' ')}
                </td>
                <td>${formatDate(group.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon" title="Edit">✏️</button>
                        <button class="btn btn-icon" title="Members">👥</button>
                        <button class="btn btn-icon" title="Delete">🗑️</button>
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
    console.log('Group table rendered successfully');
}

function setupAddGroupButton() {
    console.log('Setting up add group button...');
    
    const addButton = document.getElementById('add-group-btn');
    if (!addButton) {
        console.error('Add group button not found!');
        return;
    }
    
    console.log('Add group button found, attaching click handler');
    
    addButton.addEventListener('click', function() {
        console.log('Add group button clicked!');
        showAddGroupModal();
    });
}

function showAddGroupModal() {
    console.log('Showing add group modal...');
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('group-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'group-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Add New Group</h3>
                <button type="button" class="modal-close" onclick="hideGroupModal()">×</button>
            </div>
            <div class="modal-body">
                <form id="add-group-form">
                    <div class="form-group">
                        <label for="group-name" class="form-label">Group Name</label>
                        <input type="text" id="group-name" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="group-description" class="form-label">Description</label>
                        <textarea id="group-description" class="form-input" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Permissions</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="checkbox" id="perm-full" value="Full Access">
                                <label for="perm-full">Full Access</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="perm-user" value="User Management">
                                <label for="perm-user">User Management</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="perm-group" value="Group Management">
                                <label for="perm-group">Group Management</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="perm-app" value="App Access" checked>
                                <label for="perm-app">App Access</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="hideGroupModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create Group</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Show modal
    setTimeout(() => {
        modal.classList.add('visible');
    }, 10);
    
    // Setup form submission
    document.getElementById('add-group-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const groupName = document.getElementById('group-name').value.trim();
        const groupDescription = document.getElementById('group-description').value.trim();
        
        // Get selected permissions
        const permissionCheckboxes = document.querySelectorAll('#add-group-form input[type="checkbox"]:checked');
        const permissions = Array.from(permissionCheckboxes).map(checkbox => checkbox.value);
        
        if (!groupName) {
            showToast('Group name is required!', 'error');
            return;
        }
        
        console.log('Creating group:', groupName, 'with permissions:', permissions);
        
        // Create new group object
        const newGroup = {
            id: 'grp_' + Date.now(),
            name: groupName,
            description: groupDescription || 'No description provided',
            memberCount: 0,
            permissions: permissions.length > 0 ? permissions : ['App Access'],
            createdAt: new Date().toISOString().split('T')[0]
        };
        
        // Add to global groups array
        globalGroups.push(newGroup);
        
        // Re-render the table with updated groups
        renderGroupTable(globalGroups);
        
        // Show success message
        showToast(`Group "${groupName}" created successfully!`, 'success');
        
        // Hide modal
        hideGroupModal();
    });
    
    // Close on outside click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideGroupModal();
        }
    });
}

function hideGroupModal() {
    const modal = document.getElementById('group-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.remove();
        }, 200);
    }
}

function showToast(message, type = 'info') {
    console.log('Showing toast:', message, type);
    
    // Create toast container if needed
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Remove after 4 seconds
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Helper function to get current groups (for consistency with user management)
function getCurrentGroups() {
    return globalGroups;
}

// Function to add a new group
function addNewGroup(groupData) {
    const newGroup = {
        id: 'grp_' + Date.now(),
        name: groupData.name,
        description: groupData.description || 'No description provided',
        memberCount: 0,
        permissions: groupData.permissions || ['App Access'],
        createdAt: new Date().toISOString().split('T')[0]
    };
    
    globalGroups.push(newGroup);
    renderGroupTable(globalGroups);
    
    return newGroup;
}

console.log('Group management script loaded successfully');
