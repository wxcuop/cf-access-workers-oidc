export function getAdminUsersHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Management - OIDC System</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .header { background: #fff; padding: 1rem 2rem; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #333; }
        .user-info { display: flex; align-items: center; gap: 1rem; }
        .logout-btn { background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
        .container { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
        .nav-links { display: flex; gap: 1rem; margin-bottom: 2rem; }
        .nav-link { background: #007bff; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px; }
        .nav-link:hover { background: #0056b3; }
        .actions { display: flex; justify-content: between; margin-bottom: 2rem; }
        .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
        .btn-primary { background: #007bff; color: white; }
        .btn-primary:hover { background: #0056b3; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-danger:hover { background: #c82333; }
        .btn-small { padding: 0.5rem 1rem; font-size: 0.9rem; }
        .users-table { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; font-weight: bold; }
        .status-active { color: #28a745; }
        .status-inactive { color: #dc3545; }
        .groups { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .group-badge { background: #007bff; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem; }
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; }
        .modal-content { background: white; margin: 5% auto; padding: 2rem; border-radius: 8px; max-width: 500px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .close { font-size: 1.5rem; cursor: pointer; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
        .form-group input, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; }
        .checkbox-group { display: flex; flex-wrap: wrap; gap: 1rem; }
        .checkbox-group label { display: flex; align-items: center; gap: 0.5rem; font-weight: normal; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">OIDC Admin Dashboard</div>
        <div class="user-info">
            <span id="user-name">Loading...</span>
            <button class="logout-btn" onclick="logout()">Logout</button>
        </div>
    </div>

    <div class="container">
        <div class="nav-links">
            <a href="/admin/dashboard.html" class="nav-link">Dashboard</a>
            <a href="/admin/users.html" class="nav-link">Users</a>
            <a href="/admin/groups.html" class="nav-link">Groups</a>
        </div>

        <div class="actions">
            <button class="btn btn-primary" onclick="openCreateUserModal()">Create New User</button>
        </div>

        <div class="users-table">
            <table>
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
                <tbody id="users-tbody">
                    <tr>
                        <td colspan="6" style="text-align: center;">Loading users...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Create User Modal -->
    <div id="createUserModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Create New User</h2>
                <span class="close" onclick="closeCreateUserModal()">&times;</span>
            </div>
            <form id="createUserForm">
                <div class="form-group">
                    <label for="userName">Name:</label>
                    <input type="text" id="userName" name="name" required>
                </div>
                <div class="form-group">
                    <label for="userEmail">Email:</label>
                    <input type="email" id="userEmail" name="email" required>
                </div>
                <div class="form-group">
                    <label for="userPassword">Password:</label>
                    <input type="password" id="userPassword" name="password" required>
                </div>
                <div class="form-group">
                    <label>Groups:</label>
                    <div class="checkbox-group" id="groupCheckboxes">
                        <label><input type="checkbox" name="groups" value="admin"> Admin</label>
                        <label><input type="checkbox" name="groups" value="manager"> Manager</label>
                        <label><input type="checkbox" name="groups" value="user" checked> User</label>
                    </div>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Create User</button>
                    <button type="button" class="btn" onclick="closeCreateUserModal()">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Check authentication
        const token = localStorage.getItem('admin_token');
        const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
        
        if (!token) {
            window.location.href = '/admin/login.html';
        }
        
        // Display user info
        document.getElementById('user-name').textContent = user.name || user.email || 'Admin';
        
        // Load users
        loadUsers();
        
        async function loadUsers() {
            try {
                const response = await fetch('/dev/users');
                const data = await response.json();
                if (data.success) {
                    displayUsers(data.users);
                }
            } catch (error) {
                console.error('Failed to load users:', error);
                document.getElementById('users-tbody').innerHTML = '<tr><td colspan="6" style="text-align: center;">Failed to load users</td></tr>';
            }
        }
        
        function displayUsers(users) {
            const tbody = document.getElementById('users-tbody');
            tbody.innerHTML = users.map(user => 
                '<tr>' +
                '<td>' + user.name + '</td>' +
                '<td>' + user.email + '</td>' +
                '<td><div class="groups">' + user.groups.map(group => '<span class="group-badge">' + group + '</span>').join('') + '</div></td>' +
                '<td><span class="status-' + user.status + '">' + user.status + '</span></td>' +
                '<td>' + (user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never') + '</td>' +
                '<td>' +
                '<button class="btn btn-small btn-danger" onclick="deleteUser(\\'' + user.email + '\\')">Delete</button>' +
                '</td>' +
                '</tr>'
            ).join('');
        }
        
        function openCreateUserModal() {
            document.getElementById('createUserModal').style.display = 'block';
        }
        
        function closeCreateUserModal() {
            document.getElementById('createUserModal').style.display = 'none';
            document.getElementById('createUserForm').reset();
        }
        
        document.getElementById('createUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const groups = Array.from(formData.getAll('groups'));
            
            const userData = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                groups: groups
            };
            
            try {
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(userData)
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    alert('User created successfully!');
                    closeCreateUserModal();
                    loadUsers();
                } else {
                    alert('Failed to create user: ' + (result.error || result.message));
                }
            } catch (error) {
                alert('Error creating user: ' + error.message);
            }
        });
        
        async function deleteUser(email) {
            if (!confirm('Are you sure you want to delete user: ' + email + '?')) {
                return;
            }
            
            try {
                const response = await fetch('/users/' + encodeURIComponent(email), {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    alert('User deleted successfully!');
                    loadUsers();
                } else {
                    alert('Failed to delete user: ' + (result.error || result.message));
                }
            } catch (error) {
                alert('Error deleting user: ' + error.message);
            }
        }
        
        function logout() {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            window.location.href = '/admin/login.html';
        }
    </script>
</body>
</html>
  `
}
