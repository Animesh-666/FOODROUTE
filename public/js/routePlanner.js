/**
 * =================================================
 * Route Planner JS
 * =================================================
 * Integrates Leaflet map with backend DAA TSP algorithms.
 */

let map;
let markers = [];
let routePolylines = [];
let globalMapData = null;
let selectedOrderIds = new Set();
let currentOptimizationResult = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isLoggedIn() || Auth.getUser().role !== 'admin') {
        window.location.href = 'admin-login.html';
        return;
    }
    
    initMap();
    loadMapData();
    
    document.getElementById('btnOptimize').addEventListener('click', runOptimization);
});

function initMap() {
    // Center on Delhi roughly
    map = L.map('routingMap').setView([28.6139, 77.2090], 12);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);
}

async function loadMapData() {
    try {
        const res = await ApiClient.get('/routes/map-data');
        globalMapData = res.data;
        
        renderPendingOrdersList();
        drawMapMarkers();
        
    } catch (error) {
        showToast('Failed to load map data', 'error');
    }
}

// Icons
const depotIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const deliveryIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const deliverySelectedIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const agentIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

function drawMapMarkers() {
    // Clear existing
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    
    // Draw Depot
    const depot = globalMapData.depot;
    const mDepot = L.marker([depot.lat, depot.lng], {icon: depotIcon})
        .addTo(map)
        .bindTooltip("<strong>Central Kitchen</strong><br>Start/End point", {permanent: true, direction: 'top'});
    markers.push(mDepot);
    
    // Draw Orders
    globalMapData.orders.forEach(order => {
        if (!order.lat || !order.lng) return;
        
        const isSelected = selectedOrderIds.has(order.id);
        const mOrder = L.marker([order.lat, order.lng], {
            icon: isSelected ? deliverySelectedIcon : deliveryIcon
        }).addTo(map)
          .bindPopup(`<strong>Order #${order.tracking_id}</strong><br>${order.address}<br>Status: ${order.status}`);
          
        mOrder.orderId = order.id; // custom property
        markers.push(mOrder);
    });
    
    // Draw Agents
    globalMapData.agents.forEach(agent => {
        if (!agent.lat || !agent.lng) return;
        const mAgent = L.marker([agent.lat, agent.lng], {icon: agentIcon})
            .addTo(map)
            .bindPopup(`<strong>Agent: ${agent.name}</strong><br>Available`);
        markers.push(mAgent);
    });
    
    // Auto fit bounds if we have markers
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

function renderPendingOrdersList() {
    const list = document.getElementById('pendingOrdersList');
    document.getElementById('pendingCount').textContent = globalMapData.orders.length;
    
    if (globalMapData.orders.length === 0) {
        list.innerHTML = `<div class="text-center p-3 text-muted">No pending orders to route.</div>`;
        return;
    }
    
    list.innerHTML = globalMapData.orders.map(order => `
        <div class="form-check p-2 border-bottom border-secondary" style="background: rgba(255,255,255,0.02);">
            <input class="form-check-input ms-1 me-2 order-checkbox" type="checkbox" value="${order.id}" id="chkOrder${order.id}" onchange="toggleOrderSelection(this)">
            <label class="form-check-label w-100" for="chkOrder${order.id}" style="cursor:pointer">
                <div class="d-flex justify-content-between">
                    <strong>#${order.tracking_id}</strong>
                    <span class="badge ${order.status === 'pending' ? 'bg-warning' : 'bg-info'} text-dark">${order.status}</span>
                </div>
                <small class="text-muted text-truncate d-block" style="max-width:200px" title="${escapeHtml(order.address)}">${escapeHtml(order.address)}</small>
            </label>
        </div>
    `).join('');
}

window.toggleOrderSelection = function(checkbox) {
    const orderId = parseInt(checkbox.value);
    
    if (checkbox.checked) {
        if (selectedOrderIds.size >= 10) {
            showToast('Cannot select more than 10 orders for exact algorithms', 'warning');
            checkbox.checked = false;
            return;
        }
        selectedOrderIds.add(orderId);
    } else {
        selectedOrderIds.delete(orderId);
    }
    
    const btnOpt = document.getElementById('btnOptimize');
    btnOpt.disabled = selectedOrderIds.size === 0;
    btnOpt.innerHTML = `<i class="fa-solid fa-route me-2"></i> Optimize Route (${selectedOrderIds.size})`;
    
    // Update map marker colors
    drawMapMarkers();
}

async function runOptimization() {
    const btnOpt = document.getElementById('btnOptimize');
    btnOpt.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i> Running DAA Algorithms...`;
    btnOpt.disabled = true;
    
    document.getElementById('algorithmResultsPanel').style.display = 'none';
    
    try {
        const orderIds = Array.from(selectedOrderIds);
        const res = await ApiClient.post('/routes/optimize', { order_ids: orderIds });
        
        currentOptimizationResult = res.data;
        renderAlgorithmResults(res.data);
        
        // Draw the best route on map by default
        const bestAlgoResult = res.data.results.find(r => r.algorithm === res.data.bestAlgorithm);
        drawRouteOnMap(bestAlgoResult.path, res.data.locations, 'best');
        
    } catch (error) {
        showToast('Algorithm execution failed', 'error');
    } finally {
        btnOpt.innerHTML = `<i class="fa-solid fa-route me-2"></i> Optimize Route (${selectedOrderIds.size})`;
        btnOpt.disabled = false;
    }
}

function renderAlgorithmResults(data) {
    document.getElementById('algorithmResultsPanel').style.display = 'flex';
    document.getElementById('resBestAlgo').textContent = data.bestAlgorithm;
    document.getElementById('resFastestAlgo').textContent = data.fastestAlgorithm;
    
    const bestRes = data.results.find(r => r.algorithm === data.bestAlgorithm);
    document.getElementById('resTotalDist').textContent = `${parseFloat(bestRes.totalDistance).toFixed(2)} km`;
    
    const accordion = document.getElementById('algoAccordion');
    let html = '';
    
    data.results.forEach((algo, index) => {
        const isBest = algo.algorithm === data.bestAlgorithm;
        const color = isBest ? 'success' : 'secondary';
        
        let pathStr = algo.path.join(' → ');
        
        html += `
            <div class="accordion-item border-0 mb-2 rounded" style="background: var(--glass-bg); border: var(--glass-border) !important;">
                <h2 class="accordion-header" id="heading${index}">
                    <button class="accordion-button ${isBest ? '' : 'collapsed'} border-0" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}" style="background: var(--glass-bg); color: var(--clr-text-primary);">
                        <div class="d-flex justify-content-between w-100 pe-3 align-items-center">
                            <span>${algo.algorithm} ${isBest ? '<i class="fa-solid fa-trophy text-warning ms-2"></i>' : ''}</span>
                            <span class="badge bg-${color}">${parseFloat(algo.totalDistance).toFixed(1)} km</span>
                        </div>
                    </button>
                </h2>
                <div id="collapse${index}" class="accordion-collapse collapse ${isBest ? 'show' : ''}" data-bs-parent="#algoAccordion">
                    <div class="accordion-body border-top small pt-2" style="background: var(--glass-bg); color: var(--clr-text-primary); border-color: var(--clr-border) !important;">
                        <div class="d-flex justify-content-between mb-1">
                            <span style="color: var(--clr-text-muted);">Complexity:</span> <code>${algo.complexity}</code>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span style="color: var(--clr-text-muted);">Exec Time:</span> <span>${parseFloat(algo.executionTime).toFixed(3)} ms</span>
                        </div>
                        <div class="mb-2">
                            <span style="color: var(--clr-text-muted);" class="d-block mb-1">Path sequence (indices):</span>
                            <div class="p-1 px-2 rounded font-monospace" style="background: rgba(0,0,0,0.3); font-size:11px; color: var(--clr-text-primary);">${pathStr}</div>
                        </div>
                        <button class="btn btn-sm btn-outline-info w-100" onclick="previewRoute(${index})">
                            <i class="fa-solid fa-eye me-1"></i> Preview this path on map
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    accordion.innerHTML = html;
}

window.previewRoute = function(algoIndex) {
    if (!currentOptimizationResult) return;
    const algoResult = currentOptimizationResult.results[algoIndex];
    drawRouteOnMap(algoResult.path, currentOptimizationResult.locations, 'preview');
}

function drawRouteOnMap(pathIndices, locations, mode) {
    // Clear previous polylines
    routePolylines.forEach(p => map.removeLayer(p));
    routePolylines = [];
    
    const latlngs = [];
    
    // Path indices correspond to locations array
    pathIndices.forEach(idx => {
        const loc = locations[idx];
        if (loc) {
            latlngs.push([loc.lat, loc.lng]);
        }
    });
    
    // Draw the polyline
    const color = mode === 'best' ? '#10b981' : '#0ea5e9'; // green for best, blue for preview
    
    const polyline = L.polyline(latlngs, {
        color: color,
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10', // dotted line to represent direct haversine distance
        lineJoin: 'round'
    }).addTo(map);
    
    routePolylines.push(polyline);
    
    // Fit bounds to polyline
    map.fitBounds(polyline.getBounds().pad(0.1));
}

// -------------------------
// Assignment Modal logic
// -------------------------
document.getElementById('btnAssignRoute').addEventListener('click', () => {
    if (!currentOptimizationResult) return;
    
    // Populate Agents
    const agentSelect = document.getElementById('selectAgentForRoute');
    let agentHtml = '<option value="">Select an agent...</option>';
    
    if (globalMapData.agents.length === 0) {
        agentHtml = '<option value="" disabled>No available agents right now.</option>';
    } else {
        globalMapData.agents.forEach(agent => {
            agentHtml += `<option value="${agent.id}">${agent.name}</option>`;
        });
    }
    
    agentSelect.innerHTML = agentHtml;
    document.getElementById('modalOrdersCount').textContent = selectedOrderIds.size;
    
    const modal = new bootstrap.Modal(document.getElementById('assignAgentModal'));
    modal.show();
    
    // Confirm dispatch
    document.getElementById('confirmAssignBtn').onclick = async () => {
        const agentId = document.getElementById('selectAgentForRoute').value;
        if (!agentId) {
            showToast('Please select a delivery agent', 'warning');
            return;
        }
        
        try {
            document.getElementById('confirmAssignBtn').disabled = true;
            document.getElementById('confirmAssignBtn').innerHTML = '<span class="spinner-border spinner-border-sm"></span> Dispatching...';
            
            // In a real app, this would hit a new endpoint: POST /api/routes/dispatch
            // For now, we update orders to 'out_for_delivery' and assign agent individually
            
            // HACK: Simulating dispatch by hitting order update endpoint for each selected order
            const orderIds = Array.from(selectedOrderIds);
            for(let id of orderIds) {
                await ApiClient.put(`/orders/${id}/assign`, { agent_id: agentId });
                await ApiClient.put(`/orders/${id}/status`, { status: 'out_for_delivery' });
            }
            
            modal.hide();
            showToast(`Route successfully dispatched to agent!`, 'success');
            
            // Reset UI
            selectedOrderIds.clear();
            document.getElementById('algorithmResultsPanel').style.display = 'none';
            document.getElementById('btnOptimize').innerHTML = `<i class="fa-solid fa-route me-2"></i> Optimize Route`;
            document.getElementById('btnOptimize').disabled = true;
            
            // Clear polyline
            routePolylines.forEach(p => map.removeLayer(p));
            routePolylines = [];
            
            // Reload data
            loadMapData();
            
        } catch(e) {
            showToast('Failed to dispatch route', 'error');
        } finally {
            document.getElementById('confirmAssignBtn').disabled = false;
            document.getElementById('confirmAssignBtn').innerHTML = 'Dispatch Route';
        }
    };
});
