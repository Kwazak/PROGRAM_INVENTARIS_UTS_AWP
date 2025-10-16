// dashboard-charts.js - Plotly-based Dashboard Charts

async function loadDashboardCharts() {
    try {
        // Load Plotly library
        await loadScriptOnce('https://cdn.plot.ly/plotly-2.27.0.min.js');

        const today = new Date().toISOString().split('T')[0];
        const start = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Use fetchAPI wrapper from main.js (handles auth token automatically)
        const json = await fetchAPI('/reports/dashboard-summary?startDate=' + start + '&endDate=' + today);
        if (!json || !json.success) return console.error('Failed to load dashboard summary');

        const { labels, revenue, orders, topProducts, topCustomers } = json.data;

        // Load additional inventory health data
        const healthData = await fetchAPI('/dashboard/inventory-health');
        const agingData = await fetchAPI('/dashboard/inventory-aging');

        // Render Inventory Health Gauges
        if (healthData && healthData.success) {
            renderInventoryHealthGauges(healthData.data);
        }

        // Render Aging Inventory Analysis
        if (agingData && agingData.success) {
            renderAgingInventory(agingData.data);
        }

        // Render Revenue Trend with Plotly
        const revenueContainer = document.getElementById('revenueChart');
        if (revenueContainer && labels && revenue) {
            renderRevenueTrendPlotly('revenueChart', labels, revenue);
        }

        // Render Top Products with Plotly
        const productsContainer = document.getElementById('topProductsChart');
        if (productsContainer && topProducts && topProducts.length > 0) {
            renderTopProductsPlotly('topProductsChart', topProducts);
        }

        // Render Top Customers with Plotly
        const customersContainer = document.getElementById('topCustomersSVG');
        if (customersContainer && topCustomers && topCustomers.length > 0) {
            renderTopCustomersPlotly('topCustomersSVG', topCustomers);
        }

    } catch (err) {
        console.error('Error loading dashboard charts', err);
    }
}

function formatCurrency(value) {
    try {
        return 'Rp ' + Number(value).toLocaleString('id-ID', { maximumFractionDigits: 0 });
    } catch (e) { return value; }
}

function formatCurrencyMillions(value) {
    try {
        const num = Number(value) || 0;
        // display in millions (Juta) with 2 decimals when not integer
        const millions = num / 1000000;
        // show as 'Rp X,XX JT' or 'Rp X JT' if whole
        const formatted = millions >= 1 ? millions.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : millions.toLocaleString('id-ID', { maximumFractionDigits: 2 });
        return 'Rp ' + formatted + ' JT';
    } catch (e) { return value; }
}

// Load external script once
const _loadedScripts = {};
function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
        if (_loadedScripts[src]) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => { _loadedScripts[src] = true; resolve(); };
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

// Common Plotly layout theme
function getPlotlyTheme() {
    return {
        font: { family: 'system-ui, -apple-system, "Segoe UI", sans-serif', size: 13, color: '#0f172a' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { l: 60, r: 40, t: 80, b: 60 },
        hovermode: 'closest',
        hoverlabel: {
            bgcolor: 'rgba(0,0,0,0.85)',
            bordercolor: 'transparent',
            font: { color: '#ffffff', size: 13 }
        }
    };
}

// Revenue Trend Chart (Plotly line chart)
function renderRevenueTrendPlotly(containerId, labels, revenue) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const trace = {
        x: labels,
        y: revenue,
        type: 'scatter',
        mode: 'lines+markers',
        fill: 'tozeroy',
        fillcolor: 'rgba(220, 38, 38, 0.1)',
        line: { color: '#dc2626', width: 3, shape: 'spline', smoothing: 0.4 },
        marker: { color: '#dc2626', size: 8, line: { color: '#fff', width: 2 } },
        hovertemplate: '%{x}<br><b>Rp %{y:,.0f}</b><extra></extra>'
    };

    const layout = {
        ...getPlotlyTheme(),
        margin: { l: 70, r: 40, t: 50, b: 60 },
        height: 400,
        xaxis: {
            showgrid: false,
            tickangle: -45,
            tickfont: { size: 11 }
        },
        yaxis: {
            showgrid: true,
            gridcolor: 'rgba(113, 63, 18, 0.08)',
            tickformat: ',.0f',
            tickprefix: 'Rp ',
            rangemode: 'tozero'
        }
    };

    Plotly.newPlot(container, [trace], layout, { 
        responsive: true, 
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
        modeBarButtonsToAdd: ['zoom2d', 'zoomIn2d', 'zoomOut2d', 'resetScale2d']
    }).then(() => {
        // Add custom tooltips for zoom controls
        setTimeout(() => {
            const modebar = container.querySelector('.modebar');
            if (modebar) {
                const zoomBtn = modebar.querySelector('[data-title*="Zoom"]');
                const zoomInBtn = modebar.querySelector('[data-title*="Zoom in"]');
                const zoomOutBtn = modebar.querySelector('[data-title*="Zoom out"]');
                const resetBtn = modebar.querySelector('[data-title*="Reset"]');
                
                if (zoomBtn) zoomBtn.setAttribute('title', 'Zoom: Klik dan drag untuk zoom area tertentu');
                if (zoomInBtn) zoomInBtn.setAttribute('title', 'Zoom In: Perbesar tampilan chart');
                if (zoomOutBtn) zoomOutBtn.setAttribute('title', 'Zoom Out: Perkecil tampilan chart');
                if (resetBtn) resetBtn.setAttribute('title', 'Reset: Kembali ke tampilan awal');
            }
        }, 100);
    });
}

// Top Products Chart (Plotly horizontal bar)
function renderTopProductsPlotly(containerId, topProducts) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const labels = topProducts.map(p => p.name);
    const values = topProducts.map(p => p.revenue);

    const trace = {
        y: labels,
        x: values,
        type: 'bar',
        orientation: 'h',
        marker: {
            color: '#10b981',
            line: { color: '#059669', width: 1.5 }
        },
        hovertemplate: '%{y}<br><b>Rp %{x:,.0f}</b><extra></extra>'
    };

    const layout = {
        ...getPlotlyTheme(),
        margin: { l: 200, r: 80, t: 60, b: 80 },
        height: 350,
        xaxis: {
            showgrid: true,
            gridcolor: 'rgba(15,23,42,0.06)',
            tickformat: ',.0f',
            tickprefix: 'Rp ',
            rangemode: 'tozero'
        },
        yaxis: {
            automargin: true,
            tickfont: { size: 12, weight: 'bold' }
        }
    };

    Plotly.newPlot(container, [trace], layout, { 
        responsive: true, 
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
        modeBarButtonsToAdd: ['zoom2d', 'zoomIn2d', 'zoomOut2d', 'resetScale2d']
    }).then(() => {
        // Add custom tooltips for zoom controls
        setTimeout(() => {
            const modebar = container.querySelector('.modebar');
            if (modebar) {
                const zoomBtn = modebar.querySelector('[data-title*="Zoom"]');
                const zoomInBtn = modebar.querySelector('[data-title*="Zoom in"]');
                const zoomOutBtn = modebar.querySelector('[data-title*="Zoom out"]');
                const resetBtn = modebar.querySelector('[data-title*="Reset"]');
                
                if (zoomBtn) zoomBtn.setAttribute('title', 'Zoom: Klik dan drag untuk zoom area tertentu');
                if (zoomInBtn) zoomInBtn.setAttribute('title', 'Zoom In: Perbesar tampilan chart');
                if (zoomOutBtn) zoomOutBtn.setAttribute('title', 'Zoom Out: Perkecil tampilan chart');
                if (resetBtn) resetBtn.setAttribute('title', 'Reset: Kembali ke tampilan awal');
            }
        }, 100);
    });
}

// Top Customers Chart (Plotly grouped horizontal bar with 50M step)
function renderTopCustomersPlotly(containerId, topCustomers) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const labels = topCustomers.map(t => t.company_name || t.name);
    const totalSpend = topCustomers.map(t => parseFloat(t.total_revenue) || 0);
    const avgSpend = topCustomers.map(t => {
        const orders = parseInt(t.total_orders) || 0;
        const rev = parseFloat(t.total_revenue) || 0;
        return orders > 0 ? (rev / orders) : 0;
    });

    const maxVal = Math.max(0, ...totalSpend);
    const step = 50000000;
    const maxRounded = Math.ceil(maxVal / step) * step || step;

    const trace1 = {
        x: totalSpend,
        y: labels,
        name: 'Total Spend',
        orientation: 'h',
        marker: { 
            color: '#3b82f6',
            line: { color: '#2563eb', width: 1 }
        },
        type: 'bar',
        hovertemplate: '%{y}<br><b>Total Spend: Rp %{x:,.0f}</b><extra></extra>'
    };

    const trace2 = {
        x: avgSpend,
        y: labels,
        name: 'Avg Spend per Order',
        orientation: 'h',
        marker: { 
            color: '#10b981',
            line: { color: '#059669', width: 1 }
        },
        type: 'bar',
        hovertemplate: '%{y}<br><b>Avg: Rp %{x:,.0f}</b><extra></extra>'
    };

    const data = [trace1, trace2];

    const layout = {
        ...getPlotlyTheme(),
        barmode: 'group',
        margin: { l: 220, r: 140, t: 60, b: 80 },
        height: 450,
        xaxis: {
            range: [0, maxRounded],
            tick0: 0,
            dtick: step,
            tickformat: ',.0f',
            tickprefix: 'Rp ',
            showgrid: true,
            gridcolor: 'rgba(15,23,42,0.06)',
            rangemode: 'tozero'
        },
        yaxis: { 
            automargin: true,
            tickfont: { size: 12, weight: 'bold' }
        },
        legend: { 
            orientation: 'h', 
            y: 1.08,
            x: 0,
            font: { size: 12 }
        }
    };

    // Render plot
    try {
        Plotly.newPlot(container, data, layout, { 
            responsive: true, 
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
            modeBarButtonsToAdd: ['zoom2d', 'zoomIn2d', 'zoomOut2d', 'resetScale2d']
        }).then(gd => {
            // attach download buttons for PNG and SVG via Plotly.toImage
            const pngBtn = document.getElementById('downloadTopCustomersPNG');
            if (pngBtn) pngBtn.onclick = () => {
                Plotly.toImage(gd, { format: 'png', width: gd._fullLayout.width * 3, height: gd._fullLayout.height * 3 }).then(function(url) {
                    const a = document.createElement('a'); a.href = url; a.download = 'top-customers.png'; a.click();
                });
            };
            const svgBtn = document.getElementById('downloadTopCustomersSVG');
            if (svgBtn) svgBtn.onclick = () => {
                Plotly.toImage(gd, { format: 'svg', width: gd._fullLayout.width, height: gd._fullLayout.height }).then(function(url) {
                    const a = document.createElement('a'); a.href = url; a.download = 'top-customers.svg'; a.click();
                });
            };
            
            // Add custom tooltips for zoom controls
            setTimeout(() => {
                const modebar = container.querySelector('.modebar');
                if (modebar) {
                    const zoomBtn = modebar.querySelector('[data-title*="Zoom"]');
                    const zoomInBtn = modebar.querySelector('[data-title*="Zoom in"]');
                    const zoomOutBtn = modebar.querySelector('[data-title*="Zoom out"]');
                    const resetBtn = modebar.querySelector('[data-title*="Reset"]');
                    
                    if (zoomBtn) zoomBtn.setAttribute('title', 'Zoom: Klik dan drag untuk zoom area tertentu');
                    if (zoomInBtn) zoomInBtn.setAttribute('title', 'Zoom In: Perbesar tampilan chart');
                    if (zoomOutBtn) zoomOutBtn.setAttribute('title', 'Zoom Out: Perkecil tampilan chart');
                    if (resetBtn) resetBtn.setAttribute('title', 'Reset: Kembali ke tampilan awal');
                }
            }, 100);
        });
    } catch (err) {
        console.error('Plotly render error', err);
    }
}

// Inventory Health Gauges (Turnover Ratio & Stockout Rate)
function renderInventoryHealthGauges(data) {
    const { inventoryTurnover, stockoutRate } = data;
    
    // Gauge 1: Inventory Turnover Ratio
    const turnoverContainer = document.getElementById('inventoryTurnoverGauge');
    if (turnoverContainer) {
        const turnoverTrace = {
            type: 'indicator',
            mode: 'gauge+number+delta',
            value: inventoryTurnover,
            title: { text: 'Inventory Turnover Ratio', font: { size: 16, weight: 'bold' } },
            delta: { reference: 2.5, increasing: { color: '#10b981' } },
            gauge: {
                axis: { range: [null, 5], tickwidth: 1, tickcolor: '#0f172a' },
                bar: { color: '#3b82f6' },
                bgcolor: 'rgba(15,23,42,0.05)',
                borderwidth: 2,
                bordercolor: '#cbd5e1',
                steps: [
                    { range: [0, 1.5], color: '#fca5a5' },
                    { range: [1.5, 3], color: '#fcd34d' },
                    { range: [3, 5], color: '#86efac' }
                ],
                threshold: {
                    line: { color: '#dc2626', width: 4 },
                    thickness: 0.75,
                    value: 2.5
                }
            }
        };

        const turnoverLayout = {
            ...getPlotlyTheme(),
            height: 250,
            margin: { t: 60, b: 30, l: 40, r: 40 }
        };

        Plotly.newPlot(turnoverContainer, [turnoverTrace], turnoverLayout, { responsive: true, displayModeBar: false });
    }

    // Gauge 2: Stockout Rate
    const stockoutContainer = document.getElementById('stockoutRateGauge');
    if (stockoutContainer) {
        const stockoutTrace = {
            type: 'indicator',
            mode: 'gauge+number',
            value: stockoutRate,
            title: { text: 'Stockout Rate (%)', font: { size: 16, weight: 'bold' } },
            number: { suffix: '%' },
            gauge: {
                axis: { range: [null, 100], tickwidth: 1, tickcolor: '#0f172a', ticksuffix: '%' },
                bar: { color: stockoutRate > 30 ? '#dc2626' : stockoutRate > 15 ? '#f59e0b' : '#10b981' },
                bgcolor: 'rgba(15,23,42,0.05)',
                borderwidth: 2,
                bordercolor: '#cbd5e1',
                steps: [
                    { range: [0, 15], color: '#d1fae5' },
                    { range: [15, 30], color: '#fef3c7' },
                    { range: [30, 100], color: '#fee2e2' }
                ],
                threshold: {
                    line: { color: '#dc2626', width: 4 },
                    thickness: 0.75,
                    value: 30
                }
            }
        };

        const stockoutLayout = {
            ...getPlotlyTheme(),
            height: 250,
            margin: { t: 60, b: 30, l: 40, r: 40 }
        };

        Plotly.newPlot(stockoutContainer, [stockoutTrace], stockoutLayout, { responsive: true, displayModeBar: false });
    }
}

// Aging Inventory Analysis (Stacked Bar + Stock per Size)
function renderAgingInventory(data) {
    const { agingBuckets, stockBySize } = data;
    
    // Chart 1: Aging Inventory Stacked Bar
    const agingContainer = document.getElementById('agingInventoryChart');
    if (agingContainer && agingBuckets) {
        const bucketLabels = ['0-30 Days', '31-60 Days', '61-90 Days', '>90 Days'];
        const bucketKeys = ['0-30', '31-60', '61-90', '>90'];
        const bucketValues = bucketKeys.map(k => agingBuckets[k] || 0);
        const bucketColors = ['#86efac', '#fcd34d', '#fdba74', '#fca5a5'];

        const agingTrace = {
            x: bucketLabels,
            y: bucketValues,
            type: 'bar',
            marker: { 
                color: bucketColors,
                line: { color: '#0f172a', width: 1 }
            },
            text: bucketValues.map(v => 'Rp ' + v.toLocaleString('id-ID')),
            textposition: 'outside',
            hovertemplate: '%{x}<br><b>Rp %{y:,.0f}</b><extra></extra>'
        };

        const agingLayout = {
            ...getPlotlyTheme(),
            title: { text: 'Aging Inventory by SKU & Size', font: { size: 16, weight: 'bold' } },
            height: 280,
            margin: { l: 70, r: 40, t: 60, b: 60 },
            xaxis: { title: 'Age Bucket', tickangle: 0 },
            yaxis: { 
                title: 'Stock Value (Rp)',
                tickformat: ',.0f',
                rangemode: 'tozero'
            }
        };

        Plotly.newPlot(agingContainer, [agingTrace], agingLayout, { responsive: true, displayModeBar: false });
    }

    // Chart 2: Stock per Size (Top 5)
    const sizeContainer = document.getElementById('stockBySizeChart');
    if (sizeContainer && stockBySize && stockBySize.length > 0) {
        const sizeLabels = stockBySize.map(s => s.size || 'N/A');
        const sizeStocks = stockBySize.map(s => parseInt(s.total_stock) || 0);

        const sizeTrace = {
            y: sizeLabels,
            x: sizeStocks,
            type: 'bar',
            orientation: 'h',
            marker: { 
                color: '#6366f1',
                line: { color: '#4f46e5', width: 1 }
            },
            hovertemplate: '%{y}<br><b>Stock: %{x:,.0f} units</b><extra></extra>'
        };

        const sizeLayout = {
            ...getPlotlyTheme(),
            title: { text: 'Stock per Size (Top 5)', font: { size: 16, weight: 'bold' } },
            height: 280,
            margin: { l: 100, r: 40, t: 60, b: 60 },
            xaxis: { 
                title: 'Total Stock',
                tickformat: ',.0f',
                rangemode: 'tozero'
            },
            yaxis: { 
                automargin: true,
                tickfont: { size: 12, weight: 'bold' }
            }
        };

        Plotly.newPlot(sizeContainer, [sizeTrace], sizeLayout, { responsive: true, displayModeBar: false });
    }
}


// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // insert chart containers into dashboard if present
    const dashboardArea = document.querySelector('.dashboard-grid');
    if (dashboardArea) {
        // Create charts container with optimized grid layout
        const chartsContainer = document.createElement('div');
        chartsContainer.className = 'charts-container';
        chartsContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        `;
        
        // Panel 1: Inventory Health Summary (Gauges)
        const healthPanel = document.createElement('div');
        healthPanel.className = 'card chart-card chart-card-health';
        healthPanel.innerHTML = `
            <div class="card-header" style="background: rgba(15,23,42,0.03); border-bottom: 2px solid #e2e8f0;">
                <h3 style="color: #0f172a;"><i class="fas fa-heartbeat"></i> Inventory Health Summary (Gauges)</h3>
                <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">Gunakan Gauge Chart untuk memantau metrik kritis secara instan</p>
            </div>
            <div class="card-body" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
                <div id="inventoryTurnoverGauge" style="min-height: 250px;"></div>
                <div id="stockoutRateGauge" style="min-height: 250px;"></div>
            </div>
        `;
        
        // Panel 2: Aging Inventory Analysis
        const agingPanel = document.createElement('div');
        agingPanel.className = 'card chart-card chart-card-aging';
        agingPanel.innerHTML = `
            <div class="card-header" style="background: rgba(113,63,18,0.05); border-bottom: 2px solid #fde68a;">
                <h3 style="color: #713f12;"><i class="fas fa-clock"></i> Aging Inventory Analysis</h3>
                <p style="font-size: 13px; color: #92400e; margin: 4px 0 0 0;">Visualisasi risiko stok mati dan mismatch ukuran</p>
            </div>
            <div class="card-body" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem;">
                <div id="agingInventoryChart" style="min-height: 280px;"></div>
                <div id="stockBySizeChart" style="min-height: 280px;"></div>
            </div>
        `;
        
        // Chart 1: Revenue Trend
        const chartCard1 = document.createElement('div');
        chartCard1.className = 'card chart-card chart-card-revenue';
        chartCard1.innerHTML = `
            <div class="card-header">
                <h3><i class="fas fa-chart-line"></i> Revenue Trend (30 Days)</h3>
            </div>
            <div class="card-body">
                <div id="revenueChart" style="width:100%; height:400px;"></div>
            </div>
        `;
        
        // Chart 2: Top Products
        const chartCard2 = document.createElement('div');
        chartCard2.className = 'card chart-card chart-card-products';
        chartCard2.innerHTML = `
            <div class="card-header">
                <h3><i class="fas fa-boxes"></i> Top 5 Products</h3>
            </div>
            <div class="card-body">
                <div id="topProductsChart" style="width:100%; height:350px;"></div>
            </div>
        `;
        
        // Chart 3: Top Customers
        const chartCard3 = document.createElement('div');
        chartCard3.className = 'card chart-card chart-card-customers';
        chartCard3.innerHTML = `
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3><i class="fas fa-users"></i> Top 10 Customers by Spend</h3>
                </div>
                <div class="card-actions">
                    <button id="downloadTopCustomersPNG" class="btn btn-sm">
                        <i class="fas fa-download"></i> PNG
                    </button>
                    <button id="downloadTopCustomersSVG" class="btn btn-sm">
                        <i class="fas fa-download"></i> SVG
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div id="topCustomersSVG" style="width:100%; height:450px;"></div>
            </div>
        `;
        
        // Append all cards in optimized order
        chartsContainer.appendChild(healthPanel);
        chartsContainer.appendChild(agingPanel);
        chartsContainer.appendChild(chartCard1);
        chartsContainer.appendChild(chartCard2);
        chartsContainer.appendChild(chartCard3);
        
        // Insert charts container at the beginning of dashboard-grid
        dashboardArea.insertBefore(chartsContainer, dashboardArea.firstChild);
        
        // Add class to dashboard-grid for special layout
        dashboardArea.classList.add('with-charts');

        // Load charts with Plotly
        loadDashboardCharts();
    }
});
