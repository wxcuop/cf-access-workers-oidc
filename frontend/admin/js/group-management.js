// group-management.js - Group management functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('Group management script loaded');
    
    // Check if we're on the group management page
    const groupManagementElement = document.getElementById('group-management');
    console.log('Group management element found:', !!groupManagementElement);
    
    if (groupManagementElement) {
        console.log('Initializing group management...');
        initGroupManagement();
    } else {
        console.log('Not on group management page');
    }
});

/**
 * Initialize group management page
 */
function initGroupManagement() {
    // Mock groups data
    const groups = [
        {
            id: 'grp_001',
            name: 'Admins',
            description: 'Full system access administrators',
            memberCount: 3,
            permissions: ['full_access', 'user_manage', 'group_manage', 'settings_manage'],
            createdAt: '2023-06-15'
        },
        {
            id: 'grp_002',
            name: 'Developers',
            description: 'Development team members',
            memberCount: 12,
            permissions: ['app_access', 'api_access'],
            createdAt: '2023-06-20'
        },
        {
            id: 'grp_003',
            name: 'Managers',
            description: 'Team managers and supervisors',
            memberCount: 5,
            permissions: ['user_manage', 'reports_view', 'app_access'],
            createdAt: '2023-07-05'
        },
        {
            id: 'grp_004',
            name: 'Users',
            description: 'Standard application users',
            memberCount: 136,
            permissions: ['app_access'],
            createdAt: '2023-07-10'
        }
    ];

    renderGroupTable(groups);
    setupGroupActions();
    setupAddGroupForm();
}

/**
 * Render group table with data
 * @param {Array} groups - Array of group objects
 */
function renderGroupTable(groups) {
    const tableContainer = document.getElementById('group-table-container');
    if (!tableContainer) return;

    let tableHTML = `
        <table class="data-table" id="groups-table">
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
        tableHTML += `
            <tr data-group-id="${group.id}">
                <td>
                    <div class="group-name">${group.name}</div>
                </td>
                <td>${group.description}</td>
                <td>${group.memberCount} members</td>
                <td>
                    <div class="permission-tags">
                        ${group.permissions.map(perm => `<span class="permission-tag">${formatPermission(perm)}</span>`).join('')}
                    </div>
                </td>
                <td>${formatDate(group.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon btn-edit" title="Edit Group">✏️</button>
                        <button class="btn btn-icon btn-members" title="Manage Members">👥</button>
                        <button class="btn btn-icon btn-delete" title="Delete Group">🗑️</button>
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
        .group-name {
            font-weight: 500;
        }
        
        .permission-tags {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-xs);
        }
        
        .permission-tag {
            background-color: var(--bg-light);
            border-radius: var(--border-radius-sm);
            padding: 2px 6px;
            font-size: var(--font-size-xs);
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Set up group action buttons (edit, manage members, delete)
 */
function setupGroupActions() {
    const groupTable = document.getElementById('groups-table');
    if (!groupTable) return;
    
    groupTable.addEventListener('click', function(e) {
        const target = e.target;
        const row = target.closest('tr');
        
        if (!row) return;
        
        const groupId = row.dataset.groupId;
        const groupName = row.querySelector('.group-name').textContent;
        
        // Edit group button
        if (target.classList.contains('btn-edit')) {
            showModal('Edit Group', `
                <form id="edit-group-form">
                    <div class="form-group">
                        <label for="edit-group-name">Group Name</label>
                        <input type="text" id="edit-group-name" value="${groupName}" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="edit-group-description">Description</label>
                        <textarea id="edit-group-description" class="form-control">${row.cells[1].textContent}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Permissions</label>
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" value="full_access" ${row.querySelector('.permission-tags').textContent.includes('Full Access') ? 'checked' : ''}>
                                Full Access
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="user_manage" ${row.querySelector('.permission-tags').textContent.includes('User Management') ? 'checked' : ''}>
                                User Management
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="group_manage" ${row.querySelector('.permission-tags').textContent.includes('Group Management') ? 'checked' : ''}>
                                Group Management
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="settings_manage" ${row.querySelector('.permission-tags').textContent.includes('Settings Management') ? 'checked' : ''}>
                                Settings Management
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="reports_view" ${row.querySelector('.permission-tags').textContent.includes('View Reports') ? 'checked' : ''}>
                                View Reports
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="app_access" ${row.querySelector('.permission-tags').textContent.includes('App Access') ? 'checked' : ''}>
                                App Access
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="api_access" ${row.querySelector('.permission-tags').textContent.includes('API Access') ? 'checked' : ''}>
                                API Access
                            </label>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            `);
            
            document.getElementById('edit-group-form').addEventListener('submit', function(e) {
                e.preventDefault();
                // In a real app, this would send data to the backend
                showToast(`Group ${groupName} updated successfully`, 'success');
                hideModal();
            });
        }
        
        // Manage members button
        else if (target.classList.contains('btn-members')) {
            showModal('Manage Group Members', `
                <div class="tabs">
                    <button class="tab-btn active" data-tab="current-members">Current Members</button>
                    <button class="tab-btn" data-tab="add-members">Add Members</button>
                </div>
                
                <div class="tab-content active" id="current-members">
                    <div class="search-container">
                        <input type="text" placeholder="Search members..." class="form-control search-input">
                    </div>
                    
                    <div class="member-list">
                        <div class="member-item">
                            <div class="member-info">
                                <div class="member-name">John Doe</div>
                                <div class="member-email">john.doe@example.com</div>
                            </div>
                            <button class="btn btn-icon btn-remove-member" title="Remove from group">❌</button>
                        </div>
                        <div class="member-item">
                            <div class="member-info">
                                <div class="member-name">Alice Johnson</div>
                                <div class="member-email">alice.johnson@example.com</div>
                            </div>
                            <button class="btn btn-icon btn-remove-member" title="Remove from group">❌</button>
                        </div>
                        <div class="member-item">
                            <div class="member-info">
                                <div class="member-name">Bob Brown</div>
                                <div class="member-email">bob.brown@example.com</div>
                            </div>
                            <button class="btn btn-icon btn-remove-member" title="Remove from group">❌</button>
                        </div>
                    </div>
                </div>
                
                <div class="tab-content" id="add-members">
                    <div class="search-container">
                        <input type="text" placeholder="Search users to add..." class="form-control search-input">
                    </div>
                    
                    <div class="member-list">
                        <div class="member-item">
                            <div class="member-info">
                                <div class="member-name">Jane Smith</div>
                                <div class="member-email">jane.smith@example.com</div>
                            </div>
                            <button class="btn btn-icon btn-add-member" title="Add to group">➕</button>
                        </div>
                        <div class="member-item">
                            <div class="member-info">
                                <div class="member-name">Carol White</div>
                                <div class="member-email">carol.white@example.com</div>
                            </div>
                            <button class="btn btn-icon btn-add-member" title="Add to group">➕</button>
                        </div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-primary" onclick="hideModal()">Done</button>
                </div>
            `);
            
            // Set up tabs functionality
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    // Update active tab button
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Show active tab content
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    document.getElementById(this.dataset.tab).classList.add('active');
                });
            });
            
            // Add styles for member management
            const style = document.createElement('style');
            style.textContent = `
                .tabs {
                    display: flex;
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: var(--spacing-md);
                }
                
                .tab-btn {
                    padding: var(--spacing-sm) var(--spacing-md);
                    background: none;
                    border: none;
                    border-bottom: 2px solid transparent;
                    cursor: pointer;
                    font-weight: 500;
                }
                
                .tab-btn.active {
                    border-bottom-color: var(--primary-color);
                    color: var(--primary-color);
                }
                
                .tab-content {
                    display: none;
                }
                
                .tab-content.active {
                    display: block;
                }
                
                .search-container {
                    margin-bottom: var(--spacing-md);
                }
                
                .member-list {
                    max-height: 300px;
                    overflow-y: auto;
                }
                
                .member-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--spacing-sm);
                    border-bottom: 1px solid var(--border-light);
                }
                
                .member-name {
                    font-weight: 500;
                }
                
                .member-email {
                    font-size: var(--font-size-sm);
                    color: var(--text-secondary);
                }
            `;
            document.head.appendChild(style);
            
            // Set up member action buttons
            document.querySelectorAll('.btn-remove-member').forEach(btn => {
                btn.addEventListener('click', function() {
                    const memberItem = this.closest('.member-item');
                    const memberName = memberItem.querySelector('.member-name').textContent;
                    
                    // In a real app, this would send request to backend
                    memberItem.style.opacity = '0.5';
                    this.disabled = true;
                    
                    showToast(`Removed ${memberName} from ${groupName}`, 'info');
                });
            });
            
            document.querySelectorAll('.btn-add-member').forEach(btn => {
                btn.addEventListener('click', function() {
                    const memberItem = this.closest('.member-item');
                    const memberName = memberItem.querySelector('.member-name').textContent;
                    
                    // In a real app, this would send request to backend
                    memberItem.style.opacity = '0.5';
                    this.disabled = true;
                    
                    showToast(`Added ${memberName} to ${groupName}`, 'success');
                });
            });
        }
        
        // Delete group button
        else if (target.classList.contains('btn-delete')) {
            showModal('Delete Group', `
                <div class="alert alert-danger">
                    <p><strong>Warning:</strong> This action cannot be undone!</p>
                </div>
                <p>Are you sure you want to delete the group <strong>${groupName}</strong>?</p>
                <p>This will remove the group and all member associations, but won't delete user accounts.</p>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirm-delete">Delete Group</button>
                </div>
            `);
            
            document.getElementById('confirm-delete').addEventListener('click', function() {
                // In a real app, this would delete the group from the database
                row.style.opacity = '0.5';
                setTimeout(() => {
                    row.style.display = 'none';
                }, 500);
                
                showToast(`Group "${groupName}" has been deleted`, 'warning');
                hideModal();
            });
        }
    });
}

/**
 * Set up add group form
 */
function setupAddGroupForm() {
    console.log('Setting up add group form...');
    
    const addGroupBtn = document.getElementById('add-group-btn');
    console.log('Add group button found:', !!addGroupBtn);
    
    if (!addGroupBtn) {
        console.error('Add group button not found!');
        return;
    }
    
    addGroupBtn.addEventListener('click', function() {
        showModal('Add New Group', `
            <form id="add-group-form">
                <div class="form-group">
                    <label for="new-group-name">Group Name</label>
                    <input type="text" id="new-group-name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="new-group-description">Description</label>
                    <textarea id="new-group-description" class="form-control"></textarea>
                </div>
                <div class="form-group">
                    <label>Permissions</label>
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" value="full_access">
                            Full Access
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" value="user_manage">
                            User Management
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" value="group_manage">
                            Group Management
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" value="settings_manage">
                            Settings Management
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" value="reports_view">
                            View Reports
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" value="app_access" checked>
                            App Access
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" value="api_access">
                            API Access
                        </label>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Group</button>
                </div>
            </form>
        `);
        
        // Add form styles
        const style = document.createElement('style');
        style.textContent = `
            .checkbox-group {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-sm);
            }
            
            .checkbox-label {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                cursor: pointer;
            }
            
            .alert {
                padding: var(--spacing-md);
                border-radius: var(--border-radius);
                margin-bottom: var(--spacing-md);
            }
            
            .alert-danger {
                background-color: var(--danger-bg);
                color: var(--danger-color);
            }
        `;
        document.head.appendChild(style);
        
        document.getElementById('add-group-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newGroupName = document.getElementById('new-group-name').value;
            
            // In a real app, this would send data to the backend
            showToast(`Group "${newGroupName}" created successfully`, 'success');
            hideModal();
            
            // Optionally reload the group list or add the new group to the table
        });
    });
}

/**
 * Format permission code to readable text
 * @param {string} permission - Permission code
 * @returns {string} - Readable permission name
 */
function formatPermission(permission) {
    switch(permission) {
        case 'full_access': return 'Full Access';
        case 'user_manage': return 'User Management';
        case 'group_manage': return 'Group Management';
        case 'settings_manage': return 'Settings Management';
        case 'reports_view': return 'View Reports';
        case 'app_access': return 'App Access';
        case 'api_access': return 'API Access';
        default: return permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}

/**
 * Format date to a readable string
 * @param {string} dateStr - ISO date string
 * @returns {string} - Formatted date string
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Import showModal, hideModal, and showToast from user-management.js
// For a real application, these would be in a shared utilities file
