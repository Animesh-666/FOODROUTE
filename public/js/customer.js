/**
 * =================================================
 * Customer JS
 * =================================================
 * Logic for dashboard and profile pages.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check login state
    if (!Auth.isLoggedIn()) {
        if (window.location.pathname.includes('customer-dashboard.html') || 
            window.location.pathname.includes('profile.html') || 
            window.location.pathname.includes('order-history.html')) {
            window.location.href = 'login.html';
        }
        return;
    }

    const user = Auth.getUser();

    // Role verification for customer-specific pages
    if (user.role !== 'customer') {
        if (window.location.pathname.includes('customer-dashboard.html') || 
            window.location.pathname.includes('order-history.html')) {
            window.location.href = 'login.html';
            return;
        }
    }

    // Update Profile UI
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        loadProfileData();
        setupProfileForm(profileForm);
        
        // Make the back-to-dashboard button point to the correct role dashboard
        const backBtn = document.getElementById('backToDashboardBtn');
        if (backBtn) {
            const dashboardMap = {
                customer: 'customer-dashboard.html',
                admin: 'admin-dashboard.html',
                delivery_agent: 'delivery-dashboard.html'
            };
            backBtn.href = dashboardMap[user.role] || 'customer-dashboard.html';
        }
    }

    // Update Dashboard UI
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = user.name.split(' ')[0];
        loadDashboardStats();
        loadRecentOrders();
    }
});

async function loadDashboardStats() {
    try {
        const data = await ApiClient.get('/customer/dashboard');
        
        document.getElementById('statActiveOrders').textContent = data.active_orders;
        document.getElementById('statTotalOrders').textContent = data.total_orders;
        document.getElementById('statTotalSpent').textContent = formatCurrency(data.total_spent);
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentOrders() {
    const list = document.getElementById('recentOrdersList');
    if (!list) return;

    try {
        const data = await ApiClient.get('/orders/my-orders?limit=5');
        
        if (data.data.length === 0) {
            list.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">You have no orders yet. <a href="menu.html" class="text-primary">Order now!</a></td></tr>`;
            return;
        }

        list.innerHTML = data.data.map(order => `
            <tr>
                <td class="fw-medium text-light">#${order.tracking_id}</td>
                <td><small class="text-muted">${formatDate(order.created_at)}</small></td>
                <td><span class="text-truncate d-inline-block" style="max-width: 200px;" title="${escapeHtml(order.items_summary)}">${escapeHtml(order.items_summary)}</span></td>
                <td class="fw-medium">${formatCurrency(order.total_amount)}</td>
                <td><span class="${getStatusBadgeClass(order.status)}">${getStatusLabel(order.status)}</span></td>
                <td>
                    <a href="track-order.html?id=${order.id}" class="btn btn-sm btn-outline-primary">
                        ${['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.status) ? 'Track' : 'View'}
                    </a>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        list.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Failed to load orders.</td></tr>`;
    }
}

// Order History Page logic
async function loadOrderHistory(page = 1) {
    const list = document.getElementById('ordersHistoryList');
    const pagination = document.getElementById('pagination');
    if (!list) return;

    try {
        list.innerHTML = `<tr><td colspan="6" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></td></tr>`;
        
        const data = await ApiClient.get(`/orders/my-orders?page=${page}&limit=10`);
        
        if (data.data.length === 0) {
            list.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted">No orders found.</td></tr>`;
            pagination.innerHTML = '';
            return;
        }

        list.innerHTML = data.data.map(order => `
            <tr>
                <td class="fw-medium text-light">#${order.tracking_id}</td>
                <td>
                    <div class="d-flex flex-column">
                        <span>${formatDate(order.created_at).split(' ')[0]}</span>
                        <small class="text-muted">${formatDate(order.created_at).split(' ').slice(1).join(' ')}</small>
                    </div>
                </td>
                <td>
                    <div class="text-truncate" style="max-width: 250px;" title="${escapeHtml(order.items_summary)}">
                        ${escapeHtml(order.items_summary)}
                    </div>
                </td>
                <td class="fw-bold">${formatCurrency(order.total_amount)}</td>
                <td><span class="${getStatusBadgeClass(order.status)}">${getStatusLabel(order.status)}</span></td>
                <td>
                    <a href="track-order.html?id=${order.id}" class="btn btn-sm btn-outline-primary rounded-pill px-3">
                        ${['delivered', 'cancelled'].includes(order.status) ? 'Details' : 'Track Status'}
                    </a>
                </td>
            </tr>
        `).join('');

        // Render Pagination
        renderPagination(pagination, data.meta, loadOrderHistory);

    } catch (error) {
        list.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-danger">Failed to load order history.</td></tr>`;
    }
}

function renderPagination(container, meta, callback) {
    if (meta.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    
    // Prev
    html += `
        <li class="page-item ${!meta.hasPrev ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${meta.currentPage - 1}" style="background: var(--clr-surface); color: var(--clr-text-primary); border-color: var(--clr-border);"><i class="fa-solid fa-chevron-left"></i></a>
        </li>
    `;
    
    // Pages (simplified)
    for (let i = 1; i <= meta.totalPages; i++) {
        html += `
            <li class="page-item ${i === meta.currentPage ? 'active' : ''}">
                <a class="page-link ${i === meta.currentPage ? 'bg-primary border-primary text-white' : ''}" href="#" data-page="${i}" style="${i === meta.currentPage ? '' : 'background: var(--clr-surface); color: var(--clr-text-primary); border-color: var(--clr-border);'}">${i}</a>
            </li>
        `;
    }
    
    // Next
    html += `
        <li class="page-item ${!meta.hasNext ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${meta.currentPage + 1}" style="background: var(--clr-surface); color: var(--clr-text-primary); border-color: var(--clr-border);"><i class="fa-solid fa-chevron-right"></i></a>
        </li>
    `;
    
    container.innerHTML = html;
    
    // Add event listeners
    container.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.currentTarget.dataset.page);
            if (page && page > 0 && page <= meta.totalPages && page !== meta.currentPage) {
                callback(page);
            }
        });
    });
}

async function loadProfileData() {
    try {
        const data = await ApiClient.get('/auth/profile');
        const user = data.data;
        
        document.getElementById('profileNameDisplay').textContent = user.name;
        document.getElementById('profileEmailDisplay').textContent = user.email;
        document.getElementById('avatarInitial').textContent = user.name.charAt(0).toUpperCase();
        
        document.getElementById('profileName').value = user.name || '';
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('profilePhone').value = user.phone || '';
        document.getElementById('profileAddress').value = user.address || '';
        
    } catch (error) {
        showToast('Failed to load profile data', 'error');
    }
}

function setupProfileForm(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        const btn = document.getElementById('btnUpdateProfile');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        btn.disabled = true;

        const payload = {
            name: document.getElementById('profileName').value,
            phone: document.getElementById('profilePhone').value,
            address: document.getElementById('profileAddress').value
        };

        try {
            const data = await ApiClient.put('/auth/profile', payload);
            
            showToast('Profile updated successfully', 'success');
            
            // Update UI
            document.getElementById('profileNameDisplay').textContent = data.name;
            document.getElementById('avatarInitial').textContent = data.name.charAt(0).toUpperCase();
            
            // Update local storage user object
            const user = Auth.getUser();
            user.name = data.name;
            Auth.setToken(Auth.getToken()); // Token might not contain new info, but keep it active
            // Actually to update token info, backend should return new token, 
            // but for now we just rely on API for profile data.
            
        } catch (error) {
            // Error handled by ApiClient
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}
