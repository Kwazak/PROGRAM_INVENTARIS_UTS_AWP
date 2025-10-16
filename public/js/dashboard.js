// Dashboard Script

// Load dashboard data
async function loadDashboardData() {
    console.log('🔄 Loading dashboard data...');
    console.log('📊 Token:', localStorage.getItem('token') ? 'Present' : 'Missing');
    console.log('👤 User:', JSON.parse(localStorage.getItem('user') || '{}'));
    
    try {
        // Load overview stats
        console.log('📡 Fetching overview...');
        const overview = await fetchAPI('/dashboard/overview');
        console.log('✅ Overview response:', overview);
        if (overview && overview.success) {
            updateOverviewStats(overview.data);
        }

        // Load production dashboard
        console.log('📡 Fetching production...');
        const production = await fetchAPI('/dashboard/production');
        console.log('✅ Production response:', production);
        if (production && production.success) {
            updateProductionStats(production.data);
        }

        // Load inventory dashboard
        console.log('📡 Fetching inventory...');
        const inventory = await fetchAPI('/dashboard/inventory');
        console.log('✅ Inventory response:', inventory);
        if (inventory && inventory.success) {
            updateInventoryStats(inventory.data);
        }

        // Load sales dashboard
        console.log('📡 Fetching sales...');
        const sales = await fetchAPI('/dashboard/sales');
        console.log('✅ Sales response:', sales);
        if (sales && sales.success) {
            updateSalesStats(sales.data);
        }

        console.log('✨ Dashboard data loaded successfully');

    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
    }
}

// Update overview stats
function updateOverviewStats(data) {
    document.getElementById('activeWorkOrders').textContent = data.active_wo || 0;
    document.getElementById('pendingOrders').textContent = data.pending_orders || 0;
    document.getElementById('lowStockAlerts').textContent = data.low_stock_alerts || 0;
    document.getElementById('monthlyRevenue').textContent = formatCurrency(data.monthly_revenue);
}

// Update production stats
function updateProductionStats(data) {
    if (data.todayProduction) {
        document.getElementById('todayProduction').textContent = data.todayProduction.good || 0;
    }

    // Load recent work orders
    if (data.recentWorkOrders) {
        loadRecentWorkOrders(data.recentWorkOrders);
    }
}

// Update inventory stats
function updateInventoryStats(data) {
    if (data.inventory) {
        const totalValue = parseFloat(data.inventory.totalValue) || 0;
        document.getElementById('totalInventoryValue').textContent = formatCurrency(totalValue);
    }

    if (data.alerts) {
        document.getElementById('lowStockAlerts').textContent = data.alerts.lowStockMaterials || 0;
    }

    // Load low stock materials
    loadLowStockMaterials();
}

// Update sales stats
function updateSalesStats(data) {
    if (data.monthly) {
        document.getElementById('monthlyRevenue').textContent = formatCurrency(data.monthly.revenue);
    }

    // Load recent orders
    if (data.recentOrders) {
        loadRecentOrders(data.recentOrders);
    }
}

// Load recent work orders
function loadRecentWorkOrders(workOrders) {
    const tbody = document.getElementById('recentWorkOrdersTable');
    
    if (!workOrders || workOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data</td></tr>';
        return;
    }

    tbody.innerHTML = workOrders.slice(0, 5).map(wo => `
        <tr>
            <td>${wo.wo_number}</td>
            <td>${wo.product_name || '-'}</td>
            <td>${wo.quantity_planned}</td>
            <td>${getStatusBadge(wo.status)}</td>
            <td>${formatDate(wo.due_date)}</td>
        </tr>
    `).join('');
}

// Load low stock materials
async function loadLowStockMaterials() {
    try {
        const response = await fetchAPI('/materials/alerts/low-stock');
        
        if (response && response.success) {
            const tbody = document.getElementById('lowStockTable');
            const materials = response.data;

            if (materials.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">Tidak ada material low stock</td></tr>';
                return;
            }

            tbody.innerHTML = materials.slice(0, 5).map(material => {
                const percentage = ((material.current_stock / material.min_stock) * 100).toFixed(0);
                const statusClass = percentage < 50 ? 'badge-danger' : 'badge-warning';
                
                return `
                    <tr>
                        <td>${material.name}</td>
                        <td>${material.current_stock} ${material.unit}</td>
                        <td>${material.min_stock} ${material.unit}</td>
                        <td><span class="badge-status ${statusClass}">${percentage}%</span></td>
                    </tr>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading low stock materials:', error);
    }
}

// Load recent orders
function loadRecentOrders(orders) {
    const tbody = document.getElementById('recentOrdersTable');
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Tidak ada data</td></tr>';
        return;
    }

    tbody.innerHTML = orders.slice(0, 5).map(order => `
        <tr>
            <td>${order.so_number}</td>
            <td>${order.customer_name || '-'}</td>
            <td>${formatCurrency(order.total_amount)}</td>
            <td>${getStatusBadge(order.status)}</td>
        </tr>
    `).join('');
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first
    console.log('🔐 Checking authentication...');
    if (!checkAuth()) {
        console.log('❌ Not authenticated, redirecting to login...');
        return;
    }
    
    console.log('✅ Authenticated, loading dashboard...');
    loadDashboardData();

    // Refresh data every 30 seconds
    setInterval(loadDashboardData, 30000);
});
