// admin-utils.js - Shared utilities for admin dashboard

/**
 * Show a modal dialog
 * @param {string} title - Modal title
 * @param {string} content - Modal HTML content
 */
function showModal(title, content) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('admin-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'admin-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s ease, visibility 0.2s ease;
            }
            
            .modal.visible {
                opacity: 1;
                visibility: visible;
            }
            
            .modal-content {
                background-color: var(--bg-primary);
                border-radius: var(--border-radius);
                width: 100%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            }
            
            .modal-header {
                padding: var(--spacing-md);
                border-bottom: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .modal-title {
                font-size: var(--font-size-lg);
                font-weight: 600;
                margin: 0;
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: var(--font-size-lg);
                cursor: pointer;
                padding: 0;
            }
            
            .modal-body {
                padding: var(--spacing-md);
            }
        `;
        document.head.appendChild(style);
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button type="button" class="modal-close" onclick="hideModal()">×</button>
            </div>
            <div class="modal-body">${content}</div>
        </div>
    `;
    
    // Show modal after a brief delay to ensure smooth animation
    setTimeout(() => {
        modal.classList.add('visible');
    }, 10);
    
    // Close when clicking outside modal content
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideModal();
        }
    });
}

/**
 * Hide the modal dialog
 */
function hideModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
    }
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, warning, error)
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
        
        // Add toast styles
        const style = document.createElement('style');
        style.textContent = `
            #toast-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1001;
            }
            
            .toast {
                padding: var(--spacing-md);
                margin-top: var(--spacing-md);
                border-radius: var(--border-radius);
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
                min-width: 250px;
                max-width: 350px;
                animation: toast-in 0.3s ease, toast-out 0.3s ease 3.7s forwards;
            }
            
            .toast.success {
                background-color: var(--success-bg);
                color: var(--success-color);
                border-left: 4px solid var(--success-color);
            }
            
            .toast.warning {
                background-color: var(--warning-bg);
                color: var(--warning-color);
                border-left: 4px solid var(--warning-color);
            }
            
            .toast.error {
                background-color: var(--danger-bg);
                color: var(--danger-color);
                border-left: 4px solid var(--danger-color);
            }
            
            .toast.info {
                background-color: var(--info-bg);
                color: var(--info-color);
                border-left: 4px solid var(--info-color);
            }
            
            @keyframes toast-in {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes toast-out {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Remove after animation
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

/**
 * Format date to a readable string
 * @param {string} dateStr - ISO date string
 * @returns {string} - Formatted date string
 */
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

/**
 * Initialize tab functionality for tab interfaces
 * @param {string} tabContainerId - ID of the container element holding tabs
 */
function initTabs(tabContainerId) {
    const tabContainer = document.getElementById(tabContainerId);
    if (!tabContainer) return;
    
    const tabButtons = tabContainer.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the target tab content ID
            const targetTabId = this.getAttribute('data-tab');
            
            // Deactivate all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContainer.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Activate current tab and content
            this.classList.add('active');
            document.getElementById(targetTabId).classList.add('active');
        });
    });
}

/**
 * Setup responsive behavior for the admin layout
 */
function setupResponsiveLayout() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    const adminLayout = document.querySelector('.admin-layout');
    
    if (sidebarToggle && sidebar && adminLayout) {
        // Handle sidebar toggle button click
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            adminLayout.classList.toggle('sidebar-collapsed');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            const isClickInsideSidebar = sidebar.contains(e.target);
            const isClickOnToggleBtn = sidebarToggle.contains(e.target);
            
            if (isMobile && !isClickInsideSidebar && !isClickOnToggleBtn && sidebar.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
            }
        });
        
        // Adjust layout based on screen size
        const handleResize = () => {
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            
            if (isMobile) {
                adminLayout.classList.add('sidebar-collapsed');
                sidebar.classList.remove('mobile-open');
            } else {
                adminLayout.classList.remove('sidebar-collapsed');
            }
        };
        
        // Initial call and add resize listener
        handleResize();
        window.addEventListener('resize', handleResize);
    }
}

/**
 * Create and show a confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {Function} onConfirm - Callback for confirm button
 * @param {string} confirmBtnText - Text for confirm button
 * @param {string} confirmBtnClass - CSS class for confirm button
 */
function showConfirmDialog(title, message, onConfirm, confirmBtnText = 'Confirm', confirmBtnClass = 'btn-primary') {
    showModal(title, `
        <div class="confirm-dialog">
            <p>${message}</p>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancel</button>
                <button type="button" class="btn ${confirmBtnClass}" id="confirm-action">${confirmBtnText}</button>
            </div>
        </div>
    `);
    
    document.getElementById('confirm-action').addEventListener('click', function() {
        hideModal();
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    });
}

/**
 * Initialize data table with search and sorting functionality
 * @param {string} tableId - ID of the table element
 * @param {string} searchInputId - ID of the search input element (optional)
 */
function initDataTable(tableId, searchInputId = null) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    // Setup search functionality if search input is provided
    if (searchInputId) {
        const searchInput = document.getElementById(searchInputId);
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const rows = table.querySelectorAll('tbody tr');
                
                rows.forEach(row => {
                    const textContent = row.textContent.toLowerCase();
                    row.style.display = textContent.includes(searchTerm) ? '' : 'none';
                });
            });
        }
    }
    
    // Setup sorting functionality
    const headers = table.querySelectorAll('thead th');
    headers.forEach((header, index) => {
        if (!header.classList.contains('no-sort')) {
            header.style.cursor = 'pointer';
            header.title = 'Click to sort';
            header.innerHTML += ' <span class="sort-icon">↕️</span>';
            
            header.addEventListener('click', function() {
                const isAscending = !this.classList.contains('sort-asc');
                
                // Remove sort classes from all headers
                headers.forEach(h => {
                    h.classList.remove('sort-asc', 'sort-desc');
                    h.querySelector('.sort-icon').textContent = '↕️';
                });
                
                // Set sort class on current header
                this.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
                this.querySelector('.sort-icon').textContent = isAscending ? '↑' : '↓';
                
                // Sort the rows
                const rows = Array.from(table.querySelectorAll('tbody tr'));
                
                rows.sort((a, b) => {
                    let valueA = a.cells[index].textContent.trim();
                    let valueB = b.cells[index].textContent.trim();
                    
                    // Check if values are numbers
                    const isNumber = !isNaN(parseFloat(valueA)) && !isNaN(parseFloat(valueB));
                    
                    if (isNumber) {
                        valueA = parseFloat(valueA);
                        valueB = parseFloat(valueB);
                    }
                    
                    if (valueA < valueB) return isAscending ? -1 : 1;
                    if (valueA > valueB) return isAscending ? 1 : -1;
                    return 0;
                });
                
                // Re-append rows in sorted order
                const tbody = table.querySelector('tbody');
                rows.forEach(row => tbody.appendChild(row));
            });
        }
    });
}

// Export utils for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showModal,
        hideModal,
        showToast,
        formatDate,
        initTabs,
        setupResponsiveLayout,
        showConfirmDialog,
        initDataTable
    };
}
