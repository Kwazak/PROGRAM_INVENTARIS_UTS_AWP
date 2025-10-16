// production.js - Production Management Functions

let currentWOId = null;
let currentTrackingWOId = null;
let allWorkOrders = [];
let workOrdersPagination = null;

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    initWorkOrdersPagination(); // Initialize pagination first
    loadWorkOrders();
    loadProductionLines();
    loadProducts();
    setDefaultDates();
});

// Load user info
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.full_name;
        document.getElementById('userRole').textContent = user.role.replace('_', ' ').toUpperCase();
    }
}

// Set default dates (today)
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    document.getElementById('trackingDate').value = today;
    
    // Set due date to 7 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];
}

// Load production lines
async function loadProductionLines() {
    try {
        const response = await fetchAPI('/work-orders/lines/list');
        if (response.success) {
            const lineFilter = document.getElementById('lineFilter');
            const productionLineId = document.getElementById('productionLineId');
            
            lineFilter.innerHTML = '<option value="">All Lines</option>';
            productionLineId.innerHTML = '<option value="">Select Line</option>';
            
            response.data.forEach(line => {
                lineFilter.innerHTML += `<option value="${line.id}">${line.line_name}</option>`;
                productionLineId.innerHTML += `<option value="${line.id}">${line.line_name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading production lines:', error);
    }
}

// Load products
async function loadProducts() {
    try {
        const response = await fetchAPI('/products?status=active');
        if (response.success) {
            const productId = document.getElementById('productId');
            productId.innerHTML = '<option value="">Select Product</option>';
            
            response.data.forEach(product => {
                productId.innerHTML += `<option value="${product.id}">${product.name} (${product.sku_code})</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load work orders with filters
async function loadWorkOrders() {
    try {
        const search = document.getElementById('searchInput').value;
        const status = document.getElementById('statusFilter').value;
        const priority = document.getElementById('priorityFilter').value;
        const line = document.getElementById('lineFilter').value;
        
        let url = '/work-orders?';
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (status) url += `status=${status}&`;
        if (priority) url += `priority=${priority}&`;
        if (line) url += `line=${line}&`;
        
        const response = await fetchAPI(url);
        
        if (response.success) {
            allWorkOrders = response.data;
            displayWorkOrders(response.data);
            updateStats(response.data);
        }
    } catch (error) {
        console.error('Error loading work orders:', error);
        showToast('Failed to load work orders', 'error');
    }
}

// Display work orders in table
function displayWorkOrders(workOrders) {
    // Pagination is already initialized in DOMContentLoaded
    // Set data and display current page
    workOrdersPagination.setData(workOrders);
    const currentPageItems = workOrdersPagination.getCurrentPageItems();
    
    const tbody = document.getElementById('workOrdersTableBody');
    
    if (currentPageItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center">No work orders found</td></tr>';
        return;
    }
    
    tbody.innerHTML = currentPageItems.map(wo => {
        const progress = wo.quantity_planned > 0 ? ((wo.quantity_produced || 0) / wo.quantity_planned * 100).toFixed(1) : 0;
        const statusBadge = getStatusBadge(wo.status);
        const priorityBadge = getPriorityBadge(wo.priority);
        
        const isOverdue = wo.status !== 'completed' && new Date(wo.due_date) < new Date();
        const rowClass = isOverdue ? 'class="overdue-row"' : '';
        
        return `
            <tr ${rowClass}>
                <td><strong>${wo.wo_number}</strong></td>
                <td>${wo.product_name}</td>
                <td>
                    <strong>${wo.quantity_planned}</strong><br>
                    <small class="text-muted">Produced: ${wo.quantity_produced || 0}</small>
                </td>
                <td>
                    <div class="progress-mini">
                        <div class="progress-bar-mini" style="width: ${progress}%"></div>
                    </div>
                    <small>${progress}%</small>
                </td>
                <td>
                    <span class="badge badge-success">${wo.quantity_good || 0}</span> / 
                    <span class="badge badge-danger">${wo.quantity_reject || 0}</span>
                </td>
                <td>${wo.line_name || '-'}</td>
                <td>${priorityBadge}</td>
                <td>${statusBadge}</td>
                <td>${formatDate(wo.start_date)}</td>
                <td>${formatDate(wo.due_date)}</td>
                <td>
                    <div class="action-buttons">
                        <!-- View Details - Always visible -->
                        <button class="btn btn-sm btn-info" onclick="viewDetails(${wo.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        
                        <!-- Edit - ALWAYS VISIBLE for all statuses -->
                        <button class="btn btn-sm btn-warning" onclick="editWO(${wo.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        
                        <!-- Start - Only for pending/draft -->
                        ${wo.status === 'pending' || wo.status === 'draft' ? `
                            <button class="btn btn-sm btn-success" onclick="startWO(${wo.id})" title="Start Production">
                                <i class="fas fa-play"></i>
                            </button>
                        ` : ''}
                        
                        <!-- Add Tracking - Only for in_progress -->
                        ${wo.status === 'in_progress' ? `
                            <button class="btn btn-sm btn-primary" onclick="addTracking(${wo.id}, '${wo.wo_number}', '${wo.product_name}', ${wo.quantity_planned})" title="Add Tracking">
                                <i class="fas fa-clipboard-check"></i>
                            </button>
                            <button class="btn btn-sm btn-success" onclick="completeWO(${wo.id})" title="Complete">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="openQCInspectionDirect(${wo.id}, '${wo.wo_number}', '${wo.product_name}', ${wo.quantity_planned}, ${wo.quantity_reject || 0})" title="QC Inspection">
                                <i class="fas fa-clipboard-check"></i> QC
                            </button>
                        ` : ''}
                        
                        <!-- Cancel - For pending and in_progress -->
                        ${wo.status === 'pending' || wo.status === 'draft' || wo.status === 'in_progress' ? `
                            <button class="btn btn-sm btn-warning" onclick="cancelWO(${wo.id})" title="Cancel">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        
                        <!-- Delete - Always visible (with different states) -->
                        ${wo.status === 'completed' || wo.status === 'cancelled' ? `
                            <button class="btn btn-sm btn-danger" onclick="deleteWO(${wo.id}, '${wo.wo_number}')" title="Delete (Permanent)">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-danger" onclick="deleteWO(${wo.id}, '${wo.wo_number}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Initialize work orders pagination
function initWorkOrdersPagination() {
    workOrdersPagination = new PaginationManager({
        containerId: 'workOrdersPaginationContainer',
        itemsPerPage: 10,
        onPageChange: () => {
            // Reload current data to refresh display
            loadWorkOrders();
        }
    });
}

// Get priority badge
function getPriorityBadge(priority) {
    const badges = {
        'low': '<span class="badge badge-secondary">Low</span>',
        'normal': '<span class="badge badge-info">Normal</span>',
        'high': '<span class="badge badge-warning">High</span>',
        'urgent': '<span class="badge badge-danger">Urgent</span>'
    };
    return badges[priority] || badges['normal'];
}

// Update statistics
function updateStats(workOrders) {
    const activeWO = workOrders.filter(wo => wo.status === 'in_progress').length;
    const pendingWO = workOrders.filter(wo => wo.status === 'pending').length;
    
    // Completed today
    const today = new Date().toISOString().split('T')[0];
    const completedToday = workOrders.filter(wo => {
        if (!wo.completed_date) return false;
        const completedDate = new Date(wo.completed_date).toISOString().split('T')[0];
        return completedDate === today && wo.status === 'completed';
    }).length;
    
    // Today's production
    const todayProduction = workOrders
        .filter(wo => wo.status === 'in_progress')
        .reduce((sum, wo) => sum + (wo.quantity_produced || 0), 0);
    
    document.getElementById('activeWO').textContent = activeWO;
    document.getElementById('completedToday').textContent = completedToday;
    document.getElementById('pendingWO').textContent = pendingWO;
    document.getElementById('todayProduction').textContent = todayProduction;
}

// Search and filter functions
document.getElementById('searchInput').addEventListener('input', debounce(loadWorkOrders, 500));
document.getElementById('statusFilter').addEventListener('change', loadWorkOrders);
document.getElementById('priorityFilter').addEventListener('change', loadWorkOrders);
document.getElementById('lineFilter').addEventListener('change', loadWorkOrders);

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('priorityFilter').value = '';
    document.getElementById('lineFilter').value = '';
    loadWorkOrders();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Modal functions
async function openAddWOModal() {
    currentWOId = null;
    document.getElementById('modalTitle').textContent = 'Create Work Order';
    document.getElementById('woForm').reset();
    setDefaultDates();
    
    // Auto-fill WO Number
    try {
        const response = await fetchAPI('/auto-number/wo-number');
        if (response.success) {
            document.getElementById('woNumber').value = response.number;
            document.getElementById('woNumber').readOnly = true;
        }
    } catch (error) {
        console.error('Error getting WO number:', error);
    }
    
    document.getElementById('woModal').style.display = 'flex';
}

// Edit work order
async function editWO(id) {
    try {
        const response = await fetchAPI(`/work-orders/${id}`);
        if (response.success) {
            const wo = response.data;
            currentWOId = id;
            
            document.getElementById('modalTitle').textContent = 'Edit Work Order';
            document.getElementById('woNumber').value = wo.wo_number;
            document.getElementById('woNumber').readOnly = true;
            document.getElementById('productId').value = wo.product_id;
            document.getElementById('quantityPlanned').value = wo.quantity_planned;
            document.getElementById('productionLineId').value = wo.production_line_id;
            document.getElementById('priority').value = wo.priority;
            document.getElementById('shift').value = wo.shift;
            document.getElementById('startDate').value = wo.start_date;
            document.getElementById('dueDate').value = wo.due_date;
            document.getElementById('notes').value = wo.notes || '';
            
            document.getElementById('woModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading work order:', error);
        showToast('Failed to load work order data', 'error');
    }
}

function closeWOModal() {
    document.getElementById('woModal').style.display = 'none';
    currentWOId = null;
}

// Save work order
document.getElementById('woForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const woData = {
        product_id: parseInt(document.getElementById('productId').value),
        quantity_planned: parseInt(document.getElementById('quantityPlanned').value),
        production_line_id: parseInt(document.getElementById('productionLineId').value),
        priority: document.getElementById('priority').value,
        shift: document.getElementById('shift').value,
        start_date: document.getElementById('startDate').value,
        due_date: document.getElementById('dueDate').value,
        notes: document.getElementById('notes').value || null
    };
    
    try {
        let response;
        if (currentWOId) {
            // Update existing work order
            response = await fetchAPI(`/work-orders/${currentWOId}`, {
                method: 'PUT',
                body: JSON.stringify(woData)
            });
        } else {
            // Create new work order
            response = await fetchAPI('/work-orders', {
                method: 'POST',
                body: JSON.stringify(woData)
            });
        }
        
        if (response.success) {
            showToast(response.message, 'success');
            closeWOModal();
            loadWorkOrders();
        } else {
            showToast(response.message || 'Failed to save work order', 'error');
        }
    } catch (error) {
        console.error('Error saving work order:', error);
        showToast('Failed to save work order', 'error');
    }
});

// Start work order
async function startWO(id) {
    if (!confirm('Start production for this work order?')) {
        return;
    }
    
    try {
        const response = await fetchAPI(`/work-orders/${id}/start`, {
            method: 'POST'
        });
        
        if (response.success) {
            showToast(response.message, 'success');
            loadWorkOrders();
        } else {
            showToast(response.message || 'Failed to start work order', 'error');
        }
    } catch (error) {
        console.error('Error starting work order:', error);
        showToast('Failed to start work order', 'error');
    }
}

// Complete work order
async function completeWO(id) {
    if (!confirm('Mark this work order as completed?')) {
        return;
    }
    
    try {
        const response = await fetchAPI(`/work-orders/${id}/complete`, {
            method: 'POST'
        });
        
        if (response.success) {
            showToast(response.message, 'success');
            loadWorkOrders();
        } else {
            showToast(response.message || 'Failed to complete work order', 'error');
        }
    } catch (error) {
        console.error('Error completing work order:', error);
        showToast('Failed to complete work order', 'error');
    }
}

// Cancel work order
async function cancelWO(id) {
    if (!confirm('Are you sure you want to cancel this work order?')) {
        return;
    }
    
    try {
        const response = await fetchAPI(`/work-orders/${id}/cancel`, {
            method: 'POST'
        });
        
        if (response.success) {
            showToast(response.message, 'success');
            loadWorkOrders();
        } else {
            showToast(response.message || 'Failed to cancel work order', 'error');
        }
    } catch (error) {
        console.error('Error cancelling work order:', error);
        showToast('Failed to cancel work order', 'error');
    }
}

// Delete work order
async function deleteWO(id, woNumber) {
    if (!confirm(`Are you sure you want to DELETE work order ${woNumber}?\n\nThis action cannot be undone!`)) {
        return;
    }
    
    try {
        const response = await fetchAPI(`/work-orders/${id}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showToast(response.message, 'success');
            loadWorkOrders();
        } else {
            showToast(response.message || 'Failed to delete work order', 'error');
        }
    } catch (error) {
        console.error('Error deleting work order:', error);
        showToast('Failed to delete work order', 'error');
    }
}

// Production Tracking Modal
function addTracking(woId, woNumber, productName, quantityPlanned) {
    currentTrackingWOId = woId;
    document.getElementById('trackingWONumber').textContent = woNumber;
    document.getElementById('trackingProduct').textContent = productName;
    document.getElementById('trackingPlanned').textContent = quantityPlanned;
    document.getElementById('trackingForm').reset();
    document.getElementById('trackingDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('trackingModal').style.display = 'flex';
}

function closeTrackingModal() {
    document.getElementById('trackingModal').style.display = 'none';
    currentTrackingWOId = null;
}

// Auto-calculate quantities
document.getElementById('quantityProduced').addEventListener('input', updateRejectQuantity);
document.getElementById('quantityGood').addEventListener('input', updateRejectQuantity);

function updateRejectQuantity() {
    const produced = parseInt(document.getElementById('quantityProduced').value) || 0;
    const good = parseInt(document.getElementById('quantityGood').value) || 0;
    const reject = produced - good;
    document.getElementById('quantityReject').value = reject >= 0 ? reject : 0;
}

// Save tracking
document.getElementById('trackingForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const trackingData = {
        wo_id: currentTrackingWOId,
        tracking_date: document.getElementById('trackingDate').value,
        quantity_produced: parseInt(document.getElementById('quantityProduced').value),
        quantity_good: parseInt(document.getElementById('quantityGood').value),
        quantity_reject: parseInt(document.getElementById('quantityReject').value),
        reject_reason: document.getElementById('rejectReason').value || null,
        shift: document.getElementById('trackingShift').value,
        notes: document.getElementById('trackingNotes').value || null
    };
    
    try {
        // First, save production tracking
        const response = await fetchAPI('/production/tracking', {
            method: 'POST',
            body: JSON.stringify(trackingData)
        });
        
        if (response.success) {
            const trackingId = response.data.id;
            
            // If there are QC inspections, save them
            if (window.qcInspections && window.qcInspections.length > 0) {
                const qcCount = window.qcInspections.length; // Store count before clearing
                
                // Get work order and product info
                const woResponse = await fetchAPI(`/work-orders/${currentTrackingWOId}`);
                const wo = woResponse.data;
                
                // Save each QC inspection
                for (const qc of window.qcInspections) {
                    const qcData = {
                        production_tracking_id: trackingId,
                        work_order_id: currentTrackingWOId,
                        product_id: wo.product_id,
                        product_model: wo.product_name,
                        inspection_date: qc.inspection_date,
                        shift: qc.shift,
                        total_inspected: qc.total_inspected,
                        total_defect: qc.total_defect,
                        defect_rate: qc.defect_rate,
                        decision: qc.decision,
                        inspector: qc.inspector,
                        supervisor: qc.supervisor,
                        notes: qc.notes,
                        defects: qc.defects
                    };
                    
                    await fetchAPI('/api/qc-inspections', {
                        method: 'POST',
                        body: JSON.stringify(qcData)
                    });
                }
                
                // Clear QC inspections after saving
                window.qcInspections = [];
                if (window.updateQCInspectionsList) {
                    window.updateQCInspectionsList();
                }
                
                showToast(`Production tracking and ${qcCount} QC inspection(s) saved successfully!`, 'success');
            } else {
                showToast(response.message, 'success');
            }
            
            closeTrackingModal();
            loadWorkOrders();
        } else {
            showToast(response.message || 'Failed to save tracking', 'error');
        }
    } catch (error) {
        console.error('Error saving tracking:', error);
        showToast('Failed to save tracking', 'error');
    }
});

// View details modal
async function viewDetails(woId) {
    try {
        const response = await fetchAPI(`/work-orders/${woId}`);
        if (response.success) {
            const wo = response.data;
            
            document.getElementById('detailWONumber').textContent = wo.wo_number;
            document.getElementById('detailProduct').textContent = wo.product_name;
            document.getElementById('detailQuantityPlanned').textContent = wo.quantity_planned;
            document.getElementById('detailStatus').innerHTML = getStatusBadge(wo.status);
            document.getElementById('detailPriority').innerHTML = getPriorityBadge(wo.priority);
            document.getElementById('detailLine').textContent = wo.line_name || '-';
            document.getElementById('detailStartDate').textContent = formatDate(wo.start_date);
            document.getElementById('detailDueDate').textContent = formatDate(wo.due_date);
            
            document.getElementById('detailProduced').textContent = wo.quantity_produced || 0;
            document.getElementById('detailGood').textContent = wo.quantity_good || 0;
            document.getElementById('detailReject').textContent = wo.quantity_reject || 0;
            
            const efficiency = wo.quantity_produced > 0 ? ((wo.quantity_good / wo.quantity_produced) * 100).toFixed(2) : 0;
            document.getElementById('detailEfficiency').textContent = efficiency + '%';
            
            const progress = wo.quantity_planned > 0 ? ((wo.quantity_produced / wo.quantity_planned) * 100).toFixed(1) : 0;
            document.getElementById('detailProgressBar').style.width = progress + '%';
            document.getElementById('detailProgressBar').textContent = progress + '%';
            
            // Load tracking history
            loadTrackingHistory(woId);
            
            document.getElementById('detailsModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading work order details:', error);
        showToast('Failed to load details', 'error');
    }
}

async function loadTrackingHistory(woId) {
    try {
        const response = await fetchAPI(`/production/tracking/${woId}`);
        const tbody = document.getElementById('trackingHistoryBody');
        
        if (response && response.success && response.data && response.data.length > 0) {
            tbody.innerHTML = response.data.map(track => `
                <tr>
                    <td>${formatDate(track.tracking_date)}</td>
                    <td>${track.quantity_produced}</td>
                    <td><span class="badge badge-success">${track.quantity_good}</span></td>
                    <td><span class="badge badge-danger">${track.quantity_reject}</span></td>
                    <td>${track.shift}</td>
                    <td>${track.notes || '-'}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No tracking data available</td></tr>';
        }
    } catch (error) {
        console.error('Error loading tracking history:', error);
        const tbody = document.getElementById('trackingHistoryBody');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Unable to load tracking history</td></tr>';
    }
}

function closeDetailsModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

// Open QC Inspection directly from table action
function openQCInspectionDirect(woId, woNumber, productName, quantityPlanned, quantityReject) {
    // Check if QC inspection modal exists
    if (typeof openQCInspectionModal === 'function') {
        // Set up tracking data for QC modal
        if (window.currentTrackingData) {
            window.currentTrackingData.workOrderId = woId;
            window.currentTrackingData.quantityReject = quantityReject;
            window.currentTrackingData.trackingDate = new Date().toISOString().split('T')[0];
            window.currentTrackingData.shift = 1; // Default shift
        }

        // Fill QC modal info
        const qcWONumberElement = document.getElementById('qcWONumber');
        const qcProductElement = document.getElementById('qcProduct');
        const qcPlannedElement = document.getElementById('qcPlanned');
        const qcQuantityRejectElement = document.getElementById('qcQuantityReject');
        const qcMaxInspectElement = document.getElementById('qcMaxInspect');

        if (qcWONumberElement) qcWONumberElement.textContent = woNumber;
        if (qcProductElement) qcProductElement.textContent = productName;
        if (qcPlannedElement) qcPlannedElement.textContent = quantityPlanned;
        if (qcQuantityRejectElement) qcQuantityRejectElement.textContent = quantityReject;
        if (qcMaxInspectElement) qcMaxInspectElement.textContent = quantityReject;

        // Set default values
        const qcInspectionDateElement = document.getElementById('qcInspectionDate');
        const qcShiftElement = document.getElementById('qcShift');
        const qcTotalInspectedElement = document.getElementById('qcTotalInspected');

        if (qcInspectionDateElement) {
            qcInspectionDateElement.value = new Date().toISOString().split('T')[0];
        }
        if (qcShiftElement) {
            qcShiftElement.value = '1';
        }
        if (qcTotalInspectedElement) {
            qcTotalInspectedElement.value = quantityReject;
        }

        // Show QC modal
        const qcModal = document.getElementById('qcInspectionModal');
        if (qcModal) {
            qcModal.style.display = 'flex';
        }
    } else {
        alert('QC Inspection module not loaded. Please refresh the page.');
    }
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const woModal = document.getElementById('woModal');
    const trackingModal = document.getElementById('trackingModal');
    const detailsModal = document.getElementById('detailsModal');
    
    if (event.target === woModal) closeWOModal();
    if (event.target === trackingModal) closeTrackingModal();
    if (event.target === detailsModal) closeDetailsModal();
});

// Export functions for global access
window.openQCInspectionDirect = openQCInspectionDirect;
