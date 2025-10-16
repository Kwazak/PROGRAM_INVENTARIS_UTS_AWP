// QC Inspection Form JavaScript
const API_URL = window.APP_CONFIG?.API_URL || 'http://localhost:3000/api';

// Get token from localStorage
const token = localStorage.getItem('token');

// Redirect to login if no token
if (!token) {
    window.location.href = '/login.html';
}

// Auto-calculate defect rate
function calculateDefectRate() {
    const totalInspected = parseInt(document.getElementById('totalInspected').value) || 0;
    document.getElementById('totalInspectedDisplay').textContent = totalInspected;
    
    let totalDefect = 0;
    
    // Sum all defect quantities
    document.querySelectorAll('.defect-qty:not([disabled])').forEach(input => {
        totalDefect += parseInt(input.value) || 0;
    });
    
    // Add others quantity
    totalDefect += parseInt(document.getElementById('othersQty').value) || 0;
    
    // Update display
    document.getElementById('totalDefect').textContent = totalDefect;
    
    // Calculate defect rate
    const defectRate = totalInspected > 0 ? (totalDefect / totalInspected * 100).toFixed(2) : 0;
    document.getElementById('defectRate').textContent = defectRate + '%';
    
    // Auto-select decision based on rate
    const radioRelease = document.querySelector('input[value="RELEASE"]');
    const radioRework = document.querySelector('input[value="REWORK"]');
    const radioReject = document.querySelector('input[value="REJECT"]');
    
    if (defectRate < 5) {
        radioRelease.checked = true;
    } else if (defectRate >= 5 && defectRate <= 10) {
        radioRework.checked = true;
    } else {
        radioReject.checked = true;
    }
}

// Enable/disable quantity input when checkbox is checked
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    document.getElementById('inspectionDate').valueAsDate = new Date();
    
    // Checkbox event listeners
    document.querySelectorAll('.defect-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const qtyInput = this.closest('.defect-item').querySelector('.defect-qty');
            if (this.checked) {
                qtyInput.disabled = false;
                qtyInput.focus();
            } else {
                qtyInput.disabled = true;
                qtyInput.value = '';
            }
            calculateDefectRate();
        });
    });
    
    // Quantity input event listeners
    document.querySelectorAll('.defect-qty').forEach(input => {
        input.addEventListener('input', calculateDefectRate);
    });
    
    document.getElementById('totalInspected').addEventListener('input', calculateDefectRate);
    document.getElementById('othersQty').addEventListener('input', calculateDefectRate);
    
    // Form submit handler
    document.getElementById('inspectionForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            // Collect defects data
            const defects = [];
            
            document.querySelectorAll('.defect-checkbox:checked').forEach(checkbox => {
                const category = checkbox.dataset.category;
                const defectName = checkbox.dataset.defect;
                const qtyInput = checkbox.closest('.defect-item').querySelector('.defect-qty');
                const qty = parseInt(qtyInput.value) || 0;
                
                if (qty > 0) {
                    defects.push({
                        category: category,
                        defect_name: defectName,
                        quantity: qty
                    });
                }
            });
            
            // Add others if exists
            const othersDetail = document.getElementById('othersDetail').value.trim();
            const othersQty = parseInt(document.getElementById('othersQty').value) || 0;
            
            if (othersQty > 0 && othersDetail) {
                defects.push({
                    category: 'OTHERS',
                    defect_name: othersDetail,
                    quantity: othersQty
                });
            }
            
            // Get decision
            const decision = document.querySelector('input[name="decision"]:checked').value;
            
            // Prepare data
            const inspectionData = {
                product_model: document.getElementById('productModel').value,
                inspection_date: document.getElementById('inspectionDate').value,
                shift: document.getElementById('shift').value,
                total_inspected: parseInt(document.getElementById('totalInspected').value),
                total_defect: parseInt(document.getElementById('totalDefect').textContent),
                defect_rate: parseFloat(document.getElementById('defectRate').textContent),
                decision: decision,
                inspector: document.getElementById('inspector').value,
                supervisor: document.getElementById('supervisor').value,
                defects: defects
            };
            
            // Validate
            if (defects.length === 0) {
                alert('Harap centang minimal satu defect dan isi quantity!');
                return;
            }
            
            // Submit to API
            const response = await fetch(`${API_URL}/qc-inspections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(inspectionData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('✅ Inspection berhasil disimpan!');
                // Redirect to dashboard
                window.location.href = '/qc-dashboard.html';
            } else {
                alert('❌ Error: ' + (result.message || 'Gagal menyimpan inspection'));
            }
            
        } catch (error) {
            console.error('Error submitting inspection:', error);
            alert('❌ Error: ' + error.message);
        }
    });
    
    // Reset form handler
    document.querySelector('button[type="reset"]').addEventListener('click', function() {
        setTimeout(() => {
            // Reset all qty inputs to disabled
            document.querySelectorAll('.defect-qty').forEach(input => {
                input.disabled = true;
                input.value = '';
            });
            
            // Reset calculations
            document.getElementById('totalDefect').textContent = '0';
            document.getElementById('totalInspectedDisplay').textContent = '0';
            document.getElementById('defectRate').textContent = '0.00%';
            
            // Reset date to today
            document.getElementById('inspectionDate').valueAsDate = new Date();
        }, 10);
    });
});
