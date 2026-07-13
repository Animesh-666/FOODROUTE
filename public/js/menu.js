/**
 * =================================================
 * Menu JS
 * =================================================
 * Logic for browsing and filtering food items.
 */

let currentQuery = {
    page: 1,
    limit: 12,
    category: '',
    search: '',
    is_veg: '',
    sort_by: 'created_at',
    sort_order: 'DESC'
};

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('menu.html')) {
        initMenu();
    }
});

async function initMenu() {
    await loadCategories();
    
    // Check URL params for category
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('category')) {
        currentQuery.category = urlParams.get('category');
        const catRadio = document.getElementById(`cat-${currentQuery.category.replace(/\s+/g, '-').toLowerCase()}`);
        if (catRadio) catRadio.checked = true;
    }

    setupEventListeners();
    fetchMenu();
}

async function loadCategories() {
    try {
        const data = await ApiClient.get('/food/categories/list');
        const container = document.getElementById('categoryFilters');
        
        if (container && data.length > 0) {
            data.forEach(cat => {
                const id = `cat-${cat.replace(/\s+/g, '-').toLowerCase()}`;
                const html = `
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" name="category" id="${id}" value="${cat}">
                        <label class="form-check-label" for="${id}">${cat}</label>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', html);
            });
        }
    } catch (error) {
        console.error('Failed to load categories', error);
    }
}

function setupEventListeners() {
    // Search with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            currentQuery.search = e.target.value;
            currentQuery.page = 1;
            fetchMenu();
        }, 500));
    }

    // Category changes
    document.querySelectorAll('input[name="category"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentQuery.category = e.target.value;
            currentQuery.page = 1;
            fetchMenu();
        });
    });

    // Veg filter
    const vegFilter = document.getElementById('filterVeg');
    if (vegFilter) {
        vegFilter.addEventListener('change', (e) => {
            currentQuery.is_veg = e.target.checked ? true : '';
            currentQuery.page = 1;
            fetchMenu();
        });
    }

    // Sort changes
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const [by, order] = e.target.value.split('_');
            currentQuery.sort_by = by;
            currentQuery.sort_order = order;
            currentQuery.page = 1;
            fetchMenu();
        });
    }
}

async function fetchMenu() {
    const grid = document.getElementById('menuGrid');
    const resultCount = document.getElementById('resultCount');
    const pagination = document.getElementById('pagination');
    
    if (!grid) return;
    
    grid.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="text-muted mt-2">Finding delicious food...</p>
        </div>
    `;

    try {
        const qs = toQueryString(currentQuery);
        const data = await ApiClient.get(`/food?${qs}`);
        
        resultCount.textContent = `Showing ${data.meta.totalItems} results`;
        
        if (data.data.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5 glass-card">
                    <i class="fa-solid fa-utensils fa-3x text-muted mb-3"></i>
                    <h4>No food items found</h4>
                    <p class="text-muted">Try adjusting your filters or search query.</p>
                    <button class="btn btn-outline-primary mt-3" onclick="resetFilters()">Clear Filters</button>
                </div>
            `;
            pagination.innerHTML = '';
            return;
        }

        grid.innerHTML = data.data.map(item => `
            <div class="col-sm-6 col-lg-4">
                <div class="food-card glass-card h-100 overflow-hidden">
                    <div class="food-img-wrapper position-relative" style="height: 200px; overflow: hidden;">
                        <img src="${item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}" 
                             onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';"
                             class="w-100 h-100 object-fit-cover" alt="${escapeHtml(item.name)}">
                        ${item.is_veg ? '<span class="badge bg-success position-absolute top-0 end-0 m-2"><i class="fa-solid fa-leaf"></i> Veg</span>' : 
                                        '<span class="badge bg-danger position-absolute top-0 end-0 m-2"><i class="fa-solid fa-drumstick-bite"></i> Non-Veg</span>'}
                        ${!item.is_available ? '<div class="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center"><span class="badge bg-secondary fs-6">Currently Unavailable</span></div>' : ''}
                    </div>
                    <div class="p-3 d-flex flex-column h-100">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="m-0 fw-bold text-truncate pe-2" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</h5>
                            <span class="badge bg-dark border border-secondary text-light">${escapeHtml(item.category)}</span>
                        </div>
                        <p class="text-muted small mb-3 flex-grow-1 line-clamp-2">${escapeHtml(item.description || 'Delicious food item')}</p>
                        
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="fs-4 fw-bold gradient-text">${formatCurrency(item.price)}</span>
                            <button class="btn btn-primary-gradient rounded-circle px-3 py-2 shadow-sm" 
                                    onclick="addToCart(event, ${item.id})"
                                    ${!item.is_available ? 'disabled' : ''}
                                    title="Add to Cart">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        renderPagination(pagination, data.meta, (page) => {
            currentQuery.page = page;
            fetchMenu();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

    } catch (error) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-danger" role="alert">
                    <i class="fa-solid fa-triangle-exclamation me-2"></i> Failed to load menu. Please try again later.
                </div>
            </div>
        `;
    }
}

// Global function to call from inline onclick
window.resetFilters = function() {
    currentQuery = { ...currentQuery, category: '', search: '', is_veg: '', page: 1 };
    
    document.getElementById('searchInput').value = '';
    document.getElementById('cat-all').checked = true;
    document.getElementById('filterVeg').checked = false;
    
    fetchMenu();
};
window.addToCart = async function(e, foodId) {
    if (!Auth.isLoggedIn()) {
        showToast('Please login to add items to your cart', 'info');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    const btn = e ? e.currentTarget : null;
    const icon = btn ? btn.querySelector('i') : null;
    
    if (icon) icon.className = 'fa-solid fa-spinner fa-spin';
    if (btn) btn.disabled = true;

    try {
        await Cart.addItem(foodId, 1);
        
        if (icon) {
            icon.className = 'fa-solid fa-check';
            btn.classList.replace('btn-primary-gradient', 'btn-success-gradient');
        }
        
        showToast('Added to cart!', 'success');
        
        setTimeout(() => {
            if (icon) {
                icon.className = 'fa-solid fa-plus';
                btn.classList.replace('btn-success-gradient', 'btn-primary-gradient');
                btn.disabled = false;
            }
        }, 2000);

    } catch (error) {
        console.error('Failed to add to cart:', error);
        showToast(error.message || 'Failed to add item to cart', 'error');
        if (icon) {
            icon.className = 'fa-solid fa-plus';
            btn.disabled = false;
        }
    }
};
// Re-use pagination logic from customer.js
function renderPagination(container, meta, callback) {
    if (!container) return;
    if (meta.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    
    html += `
        <li class="page-item ${!meta.hasPrev ? 'disabled' : ''}">
            <a class="page-link bg-dark border-secondary text-light" href="#" data-page="${meta.currentPage - 1}">Previous</a>
        </li>
    `;
    
    for (let i = 1; i <= meta.totalPages; i++) {
        html += `
            <li class="page-item ${i === meta.currentPage ? 'active' : ''}">
                <a class="page-link ${i === meta.currentPage ? 'bg-primary border-primary' : 'bg-dark border-secondary text-light'}" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    html += `
        <li class="page-item ${!meta.hasNext ? 'disabled' : ''}">
            <a class="page-link bg-dark border-secondary text-light" href="#" data-page="${meta.currentPage + 1}">Next</a>
        </li>
    `;
    
    container.innerHTML = html;
    
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
