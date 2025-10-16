/**
 * Reports Page JavaScript
 * Factory Inventory System
 */

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Reports page loaded');
    checkPermissions();
    initializeDateFilters();
});

// Check user permissions
function checkPermissions() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.username) {
        window.location.href = '/login.html';
        return;
    }
    
    // Update user info in sidebar
    document.getElementById('userName').textContent = user.username;
    document.getElementById('userRole').textContent = user.role || 'User';
}

// Initialize date filters
function initializeDateFilters() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('startDate').valueAsDate = firstDayOfMonth;
    document.getElementById('endDate').valueAsDate = today;
    
    // Handle date range change
    document.getElementById('dateRange').addEventListener('change', function() {
        const range = this.value;
        const endDate = new Date();
        let startDate = new Date();
        
        switch(range) {
            case 'today':
                startDate = new Date();
                break;
            case 'week':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
                break;
            case 'quarter':
                const quarter = Math.floor(endDate.getMonth() / 3);
                startDate = new Date(endDate.getFullYear(), quarter * 3, 1);
                break;
            case 'year':
                startDate = new Date(endDate.getFullYear(), 0, 1);
                break;
            case 'custom':
                // Let user select custom dates
                return;
        }
        
        document.getElementById('startDate').valueAsDate = startDate;
        document.getElementById('endDate').valueAsDate = endDate;
    });
}

// Show specific report
function showReport(type) {
    document.getElementById('reportType').value = type;
    updateReportOptions();
    generateReport();
}

// Update report options based on type
function updateReportOptions() {
    const reportType = document.getElementById('reportType').value;
    const reportTitle = document.getElementById('reportTitle');
    
    switch(reportType) {
        case 'inventory':
            reportTitle.textContent = 'Inventory Report';
            break;
        case 'production':
            reportTitle.textContent = 'Production Report';
            break;
        case 'sales':
            reportTitle.textContent = 'Sales Report';
            break;
        case 'finance':
            reportTitle.textContent = 'Financial Report';
            break;
        default:
            reportTitle.textContent = 'Report Preview';
    }
}

// Generate report
async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    
    if (!reportType) {
        alert('Please select a report type first');
        return;
    }
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select date range');
        return;
    }
    
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Generating report...</div>';
    
    try {
        let data;
        
        switch(reportType) {
            case 'inventory':
                data = await generateInventoryReport(startDate, endDate);
                break;
            case 'production':
                data = await generateProductionReport(startDate, endDate);
                break;
            case 'sales':
                data = await generateSalesReport(startDate, endDate);
                break;
            case 'finance':
                data = await generateFinanceReport(startDate, endDate);
                break;
        }
        
        displayReport(data, reportType);
    } catch (error) {
        console.error('Error generating report:', error);
        reportContent.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                Error generating report: ${error.message}
            </div>
        `;
    }
}

// Generate Inventory Report
async function generateInventoryReport(startDate, endDate) {
    // Simulated data - replace with actual API call
    return {
        title: 'Inventory Report',
        period: `${startDate} to ${endDate}`,
        summary: {
            totalItems: 150,
            totalValue: 'Rp 500,000,000',
            lowStock: 12,
            outOfStock: 3
        },
        details: [
            { category: 'Leather', items: 45, value: 'Rp 200,000,000', stock: 'Normal' },
            { category: 'Rubber', items: 30, value: 'Rp 150,000,000', stock: 'Low' },
            { category: 'Fabric', items: 25, value: 'Rp 100,000,000', stock: 'Normal' },
            { category: 'Accessories', items: 50, value: 'Rp 50,000,000', stock: 'Normal' }
        ]
    };
}

// Generate Production Report
async function generateProductionReport(startDate, endDate) {
    return {
        title: 'Production Report',
        period: `${startDate} to ${endDate}`,
        summary: {
            totalWorkOrders: 45,
            completed: 38,
            inProgress: 7,
            totalProduced: 5420
        },
        details: [
            { product: 'Sandal Type A', produced: 2000, target: 2000, efficiency: '100%' },
            { product: 'Sandal Type B', produced: 1800, target: 2000, efficiency: '90%' },
            { product: 'Boot Type A', produced: 1200, target: 1500, efficiency: '80%' },
            { product: 'Boot Type B', produced: 420, target: 500, efficiency: '84%' }
        ]
    };
}

// Generate Sales Report
async function generateSalesReport(startDate, endDate) {
    try {
        const response = await fetchAPI(`/reports/sales-report?startDate=${startDate}&endDate=${endDate}`);
        
        if (response.success) {
            const { summary, details } = response.data;
            
            return {
                title: 'Sales Report',
                period: `${startDate} to ${endDate}`,
                summary: {
                    totalOrders: summary.total_orders || 0,
                    totalRevenue: formatCurrency(summary.total_revenue || 0),
                    pending: summary.pending_orders || 0,
                    completed: summary.completed_orders || 0
                },
                details: details.map(item => {
                    // Parse products with sizes
                    const productsArray = item.products_with_sizes ? 
                        item.products_with_sizes.split('||').filter(p => p.trim()) : [];
                    
                    return {
                        customer: item.customer,
                        products: productsArray, // Array of products with sizes
                        orders: item.orders,
                        revenue: formatCurrency(item.revenue || 0)
                    };
                })
            };
        } else {
            throw new Error(response.message || 'Failed to load sales report');
        }
    } catch (error) {
        console.error('Error generating sales report:', error);
        showToast('Failed to generate sales report', 'error');
        return {
            title: 'Sales Report',
            period: `${startDate} to ${endDate}`,
            summary: {
                totalOrders: 0,
                totalRevenue: 'Rp 0',
                pending: 0,
                completed: 0
            },
            details: []
        };
    }
}

// Generate Finance Report
async function generateFinanceReport(startDate, endDate) {
    return {
        title: 'Financial Report',
        period: `${startDate} to ${endDate}`,
        summary: {
            revenue: 'Rp 850,000,000',
            costs: 'Rp 600,000,000',
            profit: 'Rp 250,000,000',
            margin: '29.4%'
        },
        details: [
            { category: 'Material Costs', amount: 'Rp 400,000,000' },
            { category: 'Labor Costs', amount: 'Rp 150,000,000' },
            { category: 'Overhead', amount: 'Rp 50,000,000' },
            { category: 'Revenue', amount: 'Rp 850,000,000' }
        ]
    };
}

// Display report
function displayReport(data, type) {
    const reportContent = document.getElementById('reportContent');
    
    let html = `
        <div class="report-header">
            <h3>${data.title}</h3>
            <p class="text-muted">Period: ${data.period}</p>
        </div>
        
        <div class="report-summary">
            <h4>Summary</h4>
            <div class="stats-grid">
    `;
    
    // Add summary cards
    for (const [key, value] of Object.entries(data.summary)) {
        html += `
            <div class="stat-card">
                <div class="stat-content">
                    <div class="stat-value">${value}</div>
                    <div class="stat-label">${formatLabel(key)}</div>
                </div>
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
        
        <div class="report-details">
            <h4>Details</h4>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
    `;
    
    // Add table headers based on report type
    if (type === 'sales') {
        html += `
            <th>Customer</th>
            <th>Product Name</th>
            <th>Size Product</th>
            <th>Orders</th>
            <th>Revenue</th>
        `;
    } else if (data.details.length > 0) {
        const headers = Object.keys(data.details[0]);
        headers.forEach(header => {
            html += `<th>${formatLabel(header)}</th>`;
        });
    }
    
    html += `
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Add table rows
    if (type === 'sales') {
        data.details.forEach(row => {
            const customer = row.customer;
            const products = row.products || [];
            const orders = row.orders;
            const revenue = row.revenue;
            
            if (products.length === 0) {
                // No products - show single row
                html += `
                    <tr>
                        <td>${customer}</td>
                        <td>-</td>
                        <td>-</td>
                        <td style="text-align: center;">${orders}</td>
                        <td style="text-align: right;">${revenue}</td>
                    </tr>
                `;
            } else {
                // Multiple products - show one row per product
                products.forEach((productWithSize, index) => {
                    // Extract product name and size
                    const match = productWithSize.match(/^(.+?)\s*(?:\(Size:\s*(.+?)\))?$/);
                    const productName = match ? match[1].trim() : productWithSize;
                    const size = match && match[2] ? match[2].trim() : '-';
                    
                    html += `
                        <tr>
                            <td>${index === 0 ? customer : ''}</td>
                            <td>${productName}</td>
                            <td style="text-align: center;">${size}</td>
                            <td style="text-align: center;">${index === 0 ? orders : ''}</td>
                            <td style="text-align: right;">${index === 0 ? revenue : ''}</td>
                        </tr>
                    `;
                });
            }
        });
    } else {
        // Default rendering for other report types
        data.details.forEach(row => {
            html += '<tr>';
            Object.values(row).forEach(value => {
                html += `<td>${value}</td>`;
            });
            html += '</tr>';
        });
    }
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    reportContent.innerHTML = html;
}

// Format label
function formatLabel(str) {
    return str.replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

// Export report
function exportReport(format) {
    const reportType = document.getElementById('reportType').value;
    const reportContent = document.getElementById('reportContent').innerHTML;
    
    if (!reportType || reportContent.includes('empty-state')) {
        showToast('Please generate a report first', 'warning');
        return;
    }
    
    if (format === 'excel') {
        exportToExcel();
    } else if (format === 'pdf') {
        showToast('PDF export coming soon', 'info');
    }
}

// Export to Excel/CSV
function exportToExcel() {
    const reportType = document.getElementById('reportType').value;
    const reportTitle = document.getElementById('reportTitle').textContent;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // Create CSV with UTF-8 BOM
    let csv = '\uFEFF'; // UTF-8 BOM
    
    // Add title
    csv += `"${reportTitle}"\n`;
    csv += `"Period: ${startDate} to ${endDate}"\n`;
    csv += `"Generated: ${new Date().toLocaleString('id-ID')}"\n`;
    csv += `\n`; // Empty line
    
    // Get table from report content
    const table = document.querySelector('#reportContent table');
    if (table) {
        // Get headers
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
        csv += headers.map(h => `"${h}"`).join(',') + '\n';
        
        // Get data rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(td => {
                const text = td.textContent.trim().replace(/"/g, '""');
                return `"${text}"`;
            });
            csv += cells.join(',') + '\n';
        });
    }
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Report exported to Excel', 'success');
}

// Print report
function printReport() {
    const reportContent = document.getElementById('reportContent').innerHTML;
    
    if (!reportContent || reportContent.includes('empty-state')) {
        showToast('Please generate a report first', 'warning');
        return;
    }
    
    const reportTitle = document.getElementById('reportTitle').textContent;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${reportTitle}</title>
            <style>
                @media print {
                    @page {
                        margin: 1cm;
                    }
                    body {
                        margin: 0;
                        padding: 20px;
                        font-family: Arial, sans-serif;
                    }
                }
                
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                }
                
                .print-header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 10px;
                }
                
                .print-header h1 {
                    margin: 0 0 10px 0;
                    font-size: 24pt;
                }
                
                .print-header p {
                    margin: 5px 0;
                    font-size: 11pt;
                    color: #666;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                
                table thead {
                    background-color: #f0f0f0;
                }
                
                table th,
                table td {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: left;
                    font-size: 10pt;
                }
                
                table th {
                    font-weight: bold;
                    background-color: #e0e0e0;
                }
                
                .report-summary {
                    margin: 20px 0;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin: 15px 0;
                }
                
                .stat-card {
                    border: 1px solid #ddd;
                    padding: 15px;
                    text-align: center;
                }
                
                .stat-value {
                    font-size: 18pt;
                    font-weight: bold;
                    color: #2c3e50;
                }
                
                .stat-label {
                    font-size: 10pt;
                    color: #7f8c8d;
                    margin-top: 5px;
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>${reportTitle}</h1>
                <p>Period: ${startDate} to ${endDate}</p>
                <p>Generated: ${new Date().toLocaleString('id-ID')}</p>
            </div>
            ${reportContent}
            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Format currency helper
function formatCurrency(amount) {
    return 'Rp ' + parseFloat(amount || 0).toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}
