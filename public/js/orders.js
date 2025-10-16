// orders.js - Sales Order Management Functions

let currentOrderId = null;
let currentStatusOrderId = null;
let allOrders = [];
let allProducts = [];
let orderItems = [];

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    loadOrders();
    loadCustomers();
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

// Set default dates
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('orderDate').value = today;
    
    // Set delivery date to 7 days from now
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    document.getElementById('deliveryDate').value = deliveryDate.toISOString().split('T')[0];
}

// Load customers
async function loadCustomers() {
    try {
        const response = await fetchAPI('/customers');
        if (response.success) {
            const customerFilter = document.getElementById('customerFilter');
            const customerId = document.getElementById('customerId');
            
            customerFilter.innerHTML = '<option value="">All Customers</option>';
            customerId.innerHTML = '<option value="">Select Customer</option>';
            
            response.data.forEach(customer => {
                // Use company_name or fallback to customer_name for compatibility
                const displayName = customer.company_name || customer.customer_name || customer.name || 'Unknown';
                customerFilter.innerHTML += `<option value="${customer.id}">${displayName}</option>`;
                customerId.innerHTML += `<option value="${customer.id}">${displayName}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// Load products
async function loadProducts() {
    try {
        const response = await fetchAPI('/products?status=active');
        if (response.success) {
            allProducts = response.data;
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load sales orders with filters
async function loadOrders() {
    try {
        const search = document.getElementById('searchInput').value;
        const status = document.getElementById('statusFilter').value;
        const payment = document.getElementById('paymentFilter').value;
        const customer = document.getElementById('customerFilter').value;
        
        let url = '/sales-orders?';
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (status) url += `status=${status}&`;
        if (payment) url += `payment=${payment}&`;
        if (customer) url += `customer=${customer}&`;
        
        const response = await fetchAPI(url);
        
        if (response.success) {
            allOrders = response.data;
            displayOrders(response.data);
            updateStats(response.data);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Failed to load orders', 'error');
    }
}

// Display orders in table
function displayOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No orders found</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => {
        const statusBadge = getStatusBadge(order.status);
        const paymentBadge = getPaymentBadge(order.payment_status);
        
        // Escape single quotes in SO number for onclick
        const safeSONumber = (order.so_number || '').replace(/'/g, "\\'");
        
        return `
            <tr>
                <td><strong>${order.so_number}</strong></td>
                <td>${order.customer_name || order.company_name || '-'}</td>
                <td>${formatDate(order.order_date)}</td>
                <td>${formatDate(order.delivery_date)}</td>
                <td><strong>${formatCurrency(order.total_amount)}</strong></td>
                <td>${statusBadge}</td>
                <td>${paymentBadge}</td>
                <td>
                    <div class="action-buttons">
                        <!-- View Details Button - Always visible -->
                        <button class="btn btn-sm btn-info" onclick="handleViewDetails(${order.id})" title="View Details" type="button">
                            <i class="fas fa-eye"></i>
                        </button>
                        
                        <!-- Update Status Button - Not for delivered/cancelled -->
                        ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
                        <button class="btn btn-sm btn-primary" onclick="handleUpdateStatus(${order.id}, '${safeSONumber}')" title="Update Status" type="button">
                            <i class="fas fa-edit"></i>
                        </button>
                        ` : ''}
                        
                        <!-- Confirm Order Button - Only for pending -->
                        ${order.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="handleConfirmOrder(${order.id})" title="Confirm Order" type="button">
                            <i class="fas fa-check"></i>
                        </button>
                        ` : ''}
                        
                        <!-- Create Shipment Button - For confirmed/processing -->
                        ${order.status === 'confirmed' || order.status === 'processing' ? `
                        <button class="btn btn-sm btn-warning" onclick="handleCreateShipment(${order.id})" title="Create Shipment" type="button">
                            <i class="fas fa-truck"></i>
                        </button>
                        ` : ''}
                        
                        <!-- Cancel Order Button - Only for pending -->
                        ${order.status === 'pending' ? `
                        <button class="btn btn-sm btn-danger" onclick="handleCancelOrder(${order.id})" title="Cancel Order" type="button">
                            <i class="fas fa-times"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Get payment status badge
function getPaymentBadge(status) {
    const badges = {
        'unpaid': '<span class="badge badge-danger">Unpaid</span>',
        'partial': '<span class="badge badge-warning">Partial</span>',
        'paid': '<span class="badge badge-success">Paid</span>'
    };
    return badges[status] || badges['unpaid'];
}

// Update statistics
function updateStats(orders) {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    
    // Completed today
    const today = new Date().toISOString().split('T')[0];
    const completedToday = orders.filter(o => {
        if (!o.delivered_date) return false;
        const deliveredDate = new Date(o.delivered_date).toISOString().split('T')[0];
        return deliveredDate === today && o.status === 'delivered';
    }).length;
    
    // Total revenue
    const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => {
            const amount = parseFloat(o.total_amount) || 0;
            return sum + amount;
        }, 0);
    
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('completedToday').textContent = completedToday;
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
}

// Search and filter functions
document.getElementById('searchInput').addEventListener('input', debounce(loadOrders, 500));
document.getElementById('statusFilter').addEventListener('change', loadOrders);
document.getElementById('paymentFilter').addEventListener('change', loadOrders);
document.getElementById('customerFilter').addEventListener('change', loadOrders);

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('paymentFilter').value = '';
    document.getElementById('customerFilter').value = '';
    loadOrders();
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

// Order Items Management
function addOrderItem() {
    const itemRow = document.createElement('tr');
    itemRow.innerHTML = `
        <td>
            <select class="form-control item-product" onchange="updateItemPrice(this)" aria-label="Select product">
                <option value="">Select Product</option>
                ${allProducts.map(p => `<option value="${p.id}" data-price="${p.unit_price}" data-stock="${p.current_stock || 0}">${p.name} (${p.sku_code})</option>`).join('')}
            </select>
        </td>
        <td>
            <div class="stock-indicator">
                <span class="stock-value">-</span>
                <small class="stock-label">units available</small>
            </div>
        </td>
        <td>
            <input type="number" class="form-control item-quantity" value="1" min="1" onchange="calculateItemTotal(this)">
        </td>
        <td>
            <input type="number" class="form-control item-price" value="0" readonly>
        </td>
        <td>
            <input type="number" class="form-control item-discount" value="0" min="0" onchange="calculateItemTotal(this)">
        </td>
        <td class="item-subtotal">Rp 0</td>
        <td>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeOrderItem(this)">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    document.getElementById('orderItemsBody').appendChild(itemRow);
}

function removeOrderItem(button) {
    button.closest('tr').remove();
    calculateOrderTotal();
}

function updateItemPrice(select) {
    const row = select.closest('tr');
    const selectedOption = select.options[select.selectedIndex];
    const price = selectedOption.dataset.price || 0;
    const stock = selectedOption.dataset.stock || 0;
    
    // Update price
    row.querySelector('.item-price').value = price;
    
    // Update stock indicator
    const stockIndicator = row.querySelector('.stock-indicator');
    const stockValue = row.querySelector('.stock-value');
    const quantityInput = row.querySelector('.item-quantity');
    
    if (select.value) {
        stockValue.textContent = stock;
        
        // Add color coding based on stock level
        stockIndicator.classList.remove('stock-low', 'stock-medium', 'stock-good', 'stock-out');
        if (stock == 0) {
            stockIndicator.classList.add('stock-out');
        } else if (stock < 10) {
            stockIndicator.classList.add('stock-low');
        } else if (stock < 50) {
            stockIndicator.classList.add('stock-medium');
        } else {
            stockIndicator.classList.add('stock-good');
        }
        
        // Set max quantity based on stock
        quantityInput.max = stock;
        if (parseInt(quantityInput.value) > stock) {
            quantityInput.value = stock;
        }
    } else {
        stockValue.textContent = '-';
        stockIndicator.classList.remove('stock-low', 'stock-medium', 'stock-good', 'stock-out');
        quantityInput.removeAttribute('max');
    }
    
    calculateItemTotal(select);
}

function calculateItemTotal(element) {
    const row = element.closest('tr');
    const quantityInput = row.querySelector('.item-quantity');
    const quantity = parseFloat(quantityInput.value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const discount = parseFloat(row.querySelector('.item-discount').value) || 0;
    
    // Validate quantity against stock
    const maxStock = parseInt(quantityInput.max);
    if (maxStock && quantity > maxStock) {
        quantityInput.value = maxStock;
        showToast(`Quantity adjusted to available stock: ${maxStock}`, 'warning');
        return calculateItemTotal(element); // Recalculate with adjusted value
    }
    
    const subtotal = (quantity * price) - discount;
    row.querySelector('.item-subtotal').textContent = formatCurrency(subtotal);
    
    calculateOrderTotal();
}

function calculateOrderTotal() {
    let total = 0;
    document.querySelectorAll('.item-subtotal').forEach(cell => {
        const value = cell.textContent.replace(/[^\d]/g, '');
        total += parseFloat(value) || 0;
    });
    document.getElementById('orderTotalAmount').textContent = formatCurrency(total);
}

// Modal functions
async function openAddOrderModal() {
    currentOrderId = null;
    document.getElementById('modalTitle').textContent = 'Create Sales Order';
    document.getElementById('orderForm').reset();
    document.getElementById('orderItemsBody').innerHTML = '';
    setDefaultDates();
    addOrderItem(); // Add first item row
    
    // Auto-fill SO Number
    try {
        const response = await fetchAPI('/auto-number/so-number');
        if (response.success) {
            document.getElementById('soNumber').value = response.number;
            document.getElementById('soNumber').readOnly = true;
        }
    } catch (error) {
        console.error('Error getting SO number:', error);
    }
    
    document.getElementById('orderModal').style.display = 'flex';
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
    currentOrderId = null;
}

// Save order
document.getElementById('orderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Collect order items
    const items = [];
    document.querySelectorAll('#orderItemsBody tr').forEach(row => {
        const productId = row.querySelector('.item-product').value;
        const quantity = parseInt(row.querySelector('.item-quantity').value);
        const unitPrice = parseFloat(row.querySelector('.item-price').value);
        const discount = parseFloat(row.querySelector('.item-discount').value) || 0;
        
        if (productId && quantity > 0) {
            items.push({
                product_id: parseInt(productId),
                quantity: quantity,
                unit_price: unitPrice,
                discount: discount
            });
        }
    });
    
    if (items.length === 0) {
        showToast('Please add at least one order item', 'error');
        return;
    }
    
    const orderData = {
        // so_number removed - backend will auto-generate
        customer_id: parseInt(document.getElementById('customerId').value),
        order_date: document.getElementById('orderDate').value,
        delivery_date: document.getElementById('deliveryDate').value,
        items: items,
        shipping_address: document.getElementById('shippingAddress').value,
        notes: document.getElementById('notes').value || null
    };
    
    try {
        const response = await fetchAPI('/sales-orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        
        if (response.success) {
            showToast(response.message, 'success');
            closeOrderModal();
            loadOrders();
        } else {
            showToast(response.message || 'Failed to create order', 'error');
        }
    } catch (error) {
        console.error('Error creating order:', error);
        showToast('Failed to create order', 'error');
    }
});

// ========================================
// BUTTON CLICK HANDLERS (with error handling)
// ========================================

// View Details Handler
function handleViewDetails(orderId) {
    console.log('View Details clicked for order ID:', orderId);
    try {
        viewOrderDetails(orderId);
    } catch (error) {
        console.error('Error in handleViewDetails:', error);
        showToast('Failed to view order details', 'error');
    }
}

// Update Status Handler
function handleUpdateStatus(orderId, soNumber) {
    console.log('Update Status clicked for order ID:', orderId, 'SO:', soNumber);
    try {
        updateOrderStatus(orderId, soNumber);
    } catch (error) {
        console.error('Error in handleUpdateStatus:', error);
        showToast('Failed to open update status modal', 'error');
    }
}

// Create Shipment Handler
function handleCreateShipment(orderId) {
    console.log('Create Shipment clicked for order ID:', orderId);
    try {
        createShipment(orderId);
    } catch (error) {
        console.error('Error in handleCreateShipment:', error);
        showToast('Failed to open shipment modal', 'error');
    }
}

// Confirm Order Handler
function handleConfirmOrder(orderId) {
    console.log('Confirm Order clicked for order ID:', orderId);
    try {
        confirmOrder(orderId);
    } catch (error) {
        console.error('Error in handleConfirmOrder:', error);
        showToast('Failed to confirm order', 'error');
    }
}

// Cancel Order Handler
function handleCancelOrder(orderId) {
    console.log('Cancel Order clicked for order ID:', orderId);
    try {
        cancelOrder(orderId);
    } catch (error) {
        console.error('Error in handleCancelOrder:', error);
        showToast('Failed to cancel order', 'error');
    }
}

// ========================================
// CONFIRM AND CANCEL FUNCTIONS
// ========================================

// Confirm order
async function confirmOrder(id) {
    if (!confirm('Confirm this sales order?')) {
        return;
    }
    
    try {
        const response = await fetchAPI(`/sales-orders/${id}/confirm`, {
            method: 'POST'
        });
        
        if (response.success) {
            showToast(response.message, 'success');
            loadOrders();
        } else {
            showToast(response.message || 'Failed to confirm order', 'error');
        }
    } catch (error) {
        console.error('Error confirming order:', error);
        showToast('Failed to confirm order', 'error');
    }
}

// Cancel order
async function cancelOrder(id) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }
    
    try {
        const response = await fetchAPI(`/sales-orders/${id}/cancel`, {
            method: 'POST'
        });
        
        if (response.success) {
            showToast(response.message, 'success');
            loadOrders();
        } else {
            showToast(response.message || 'Failed to cancel order', 'error');
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        showToast('Failed to cancel order', 'error');
    }
}

// ========================================
// UPDATE STATUS MODAL FUNCTIONS
// ========================================

// Update status modal
function updateOrderStatus(id, soNumber) {
    console.log('Opening status modal for order:', id, soNumber);
    
    try {
        // Get modal element
        const modal = document.getElementById('statusModal');
        if (!modal) {
            throw new Error('Status modal not found in DOM');
        }
        
        // Reset ALL modal fields first
        const form = document.getElementById('statusForm');
        if (form) form.reset();
        
        const soNumberElement = document.getElementById('statusSONumber');
        if (soNumberElement) soNumberElement.textContent = '';
        
        const statusSelect = document.getElementById('newStatus');
        if (statusSelect) statusSelect.value = '';
        
        const paymentStatusSelect = document.getElementById('newPaymentStatus');
        if (paymentStatusSelect) paymentStatusSelect.value = 'unpaid';
        
        const notesField = document.getElementById('statusNotes');
        if (notesField) notesField.value = '';
        
        // Load current order data to pre-fill payment status
        loadCurrentOrderStatus(id);
        
        // Set new values
        currentStatusOrderId = id;
        if (soNumberElement) {
            soNumberElement.textContent = soNumber || 'N/A';
        }
        
        // Show modal
        modal.style.display = 'flex';
        console.log('Status modal opened successfully');
        
        // Focus on status select
        if (statusSelect) {
            setTimeout(() => statusSelect.focus(), 100);
        }
    } catch (error) {
        console.error('Error opening status modal:', error);
        showToast('Failed to open status modal: ' + error.message, 'error');
    }
}

// Load current order status to pre-fill form
async function loadCurrentOrderStatus(orderId) {
    try {
        const order = allOrders.find(o => o.id === orderId);
        if (order) {
            const statusSelect = document.getElementById('newStatus');
            if (statusSelect) statusSelect.value = order.status || '';
            
            const paymentStatusSelect = document.getElementById('newPaymentStatus');
            if (paymentStatusSelect) paymentStatusSelect.value = order.payment_status || 'unpaid';
        }
    } catch (error) {
        console.error('Error loading current order status:', error);
    }
}

function closeStatusModal() {
    console.log('Closing status modal');
    
    try {
        // Reset form and clear all fields
        const form = document.getElementById('statusForm');
        if (form) form.reset();
        
        const soNumberElement = document.getElementById('statusSONumber');
        if (soNumberElement) soNumberElement.textContent = '';
        
        const statusSelect = document.getElementById('newStatus');
        if (statusSelect) statusSelect.value = '';
        
        const notesField = document.getElementById('statusNotes');
        if (notesField) notesField.value = '';
        
        // Hide modal
        const modal = document.getElementById('statusModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        currentStatusOrderId = null;
        console.log('Status modal closed');
    } catch (error) {
        console.error('Error closing status modal:', error);
    }
}

// Save status update
document.getElementById('statusForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const statusData = {
        status: document.getElementById('newStatus').value,
        payment_status: document.getElementById('newPaymentStatus').value,
        notes: document.getElementById('statusNotes').value || null
    };
    
    try {
        const response = await fetchAPI(`/sales-orders/${currentStatusOrderId}`, {
            method: 'PUT',
            body: JSON.stringify(statusData)
        });
        
        if (response.success) {
            showToast('Order status and payment status updated successfully', 'success');
            closeStatusModal();
            loadOrders();
        } else {
            showToast(response.message || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Failed to update status', 'error');
    }
});

// ========================================
// VIEW ORDER DETAILS MODAL
// ========================================

// View order details
async function viewOrderDetails(orderId) {
    console.log('Loading order details for ID:', orderId);
    
    try {
        // Store current order ID globally for action buttons
        currentOrderId = orderId;
        
        // Get modal element
        const modal = document.getElementById('detailsModal');
        if (!modal) {
            throw new Error('Details modal not found in DOM');
        }
        
        // Reset all modal fields first
        const fields = [
            'detailSONumber', 'detailCustomer', 'detailCustomerPhone', 'detailCustomerEmail',
            'detailOrderDate', 'detailDeliveryDate', 'detailStatus', 'detailPaymentStatus',
            'detailShippingAddress', 'detailNotes', 'detailTotalAmount', 'printSONumber'
        ];
        
        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                if (fieldId.includes('Status')) {
                    element.innerHTML = '';
                } else {
                    element.textContent = '';
                }
            }
        });
        
        // Clear items table
        const tbody = document.getElementById('detailItemsBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';
        }
        
        // Fetch order data
        const response = await fetchAPI(`/sales-orders/${orderId}`);
        if (response.success) {
            const order = response.data;
            
            // Set order values
            document.getElementById('detailSONumber').textContent = order.so_number;
            document.getElementById('printSONumber').textContent = order.so_number;
            document.getElementById('detailCustomer').textContent = order.customer_name || order.company_name || '-';
            document.getElementById('detailCustomerPhone').textContent = order.customer_phone || '-';
            document.getElementById('detailCustomerEmail').textContent = order.customer_email || '-';
            document.getElementById('detailOrderDate').textContent = formatDate(order.order_date);
            document.getElementById('detailDeliveryDate').textContent = formatDate(order.delivery_date);
            document.getElementById('detailStatus').innerHTML = getStatusBadge(order.status);
            document.getElementById('detailPaymentStatus').innerHTML = getPaymentBadge(order.payment_status);
            document.getElementById('detailShippingAddress').textContent = order.shipping_address || '-';
            document.getElementById('detailNotes').textContent = order.notes || '-';
            
            // Load order items
            loadOrderItems(orderId);
            
            // Show/hide action buttons based on status
            updateActionButtons(order.status);
            
            // Show modal
            document.getElementById('detailsModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        showToast('Failed to load order details', 'error');
    }
}

// Update action buttons visibility based on order status
function updateActionButtons(status) {
    const btnUpdateStatus = document.getElementById('btnUpdateStatus');
    const btnCreateShipment = document.getElementById('btnCreateShipment');
    
    // Always show update status button
    if (btnUpdateStatus) {
        btnUpdateStatus.style.display = 'flex';
    }
    
    // Show create shipment only for certain statuses
    if (btnCreateShipment) {
        const validStatuses = ['confirmed', 'processing', 'packed'];
        if (validStatuses.includes(status.toLowerCase())) {
            btnCreateShipment.style.display = 'flex';
        } else {
            btnCreateShipment.style.display = 'none';
        }
    }
}

async function loadOrderItems(orderId) {
    try {
        const response = await fetchAPI(`/sales-orders/${orderId}/items`);
        const tbody = document.getElementById('detailItemsBody');
        
        if (response.success && response.data.length > 0) {
            let totalAmount = 0;
            
            tbody.innerHTML = response.data.map((item, index) => {
                const subtotal = (item.quantity * item.unit_price) - (item.discount || 0);
                totalAmount += subtotal;
                
                return `
                    <tr>
                        <td style="text-align: center;">${index + 1}</td>
                        <td>${item.product_name}</td>
                        <td>${item.sku_code || '-'}</td>
                        <td style="text-align: right;">${item.quantity}</td>
                        <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
                        <td style="text-align: right;">${formatCurrency(item.discount || 0)}</td>
                        <td style="text-align: right;"><strong>${formatCurrency(subtotal)}</strong></td>
                    </tr>
                `;
            }).join('');
            
            document.getElementById('detailTotalAmount').textContent = formatCurrency(totalAmount);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No items found</td></tr>';
            document.getElementById('detailTotalAmount').textContent = formatCurrency(0);
        }
    } catch (error) {
        console.error('Error loading order items:', error);
    }
}

function closeDetailsModal() {
    // Reset all fields
    document.getElementById('detailSONumber').textContent = '';
    document.getElementById('detailCustomer').textContent = '';
    document.getElementById('detailOrderDate').textContent = '';
    document.getElementById('detailDeliveryDate').textContent = '';
    document.getElementById('detailStatus').innerHTML = '';
    document.getElementById('detailPaymentStatus').innerHTML = '';
    document.getElementById('detailShippingAddress').textContent = '';
    document.getElementById('detailNotes').textContent = '';
    document.getElementById('detailTotalAmount').textContent = '';
    
    // Clear items table
    const tbody = document.getElementById('detailItemsBody');
    tbody.innerHTML = '';
    
    // Hide modal
    document.getElementById('detailsModal').style.display = 'none';
}

// ========================================
// CREATE SHIPMENT MODAL
// ========================================

// Create shipment
async function createShipment(orderId) {
    console.log('Creating shipment for order ID:', orderId);
    
    try {
        // Get modal element
        const modal = document.getElementById('shipmentModal');
        if (!modal) {
            throw new Error('Shipment modal not found in DOM');
        }
        
        // Reset form and all fields first
        const form = document.getElementById('shipmentForm');
        if (form) form.reset();
        
        const fields = [
            'shipmentOrderId', 'shipmentSONumber', 'shipmentCustomer',
            'shipmentAddress', 'shipmentNumber', 'shipmentCarrier',
            'trackingNumber', 'shipmentDate', 'estimatedDelivery', 'shipmentNotes'
        ];
        
        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) element.value = '';
        });
        
        // Load order details
        console.log('Fetching order details...');
        const response = await fetchAPI(`/sales-orders/${orderId}`);
        if (!response.success) {
            throw new Error(response.message || 'Failed to load order details');
        }
        
        const order = response.data;
        console.log('Order details loaded:', order);
        
        // Set order info
        const orderIdField = document.getElementById('shipmentOrderId');
        if (orderIdField) orderIdField.value = orderId;
        
        const soNumberField = document.getElementById('shipmentSONumber');
        if (soNumberField) soNumberField.value = order.so_number || '';
        
    const customerField = document.getElementById('shipmentCustomer');
    if (customerField) customerField.value = order.customer_name || order.company_name || '';
        
        const addressField = document.getElementById('shipmentAddress');
        if (addressField) addressField.value = order.shipping_address || '';
        
        // Auto-fill shipment number
        console.log('Getting shipment number...');
        try {
            const shipmentNumResponse = await fetchAPI('/auto-number/shipment-number');
            if (shipmentNumResponse.success) {
                const shipmentNumberField = document.getElementById('shipmentNumber');
                if (shipmentNumberField) {
                    shipmentNumberField.value = shipmentNumResponse.number;
                    shipmentNumberField.readOnly = true;
                }
                console.log('Shipment number:', shipmentNumResponse.number);
            }
        } catch (error) {
            console.error('Error getting shipment number:', error);
        }
        
        // Set default shipment date to today
        const today = new Date().toISOString().split('T')[0];
        const shipmentDateField = document.getElementById('shipmentDate');
        if (shipmentDateField) shipmentDateField.value = today;
        
        // Show modal
        modal.style.display = 'flex';
        console.log('Shipment modal opened successfully');
        
        // Focus on carrier select
        const carrierField = document.getElementById('shipmentCarrier');
        if (carrierField) {
            setTimeout(() => carrierField.focus(), 100);
        }
        
    } catch (error) {
        console.error('Error creating shipment:', error);
        showToast('Failed to open shipment modal: ' + error.message, 'error');
    }
}

function closeShipmentModal() {
    console.log('Closing shipment modal');
    
    try {
        // Reset form
        const form = document.getElementById('shipmentForm');
        if (form) form.reset();
        
        // Clear all fields
        const fields = [
            'shipmentOrderId', 'shipmentSONumber', 'shipmentCustomer',
            'shipmentAddress', 'shipmentNumber', 'shipmentCarrier',
            'trackingNumber', 'shipmentDate', 'estimatedDelivery', 'shipmentNotes'
        ];
        
        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) element.value = '';
        });
        
        // Reset readonly state
        const shipmentNumberField = document.getElementById('shipmentNumber');
        if (shipmentNumberField) shipmentNumberField.readOnly = false;
        
        // Hide modal
        const modal = document.getElementById('shipmentModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        console.log('Shipment modal closed');
    } catch (error) {
        console.error('Error closing shipment modal:', error);
    }
}

// Save shipment
document.getElementById('shipmentForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const shipmentData = {
        order_id: parseInt(document.getElementById('shipmentOrderId').value),
        // shipment_number will be auto-generated by backend
        carrier: document.getElementById('shipmentCarrier').value,
        tracking_number: document.getElementById('trackingNumber').value || null,
        shipment_date: document.getElementById('shipmentDate').value,
        estimated_delivery: document.getElementById('estimatedDelivery').value || null,
        shipping_address: document.getElementById('shipmentAddress').value,
        notes: document.getElementById('shipmentNotes').value || null
    };
    
    try {
        const response = await fetchAPI('/shipments', {
            method: 'POST',
            body: JSON.stringify(shipmentData)
        });
        
        if (response.success) {
            showToast('Shipment created successfully', 'success');
            closeShipmentModal();
            loadOrders(); // Refresh orders list
        } else {
            showToast(response.message || 'Failed to create shipment', 'error');
        }
    } catch (error) {
        console.error('Error saving shipment:', error);
        showToast('Failed to save shipment', 'error');
    }
});

// ==========================================
// PRINT ORDER FUNCTION
// ==========================================
function printOrder() {
    try {
        // Set print date
        const printDateElement = document.getElementById('printDate');
        if (printDateElement) {
            const now = new Date();
            printDateElement.textContent = now.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Also update printSONumber
        const soNumber = document.getElementById('detailSONumber').textContent;
        const printSONumber = document.getElementById('printSONumber');
        if (printSONumber) {
            printSONumber.textContent = soNumber;
        }

        // Trigger print dialog
        window.print();
        
        showToast('Print dialog opened', 'info');
    } catch (error) {
        console.error('Error printing order:', error);
        showToast('Failed to print order', 'error');
    }
}

// ==========================================
// OPEN MODALS FROM DETAILS
// ==========================================

// Open Update Status modal from order details
function openStatusModalFromDetails() {
    const soNumber = document.getElementById('detailSONumber').textContent;
    const currentStatus = document.getElementById('detailStatus').textContent.trim();
    
    // Find the order ID from the current displayed order
    const order = allOrders.find(o => o.so_number === soNumber);
    if (!order) {
        showToast('Order not found', 'error');
        return;
    }
    
    // Set the order ID for status update
    currentStatusOrderId = order.id;
    
    // Populate status modal
    document.getElementById('statusSONumber').textContent = soNumber;
    document.getElementById('newStatus').value = '';
    document.getElementById('statusNotes').value = '';
    
    // Show status modal
    document.getElementById('statusModal').style.display = 'flex';
}

// Open Create Shipment modal from order details
function openShipmentModalFromDetails() {
    const soNumber = document.getElementById('detailSONumber').textContent;
    const customerName = document.getElementById('detailCustomer').textContent;
    const shippingAddress = document.getElementById('detailShippingAddress').textContent;
    
    // Find the order ID from the current displayed order
    const order = allOrders.find(o => o.so_number === soNumber);
    if (!order) {
        showToast('Order not found', 'error');
        return;
    }
    
    // Check if order status allows shipment creation
    const validStatuses = ['confirmed', 'processing', 'packed'];
    if (!validStatuses.includes(order.status.toLowerCase())) {
        showToast(`Cannot create shipment for orders with status: ${order.status}. Order must be Confirmed, Processing, or Packed.`, 'warning');
        return;
    }
    
    // Populate shipment modal
    document.getElementById('shipmentOrderId').value = order.id;
    document.getElementById('shipmentSONumber').value = soNumber;
    document.getElementById('shipmentCustomer').value = customerName;
    document.getElementById('shipmentAddress').value = shippingAddress !== '-' ? shippingAddress : '';
    
    // Set default shipment date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('shipmentDate').value = today;
    
    // Set estimated delivery to 3 days from now
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 3);
    document.getElementById('estimatedDelivery').value = estimatedDate.toISOString().split('T')[0];
    
    // Clear other fields
    document.getElementById('shipmentCarrier').value = '';
    document.getElementById('trackingNumber').value = '';
    document.getElementById('shipmentNotes').value = '';
    
    // Generate shipment number placeholder
    const shipmentNumber = `SHP-${Date.now().toString().slice(-8)}`;
    document.getElementById('shipmentNumber').value = shipmentNumber;
    
    // Show shipment modal
    document.getElementById('shipmentModal').style.display = 'flex';
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const orderModal = document.getElementById('orderModal');
    const detailsModal = document.getElementById('detailsModal');
    const statusModal = document.getElementById('statusModal');
    const shipmentModal = document.getElementById('shipmentModal');
    
    if (event.target === orderModal) closeOrderModal();
    if (event.target === detailsModal) closeDetailsModal();
    if (event.target === statusModal) closeStatusModal();
    if (event.target === shipmentModal) closeShipmentModal();
});
