export function getEnhancedDemoHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User-Group Management Demo | OIDC Admin</title>
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

        .demo-container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 2rem;
            background: var(--bg-white);
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .demo-header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .demo-title {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-gray-900);
            margin-bottom: 0.5rem;
        }
        
        .demo-subtitle {
            font-size: 1.125rem;
            color: var(--text-gray-600);
        }
        
        .demo-section {
            margin-bottom: 3rem;
        }
        
        .demo-section-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-gray-900);
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--primary);
        }
        
        .demo-links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        
        .demo-link-card {
            padding: 1.5rem;
            border: 1px solid var(--border-gray-200);
            border-radius: 0.5rem;
            background: var(--bg-gray-50);
            transition: all 0.2s;
        }
        
        .demo-link-card:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
        }
        
        .demo-link-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-gray-900);
            margin-bottom: 0.5rem;
        }
        
        .demo-link-description {
            color: var(--text-gray-600);
            margin-bottom: 1rem;
        }
        
        .demo-link-button {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background-color: var(--primary);
            color: var(--text-white);
            text-decoration: none;
            border-radius: 0.375rem;
            font-weight: 500;
            transition: all 0.2s;
        }
        
        .demo-link-button:hover {
            background-color: #0056b3;
        }

        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-top: 1.5rem;
        }

        .feature-card {
            padding: 1rem;
            border: 1px solid var(--border-gray-200);
            border-radius: 0.375rem;
            background: var(--bg-white);
        }

        .feature-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        .feature-title {
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-gray-900);
            margin-bottom: 0.25rem;
        }

        .feature-description {
            font-size: 0.875rem;
            color: var(--text-gray-600);
        }

        .tech-stack {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 1rem;
        }

        .tech-badge {
            padding: 0.25rem 0.75rem;
            background-color: var(--bg-gray-100);
            color: var(--text-gray-900);
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .highlight-box {
            background: linear-gradient(135deg, var(--primary), var(--info));
            color: var(--text-white);
            padding: 2rem;
            border-radius: 0.5rem;
            margin: 2rem 0;
        }

        .highlight-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .highlight-description {
            font-size: 1.125rem;
            opacity: 0.9;
        }

        .back-nav {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--primary);
            text-decoration: none;
            font-weight: 500;
            margin-bottom: 2rem;
        }

        .back-nav:hover {
            text-decoration: underline;
        }

        @media (max-width: 768px) {
            .demo-container {
                margin: 1rem;
                padding: 1rem;
            }
            
            .demo-title {
                font-size: 1.5rem;
            }
            
            .demo-links {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <!-- Back Navigation -->
        <a href="index.html" class="back-nav">
            ← Back to Admin Dashboard
        </a>

        <!-- Header -->
        <div class="demo-header">
            <h1 class="demo-title">🎯 Enhanced User-Group Management Demo</h1>
            <p class="demo-subtitle">
                Experience the powerful new features for managing users and groups in the OIDC Admin system
            </p>
        </div>

        <!-- Highlight Box -->
        <div class="highlight-box">
            <h2 class="highlight-title">✨ Phase 2 Enhancement Complete!</h2>
            <p class="highlight-description">
                The admin interface now includes real-time user-group management with modal interfaces, 
                instant API updates, and enhanced UX for efficient administration.
            </p>
        </div>

        <!-- Enhanced Pages Section -->
        <div class="demo-section">
            <h2 class="demo-section-title">🖥️ Enhanced Admin Pages</h2>
            <div class="demo-links">
                <div class="demo-link-card">
                    <h3 class="demo-link-title">👥 Enhanced User Management</h3>
                    <p class="demo-link-description">
                        Manage users with enhanced group editing capabilities. Features "Edit Groups" buttons 
                        on each user row with real-time modal interfaces.
                    </p>
                    <a href="users-enhanced.html" class="demo-link-button">
                        🚀 Try Enhanced Users
                    </a>
                </div>
                
                <div class="demo-link-card">
                    <h3 class="demo-link-title">🔐 Enhanced Group Management</h3>
                    <p class="demo-link-description">
                        Manage groups with user assignment features. Includes "Manage Users" buttons 
                        for each group with comprehensive member management.
                    </p>
                    <a href="groups-enhanced.html" class="demo-link-button">
                        🚀 Try Enhanced Groups
                    </a>
                </div>
                
                <div class="demo-link-card">
                    <h3 class="demo-link-title">📊 Standard Dashboard</h3>
                    <p class="demo-link-description">
                        The main admin dashboard with system overview, statistics, and quick access 
                        to all admin functions.
                    </p>
                    <a href="index.html" class="demo-link-button">
                        📈 View Dashboard
                    </a>
                </div>
            </div>
        </div>

        <!-- Key Features Section -->
        <div class="demo-section">
            <h2 class="demo-section-title">🎯 Key Features</h2>
            <div class="feature-grid">
                <div class="feature-card">
                    <div class="feature-icon">⚡</div>
                    <h3 class="feature-title">Real-time Updates</h3>
                    <p class="feature-description">
                        Instant API integration with live data updates and notifications
                    </p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">🎨</div>
                    <h3 class="feature-title">Modern UI</h3>
                    <p class="feature-description">
                        Clean, responsive design with professional modal interfaces
                    </p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">🔄</div>
                    <h3 class="feature-title">Seamless Integration</h3>
                    <p class="feature-description">
                        Full integration with existing authentication and API systems
                    </p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">📱</div>
                    <h3 class="feature-title">Mobile Responsive</h3>
                    <p class="feature-description">
                        Optimized for desktop, tablet, and mobile devices
                    </p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">🔒</div>
                    <h3 class="feature-title">Secure Operations</h3>
                    <p class="feature-description">
                        JWT-based authentication with role-based access control
                    </p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">⚙️</div>
                    <h3 class="feature-title">Admin Controls</h3>
                    <p class="feature-description">
                        Comprehensive user and group management capabilities
                    </p>
                </div>
            </div>
        </div>

        <!-- Technical Implementation Section -->
        <div class="demo-section">
            <h2 class="demo-section-title">🔧 Technical Implementation</h2>
            <p style="margin-bottom: 1rem;">
                The enhanced admin interface is built with modern web technologies and integrates 
                seamlessly with the Cloudflare Workers backend:
            </p>
            
            <div class="tech-stack">
                <span class="tech-badge">Cloudflare Workers</span>
                <span class="tech-badge">TypeScript</span>
                <span class="tech-badge">Modern JavaScript</span>
                <span class="tech-badge">CSS Grid & Flexbox</span>
                <span class="tech-badge">REST APIs</span>
                <span class="tech-badge">JWT Authentication</span>
                <span class="tech-badge">Responsive Design</span>
                <span class="tech-badge">Real-time Updates</span>
            </div>

            <div style="margin-top: 2rem;">
                <h3 style="margin-bottom: 1rem;">🔗 API Integration</h3>
                <p style="color: var(--text-gray-600);">
                    The enhanced UI connects directly to the production API endpoints:
                </p>
                <ul style="margin-top: 0.5rem; margin-left: 1.5rem; color: var(--text-gray-600);">
                    <li><code>PUT /admin/users/{email}/groups</code> - Update user groups</li>
                    <li><code>POST /admin/groups/{group}/users</code> - Manage group members</li>
                    <li><code>GET /admin/users</code> - Fetch user data</li>
                    <li><code>GET /admin/groups</code> - Fetch group data</li>
                </ul>
            </div>
        </div>

        <!-- Getting Started Section -->
        <div class="demo-section">
            <h2 class="demo-section-title">🚀 Getting Started</h2>
            <div style="background: var(--bg-gray-50); padding: 1.5rem; border-radius: 0.5rem; border-left: 4px solid var(--primary);">
                <ol style="margin-left: 1.5rem; color: var(--text-gray-700);">
                    <li style="margin-bottom: 0.5rem;">Navigate to the <strong>Enhanced User Management</strong> page</li>
                    <li style="margin-bottom: 0.5rem;">Click any <strong>"Edit Groups"</strong> button to see the modal interface</li>
                    <li style="margin-bottom: 0.5rem;">Try the <strong>Enhanced Group Management</strong> with "Manage Users" functionality</li>
                    <li style="margin-bottom: 0.5rem;">Experience real-time updates and notifications</li>
                    <li>Explore the responsive design on different screen sizes</li>
                </ol>
            </div>
        </div>

        <!-- Admin Navigation -->
        <div class="demo-section">
            <h2 class="demo-section-title">📋 Admin Navigation</h2>
            <div class="demo-links">
                <div class="demo-link-card">
                    <h3 class="demo-link-title">🏠 Admin Home</h3>
                    <p class="demo-link-description">Return to the main admin dashboard</p>
                    <a href="index.html" class="demo-link-button">Go to Dashboard</a>
                </div>
                
                <div class="demo-link-card">
                    <h3 class="demo-link-title">🔐 Login</h3>
                    <p class="demo-link-description">Access the admin login page</p>
                    <a href="login.html" class="demo-link-button">Admin Login</a>
                </div>
                
                <div class="demo-link-card">
                    <h3 class="demo-link-title">🌐 API Testing</h3>
                    <p class="demo-link-description">Test API endpoints and functionality</p>
                    <a href="test-api.html" class="demo-link-button">API Testing</a>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Demo page functionality
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Enhanced User-Group Management Demo loaded successfully!');
            
            // Add some interactive elements
            const cards = document.querySelectorAll('.demo-link-card');
            cards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-4px)';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(-2px)';
                });
            });
        });
    </script>
</body>
</html>`
}
