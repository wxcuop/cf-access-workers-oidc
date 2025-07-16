export function getAdminDashboardHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - OIDC System</title>
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
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card h2 { margin-top: 0; color: #333; }
        .stat-number { font-size: 2rem; font-weight: bold; color: #007bff; }
        .stat-label { color: #666; margin-top: 0.5rem; }
        .recent-activity { margin-top: 2rem; }
        .activity-item { padding: 1rem; border-bottom: 1px solid #eee; }
        .activity-item:last-child { border-bottom: none; }
        .activity-time { color: #666; font-size: 0.9rem; }
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

        <div class="dashboard-grid">
            <div class="card">
                <h2>System Overview</h2>
                <div class="stat-number" id="total-users">0</div>
                <div class="stat-label">Total Users</div>
            </div>
            <div class="card">
                <h2>Groups</h2>
                <div class="stat-number" id="total-groups">0</div>
                <div class="stat-label">Total Groups</div>
            </div>
            <div class="card">
                <h2>Active Sessions</h2>
                <div class="stat-number" id="active-sessions">0</div>
                <div class="stat-label">Current Sessions</div>
            </div>
            <div class="card">
                <h2>System Status</h2>
                <div class="stat-number" style="color: #28a745;">Online</div>
                <div class="stat-label">OIDC Service</div>
            </div>
        </div>

        <div class="recent-activity">
            <div class="card">
                <h2>Recent Activity</h2>
                <div id="activity-list">
                    <div class="activity-item">
                        <div>System initialized</div>
                        <div class="activity-time">Just now</div>
                    </div>
                </div>
            </div>
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
        
        // Load dashboard data
        loadDashboardData();
        
        async function loadDashboardData() {
            try {
                const response = await fetch('/dev/users');
                const data = await response.json();
                if (data.success) {
                    document.getElementById('total-users').textContent = data.users.length;
                    
                    // Count unique groups
                    const groups = new Set();
                    data.users.forEach(user => {
                        user.groups.forEach(group => groups.add(group));
                    });
                    document.getElementById('total-groups').textContent = groups.size;
                    
                    // Mock active sessions
                    document.getElementById('active-sessions').textContent = '1';
                }
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
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
