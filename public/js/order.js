/**
 * =================================================
 * Order JS
 * =================================================
 * Logic for checkout, placing orders, and order tracking.
 */

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    if (path.includes('checkout.html')) {
        if (!Auth.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        initCheckout();
    } else if (path.includes('track-order.html')) {
        if (!Auth.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        initTracking();
    }
});

// ==========================================
// CHECKOUT LOGIC
// ==========================================

async function initCheckout() {
    // 1. Fetch Cart
    try {
        const data = await Cart.getItems();
        
        if (!data || data.items.length === 0) {
            showToast('Your cart is empty', 'warning');
            setTimeout(() => window.location.href = 'cart.html', 1500);
            return;
        }
        
        renderCheckoutSummary(data.items, data.summary.subtotal);
        
        // Populate profile address if exists
        const user = Auth.getUser();
        if (user) {
            try {
                const profile = await ApiClient.get('/auth/profile');
                if (profile.address) {
                    document.getElementById('deliveryAddress').value = profile.address;
                }
            } catch (e) {
                console.warn('Could not load profile address');
            }
        }
        
    } catch (error) {
        showToast('Error loading checkout', 'error');
    }

    // 2. Setup Map
    setupLocationPicker();
    
    // 3. Setup form submission
    setupCheckoutForm();
}

function renderCheckoutSummary(items, subtotal) {
    const list = document.getElementById('checkoutItemsList');
    
    list.innerHTML = items.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center">
                <span class="badge bg-secondary me-2">${item.quantity}x</span>
                <span class="text-truncate" style="max-width: 150px;" title="${escapeHtml(item.name)}">
                    ${escapeHtml(item.name)}
                </span>
            </div>
            <span>${formatCurrency(item.price * item.quantity)}</span>
        </div>
    `).join('');
    
    const deliveryFee = 40;
    const tax = subtotal * 0.05;
    const total = subtotal + deliveryFee + tax;
    
    document.getElementById('checkoutSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('checkoutTax').textContent = formatCurrency(tax);
    document.getElementById('checkoutTotal').textContent = formatCurrency(total);
}

function setupLocationPicker() {
    const mapEl = document.getElementById('mapPicker');
    if (!mapEl || typeof L === 'undefined') return;
    
    // Default to New Delhi
    let center = [28.6139, 77.2090];
    
    const map = L.map('mapPicker').setView(center, 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    let marker = L.marker(center, { draggable: true }).addTo(map);
    
    function updateInputs(latlng) {
        document.getElementById('lat').value = latlng.lat;
        document.getElementById('lng').value = latlng.lng;
    }
    
    updateInputs(map.getCenter());
    
    map.on('click', function(e) {
        marker.setLatLng(e.latlng);
        updateInputs(e.latlng);
    });
    
    marker.on('dragend', function(e) {
        updateInputs(marker.getLatLng());
    });
    
    // Get current location btn
    const btnLoc = document.getElementById('btnGetCurrentLocation');
    if (btnLoc) {
        btnLoc.addEventListener('click', () => {
            if (navigator.geolocation) {
                btnLoc.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Locating...';
                
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const latlng = { lat: position.coords.latitude, lng: position.coords.longitude };
                        map.setView(latlng, 15);
                        marker.setLatLng(latlng);
                        updateInputs(latlng);
                        btnLoc.innerHTML = '<i class="fa-solid fa-crosshairs"></i> Get Current Location';
                    },
                    (err) => {
                        showToast('Could not access location. Please pin manually.', 'warning');
                        btnLoc.innerHTML = '<i class="fa-solid fa-crosshairs"></i> Get Current Location';
                    }
                );
            } else {
                showToast('Geolocation is not supported by your browser.', 'warning');
            }
        });
    }
}

function setupCheckoutForm() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }
        
        const btn = document.getElementById('btnPlaceOrder');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        btn.disabled = true;
        
        const payload = {
            delivery_address: document.getElementById('deliveryAddress').value,
            delivery_lat: document.getElementById('lat').value || null,
            delivery_lng: document.getElementById('lng').value || null,
            payment_method: document.querySelector('input[name="payment_method"]:checked').value,
            notes: document.getElementById('orderNotes').value
        };
        
        try {
            const data = await ApiClient.post('/orders', payload);
            
            // Force cart refresh on next load
            Cart.clearCache();
            Cart.updateBadge();
            
            showToast('Order placed successfully!', 'success');
            
            // Redirect to customer dashboard
            setTimeout(() => {
                window.location.href = 'customer-dashboard.html';
            }, 1500);
            
        } catch (error) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// ==========================================
// ORDER TRACKING LOGIC
// ==========================================

async function initTracking() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    
    if (!orderId) {
        showToast('Invalid Order ID', 'error');
        setTimeout(() => window.location.href = 'order-history.html', 1500);
        return;
    }
    
    try {
        const orderRes = await ApiClient.get(`/orders/${orderId}`);
        const order = orderRes.data;
        
        renderOrderTrackingHeader(order);
        renderTrackingTimeline(order.status);
        renderOrderDetails(order);
        renderLiveTrackingMap(order);
        
        // Set up polling for status updates every 15 seconds
        if (!['delivered', 'cancelled'].includes(order.status)) {
            setInterval(async () => {
                try {
                    const freshOrder = await ApiClient.get(`/orders/${orderId}`);
                    renderLiveTrackingMap(freshOrder.data);
                    
                    if (freshOrder.data.status !== order.status) {
                        order.status = freshOrder.data.status;
                        renderOrderTrackingHeader(freshOrder.data);
                        renderTrackingTimeline(freshOrder.data.status);
                        
                        if (['delivered', 'cancelled'].includes(order.status)) {
                            showToast(`Order status updated to ${getStatusLabel(order.status)}`, 'info');
                            setTimeout(() => location.reload(), 2000);
                        } else {
                            showToast('Order status updated!', 'info');
                        }
                    }
                } catch(e) {}
            }, 15000);
        }
        
    } catch (error) {
        showToast('Failed to load order tracking details', 'error');
    }
}

function renderOrderTrackingHeader(order) {
    document.getElementById('displayTrackingId').textContent = `#${order.tracking_id}`;
    
    const badge = document.getElementById('displayStatusBadge');
    badge.innerHTML = `<span class="${getStatusBadgeClass(order.status)} fs-6 px-3 py-2">${getStatusLabel(order.status)}</span>`;
}

function renderTrackingTimeline(currentStatus) {
    const timeline = document.getElementById('trackingTimeline');
    
    const flow = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
    
    if (currentStatus === 'cancelled') {
        timeline.innerHTML = `
            <div class="alert alert-danger mb-0">
                <i class="fa-solid fa-circle-xmark me-2"></i> This order was cancelled.
            </div>
        `;
        return;
    }
    
    const currentIndex = flow.indexOf(currentStatus);
    
    const steps = [
        { id: 'pending', title: 'Order Placed', desc: 'Waiting for restaurant confirmation', icon: 'fa-clipboard-check' },
        { id: 'confirmed', title: 'Order Confirmed', desc: 'Restaurant has accepted your order', icon: 'fa-check-double' },
        { id: 'preparing', title: 'Preparing Food', desc: 'Your food is being cooked', icon: 'fa-fire-burner' },
        { id: 'out_for_delivery', title: 'Out for Delivery', desc: 'Agent is on the way', icon: 'fa-motorcycle' },
        { id: 'delivered', title: 'Delivered', desc: 'Enjoy your meal!', icon: 'fa-box-open' }
    ];
    
    let html = '';
    
    steps.forEach((step, index) => {
        let statusClass = 'step-pending';
        let iconClass = 'fa-solid ' + step.icon;
        
        if (index < currentIndex) {
            statusClass = 'step-completed';
            iconClass = 'fa-solid fa-check'; // Replace with checkmark
        } else if (index === currentIndex) {
            statusClass = 'step-active';
        }
        
        html += `
            <div class="timeline-step ${statusClass}">
                <div class="timeline-line"></div>
                <div class="timeline-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div>
                    <h6 class="mb-1 ${statusClass === 'step-pending' ? 'text-muted' : 'text-white'}">${step.title}</h6>
                    <p class="text-muted small m-0">${step.desc}</p>
                </div>
            </div>
        `;
    });
    
    timeline.innerHTML = html;
}

function renderOrderDetails(order) {
    document.getElementById('displayOrderDate').textContent = formatDate(order.created_at);
    
    const pm = order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment';
    document.getElementById('displayPaymentMethod').textContent = pm;
    
    document.getElementById('displayAddress').textContent = order.delivery_address;
    
    // Items
    const itemsContainer = document.getElementById('displayOrderItems');
    let itemsHtml = '';
    let subtotal = 0;
    
    order.items.forEach(item => {
        subtotal += item.price * item.quantity;
        itemsHtml += `
            <div class="d-flex justify-content-between align-items-center mb-2 border-bottom border-secondary pb-2">
                <div>
                    <span class="badge bg-secondary me-2">${item.quantity}x</span>
                    <span>${escapeHtml(item.food_name)}</span>
                </div>
                <span>${formatCurrency(item.price * item.quantity)}</span>
            </div>
        `;
    });
    
    itemsContainer.innerHTML = itemsHtml;
    
    // Financials
    const totalAmount = parseFloat(order.total_amount);
    const feeAndTax = totalAmount - subtotal;
    
    document.getElementById('displaySubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('displayFeeAndTax').textContent = formatCurrency(feeAndTax);
    document.getElementById('displayTotal').textContent = formatCurrency(totalAmount);
    
    // Agent
    if (order.agent) {
        document.getElementById('agentInfoCard').style.display = 'block';
        document.getElementById('agentName').textContent = order.agent.name;
        document.getElementById('agentRating').textContent = order.agent.rating || 'New';
        document.getElementById('btnCallAgent').href = `tel:${order.agent.phone}`;
    }
}

let orderTrackMap = null;
let orderTrackMarkers = [];
let routePolyline = null;

function renderLiveTrackingMap(order) {
    const mapCard = document.getElementById('trackingMapCard');
    if (!mapCard || typeof L === 'undefined') return;
    
    if (order.status === 'pending' || order.status === 'cancelled') {
        mapCard.style.display = 'none';
        return;
    }
    
    mapCard.style.display = 'block';
    
    const depotCoords = [28.6304, 77.2177]; // Connaught Place
    const customerCoords = [parseFloat(order.delivery_lat), parseFloat(order.delivery_lng)];
    
    setTimeout(() => {
        if (!orderTrackMap) {
            orderTrackMap = L.map('orderTrackingMap').setView(depotCoords, 13);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
            }).addTo(orderTrackMap);
        }
        
        // Clear old markers/lines
        orderTrackMarkers.forEach(m => orderTrackMap.removeLayer(m));
        orderTrackMarkers = [];
        if (routePolyline) {
            orderTrackMap.removeLayer(routePolyline);
            routePolyline = null;
        }
        
        const depotIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });
        
        const customerIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });
        
        const agentIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });
        
        // Add Depot
        const mDepot = L.marker(depotCoords, { icon: depotIcon })
            .addTo(orderTrackMap)
            .bindPopup('Central Kitchen (Depot)');
        orderTrackMarkers.push(mDepot);
        
        // Add Customer
        if (order.delivery_lat && order.delivery_lng) {
            const mCust = L.marker(customerCoords, { icon: customerIcon })
                .addTo(orderTrackMap)
                .bindPopup('Your Delivery Address');
            orderTrackMarkers.push(mCust);
        }
        
        // Add Rider if assigned
        if (order.agent && order.agent.current_lat && order.agent.current_lng) {
            const agentCoords = [parseFloat(order.agent.current_lat), parseFloat(order.agent.current_lng)];
            const mAgent = L.marker(agentCoords, { icon: agentIcon })
                .addTo(orderTrackMap)
                .bindPopup(`<b>${order.agent.name}</b><br>Rider Status: En Route`);
            orderTrackMarkers.push(mAgent);
            
            // Draw route from Agent -> Customer
            routePolyline = L.polyline([agentCoords, customerCoords], { color: '#00d2ff', weight: 4, opacity: 0.8 }).addTo(orderTrackMap);
        } else if (order.delivery_lat && order.delivery_lng) {
            // Draw route from Depot -> Customer
            routePolyline = L.polyline([depotCoords, customerCoords], { color: '#e94560', weight: 4, opacity: 0.8 }).addTo(orderTrackMap);
        }
        
        // Fit bounds
        const group = new L.featureGroup(orderTrackMarkers);
        orderTrackMap.fitBounds(group.getBounds().pad(0.1));
        orderTrackMap.invalidateSize();
    }, 400);
}
