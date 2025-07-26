import { getAdminDashboardHTML as getDashboard } from './admin-dashboard'
import { getAdminUsersHTML as getUsers } from './admin-users'
import { getAdminGroupsHTML as getGroups } from './admin-groups'
import { getEnhancedUsersHTML as getEnhancedUsers } from './admin-enhanced-users'
import { getEnhancedGroupsHTML as getEnhancedGroups } from './admin-enhanced-groups'
import { getEnhancedDemoHTML as getEnhancedDemo } from './admin-enhanced-demo'

export function getAdminLoginHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - OIDC System</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 400px; margin: 100px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { text-align: center; color: #333; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
        input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; }
        button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .error { color: red; margin-top: 10px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Admin Login</h1>
        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">Login</button>
        </form>
        <div id="error" class="error"></div>
    </div>
    
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const loginData = {
                email: formData.get('email'),
                password: formData.get('password')
            };
            
            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    localStorage.setItem('admin_token', result.token);
                    localStorage.setItem('admin_user', JSON.stringify(result.user));
                    window.location.href = '/admin/dashboard.html';
                } else {
                    document.getElementById('error').textContent = result.error || 'Login failed';
                }
            } catch (error) {
                document.getElementById('error').textContent = 'Network error: ' + error.message;
            }
        });
    </script>
</body>
</html>
  `
}

export function getAdminDashboardHTML(): string {
  return getDashboard()
}

export function getAdminUsersHTML(): string {
  return getUsers()
}

export function getEnhancedUsersHTML(): string {
  return getEnhancedUsers()
}

export function getAdminGroupsHTML(): string {
  return getGroups()
}

export function getEnhancedGroupsHTML(): string {
  return getEnhancedGroups()
}

export function getEnhancedDemoHTML(): string {
  return getEnhancedDemo()
}

export function getAdminCSS(): string {
  return `/* Basic admin styles */
body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
.container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
.card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
`
}

export function getAdminJS(filePath: string): string {
  return `// Admin JavaScript for ${filePath}
console.log('Admin script loaded: ${filePath}');
`
}
