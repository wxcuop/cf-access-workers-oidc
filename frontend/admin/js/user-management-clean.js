// User Management - Clean Version
console.log('User management script loading...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, initializing user management...');
    
    // Initialize only if we're on the users page
    if (document.getElementById('user-management')) {
        console.log('User management page detected');
        // Add a small delay to ensure all scripts are loaded
        setTimeout(() => {
            initUserManagement();
        }, 500);
    } else {
        console.log('Not on user management page');
    }
});

function initUserManagement() {
    console.log('Initializing user management...');
    
    // Sample users data
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
    
    // Render the table
    renderUserTable(users);
    
    // Setup search functionality
    setupUserSearch();
    
    // Setup add user button (with delay to ensure DOM is ready)
    console.log('About to setup add user button...');
    setTimeout(() => {
        setupAddUserButton();
    }, 100);
    
    console.log('User management initialization complete!');
}

function renderUserTable(users) {
    console.log('Rendering user table with', users.length, 'users');
    
    const container = document.getElementById('user-table-container');
    if (!container) {
        console.error('User table container not found!');
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
        
        html += `
            <tr data-user-id="${user.id}">
                <td>
                    <div>
                        <div style="font-weight: 500;">${user.name}</div>
                        <div style="font-size: 0.875rem; color: var(--text-gray-600);">${user.email}</div>
                    </div>
                </td>
                <td>${formatDate(user.created)}</td>
                <td>${formatDate(user.lastLogin)}</td>
                <td>
                    ${user.groups.map(group => `<span class="group-tag">${group}</span>`).join(' ')}
                </td>
                <td>
                    <span class="status-badge status-${user.status}">${user.status}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon" title="Edit User" onclick="editUser('${user.id}')">✏️</button>
                        <button class="btn btn-icon" title="Reset Password" onclick="resetPassword('${user.id}')">🔑</button>
                        <button class="btn btn-icon" title="Toggle Status" onclick="toggleStatus('${user.id}', '${user.status}')">${user.status === 'active' ? '❌' : '✅'}</button>
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
    console.log('User table rendered successfully');
}

function setupUserSearch() {
    const searchInput = document.getElementById('user-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const userRows = document.querySelectorAll('#user-table-container tbody tr');
        
        userRows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

function setupAddUserButton() {
    console.log('Setting up add user button...');
    
    const addUserBtn = document.getElementById('add-user-btn');
    const modal = document.getElementById('add-user-modal');
    const closeBtn = document.getElementById('add-user-modal-close');
    const cancelBtn = document.getElementById('add-user-cancel');
    const form = document.getElementById('add-user-form');
    const saveBtn = document.getElementById('add-user-save');
    
    console.log('Elements found:', {
        addUserBtn: !!addUserBtn,
        modal: !!modal,
        closeBtn: !!closeBtn,
        cancelBtn: !!cancelBtn,
        form: !!form,
        saveBtn: !!saveBtn
    });
    
    if (!addUserBtn) {
        console.error('Add user button not found with ID: add-user-btn');
        return;
    }
    
    if (!modal) {
        console.error('Add user modal not found with ID: add-user-modal');
        return;
    }
    
    console.log('Adding click event listener to add user button...');
    
    // Open modal
    addUserBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Add user button clicked!');
        modal.classList.add('visible');
        console.log('Modal should be visible now');
    });
    
    // Close modal functions
    const closeModal = () => {
        console.log('Closing modal...');
        modal.classList.remove('visible');
        if (form) form.reset();
    };
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Handle form submission
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Form submitted!');
            
            const formData = new FormData(form);
            const newUser = {
                id: 'usr_' + Date.now(),
                name: formData.get('name'),
                email: formData.get('email'),
                status: formData.get('status'),
                created: new Date().toISOString().split('T')[0],
                lastLogin: 'Never',
                groups: Array.from(form.querySelectorAll('input[name="groups"]:checked')).map(cb => cb.value)
            };
            
            console.log('Creating new user:', newUser);
            
            // Add user to the list (in a real app, this would be an API call)
            const users = getCurrentUsers();
            users.push(newUser);
            
            // Re-render the table
            renderUserTable(users);
            
            // Close modal and show success message
            closeModal();
            showToast(`User "${newUser.name}" has been added successfully!`, 'success');
        });
    }
    
    // Handle save button click
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            console.log('Save button clicked, submitting form...');
            if (form) form.requestSubmit();
        });
    }
    
    console.log('Add user button setup complete!');
}

// Helper function to get current users (for mock data)
function getCurrentUsers() {
    // In a real application, this would fetch from an API
    return [
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
            lastLogin: '2023-10-18',
            groups: ['Users'],
            status: 'inactive'
        },
        {
            id: 'usr_005',
            email: 'carol.davis@example.com',
            name: 'Carol Davis',
            created: '2023-05-18',
            lastLogin: '2023-10-25',
            groups: ['Developers', 'Users'],
            status: 'active'
        }
    ];
}

function editUser(userId) {
    console.log('Edit user:', userId);
    showToast(`Edit user ${userId} - Feature coming soon!`, 'info');
}

function resetPassword(userId) {
    console.log('Reset password for user:', userId);
    showToast('Password reset email sent successfully!', 'success');
}

function toggleStatus(userId, currentStatus) {
    console.log('Toggle status for user:', userId, 'from', currentStatus);
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    showToast(`User status changed to ${newStatus}`, 'success');
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

console.log('User management script loaded successfully');
