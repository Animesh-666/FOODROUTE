/**
 * =================================================
 * Cart JS
 * =================================================
 * Logic for cart page.
 */

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('cart.html')) {
        if (!Auth.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        loadCartPage();
    }
});

async function loadCartPage() {
    const container = document.getElementById('cartItemsContainer');
    
    try {
        const data = await Cart.getItems(); // Uses app.js Cart wrapper which caches data temporarily
        
        if (!data || data.items.length === 0) {
            renderEmptyCart(container);
            return;
        }

        renderCartItems(container, data.items);
        updateCartSummary(data.summary.subtotal);

    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Failed to load cart items.</div>`;
    }
}

function renderEmptyCart(container) {
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="mb-4 text-muted">
                <i class="fa-solid fa-cart-arrow-down fa-4x opacity-50"></i>
            </div>
            <h4 class="mb-3">Your cart is empty</h4>
            <p class="text-muted mb-4">Looks like you haven't added any delicious food yet.</p>
            <a href="menu.html" class="btn btn-primary-gradient px-4 py-2">Browse Menu</a>
        </div>
    `;
    
    document.getElementById('summarySubtotal').textContent = '₹0.00';
    document.getElementById('summaryTax').textContent = '₹0.00';
    document.getElementById('summaryTotal').textContent = '₹0.00';
    document.getElementById('checkoutBtn').style.display = 'none';
}

function renderCartItems(container, items) {
    let html = '<div class="d-flex justify-content-between align-items-center mb-4"><h5>Items</h5><button class="btn btn-sm btn-outline-danger" onclick="clearFullCart()"><i class="fa-solid fa-trash me-1"></i> Clear Cart</button></div>';
    
    html += items.map(item => `
        <div class="cart-item d-flex align-items-center mb-3 pb-3 border-bottom border-secondary" id="cart-item-${item.cart_id}">
            <div class="cart-item-img me-3 rounded overflow-hidden" style="width: 80px; height: 80px; flex-shrink: 0;">
                <img src="${item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}" 
                     onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';"
                     class="w-100 h-100 object-fit-cover" alt="${escapeHtml(item.name)}">
            </div>
            
            <div class="flex-grow-1">
                <h6 class="mb-1 text-white">${escapeHtml(item.name)}</h6>
                <div class="text-primary fw-bold mb-2">${formatCurrency(item.price)}</div>
                
                ${!item.is_available ? '<span class="badge bg-danger small">Unavailable</span>' : ''}
            </div>
            
            <div class="d-flex flex-column align-items-end ms-3">
                <div class="input-group input-group-sm mb-2" style="width: 100px;">
                    <button class="btn btn-outline-secondary text-white" type="button" onclick="updateQty(${item.cart_id}, ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>
                        <i class="fa-solid fa-minus"></i>
                    </button>
                    <input type="text" class="form-control text-center bg-dark text-white border-secondary px-0" value="${item.quantity}" readonly>
                    <button class="btn btn-outline-secondary text-white" type="button" onclick="updateQty(${item.cart_id}, ${item.quantity + 1})" ${!item.is_available ? 'disabled' : ''}>
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
                
                <button class="btn btn-sm btn-link text-danger text-decoration-none p-0" onclick="removeCartItem(${item.cart_id})">
                    <small><i class="fa-solid fa-xmark me-1"></i> Remove</small>
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    document.getElementById('checkoutBtn').style.display = 'block';
}

function updateCartSummary(subtotal) {
    const deliveryFee = 40;
    const tax = subtotal * 0.05;
    const total = subtotal + deliveryFee + tax;
    
    document.getElementById('summarySubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('summaryTax').textContent = formatCurrency(tax);
    document.getElementById('summaryTotal').textContent = formatCurrency(total);
}

window.updateQty = async function(cartId, newQuantity) {
    showLoading();
    try {
        await Cart.updateQuantity(cartId, newQuantity);
        await loadCartPage();
    } catch (error) {
        // Error handled in app.js
    } finally {
        hideLoading();
    }
};

window.removeCartItem = async function(cartId) {
    showLoading();
    try {
        await Cart.removeItem(cartId);
        await loadCartPage();
    } catch (error) {
        // Error handled in app.js
    } finally {
        hideLoading();
    }
};

window.clearFullCart = async function() {
    if (!await confirmAction('Are you sure you want to clear your entire cart?')) return;
    
    showLoading();
    try {
        await Cart.clear();
        await loadCartPage();
    } catch (error) {
        // Error handled in app.js
    } finally {
        hideLoading();
    }
};
