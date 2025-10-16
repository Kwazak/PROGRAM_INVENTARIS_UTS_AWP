// QC Dashboard JavaScript
// API_URL already defined in config.js

// Get token from localStorage
const token = localStorage.getItem('token');

// Redirect to login if no token
if (!token) {
    window.location.href = '/login.html';
}

// Chart configuration for Plotly.js - ENHANCED VISUAL DESIGN
const defaultLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
        family: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif',
        size: 13,
        color: '#495057'
    },
    margin: { l: 70, r: 50, t: 60, b: 80 },
    hovermode: 'closest',
    hoverlabel: {
        bgcolor: 'rgba(0, 0, 0, 0.9)',
        bordercolor: 'transparent',
        font: { color: '#ffffff', size: 14, weight: 'bold' },
        borderRadius: 8
    },
    transition: {
        duration: 500,
        easing: 'cubic-in-out'
    }
};

const defaultConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
    toImageButtonOptions: {
        format: 'png',
        filename: 'qc_chart',
        height: 600,
        width: 1200,
        scale: 2
    }
};

// Load dashboard data
async function loadDashboard() {
    try {
        // Show loading state
        showLoading();
        
        // Get filter values
        const period = document.getElementById('filterPeriod')?.value || 'current';
        const product = document.getElementById('filterProduct')?.value || '';
        const shift = document.getElementById('filterShift')?.value || '';
        
        // Build query params
        const params = new URLSearchParams();
        if (period) params.append('period', period);
        if (product) params.append('product', product);
        if (shift) params.append('shift', shift);
        
        console.log('🔄 Loading QC Dashboard data...');
        console.log('   Endpoint:', `${API_URL}/qc-dashboard`);
        console.log('   Params:', params.toString());
        
        // Fetch data from backend
        const response = await fetch(`${API_URL}/qc-dashboard?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('   Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch dashboard data`);
        }
        
        const result = await response.json();
        console.log('✅ Dashboard data loaded:', result);
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to load dashboard data');
        }
        
        const data = result;
        
        // Update metrics
        updateMetrics(data.metrics || {});
        
        // Update last updated time
        const now = new Date();
        document.getElementById('lastUpdated').textContent = now.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Update charts
        updateParetoChart(data.paretoData);
        updateTrendChart(data.trendData);
        updateCategoryChart(data.categoryData);

        // Update action items
        if (data.actionItems) {
            updateActionItems(data.actionItems);
        }

        // Load recent inspections
        await loadRecentInspections();

        hideLoading();
        
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        hideLoading();
        showError('Error loading dashboard: ' + error.message);
    }
}

// Show error message
function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
        contentWrapper.insertBefore(alertDiv, contentWrapper.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => alertDiv.remove(), 5000);
    }
}

// Update metrics
function updateMetrics(metrics) {
    if (!metrics) {
        console.warn('No metrics data provided');
        return;
    }
    
    console.log('📊 Updating metrics:', metrics);
    
    // Update metric values with fallback to 0 and ensure they are numbers
    const totalInspected = Number(metrics.totalInspected) || 0;
    const totalRejected = Number(metrics.totalRejected) || 0;
    const rejectRate = Number(metrics.rejectRate) || 0;
    
    document.getElementById('metricTotalInspected').textContent = totalInspected.toLocaleString();
    document.getElementById('metricTotalRejected').textContent = totalRejected.toLocaleString();
    document.getElementById('metricRejectRate').textContent = rejectRate.toFixed(1) + '%';
    
    // Update change indicators with fallback to 0
    updateChangeIndicator('metricInspectedChange', Number(metrics.inspectedChange) || 0);
    updateChangeIndicator('metricRejectedChange', Number(metrics.rejectedChange) || 0, true);
    updateChangeIndicator('metricRateChange', Number(metrics.rateChange) || 0, true);
}

function updateChangeIndicator(elementId, value, inverse = false) {
    const element = document.getElementById(elementId);
    const isPositive = inverse ? value < 0 : value > 0;
    
    element.className = 'metric-change ' + (isPositive ? 'positive' : 'negative');
    element.innerHTML = `
        <i class="fas fa-arrow-${value > 0 ? 'up' : 'down'}"></i>
        ${Math.abs(value).toFixed(1)}% vs last
    `;
}

// Update Pareto Chart with Plotly.js
function updateParetoChart(data) {
    if (!data || data.length === 0) {
        console.warn('No Pareto data provided');
        // Show "No Data" message
        document.getElementById('paretoInsights').innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>Tidak ada data defect untuk periode ini</span>
        `;
        return;
    }
    
    console.log('📊 Updating Pareto Chart:', data);
    
    // Calculate cumulative percentage
    const paretoTotal = data.reduce((sum, item) => sum + item.quantity, 0);
    let cumulative = 0;
    const cumulativeData = data.map(item => {
        cumulative += item.quantity;
        return (cumulative / paretoTotal * 100);
    });
    
    // Bar trace for quantity - ENHANCED VISUAL DESIGN
    const barTrace = {
        x: data.map(item => item.defect_name),
        y: data.map(item => item.quantity),
        name: 'Defect Quantity',
        type: 'bar',
        marker: {
            color: data.map((item, index) => {
                const colors = [
                    'rgba(102, 126, 234, 0.85)', // Primary blue
                    'rgba(245, 87, 108, 0.85)',  // Danger red
                    'rgba(250, 112, 154, 0.85)', // Warning pink
                    'rgba(255, 193, 7, 0.85)',   // Warning yellow
                    'rgba(40, 167, 69, 0.85)',   // Success green
                    'rgba(23, 162, 184, 0.85)',  // Info cyan
                    'rgba(108, 117, 125, 0.85)', // Secondary gray
                    'rgba(52, 58, 64, 0.85)'     // Dark gray
                ];
                return colors[index % colors.length];
            }),
            line: {
                color: data.map((item, index) => {
                    const colors = [
                        'rgba(102, 126, 234, 1)',
                        'rgba(245, 87, 108, 1)',
                        'rgba(250, 112, 154, 1)',
                        'rgba(255, 193, 7, 1)',
                        'rgba(40, 167, 69, 1)',
                        'rgba(23, 162, 184, 1)',
                        'rgba(108, 117, 125, 1)',
                        'rgba(52, 58, 64, 1)'
                    ];
                    return colors[index % colors.length];
                }),
                width: 1
            }
        },
        hovertemplate: '<b>%{x}</b><br>' +
                       'Quantity: <b>%{y:,} pcs</b><br>' +
                       'Percentage: <b>%{customdata:.1f}%</b><br>' +
                       '<extra></extra>',
        customdata: data.map(item => (item.quantity / paretoTotal * 100))
    };
    
    // Line trace for cumulative percentage - ENHANCED
    const lineTrace = {
        x: data.map(item => item.defect_name),
        y: cumulativeData,
        name: 'Cumulative % (Pareto)',
        type: 'scatter',
        mode: 'lines+markers',
        yaxis: 'y2',
        line: {
            color: 'rgba(255, 99, 132, 1)',
            width: 3,
            shape: 'spline',
            smoothing: 1.3
        },
        marker: {
            color: 'rgba(255, 99, 132, 1)',
            size: 8,
            line: {
                color: '#ffffff',
                width: 2
            },
            symbol: 'diamond'
        },
        hovertemplate: '<b>%{x}</b><br>' +
                       'Cumulative: <b>%{y:.1f}%</b><br>' +
                       '<extra></extra>'
    };
    
    const layout = {
        ...defaultLayout,
        title: {
            text: '<b>📊 PARETO ANALYSIS - Top Quality Defects</b>',
            font: { size: 18, color: '#2c3e50', weight: 'bold' },
            x: 0.5,
            xanchor: 'center',
            y: 0.95
        },
        xaxis: {
            title: {
                text: '<b>Defect Categories</b>',
                font: { size: 14, color: '#495057' }
            },
            tickangle: -45,
            automargin: true,
            showgrid: false,
            tickfont: { size: 12, weight: 'bold' }
        },
        yaxis: {
            title: {
                text: '<b>Defect Quantity (pcs)</b>',
                font: { size: 14, color: '#495057' }
            },
            side: 'left',
            showgrid: true,
            gridcolor: 'rgba(0,0,0,0.08)',
            gridwidth: 1,
            tickfont: { size: 12 }
        },
        yaxis2: {
            title: {
                text: '<b>Cumulative Percentage (%)</b>',
                font: { size: 14, color: '#dc3545' }
            },
            overlaying: 'y',
            side: 'right',
            range: [0, 105],
            showgrid: false,
            tickfont: { size: 12, color: '#dc3545' },
            tickformat: '.0f'
        },
        legend: {
            x: 0.02,
            y: 0.98,
            xanchor: 'left',
            yanchor: 'top',
            orientation: 'h',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            bordercolor: 'rgba(0, 0, 0, 0.1)',
            borderwidth: 1,
            borderRadius: 8
        },
        hovermode: 'x unified',
        bargap: 0.2,
        bargroupgap: 0.1
    };
    
    const config = {
        ...defaultConfig,
        toImageButtonOptions: {
            format: 'png',
            filename: 'pareto_chart',
            height: 500,
            width: 1200
        }
    };
    
    Plotly.newPlot('paretoChart', [barTrace, lineTrace], layout, config).then(() => {
        // Add animation
        Plotly.animate('paretoChart', {
            data: [barTrace, lineTrace],
            traces: [0, 1],
            layout: layout
        }, {
            transition: {
                duration: 800,
                easing: 'cubic-in-out'
            },
            frame: {
                duration: 800
            }
        });
    });
    
    // Update insight
    const top3 = data.slice(0, 3);
    const top3Total = top3.reduce((sum, item) => sum + item.quantity, 0);
    const top3Percentage = (top3Total / paretoTotal * 100).toFixed(0);
    
    document.getElementById('paretoInsights').innerHTML = `
        <i class="fas fa-lightbulb"></i>
        <strong>${top3Percentage}% defect disebabkan oleh 3 jenis teratas:</strong>
        ${top3.map(item => item.defect_name).join(', ')}
    `;
}

// Update Trend Chart with Plotly.js
function updateTrendChart(data) {
    if (!data || data.length === 0) {
        console.warn('No trend data provided');
        return;
    }
    
    console.log('📈 Updating Trend Chart:', data);
    
    const target = 6.5; // Target reject rate
    
    // Actual reject rate trace - ENHANCED VISUAL DESIGN
    const actualTrace = {
        x: data.map(item => item.month),
        y: data.map(item => item.reject_rate),
        name: 'Actual Reject Rate',
        type: 'scatter',
        mode: 'lines+markers',
        line: {
            color: 'rgba(75, 192, 192, 1)',
            width: 4,
            shape: 'spline',
            smoothing: 1.3,
            dash: 'solid'
        },
        marker: {
            color: 'rgba(75, 192, 192, 1)',
            size: 10,
            line: {
                color: '#ffffff',
                width: 3
            },
            symbol: 'circle'
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(75, 192, 192, 0.15)',
        hovertemplate: '<b>%{x}</b><br>' +
                       'Reject Rate: <b>%{y:.2f}%</b><br>' +
                       '<extra></extra>'
    };
    
    // Target line trace - ENHANCED
    const targetTrace = {
        x: data.map(item => item.month),
        y: Array(data.length).fill(target),
        name: 'Target (6.5%)',
        type: 'scatter',
        mode: 'lines',
        line: {
            color: 'rgba(255, 99, 132, 1)',
            width: 3,
            dash: 'dashdot'
        },
        hovertemplate: '<b>Quality Target</b><br>' +
                       'Rate: <b>%{y:.1f}%</b><br>' +
                       '<extra></extra>'
    };
    
    const layout = {
        ...defaultLayout,
        title: {
            text: '<b>📈 QUALITY TREND ANALYSIS</b>',
            font: { size: 18, color: '#2c3e50', weight: 'bold' },
            x: 0.5,
            xanchor: 'center',
            y: 0.95
        },
        xaxis: {
            title: {
                text: '<b>Time Period</b>',
                font: { size: 14, color: '#495057' }
            },
            showgrid: false,
            tickfont: { size: 12, weight: 'bold' }
        },
        yaxis: {
            title: {
                text: '<b>Reject Rate (%)</b>',
                font: { size: 14, color: '#495057' }
            },
            range: [0, Math.max(12, Math.max(...data.map(item => item.reject_rate)) * 1.2)],
            showgrid: true,
            gridcolor: 'rgba(0,0,0,0.08)',
            gridwidth: 1,
            tickfont: { size: 12 },
            tickformat: '.1f'
        },
        legend: {
            x: 0.02,
            y: 0.98,
            xanchor: 'left',
            yanchor: 'top',
            orientation: 'h',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            bordercolor: 'rgba(0, 0, 0, 0.1)',
            borderwidth: 1,
            borderRadius: 8
        },
        hovermode: 'x unified',
        shapes: [{
            type: 'line',
            x0: data[0]?.month || '',
            y0: target,
            x1: data[data.length - 1]?.month || '',
            y1: target,
            line: {
                color: 'rgba(255, 99, 132, 0.5)',
                width: 1,
                dash: 'dot'
            }
        }],
        annotations: [
            {
                x: data[data.length - 1].month,
                y: data[data.length - 1].reject_rate,
                text: `${data[data.length - 1].reject_rate.toFixed(1)}%`,
                showarrow: true,
                arrowhead: 2,
                ax: 20,
                ay: -40,
                font: { size: 12, color: '#333' }
            }
        ]
    };
    
    const config = {
        ...defaultConfig,
        toImageButtonOptions: {
            format: 'png',
            filename: 'trend_chart',
            height: 400,
            width: 800
        }
    };
    
    Plotly.newPlot('trendChart', [actualTrace, targetTrace], layout, config).then(() => {
        // Add animation
        Plotly.animate('trendChart', {
            data: [actualTrace, targetTrace],
            traces: [0, 1],
            layout: layout
        }, {
            transition: {
                duration: 1000,
                easing: 'cubic-in-out'
            },
            frame: {
                duration: 1000
            }
        });
    });
    
    // Update insight
    const lastMonth = data[data.length - 1];
    const prevMonth = data[data.length - 2];
    const change = lastMonth.reject_rate - prevMonth.reject_rate;
    const isImproving = change < 0;
    const gap = lastMonth.reject_rate - target;
    
    document.getElementById('trendInsights').innerHTML = `
        <i class="fas fa-lightbulb"></i>
        <strong>📊 Status: ${isImproving ? '✓ IMPROVING' : '⚠️ DECLINING'}</strong> 
        (${Math.abs(change).toFixed(1)}% ${isImproving ? 'turun' : 'naik'} dari bulan lalu)<br>
        ${gap > 0 ? `⚠️ Alert: Masih perlu turun ${gap.toFixed(1)}% lagi untuk mencapai target` : '✅ Target tercapai!'}
    `;
}

// Update Category Chart with Plotly.js
function updateCategoryChart(data) {
    if (!data || data.length === 0) {
        console.warn('No category data provided');
        return;
    }
    
    console.log('📊 Updating Category Chart:', data);
    
    const colors = {
        'UPPER': 'rgba(255, 99, 132, 0.8)',
        'SOLE': 'rgba(255, 159, 64, 0.8)',
        'FINISHING': 'rgba(255, 205, 86, 0.8)',
        'SIZING': 'rgba(75, 192, 192, 0.8)',
        'OTHERS': 'rgba(153, 102, 255, 0.8)'
    };
    
    const categoryTotal = data.reduce((sum, item) => sum + item.quantity, 0);
    
    // Pie/Doughnut trace
    const pieTrace = {
        labels: data.map(item => item.category),
        values: data.map(item => item.quantity),
        type: 'pie',
        hole: 0.4, // Makes it a doughnut chart
        marker: {
            colors: data.map(item => colors[item.category] || 'rgba(201, 203, 207, 0.8)'),
            line: {
                color: '#fff',
                width: 2
            }
        },
        textposition: 'inside',
        textinfo: 'label+percent',
        hovertemplate: '<b>%{label}</b><br>' +
                       'Quantity: %{value} pcs<br>' +
                       'Percentage: %{percent}<br>' +
                       '<extra></extra>',
        pull: [0.05, 0, 0, 0, 0], // Slightly pull out the first slice
        rotation: 90
    };
    
    const layout = {
        ...defaultLayout,
        title: {
            text: '<b>🥧 DEFECT CATEGORY ANALYSIS</b>',
            font: { size: 18, color: '#2c3e50', weight: 'bold' },
            x: 0.5,
            xanchor: 'center',
            y: 0.95
        },
        showlegend: true,
        legend: {
            orientation: 'v',
            x: 1.05,
            y: 0.5,
            xanchor: 'left',
            yanchor: 'middle',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            bordercolor: 'rgba(0, 0, 0, 0.1)',
            borderwidth: 1,
            borderRadius: 8,
            font: { size: 12, weight: 'bold' }
        },
        annotations: [
            {
                text: `<b>Total<br>${categoryTotal.toLocaleString()} pcs</b>`,
                x: 0.5,
                y: 0.5,
                font: { size: 16, color: '#2c3e50', weight: 'bold' },
                showarrow: false
            }
        ],
        hovermode: 'closest'
    };
    
    const config = {
        ...defaultConfig,
        toImageButtonOptions: {
            format: 'png',
            filename: 'category_chart',
            height: 400,
            width: 600
        }
    };
    
    Plotly.newPlot('categoryChart', [pieTrace], layout, config).then(() => {
        // Add animation
        Plotly.animate('categoryChart', {
            data: [pieTrace],
            traces: [0],
            layout: layout
        }, {
            transition: {
                duration: 1000,
                easing: 'elastic-out'
            },
            frame: {
                duration: 1000
            }
        });
    });
    
    // Update breakdown
    const breakdownHTML = data.map(item => {
        const percentage = (item.quantity / categoryTotal * 100).toFixed(0);
        const emoji = {
            'UPPER': '🔴',
            'SOLE': '🟠',
            'FINISHING': '🟡',
            'SIZING': '🟢',
            'OTHERS': '⚪'
        };
        
        // Check if details exist and is an array
        const detailsList = (item.details && Array.isArray(item.details)) 
            ? item.details.map(detail => 
                `<li>• ${detail.defect_name}: ${detail.quantity}</li>`
              ).join('')
            : '<li>• No details available</li>';
        
        return `
            <div class="breakdown-item">
                <div class="breakdown-header">
                    ${emoji[item.category] || '⚪'} 
                    <strong>${item.category} DEFECTS</strong>
                    <span class="breakdown-total">${item.quantity} pcs (${percentage}%)</span>
                </div>
                <ul class="breakdown-details">
                    ${detailsList}
                </ul>
            </div>
        `;
    }).join('');
    
    document.getElementById('categoryBreakdown').innerHTML = `
        <h4>BREAKDOWN:</h4>
        ${breakdownHTML}
    `;
    
    // Update insight
    const topCategory = data.sort((a, b) => b.quantity - a.quantity)[0];
    if (topCategory) {
        document.getElementById('categoryInsights').innerHTML = `
            <i class="fas fa-lightbulb"></i>
            <strong>📌 Action Priority:</strong><br>
            1. ${topCategory.category} Department (${(topCategory.quantity / categoryTotal * 100).toFixed(0)}% dari total defect)
        `;
    }
}

// Update Action Items
function updateActionItems(items) {
    const priorityEmoji = {
        'URGENT': '🔴',
        'MONITOR': '🟡',
        'GOOD': '🟢'
    };
    
    const statusBadge = {
        'In Progress': '<span class="badge badge-warning">⏳ In Progress</span>',
        'Under Investigation': '<span class="badge badge-info">🔍 Under Investigation</span>',
        'Completed': '<span class="badge badge-success">✅ Completed</span>'
    };
    
    const html = items.map(item => `
        <div class="action-item priority-${item.priority.toLowerCase()}">
            <div class="action-header">
                ${priorityEmoji[item.priority]} <strong>${item.priority}</strong> - ${item.title}
            </div>
            <div class="action-body">
                ${item.root_cause ? `<p><strong>Root Cause:</strong> ${item.root_cause}</p>` : ''}
                ${item.action ? `<p><strong>Action:</strong> ${item.action}</p>` : ''}
                ${item.success ? `<p><strong>Success:</strong> ${item.success}</p>` : ''}
                ${item.continue ? `<p><strong>Continue:</strong> ${item.continue}</p>` : ''}
                <div class="action-footer">
                    ${item.pic ? `<span><strong>PIC:</strong> ${item.pic}</span>` : ''}
                    ${item.target_date ? `<span><strong>Target:</strong> ${item.target_date}</span>` : ''}
                    ${item.status ? statusBadge[item.status] || item.status : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    document.getElementById('actionItemsContainer').innerHTML = html || '<p class="text-muted">No action items at this time.</p>';
}

// Load recent inspections
async function loadRecentInspections(page = 1) {
    try {
        const response = await fetch(`${API_URL}/qc-dashboard/recent?page=${page}&limit=10`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch recent inspections');
        }
        
        const result = await response.json();
        const inspections = result.data || [];
        const pagination = result.pagination || { page: 1, pages: 1 };
        
        // Update table
        const tbody = document.getElementById('recentInspectionsTable');
        
        if (!inspections || inspections.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center">No inspections found</td></tr>';
            return;
        }
        
        tbody.innerHTML = inspections.map(insp => {
            const decisionBadge = {
                'RELEASE': '<span class="badge badge-success">RELEASE</span>',
                'REWORK': '<span class="badge badge-warning">REWORK</span>',
                'REJECT': '<span class="badge badge-danger">REJECT</span>'
            };
            
            const shiftLabel = {
                1: 'Pagi',
                2: 'Siang',
                3: 'Malam'
            };
            
            return `
                <tr>
                    <td>${new Date(insp.inspection_date).toLocaleDateString('id-ID')}</td>
                    <td>${insp.wo_number || '-'}</td>
                    <td>${insp.product_name || insp.product_model}</td>
                    <td>${shiftLabel[insp.shift] || insp.shift}</td>
                    <td>${insp.total_inspected || 0} pcs</td>
                    <td class="text-danger"><strong>${insp.total_defect || 0} pcs</strong></td>
                    <td><strong>${Number(insp.defect_rate || 0).toFixed(2)}%</strong></td>
                    <td>${decisionBadge[insp.decision] || '-'}</td>
                    <td>${insp.inspector || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewInspectionDetails(${insp.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Update pagination
        updatePagination(pagination, loadRecentInspections);
        
    } catch (error) {
        console.error('Error loading recent inspections:', error);
        document.getElementById('recentInspectionsTable').innerHTML = 
            '<tr><td colspan="10" class="text-center text-danger">Error loading inspections</td></tr>';
    }
}

// Update pagination
function updatePagination(pagination, loadFunction) {
    const container = document.getElementById('inspectionPagination');
    
    if (pagination.pages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination">';
    
    // Previous button
    if (pagination.page > 1) {
        html += `<button class="btn btn-sm btn-secondary" onclick="${loadFunction.name}(${pagination.page - 1})">
            <i class="fas fa-chevron-left"></i> Previous
        </button>`;
    }
    
    // Page numbers
    html += `<span class="pagination-info">Page ${pagination.page} of ${pagination.pages}</span>`;
    
    // Next button
    if (pagination.page < pagination.pages) {
        html += `<button class="btn btn-sm btn-secondary" onclick="${loadFunction.name}(${pagination.page + 1})">
            Next <i class="fas fa-chevron-right"></i>
        </button>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// View inspection details
async function viewInspectionDetails(id) {
    try {
        const response = await fetch(`${API_URL}/qc-inspections/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch inspection details');
        }
        
        const result = await response.json();
        const inspection = result.data;
        
        // Build details HTML
        const decisionBadge = {
            'RELEASE': '<span class="badge badge-success">RELEASE</span>',
            'REWORK': '<span class="badge badge-warning">REWORK</span>',
            'REJECT': '<span class="badge badge-danger">REJECT</span>'
        };
        
        const shiftLabel = {
            1: 'Pagi',
            2: 'Siang',
            3: 'Malam'
        };
        
        let defectsHtml = '';
        if (inspection.defects && inspection.defects.length > 0) {
            const defectsByCategory = {};
            inspection.defects.forEach(d => {
                if (!defectsByCategory[d.category]) {
                    defectsByCategory[d.category] = [];
                }
                defectsByCategory[d.category].push(d);
            });
            
            defectsHtml = Object.keys(defectsByCategory).map(category => {
                const categoryIcon = {
                    'UPPER': '👟',
                    'SOLE': '👣',
                    'FINISHING': '🎨',
                    'SIZING': '📏',
                    'OTHERS': '⚠️'
                };
                
                return `
                    <div class="defect-category-section">
                        <h4>${categoryIcon[category] || '•'} ${category} DEFECTS</h4>
                        <ul class="defect-list">
                            ${defectsByCategory[category].map(d => `
                                <li>
                                    <strong>${d.defect_name}:</strong> 
                                    <span class="badge badge-danger">${d.quantity} pcs</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }).join('');
        }
        
        const html = `
            <div class="inspection-details">
                <div class="details-grid">
                    <div class="detail-item">
                        <label>Inspection Date:</label>
                        <strong>${new Date(inspection.inspection_date).toLocaleDateString('id-ID')}</strong>
                    </div>
                    <div class="detail-item">
                        <label>Shift:</label>
                        <strong>${shiftLabel[inspection.shift] || inspection.shift}</strong>
                    </div>
                    <div class="detail-item">
                        <label>WO Number:</label>
                        <strong>${inspection.wo_number || '-'}</strong>
                    </div>
                    <div class="detail-item">
                        <label>Product:</label>
                        <strong>${inspection.product_name || inspection.product_model}</strong>
                    </div>
                    <div class="detail-item">
                        <label>Total Inspected:</label>
                        <strong>${inspection.total_inspected} pcs</strong>
                    </div>
                    <div class="detail-item">
                        <label>Total Defects:</label>
                        <strong class="text-danger">${inspection.total_defect} pcs</strong>
                    </div>
                    <div class="detail-item">
                        <label>Defect Rate:</label>
                        <strong class="text-warning">${inspection.defect_rate.toFixed(2)}%</strong>
                    </div>
                    <div class="detail-item">
                        <label>Decision:</label>
                        ${decisionBadge[inspection.decision]}
                    </div>
                    <div class="detail-item">
                        <label>Inspector:</label>
                        <strong>${inspection.inspector}</strong>
                    </div>
                    <div class="detail-item">
                        <label>Supervisor:</label>
                        <strong>${inspection.supervisor || '-'}</strong>
                    </div>
                </div>
                
                ${inspection.notes ? `
                    <div class="notes-section">
                        <h4>Notes:</h4>
                        <p>${inspection.notes}</p>
                    </div>
                ` : ''}
                
                <div class="defects-section">
                    <h3>Defects Details</h3>
                    ${defectsHtml || '<p class="text-muted">No defects recorded</p>'}
                </div>
            </div>
        `;
        
        document.getElementById('inspectionDetailsContent').innerHTML = html;
        document.getElementById('inspectionDetailsModal').style.display = 'block';
        
    } catch (error) {
        console.error('Error fetching inspection details:', error);
        alert('Error loading inspection details');
    }
}

// Close inspection details modal
function closeInspectionDetailsModal() {
    document.getElementById('inspectionDetailsModal').style.display = 'none';
}

// Make functions global
window.viewInspectionDetails = viewInspectionDetails;
window.closeInspectionDetailsModal = closeInspectionDetailsModal;
window.loadRecentInspections = loadRecentInspections;

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load dashboard
    loadDashboard();
    
    // Load recent inspections
    loadRecentInspections();
    
    // Filter change listeners
    document.getElementById('filterPeriod').addEventListener('change', loadDashboard);
    document.getElementById('filterProduct').addEventListener('change', loadDashboard);
    document.getElementById('filterShift').addEventListener('change', loadDashboard);
    
    // Refresh button
    const btnRefresh = document.getElementById('btnRefresh');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', function() {
            loadDashboard();
            loadRecentInspections();
        });
    }
    
    // Export buttons
    const btnExportPdf = document.getElementById('btnExportPdf');
    if (btnExportPdf) {
        btnExportPdf.addEventListener('click', function() {
            alert('Export PDF feature coming soon!');
        });
    }
    
    const btnExportExcel = document.getElementById('btnExportExcel');
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', function() {
            alert('Export Excel feature coming soon!');
        });
    }
});

// ===========================
// METRICS UPDATE FUNCTION
// ===========================

/**
 * Update dashboard metrics with proper loading state handling
 */
function updateMetrics(metrics) {
    // Update Total Inspected
    const totalInspectedEl = document.getElementById('metricTotalInspected');
    if (totalInspectedEl) {
        totalInspectedEl.textContent = (metrics.totalInspected || 0).toLocaleString();
    }

    // Update Total Rejected
    const totalRejectedEl = document.getElementById('metricTotalRejected');
    if (totalRejectedEl) {
        totalRejectedEl.textContent = (metrics.totalRejected || 0).toLocaleString();
    }

    // Update Reject Rate
    const rejectRateEl = document.getElementById('metricRejectRate');
    if (rejectRateEl) {
        const rate = parseFloat(metrics.rejectRate) || 0;
        rejectRateEl.textContent = rate.toFixed(1) + '%';
    }

    // Update change indicators
    const inspectedChangeEl = document.getElementById('metricInspectedChange');
    if (inspectedChangeEl && metrics.inspectedChange !== undefined) {
        const change = metrics.inspectedChange;
        const isPositive = change >= 0;
        inspectedChangeEl.className = `metric-change ${isPositive ? 'positive' : 'negative'}`;
        inspectedChangeEl.innerHTML = `
            <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
            ${Math.abs(change).toFixed(1)}% vs last period
        `;
    }

    const rejectedChangeEl = document.getElementById('metricRejectedChange');
    if (rejectedChangeEl && metrics.rejectedChange !== undefined) {
        const change = metrics.rejectedChange;
        const isPositive = change >= 0; // For rejected, positive means increase (worse)
        rejectedChangeEl.className = `metric-change ${isPositive ? 'negative' : 'positive'}`;
        rejectedChangeEl.innerHTML = `
            <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
            ${Math.abs(change).toFixed(1)}% vs last period
        `;
    }

    const rateChangeEl = document.getElementById('metricRateChange');
    if (rateChangeEl && metrics.rateChange !== undefined) {
        const change = metrics.rateChange;
        const isPositive = change <= 0; // For rate, negative change is positive (improvement)
        rateChangeEl.className = `metric-change ${isPositive ? 'positive' : 'negative'}`;
        rateChangeEl.innerHTML = `
            <i class="fas fa-arrow-${isPositive ? 'down' : 'up'}"></i>
            ${Math.abs(change).toFixed(1)}% vs last period
        `;
    }
}

// ===========================
// ENHANCED LOADING STATES
// ===========================

/**
 * Show loading state for the entire dashboard
 */
function showLoading() {
    // Show skeleton loading for metric cards
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach(card => {
        card.setAttribute('data-loading', 'true');
        const valueElement = card.querySelector('.metric-value');
        const changeElement = card.querySelector('.metric-change');

        if (valueElement && !valueElement.querySelector('.skeleton')) {
            valueElement.innerHTML = '<div class="skeleton skeleton-text"></div>';
        }
        if (changeElement && !changeElement.querySelector('.skeleton')) {
            changeElement.innerHTML = '<div class="skeleton skeleton-small"></div>';
        }
    });

    // Show loading for charts
    showChartLoading();
}

/**
 * Hide loading state for the entire dashboard
 */
function hideLoading() {
    // Hide skeleton loading for metric cards
    const metricCards = document.querySelectorAll('.metric-card[data-loading="true"]');
    metricCards.forEach(card => {
        card.removeAttribute('data-loading');
    });

    // Hide chart loading
    hideChartLoading();
}

/**
 * Show loading overlay for charts
 */
function showChartLoading() {
    const chartContainers = document.querySelectorAll('.chart-container');

    chartContainers.forEach(container => {
        // Remove existing overlay if present
        const existingOverlay = container.querySelector('.chart-loading-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.className = 'chart-loading-overlay';
        overlay.innerHTML = `
            <div class="chart-loading-content">
                <div class="chart-loading-spinner">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="chart-loading-text">Loading chart data...</div>
                <div class="chart-loading-bars">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
        `;

        container.style.position = 'relative';
        container.appendChild(overlay);
    });
}

/**
 * Hide loading overlay for charts
 */
function hideChartLoading() {
    const overlays = document.querySelectorAll('.chart-loading-overlay');
    overlays.forEach(overlay => {
        overlay.remove();
    });
}

/**
 * Refresh specific charts
 */
function refreshParetoChart() {
    // Show loading for pareto chart
    showChartLoading();

    // Get current filter values
    const period = document.getElementById('filterPeriod')?.value || 'current';
    const product = document.getElementById('filterProduct')?.value || '';
    const shift = document.getElementById('filterShift')?.value || '';

    // Build query params
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (product) params.append('product', product);
    if (shift) params.append('shift', shift);

    // Fetch pareto data
    fetch(`${API_URL}/qc-dashboard?${params.toString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.success && result.paretoData) {
            updateParetoChart(result.paretoData);
        }
    })
    .catch(error => {
        console.error('Error refreshing pareto chart:', error);
        showError('Failed to refresh pareto chart');
    })
    .finally(() => {
        hideChartLoading();
    });
}

function refreshTrendChart() {
    // Show loading for trend chart
    showChartLoading();

    // Get current filter values
    const period = document.getElementById('filterPeriod')?.value || 'current';
    const product = document.getElementById('filterProduct')?.value || '';
    const shift = document.getElementById('filterShift')?.value || '';

    // Build query params
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (product) params.append('product', product);
    if (shift) params.append('shift', shift);

    // Fetch trend data
    fetch(`${API_URL}/qc-dashboard?${params.toString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.success && result.trendData) {
            updateTrendChart(result.trendData);
        }
    })
    .catch(error => {
        console.error('Error refreshing trend chart:', error);
        showError('Failed to refresh trend chart');
    })
    .finally(() => {
        hideChartLoading();
    });
}

function refreshCategoryChart() {
    // Show loading for category chart
    showChartLoading();

    // Get current filter values
    const period = document.getElementById('filterPeriod')?.value || 'current';
    const product = document.getElementById('filterProduct')?.value || '';
    const shift = document.getElementById('filterShift')?.value || '';

    // Build query params
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (product) params.append('product', product);
    if (shift) params.append('shift', shift);

    // Fetch category data
    fetch(`${API_URL}/qc-dashboard?${params.toString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.success && result.categoryData) {
            updateCategoryChart(result.categoryData);
        }
    })
    .catch(error => {
        console.error('Error refreshing category chart:', error);
        showError('Failed to refresh category chart');
    })
    .finally(() => {
        hideChartLoading();
    });
}
