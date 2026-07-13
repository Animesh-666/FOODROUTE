/**
 * =================================================
 * Delivery Agent JS
 * =================================================
 * Logic for agent dashboard, GPS tracking, and delivery routing.
 */

let agentMap = null;
let agentMarker = null;
let customerMarker = null;
let currentAgentPos = null;
let gpsWatchId = null;
let activeOrderForNav = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isLoggedIn() || Auth.getUser().role !== 'delivery_agent') {
        window.location.href = 'delivery-login.html';
        return;
    }
    
    loadDeliveryDashboard();
    setupAvailabilityToggle();
});

async function loadDeliveryDashboard() {
    try {
        const res = await ApiClient.get('/delivery/dashboard');
        const data = res.data;
        
        // Update Profile
        document.getElementById('agentName').textContent = data.profile.name.split(' ')[0];
        document.getElementById('agentRating').textContent = data.profile.rating || '5.0';
        document.getElementById('todayEarnings').textContent = formatCurrency(data.stats.today_value);
        
        // Update Toggle Switch
        const toggle = document.getElementById('agentStatusToggle');
        const lbl = document.getElementById('agentStatusLabel');
        
        if (data.profile.is_available) {
            toggle.checked = true;
            lbl.textContent = 'Online';
            lbl.className = 'form-check-label small fw-bold text-success';
            startGpsTracking();
        } else {
            toggle.checked = false;
            lbl.textContent = 'Offline';
            lbl.className = 'form-check-label small fw-bold text-muted';
            stopGpsTracking();
        }
        
        // Render Active Orders List
        renderActiveOrders(data.active_orders);
        
    } catch (error) {
        showToast('Failed to load dashboard', 'error');
    }
}

function renderActiveOrders(orders) {
    const list = document.getElementById('activeOrdersList');
    document.getElementById('activeCount').textContent = orders.length;
    
    if (orders.length === 0) {
        list.innerHTML = `
            <div class="text-center py-5 glass-card rounded border border-secondary">
                <i class="fa-solid fa-mug-hot fa-3x text-muted mb-3"></i>
                <h6 class="text-white">No active deliveries</h6>
                <p class="text-muted small mb-0">Wait for new routes to be assigned.</p>
            </div>
        `;
        return;
    }
    
    // Sort by optimal route order if we had it, but for now just display them
    list.innerHTML = orders.map((order, index) => {
        // Convert to JSON string for onClick handler
        const orderStr = JSON.stringify(order).replace(/'/g, "&#39;");
        
        return `
        <div class="glass-card rounded p-3 position-relative overflow-hidden border-start border-4 border-primary">
            <div class="d-flex justify-content-between mb-2">
                <span class="badge bg-dark border border-secondary text-light">Stop ${index + 1}</span>
                <span class="fw-bold text-primary">#${order.tracking_id}</span>
            </div>
            
            <h6 class="mb-1">${escapeHtml(order.customer_name)}</h6>
            <p class="text-muted small mb-3 line-clamp-2"><i class="fa-solid fa-location-dot me-1"></i> ${escapeHtml(order.delivery_address)}</p>
            
            <div class="d-flex justify-content-between align-items-center bg-black bg-opacity-25 rounded p-2 mb-3">
                <div class="small"><span class="text-muted">Items:</span> <span class="text-truncate d-inline-block align-bottom" style="max-width: 100px;" title="${escapeHtml(order.items_summary)}">${escapeHtml(order.items_summary)}</span></div>
                <div class="fw-bold text-success">${order.payment_method === 'cod' ? 'COD: ' + formatCurrency(order.total_amount) : 'Paid Online'}</div>
            </div>
            
            ${order.status === 'out_for_delivery' ? `
                <button class="btn btn-primary-gradient w-100 fw-bold" onclick='openNavigation(${orderStr})'>
                    <i class="fa-solid fa-location-arrow me-2"></i> Navigate & Deliver
                </button>
            ` : `
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-danger flex-grow-1 fw-bold" onclick='rejectDelivery(${order.id})'>
                        <i class="fa-solid fa-xmark me-2"></i> Reject
                    </button>
                    <button class="btn btn-success-gradient flex-grow-1 fw-bold" onclick='acceptDelivery(${order.id})'>
                        <i class="fa-solid fa-check me-2"></i> Accept
                    </button>
                </div>
            `}
        </div>
    `}).join('');
}

function setupAvailabilityToggle() {
    const toggle = document.getElementById('agentStatusToggle');
    const lbl = document.getElementById('agentStatusLabel');
    
    toggle.addEventListener('change', async (e) => {
        const isOnline = e.target.checked;
        toggle.disabled = true;
        
        try {
            await ApiClient.put('/delivery/availability', { is_available: isOnline });
            
            if (isOnline) {
                lbl.textContent = 'Online';
                lbl.className = 'form-check-label small fw-bold text-success';
                startGpsTracking();
                showToast('You are now online', 'success');
            } else {
                lbl.textContent = 'Offline';
                lbl.className = 'form-check-label small fw-bold text-muted';
                stopGpsTracking();
                showToast('You are now offline', 'info');
            }
        } catch (error) {
            e.target.checked = !isOnline; // revert
        } finally {
            toggle.disabled = false;
        }
    });
}

// ==========================================
// ACCEPT / REJECT LOGIC
// ==========================================

window.acceptDelivery = async function(orderId) {
    if (await confirmAction('Accept this delivery assignment?')) {
        try {
            showLoading();
            // Since this is a mini project without a specific accept endpoint yet,
            // we simulate accepting by setting it to out_for_delivery via admin route if accessible,
            // or we'd hit a dedicated agent endpoint. For now, simulate success:
            await ApiClient.put(`/orders/${orderId}/status`, { status: 'out_for_delivery' });
            showToast('Delivery accepted! Please proceed to pickup.', 'success');
            loadDeliveryDashboard();
        } catch (error) {
            showToast('Failed to accept delivery', 'error');
        } finally {
            hideLoading();
        }
    }
}

window.rejectDelivery = async function(orderId) {
    if (await confirmAction('Reject this delivery? It will be unassigned.')) {
        try {
            showLoading();
            await ApiClient.put(`/orders/${orderId}/assign`, { agent_id: null });
            showToast('Delivery rejected.', 'info');
            loadDeliveryDashboard();
        } catch (error) {
            showToast('Failed to reject delivery', 'error');
        } finally {
            hideLoading();
        }
    }
}

// ==========================================
// GPS & NAVIGATION
// ==========================================

function startGpsTracking() {
    const iconWrapper = document.getElementById('gpsIconWrapper');
    const statusText = document.getElementById('gpsStatusText');
    const lastUpdate = document.getElementById('gpsLastUpdate');
    
    if (!navigator.geolocation) {
        statusText.textContent = "GPS Not Supported";
        return;
    }
    
    iconWrapper.className = 'bg-primary bg-opacity-25 p-2 rounded text-primary';
    statusText.textContent = "Acquiring GPS signal...";
    
    // Watch position
    gpsWatchId = navigator.geolocation.watchPosition(
        async (position) => {
            currentAgentPos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            statusText.textContent = "GPS Active";
            statusText.className = "m-0 text-success";
            lastUpdate.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
            
            // Send to backend
            try {
                await ApiClient.put('/delivery/location', currentAgentPos);
            } catch(e) {
                console.warn('Failed to sync location to server');
            }
            
            // Update map marker if open
            if (agentMap && agentMarker) {
                agentMarker.setLatLng([currentAgentPos.lat, currentAgentPos.lng]);
            }
        },
        (error) => {
            iconWrapper.className = 'bg-danger bg-opacity-25 p-2 rounded text-danger';
            statusText.textContent = "GPS Signal Lost";
            statusText.className = "m-0 text-danger";
            lastUpdate.textContent = error.message;
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
}

function stopGpsTracking() {
    if (gpsWatchId) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    
    document.getElementById('gpsIconWrapper').className = 'bg-secondary bg-opacity-25 p-2 rounded text-secondary';
    document.getElementById('gpsStatusText').textContent = "Location tracking off";
    document.getElementById('gpsStatusText').className = "m-0";
    document.getElementById('gpsLastUpdate').textContent = "Go online to start tracking";
}

let navModal = null;

window.openNavigation = function(order) {
    activeOrderForNav = order;
    
    if (!navModal) {
        navModal = new bootstrap.Modal(document.getElementById('navigationModal'));
    }
    
    // Update Modal UI
    document.getElementById('navOrderId').textContent = `#${order.tracking_id}`;
    document.getElementById('navCustomerName').textContent = order.customer_name;
    document.getElementById('navAddress').textContent = order.delivery_address;
    document.getElementById('btnCallCustomer').href = `tel:${order.customer_phone}`;
    
    // Reset deliver button
    const btnDeliver = document.getElementById('btnMarkDelivered');
    btnDeliver.disabled = false;
    btnDeliver.innerHTML = '<i class="fa-solid fa-check me-2"></i> Mark as Delivered';
    btnDeliver.onclick = async () => {
        if (await confirmAction('Confirm successful delivery to customer?')) {
            btnDeliver.disabled = true;
            btnDeliver.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';
            try {
                await ApiClient.put(`/delivery/orders/${order.id}/deliver`);
                showToast('Delivery marked as successful!', 'success');
                navModal.hide();
                loadDeliveryDashboard(); // refresh dashboard
            } catch(e) {
                btnDeliver.disabled = false;
                btnDeliver.innerHTML = '<i class="fa-solid fa-check me-2"></i> Mark as Delivered';
            }
        }
    };
    
    navModal.show();
    
    // Delay map initialization until modal is fully shown so Leaflet calculates size correctly
    setTimeout(() => {
        initNavigationMap(order);
    }, 400);
};

function initNavigationMap(order) {
    if (!agentMap) {
        agentMap = L.map('agentMap');
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(agentMap);
        
        // Define icons
        const agentIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41]
        });
        
        const customerIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41]
        });
        
        agentMarker = L.marker([0,0], {icon: agentIcon}).addTo(agentMap);
        customerMarker = L.marker([0,0], {icon: customerIcon}).addTo(agentMap);
    }
    
    // Reset map bounds calculation
    agentMap.invalidateSize();
    
    // Set customer location
    const cLat = parseFloat(order.delivery_lat);
    const cLng = parseFloat(order.delivery_lng);
    customerMarker.setLatLng([cLat, cLng]);
    
    // Set agent location (use current if available, else default near customer)
    let aLat = currentAgentPos ? currentAgentPos.lat : cLat - 0.01;
    let aLng = currentAgentPos ? currentAgentPos.lng : cLng - 0.01;
    agentMarker.setLatLng([aLat, aLng]);
    
    // Fit bounds to show both
    const bounds = L.latLngBounds([ [aLat, aLng], [cLat, cLng] ]);
    agentMap.fitBounds(bounds, { padding: [50, 150] }); // extra padding at bottom for UI
}
