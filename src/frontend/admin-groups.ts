export function getAdminGroupsHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <        async function loadGroups() {
            try {
                const response = await fetch('/admin/groups', {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });
                const data = await response.json();
                if (data.groups) {
                    displayGroups(data.groups);
                } else if (data.error) {
                    console.error('Failed to load groups:', data.error);
                    document.getElementById('groups-tbody').innerHTML = '<tr><td colspan="4" style="text-align: center;">Failed to load groups: ' + data.error + '</td></tr>';
                } else {
                    console.error('Unexpected response format:', data);
                    document.getElementById('groups-tbody').innerHTML = '<tr><td colspan="4" style="text-align: center;">Failed to load groups</td></tr>';
                }
            } catch (error) {
                console.error('Failed to load groups:', error);
                document.getElementById('groups-tbody').innerHTML = '<tr><td colspan="4" style="text-align: center;">Failed to load groups</td></tr>';
            }
        }iewport" content="width=device-width, initial-scale=1.0">
    <title>Group Management - OIDC System</title>
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
        .groups-table { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; font-weight: bold; }
        .user-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .user-badge { background: #28a745; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem; }
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; }
        .modal-content { background: white; margin: 5% auto; padding: 2rem; border-radius: 8px; max-width: 500px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .close { font-size: 1.5rem; cursor: pointer; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; }
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
            <button class="btn btn-primary" onclick="openCreateGroupModal()">Create New Group</button>
        </div>

        <div class="groups-table">
            <table>
                <thead>
                    <tr>
                        <th>Group Name</th>
                        <th>Description</th>
                        <th>Members</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="groups-tbody">
                    <tr>
                        <td colspan="5" style="text-align: center;">Loading groups...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Create Group Modal -->
    <div id="createGroupModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Create New Group</h2>
                <span class="close" onclick="closeCreateGroupModal()">&times;</span>
            </div>
            <form id="createGroupForm">
                <div class="form-group">
                    <label for="groupName">Group Name:</label>
                    <input type="text" id="groupName" name="name" required>
                </div>
                <div class="form-group">
                    <label for="groupDescription">Description:</label>
                    <textarea id="groupDescription" name="description" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Initial Members:</label>
                    <div class="checkbox-group" id="memberCheckboxes">
                        <!-- Will be populated dynamically -->
                    </div>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Create Group</button>
                    <button type="button" class="btn" onclick="closeCreateGroupModal()">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        let allUsers = [];
        
        // Check authentication
        const token = localStorage.getItem('admin_token');
        const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
        
        if (!token) {
            window.location.href = '/admin/login.html';
        }
        
        // Display user info
        document.getElementById('user-name').textContent = user.name || user.email || 'Admin';
        
        // Load groups and users
        loadGroups();
        loadUsers();
        
        async function loadGroups() {
            try {
                const response = await fetch('/dev/groups');
                const data = await response.json();
                if (data.success) {
                    displayGroups(data.groups);
                }
            } catch (error) {
                console.error('Failed to load groups:', error);
                document.getElementById('groups-tbody').innerHTML = '<tr><td colspan="5" style="text-align: center;">Failed to load groups</td></tr>';
            }
        }
        
        async function loadUsers() {
            try {
                const response = await fetch('/admin/users', {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });
                const data = await response.json();
                if (data.users) {
                    allUsers = data.users;
                }
            } catch (error) {
                console.error('Failed to load users:', error);
            }
        }
        
        function displayGroups(groups) {
            const tbody = document.getElementById('groups-tbody');
            
            // Add default groups if not present
            const defaultGroups = [
                { name: 'admin', description: 'System administrators', user_count: 0, created_at: new Date().toISOString(), is_system: true },
                { name: 'manager', description: 'Department managers', user_count: 0, created_at: new Date().toISOString(), is_system: false },
                { name: 'user', description: 'Regular users', user_count: 0, created_at: new Date().toISOString(), is_system: true }
            ];
            
            const allGroups = [...defaultGroups, ...groups];
            
            tbody.innerHTML = allGroups.map(group => 
                '<tr>' +
                '<td>' + group.name + '</td>' +
                '<td>' + (group.description || 'No description') + '</td>' +
                '<td>' + (group.user_count || 0) + ' members</td>' +
                '<td>' + (group.created_at ? new Date(group.created_at).toLocaleDateString() : 'Default') + '</td>' +
                '<td>' +
                    (group.is_system ? 
                        '<span style="color: #666;">System Group</span>' : 
                        '<button class="btn btn-small btn-danger" onclick="deleteGroup(\\'' + group.name + '\\')">Delete</button>') +
                '</td>' +
                '</tr>'
            ).join('');
        }
        
        function openCreateGroupModal() {
            populateMemberCheckboxes();
            document.getElementById('createGroupModal').style.display = 'block';
        }
        
        function closeCreateGroupModal() {
            document.getElementById('createGroupModal').style.display = 'none';
            document.getElementById('createGroupForm').reset();
        }
        
        function populateMemberCheckboxes() {
            const container = document.getElementById('memberCheckboxes');
            container.innerHTML = allUsers.map(user => 
                '<label><input type="checkbox" name="members" value="' + user.email + '"> ' + user.name + ' (' + user.email + ')</label>'
            ).join('');
        }
        
        document.getElementById('createGroupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const members = Array.from(formData.getAll('members'));
            
            const groupData = {
                name: formData.get('name'),
                description: formData.get('description'),
                members: members
            };
            
            try {
                const response = await fetch('/admin/groups', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(groupData)
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    alert('Group created successfully!');
                    closeCreateGroupModal();
                    loadGroups();
                } else {
                    alert('Failed to create group: ' + (result.error || result.message));
                }
            } catch (error) {
                alert('Error creating group: ' + error.message);
            }
        });
        
        async function deleteGroup(groupName) {
            if (!confirm('Are you sure you want to delete group: ' + groupName + '?')) {
                return;
            }
            
            try {
                const response = await fetch('/admin/groups/' + encodeURIComponent(groupName), {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    alert('Group deleted successfully!');
                    loadGroups();
                } else {
                    alert('Failed to delete group: ' + (result.error || result.message));
                }
            } catch (error) {
                alert('Error deleting group: ' + error.message);
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
