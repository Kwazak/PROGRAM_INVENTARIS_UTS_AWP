// products.js - Product Management Functions

let currentProductId = null;
let allProducts = [];
let allCategories = [];

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    loadProducts();
    loadCategories();
});

// Load user info
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.name || user.username;
        document.getElementById('userRole').textContent = user.role || 'User';
    }
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const productModal = document.getElementById('productModal');
    const bomModal = document.getElementById('bomModal');
    const addBomModal = document.getElementById('addBomItemModal');
    
    if (event.target === productModal) {
        closeProductModal();
    }
    if (event.target === bomModal) {
        closeBomModal();
    }
    if (event.target === addBomModal) {
        closeAddBomItemModal();
    }
});


// Load categories for filter and form
async function loadCategories() {
    try {
        const response = await fetchAPI('/products/categories');
        if (response.success) {
            allCategories = response.data;
            
            // Populate category filter
            const categoryFilter = document.getElementById('categoryFilter');
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            response.data.forEach(cat => {
                const name = cat.name || cat.category_name || cat.nama || 'Unknown';
                categoryFilter.innerHTML += `<option value="${cat.id}">${name}</option>`;
            });
            
            // Populate category in form
            const categoryId = document.getElementById('categoryId');
            categoryId.innerHTML = '<option value="">Select Category</option>';
            response.data.forEach(cat => {
                const name = cat.name || cat.category_name || cat.nama || 'Unknown';
                categoryId.innerHTML += `<option value="${cat.id}">${name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load products with filters
async function loadProducts() {
    try {
        const search = document.getElementById('searchInput').value;
        const category = document.getElementById('categoryFilter').value;
        const type = document.getElementById('typeFilter').value;
        const status = document.getElementById('statusFilter').value;
        
        let url = '/products?';
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (category) url += `category=${category}&`;
        if (type) url += `type=${type}&`;
        if (status) url += `status=${status}&`;
        
        const response = await fetchAPI(url);
        
        if (response.success) {
            console.log('Products loaded:', response.data);
            // Log first product to check data
            if (response.data.length > 0) {
                console.log('First product:', response.data[0]);
                console.log('Type:', response.data[0].type);
                console.log('Stock:', response.data[0].current_stock);
            }
            allProducts = response.data;
            displayProducts(response.data);
            updateStats(response.data);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Failed to load products', 'error');
    }
}

// Display products in table
function displayProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="text-center">No products found</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(product => {
        const isLowStock = (product.current_stock || 0) <= (product.min_stock || 0);
        const stockClass = isLowStock ? 'badge-danger' : 'badge-success';
        const statusBadge = getStatusBadge(product.status);
        
        return `
            <tr ${isLowStock ? 'class="low-stock-row"' : ''} data-product-id="${product.id}">
                <td>${product.sku_code || '-'}</td>
                <td><strong>${product.name || '-'}</strong></td>
                <td>${product.category_name || '-'}</td>
                <td><span class="badge badge-info">${product.type || '-'}</span></td>
                <td>${product.size || '-'}</td>
                <td>${product.color || '-'}</td>
                <td><span class="badge ${stockClass}">${product.current_stock !== null && product.current_stock !== undefined ? product.current_stock : '-'}</span></td>
                <td>${product.min_stock !== null && product.min_stock !== undefined ? product.min_stock : '-'}</td>
                <td>${formatCurrency(product.unit_price || 0)}</td>
                <td>${formatCurrency(product.wholesale_price || 0)}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="viewBOM(${product.id}, '${product.name}')" title="View BOM">
                            <i class="fas fa-list"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="editProduct(${product.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id}, '${product.name}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update statistics
function updateStats(products) {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.current_stock || 0), 0);
    const lowStockCount = products.filter(p => p.current_stock <= p.min_stock).length;
    const totalValue = products.reduce((sum, p) => sum + (p.current_stock * p.unit_price), 0);
    
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalStock').textContent = totalStock;
    document.getElementById('lowStockCount').textContent = lowStockCount;
    document.getElementById('totalValue').textContent = formatCurrency(totalValue);
}

// Search and filter functions
document.getElementById('searchInput').addEventListener('input', debounce(loadProducts, 500));
document.getElementById('categoryFilter').addEventListener('change', loadProducts);
document.getElementById('typeFilter').addEventListener('change', loadProducts);
document.getElementById('statusFilter').addEventListener('change', loadProducts);

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    loadProducts();
}

// Debounce function for search
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
async function openAddProductModal() {
    currentProductId = null;
    document.getElementById('modalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    
    // Auto-fill SKU Code
    try {
        const response = await fetchAPI('/auto-number/product-sku');
        if (response.success) {
            document.getElementById('skuCode').value = response.number;
            document.getElementById('skuCode').readOnly = true;
        }
    } catch (error) {
        console.error('Error getting SKU:', error);
    }
    
    document.getElementById('productModal').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    currentProductId = null;
}

// Edit product
async function editProduct(id) {
    try {
        const response = await fetchAPI(`/products/${id}`);
        if (response.success) {
            const product = response.data;
            currentProductId = id;
            
            document.getElementById('modalTitle').textContent = 'Edit Product';
            document.getElementById('skuCode').value = product.sku_code;
            document.getElementById('skuCode').readOnly = false; // Allow editing SKU
            document.getElementById('productName').value = product.name;
            document.getElementById('categoryId').value = product.category_id || '';
            document.getElementById('productType').value = product.type;
            document.getElementById('size').value = product.size || '';
            document.getElementById('color').value = product.color || '';
            document.getElementById('weight').value = product.weight || '';
            document.getElementById('unitPrice').value = product.unit_price;
            document.getElementById('wholesalePrice').value = product.wholesale_price || '';
            document.getElementById('minStock').value = product.min_stock;
            document.getElementById('currentStock').value = product.current_stock;
            document.getElementById('status').value = product.status;
            document.getElementById('description').value = product.description || '';
            
            document.getElementById('productModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showToast('Failed to load product data', 'error');
    }
}

// Save product (add or update)
document.getElementById('productForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('productName').value,
        category_id: document.getElementById('categoryId').value || null,
        type: document.getElementById('productType').value,
        size: document.getElementById('size').value || null,
        color: document.getElementById('color').value || null,
        weight: document.getElementById('weight').value || null,
        unit_price: parseFloat(document.getElementById('unitPrice').value),
        wholesale_price: document.getElementById('wholesalePrice').value ? parseFloat(document.getElementById('wholesalePrice').value) : null,
        min_stock: parseInt(document.getElementById('minStock').value),
        current_stock: parseInt(document.getElementById('currentStock').value) || 0,
        status: document.getElementById('status').value,
        description: document.getElementById('description').value || null
    };
    
    // Include SKU only when editing (backend will auto-generate for new)
    if (currentProductId) {
        productData.sku_code = document.getElementById('skuCode').value;
    }
    
    try {
        let response;
        if (currentProductId) {
            // Update existing product
            response = await fetchAPI(`/products/${currentProductId}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
        } else {
            // Add new product
            response = await fetchAPI('/products', {
                method: 'POST',
                body: JSON.stringify(productData)
            });
        }
        
        if (response.success) {
            showToast(response.message, 'success');
            closeProductModal();
            loadProducts();
        } else {
            showToast(response.message || 'Failed to save product', 'error');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        showToast('Failed to save product', 'error');
    }
});

// Delete product
async function deleteProduct(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        return;
    }
    
    try {
        const response = await fetchAPI(`/products/${id}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showToast(response.message, 'success');
            loadProducts();
        } else {
            showToast(response.message || 'Failed to delete product', 'error');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Failed to delete product', 'error');
    }
}

// BOM Management
let currentBomProductId = null;

async function viewBOM(productId, productName) {
    currentBomProductId = productId;
    document.getElementById('bomProductName').textContent = productName;
    document.getElementById('bomModal').style.display = 'flex';
    loadBOMItems(productId);
}

async function loadBOMItems(productId) {
    try {
        const response = await fetchAPI(`/bom/${productId}`);
        const tbody = document.getElementById('bomTableBody');
        
        if (response.success && response.data.length > 0) {
            let totalCost = 0;
            
            tbody.innerHTML = response.data.map(item => {
                const cost = item.quantity_required * item.unit_price;
                totalCost += cost;
                
                return `
                    <tr>
                        <td>${item.material_name}</td>
                        <td>${item.sku_code || '-'}</td>
                        <td>${item.quantity_required}</td>
                        <td>${item.unit}</td>
                        <td>${formatCurrency(item.unit_price)}</td>
                        <td>${formatCurrency(cost)}</td>
                        <td>
                            <button class="btn btn-sm btn-danger" onclick="deleteBOMItem(${item.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            document.getElementById('totalBomCost').textContent = formatCurrency(totalCost);
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No BOM items found</td></tr>';
            document.getElementById('totalBomCost').textContent = formatCurrency(0);
        }
    } catch (error) {
        console.error('Error loading BOM:', error);
        showToast('Failed to load BOM items', 'error');
    }
}

function closeBomModal() {
    document.getElementById('bomModal').style.display = 'none';
    currentBomProductId = null;
}

async function openAddBomItemModal() {
    try {
        // Load materials for dropdown
        await loadMaterialsForBOM();
        
        // Reset form
        document.getElementById('addBomItemForm').reset();
        document.getElementById('bomMaterialInfo').style.display = 'none';
        document.getElementById('bom_estimated_cost').value = 'Rp 0';
        
        // Show modal
        document.getElementById('addBomItemModal').style.display = 'flex';
    } catch (error) {
        console.error('Error opening add BOM modal:', error);
        showToast('Gagal membuka form BOM', 'error');
    }
}

function closeAddBomItemModal() {
    document.getElementById('addBomItemModal').style.display = 'none';
    document.getElementById('addBomItemForm').reset();
}

// Load materials for BOM dropdown
async function loadMaterialsForBOM() {
    try {
        const response = await fetchAPI('/materials?status=active');
        if (response && response.success) {
            const select = document.getElementById('bom_material_id');
            select.innerHTML = '<option value="">Pilih Material</option>';
            
            response.data.forEach(material => {
                const option = document.createElement('option');
                option.value = material.id;
                option.textContent = `${material.name} (${material.sku_code})`;
                option.dataset.sku = material.sku_code;
                option.dataset.stock = material.current_stock;
                option.dataset.unit = material.unit;
                option.dataset.price = material.unit_price;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading materials:', error);
    }
}

// Update material info when selected
function updateBomMaterialInfo() {
    const select = document.getElementById('bom_material_id');
    const option = select.options[select.selectedIndex];
    
    if (option.value) {
        const sku = option.dataset.sku;
        const stock = option.dataset.stock;
        const unit = option.dataset.unit;
        const price = option.dataset.price;
        
        document.getElementById('bom_material_sku').textContent = sku;
        document.getElementById('bom_material_stock').textContent = stock + ' ' + unit;
        document.getElementById('bom_material_price').textContent = formatCurrency(parseFloat(price));
        document.getElementById('bom_unit').value = unit;
        document.getElementById('bomMaterialInfo').style.display = 'block';
        
        // Calculate cost if quantity already entered
        calculateBomCost();
    } else {
        document.getElementById('bomMaterialInfo').style.display = 'none';
        document.getElementById('bom_unit').value = '';
    }
}

// Calculate estimated BOM cost
function calculateBomCost() {
    const select = document.getElementById('bom_material_id');
    const option = select.options[select.selectedIndex];
    const quantity = parseFloat(document.getElementById('bom_quantity').value) || 0;
    
    if (option.value && quantity > 0) {
        const price = parseFloat(option.dataset.price);
        const totalCost = quantity * price;
        document.getElementById('bom_estimated_cost').value = formatCurrency(totalCost);
    } else {
        document.getElementById('bom_estimated_cost').value = 'Rp 0';
    }
}

// Save BOM item
async function saveBomItem() {
    try {
        const form = document.getElementById('addBomItemForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const materialId = document.getElementById('bom_material_id').value;
        const quantity = parseFloat(document.getElementById('bom_quantity').value);
        const unit = document.getElementById('bom_unit').value;
        const notes = document.getElementById('bom_notes').value;

        const formData = {
            product_id: currentBomProductId,
            material_id: parseInt(materialId),
            quantity_required: quantity,
            unit: unit,
            notes: notes || null
        };

        const response = await fetchAPI('/bom', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (response && response.success) {
            showToast('BOM item berhasil ditambahkan', 'success');
            closeAddBomItemModal();
            loadBOMItems(currentBomProductId);
        } else {
            showToast(response.message || 'Gagal menambahkan BOM item', 'error');
        }
    } catch (error) {
        console.error('Error saving BOM item:', error);
        showToast('Terjadi kesalahan saat menyimpan', 'error');
    }
}

async function deleteBOMItem(bomId) {
    if (!confirm('Are you sure you want to delete this BOM item?')) {
        return;
    }
    
    try {
        const response = await fetchAPI(`/bom/${bomId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showToast(response.message, 'success');
            loadBOMItems(currentBomProductId);
        } else {
            showToast(response.message || 'Failed to delete BOM item', 'error');
        }
    } catch (error) {
        console.error('Error deleting BOM item:', error);
        showToast('Failed to delete BOM item', 'error');
    }
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const productModal = document.getElementById('productModal');
    const bomModal = document.getElementById('bomModal');
    const addBomModal = document.getElementById('addBomItemModal');
    
    if (event.target === productModal) {
        closeProductModal();
    }
    if (event.target === bomModal) {
        closeBomModal();
    }
    if (event.target === addBomModal) {
        closeAddBomItemModal();
    }
});
