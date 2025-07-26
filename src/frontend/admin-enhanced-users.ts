export function getEnhancedUsersHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Management | OIDC Authentication System</title>
    <style>
        /* Admin Clean CSS - Inline for backend serving */
        :root {
            --primary: #007bff;
            --secondary: #6c757d;
            --success: #28a745;
            --danger: #dc3545;
            --warning: #ffc107;
            --info: #17a2b8;
            --light: #f8f9fa;
            --dark: #343a40;
            --white: #ffffff;
            --bg-white: #ffffff;
            --bg-gray-50: #f9fafb;
            --bg-gray-100: #f3f4f6;
            --text-gray-900: #111827;
            --text-gray-600: #4b5563;
            --text-white: #ffffff;
            --border-gray-200: #e5e7eb;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background-color: var(--bg-gray-50);
            color: var(--text-gray-900);
            line-height: 1.6;
        }

        .admin-layout {
            display: flex;
            min-height: 100vh;
        }

        .admin-sidebar {
            width: 250px;
            background: var(--bg-white);
            border-right: 1px solid var(--border-gray-200);
            flex-shrink: 0;
        }

        .sidebar-header {
            padding: 1.5rem 1rem;
            border-bottom: 1px solid var(--border-gray-200);
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .sidebar-logo {
            width: 32px;
            height: 32px;
        }

        .sidebar-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--text-gray-900);
        }

        .sidebar-nav {
            padding: 1rem 0;
        }

        .nav-list {
            list-style: none;
        }

        .nav-item {
            margin-bottom: 0.25rem;
        }

        .nav-link {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            color: var(--text-gray-600);
            text-decoration: none;
            transition: all 0.2s;
        }

        .nav-link:hover,
        .nav-item.active .nav-link {
            background-color: var(--bg-gray-100);
            color: var(--primary);
        }

        .nav-icon {
            font-size: 1.25rem;
        }

        .sidebar-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 1rem;
            border-top: 1px solid var(--border-gray-200);
        }

        .logout-btn {
            background: none;
            border: none;
            width: 100%;
            text-align: left;
            cursor: pointer;
        }

        .admin-content {
            flex: 1;
            overflow: hidden;
        }

        .admin-header {
            background: var(--bg-white);
            border-bottom: 1px solid var(--border-gray-200);
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .header-title h1 {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-gray-900);
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .dropdown {
            position: relative;
        }

        .dropdown-toggle {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.5rem;
        }

        .avatar {
            width: 32px;
            height: 32px;
            background: var(--primary);
            color: var(--text-white);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
        }

        .main-content {
            padding: 2rem;
            overflow-y: auto;
            height: calc(100vh - 80px);
        }

        .content-header {
            margin-bottom: 2rem;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border: 1px solid transparent;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-primary {
            background-color: var(--primary);
            border-color: var(--primary);
            color: var(--text-white);
        }

        .btn-primary:hover {
            background-color: #0056b3;
            border-color: #0056b3;
        }

        .btn-secondary {
            background-color: var(--secondary);
            border-color: var(--secondary);
            color: var(--text-white);
        }

        .btn-danger {
            background-color: var(--danger);
            border-color: var(--danger);
            color: var(--text-white);
        }

        .btn-sm {
            padding: 0.375rem 0.75rem;
            font-size: 0.75rem;
        }

        .table-container {
            background: var(--bg-white);
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
        }

        .table th,
        .table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid var(--border-gray-200);
        }

        .table th {
            background-color: var(--bg-gray-50);
            font-weight: 600;
            color: var(--text-gray-900);
        }

        .groups-container {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
        }

        .group-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
        }

        .group-tag {
            display: inline-block;
            padding: 0.125rem 0.5rem;
            background-color: var(--primary);
            color: var(--text-white);
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 500;
            white-space: nowrap;
        }

        .group-tag.admin {
            background-color: var(--danger);
        }

        .group-tag.user {
            background-color: var(--success);
        }

        .group-tag.manager {
            background-color: var(--info);
        }

        .edit-groups-btn {
            margin-top: 0.5rem;
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
        }

        /* Modal styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
        }

        .modal-content {
            background-color: var(--bg-white);
            margin: 5% auto;
            padding: 0;
            border-radius: 0.5rem;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
        }

        .modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--border-gray-200);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-gray-900);
        }

        .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--text-gray-600);
        }

        .modal-body {
            padding: 1.5rem;
        }

        .modal-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--border-gray-200);
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
        }

        .groups-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 0.75rem;
            margin-top: 1rem;
        }

        .group-checkbox {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem;
            border: 1px solid var(--border-gray-200);
            border-radius: 0.375rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        .group-checkbox:hover {
            background-color: var(--bg-gray-50);
        }

        .group-checkbox input[type="checkbox"] {
            margin: 0;
        }

        .notification {
            position: fixed;
            top: 1rem;
            right: 1rem;
            padding: 1rem 1.5rem;
            border-radius: 0.375rem;
            color: var(--text-white);
            font-weight: 500;
            z-index: 1100;
            animation: slideIn 0.3s ease-out;
        }

        .notification.success {
            background-color: var(--success);
        }

        .notification.error {
            background-color: var(--danger);
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @media (max-width: 768px) {
            .admin-layout {
                flex-direction: column;
            }
            
            .admin-sidebar {
                width: 100%;
                height: auto;
            }
            
            .main-content {
                height: auto;
            }
        }
    </style>
</head>
<body>
    <div class="admin-layout">
        <!-- Sidebar Navigation -->
        <aside class="admin-sidebar" id="admin-sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">🔐</div>
                <h1 class="sidebar-title">Admin</h1>
            </div>
            <nav class="sidebar-nav">
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="index.html" class="nav-link">
                            <span class="nav-icon">📊</span>
                            <span class="nav-label">Dashboard</span>
                        </a>
                    </li>
                    <li class="nav-item active">
                        <a href="users-enhanced.html" class="nav-link">
                            <span class="nav-icon">👥</span>
                            <span class="nav-label">Users</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="groups-enhanced.html" class="nav-link">
                            <span class="nav-icon">🔐</span>
                            <span class="nav-label">Groups</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="demo.html" class="nav-link">
                            <span class="nav-icon">🎯</span>
                            <span class="nav-label">Demo</span>
                        </a>
                    </li>
                </ul>
            </nav>
            <div class="sidebar-footer">
                <button class="nav-link logout-link logout-btn">
                    <span class="nav-icon">🚪</span>
                    <span class="nav-label">Logout</span>
                </button>
            </div>
        </aside>

        <!-- Main Content Area -->
        <main class="admin-content">
            <!-- Top Header -->
            <header class="admin-header">
                <div class="header-title">
                    <h1>User Management</h1>
                </div>
                <div class="header-actions">
                    <div class="dropdown">
                        <button class="dropdown-toggle">
                            <span class="avatar" id="userAvatar">A</span>
                            <span class="user-name" id="userName">Admin User</span>
                        </button>
                    </div>
                </div>
            </header>

            <!-- Page Content -->
            <div class="main-content" id="user-management">
                <div class="content-header">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2>Users</h2>
                        <button class="btn btn-primary" onclick="openCreateUserModal()">
                            <span>➕</span>
                            Add User
                        </button>
                    </div>
                </div>

                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Groups</th>
                                <th>Status</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="userTableBody">
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 2rem;">
                                    Loading users...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <!-- User Groups Management Modal -->
    <div class="modal" id="userGroupsModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Manage User Groups</h3>
                <button class="modal-close" onclick="closeUserGroupsModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 1rem;">
                    <strong>User:</strong> <span id="userGroupsModalEmail">user@example.com</span>
                </div>
                
                <div class="groups-grid" id="userGroupsCheckboxes">
                    <!-- Groups will be populated dynamically -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeUserGroupsModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="saveUserGroups()">Save Changes</button>
            </div>
        </div>
    </div>

    <script>
        // Enhanced User Management Script
        let currentUsers = [];
        let currentGroups = [];
        let selectedUser = null;

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', function() {
            initEnhancedUserManagement();
        });

        async function initEnhancedUserManagement() {
            try {
                await Promise.all([loadUsers(), loadGroups()]);
                setupEventListeners();
            } catch (error) {
                console.error('Failed to initialize user management:', error);
                showError('Failed to load user data. Please refresh the page.');
            }
        }

        async function loadUsers() {
            try {
                const response = await fetch('/dev/users');
                const data = await response.json();
                if (data.success) {
                    currentUsers = data.users || [];
                    renderUserTable(currentUsers);
                }
            } catch (error) {
                console.error('Failed to load users:', error);
                currentUsers = [];
                renderUserTable([]);
            }
        }

        async function loadGroups() {
            try {
                const response = await fetch('/dev/groups');
                const data = await response.json();
                if (data.success) {
                    currentGroups = data.groups || [];
                }
            } catch (error) {
                console.error('Failed to load groups:', error);
                currentGroups = [];
            }
        }

        function renderUserTable(users) {
            const tbody = document.getElementById('userTableBody');
            if (!users || users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No users found</td></tr>';
                return;
            }

            tbody.innerHTML = users.map(user => \`
                <tr>
                    <td>\${user.name || 'N/A'}</td>
                    <td>\${user.email}</td>
                    <td>
                        <div class="groups-container">
                            <div class="group-tags">
                                \${(user.groups || []).map(group => 
                                    \`<span class="group-tag \${group}">\${group}</span>\`
                                ).join('')}
                            </div>
                            <button class="btn btn-sm btn-secondary edit-groups-btn" onclick="openUserGroupsModal('\${user.email}')">
                                Edit Groups
                            </button>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge \${user.status}">\${user.status}</span>
                    </td>
                    <td>\${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deleteUser('\${user.email}')">Delete</button>
                    </td>
                </tr>
            \`).join('');
        }

        function openUserGroupsModal(email) {
            selectedUser = currentUsers.find(u => u.email === email);
            if (!selectedUser) return;

            document.getElementById('userGroupsModalEmail').textContent = email;
            
            const container = document.getElementById('userGroupsCheckboxes');
            container.innerHTML = currentGroups.map(group => \`
                <div class="group-checkbox">
                    <input type="checkbox" id="group-\${group}" value="\${group}" 
                           \${selectedUser.groups.includes(group) ? 'checked' : ''}>
                    <label for="group-\${group}">\${group}</label>
                </div>
            \`).join('');

            document.getElementById('userGroupsModal').style.display = 'block';
        }

        function closeUserGroupsModal() {
            document.getElementById('userGroupsModal').style.display = 'none';
            selectedUser = null;
        }

        async function saveUserGroups() {
            if (!selectedUser) return;

            const checkboxes = document.querySelectorAll('#userGroupsCheckboxes input[type="checkbox"]');
            const selectedGroups = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);

            try {
                // Update user groups via API
                const response = await fetch(\`/admin/users/\${selectedUser.email}/groups\`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ groups: selectedGroups })
                });

                if (response.ok) {
                    // Update local data
                    selectedUser.groups = selectedGroups;
                    renderUserTable(currentUsers);
                    closeUserGroupsModal();
                    showSuccess('User groups updated successfully');
                } else {
                    throw new Error('Failed to update user groups');
                }
            } catch (error) {
                console.error('Error updating user groups:', error);
                showError('Failed to update user groups');
            }
        }

        function setupEventListeners() {
            // Close modal when clicking outside
            window.onclick = function(event) {
                const modal = document.getElementById('userGroupsModal');
                if (event.target == modal) {
                    closeUserGroupsModal();
                }
            }
        }

        function showSuccess(message) {
            showNotification(message, 'success');
        }

        function showError(message) {
            showNotification(message, 'error');
        }

        function showNotification(message, type) {
            const notification = document.createElement('div');
            notification.className = \`notification \${type}\`;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        function openCreateUserModal() {
            alert('Create user functionality coming soon!');
        }

        function deleteUser(email) {
            if (confirm(\`Are you sure you want to delete user \${email}?\`)) {
                alert('Delete user functionality coming soon!');
            }
        }

        // Logout functionality
        document.querySelector('.logout-btn').addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_user');
                window.location.href = '/admin/login.html';
            }
        });
    </script>
</body>
</html>`
}
