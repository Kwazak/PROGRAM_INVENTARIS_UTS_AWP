// qc-inspection-production.js - QC Inspection Modal for Production Tracking
// Integrated with Production Tracking Form

// Global variables for QC Modal
let currentTrackingData = {
    workOrderId: null,
    productId: null,
    productModel: '',
    plannedQty: 0,
    trackingDate: '',
    shift: 1,
    quantityReject: 0
};

let qcInspections = []; // Array to store QC inspections for current tracking

// Defect mapping
const defectMapping = {
    'jahitan_lepas': { category: 'UPPER', name: 'Jahitan lepas' },
    'benang_nongol': { category: 'UPPER', name: 'Benang nongol' },
    'warna_belang': { category: 'UPPER', name: 'Warna belang' },
    'noda_lem': { category: 'UPPER', name: 'Noda lem' },
    'sole_miring': { category: 'SOLE', name: 'Sole miring' },
    'celah_upper_sole': { category: 'SOLE', name: 'Celah upper-sole' },
    'bonding_lemah': { category: 'SOLE', name: 'Bonding lemah' },
    'sole_retak': { category: 'SOLE', name: 'Sole retak' },
    'goresan': { category: 'FINISHING', name: 'Goresan' },
    'aksesoris_rusak': { category: 'FINISHING', name: 'Aksesoris rusak' }
};

// Initialize QC Modal functionality
function initQCInspectionModal() {
    // Setup checkbox event listeners
    document.querySelectorAll('.defect-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const defectId = this.id.replace('defect_', '');
            const qtyInput = document.getElementById(`qty_${defectId}`);
            
            if (qtyInput) {
                qtyInput.disabled = !this.checked;
                if (!this.checked) {
                    qtyInput.value = '';
                } else {
                    qtyInput.focus();
                }
                calculateQCDefectRate();
            }
        });
    });
    
    // Setup qty input event listeners
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('input', calculateQCDefectRate);
    });
    
    // Setup others qty input
    const othersQty = document.getElementById('qcOthersQty');
    if (othersQty) {
        othersQty.addEventListener('input', calculateQCDefectRate);
    }
    
    // Setup form submit
    const qcForm = document.getElementById('qcInspectionForm');
    if (qcForm) {
        qcForm.addEventListener('submit', handleQCInspectionSubmit);
    }
}

// Open QC Inspection Modal
function openQCInspectionModal() {
    // Get data from production tracking form
    const woNumberElement = document.getElementById('trackingWONumber');
    const productElement = document.getElementById('trackingProduct');
    const plannedElement = document.getElementById('trackingPlanned');
    const quantityRejectElement = document.getElementById('quantityReject');
    const trackingDateElement = document.getElementById('trackingDate');
    const trackingShiftElement = document.getElementById('trackingShift');
    
    const woNumber = woNumberElement ? woNumberElement.textContent : '-';
    const product = productElement ? productElement.textContent : '-';
    const planned = plannedElement ? plannedElement.textContent : '-';
    const quantityReject = quantityRejectElement && quantityRejectElement.value ? 
                           parseInt(quantityRejectElement.value) || 0 : 0;
    const trackingDate = trackingDateElement && trackingDateElement.value ? 
                         trackingDateElement.value : new Date().toISOString().split('T')[0];
    const trackingShift = trackingShiftElement && trackingShiftElement.value ? 
                          trackingShiftElement.value : '1';
    
    if (quantityReject === 0) {
        alert('Quantity reject is 0. No need for QC inspection.');
        return;
    }
    
    // Store current tracking data
    currentTrackingData.quantityReject = quantityReject;
    currentTrackingData.trackingDate = trackingDate;
    currentTrackingData.shift = trackingShift;
    
    // Fill QC modal info
    const qcWONumberElement = document.getElementById('qcWONumber');
    const qcProductElement = document.getElementById('qcProduct');
    const qcPlannedElement = document.getElementById('qcPlanned');
    const qcQuantityRejectElement = document.getElementById('qcQuantityReject');
    const qcMaxInspectElement = document.getElementById('qcMaxInspect');
    
    if (qcWONumberElement) qcWONumberElement.textContent = woNumber;
    if (qcProductElement) qcProductElement.textContent = product;
    if (qcPlannedElement) qcPlannedElement.textContent = planned;
    if (qcQuantityRejectElement) qcQuantityRejectElement.textContent = quantityReject;
    if (qcMaxInspectElement) qcMaxInspectElement.textContent = quantityReject;
    
    // Set default values
    const qcInspectionDateElement = document.getElementById('qcInspectionDate');
    const qcShiftElement = document.getElementById('qcShift');
    const qcTotalInspectedElement = document.getElementById('qcTotalInspected');
    
    if (qcInspectionDateElement) {
        qcInspectionDateElement.value = trackingDate;
    }
    if (qcShiftElement) {
        qcShiftElement.value = trackingShift;
    }
    if (qcTotalInspectedElement) {
        qcTotalInspectedElement.value = quantityReject;
        qcTotalInspectedElement.max = quantityReject;
    }
    
    // Reset form
    resetQCForm();
    
    // Show modal
    const qcModal = document.getElementById('qcInspectionModal');
    if (qcModal) {
        qcModal.style.display = 'block';
    }
}

// Close QC Inspection Modal
function closeQCInspectionModal() {
    const qcModal = document.getElementById('qcInspectionModal');
    if (qcModal) {
        qcModal.style.display = 'none';
    }
}

// Reset QC Form
function resetQCForm() {
    // Uncheck all checkboxes
    document.querySelectorAll('.defect-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Disable and clear all qty inputs
    document.querySelectorAll('.qty-input').forEach(input => {
        input.disabled = true;
        input.value = '';
    });
    
    // Clear others
    const othersDetailElement = document.getElementById('qcOthersDetail');
    const othersQtyElement = document.getElementById('qcOthersQty');
    
    if (othersDetailElement) {
        othersDetailElement.value = '';
    }
    if (othersQtyElement) {
        othersQtyElement.value = '';
    }
    
    // Clear inspector fields
    const inspectorElement = document.getElementById('qcInspector');
    const supervisorElement = document.getElementById('qcSupervisor');
    const notesElement = document.getElementById('qcNotes');
    
    if (inspectorElement) {
        inspectorElement.value = '';
    }
    if (supervisorElement) {
        supervisorElement.value = '';
    }
    if (notesElement) {
        notesElement.value = '';
    }
    
    // Reset summary
    const totalDefectElement = document.getElementById('qcTotalDefect');
    const defectRateElement = document.getElementById('qcDefectRate');
    const autoDecisionElement = document.getElementById('qcAutoDecision');
    
    if (totalDefectElement) {
        totalDefectElement.textContent = '0';
    }
    if (defectRateElement) {
        defectRateElement.textContent = '0%';
    }
    if (autoDecisionElement) {
        autoDecisionElement.textContent = '-';
        autoDecisionElement.className = 'badge badge-secondary';
        autoDecisionElement.style.fontSize = '1.5rem';
    }
    
    // Set default decision
    const decisionReject = document.getElementById('decision_reject');
    if (decisionReject) {
        decisionReject.checked = true;
    }
}

// Calculate Defect Rate
function calculateQCDefectRate() {
    let totalDefect = 0;
    
    // Sum all defect quantities
    document.querySelectorAll('.defect-checkbox').forEach(checkbox => {
        if (checkbox.checked) {
            const defectId = checkbox.id.replace('defect_', '');
            const qtyInput = document.getElementById(`qty_${defectId}`);
            if (qtyInput && qtyInput.value) {
                const qty = parseInt(qtyInput.value) || 0;
                totalDefect += qty;
            }
        }
    });
    
    // Add others quantity
    const othersQtyElement = document.getElementById('qcOthersQty');
    if (othersQtyElement && othersQtyElement.value) {
        const othersQty = parseInt(othersQtyElement.value) || 0;
        totalDefect += othersQty;
    }
    
    // Get total inspected
    const totalInspectedElement = document.getElementById('qcTotalInspected');
    const totalInspected = totalInspectedElement && totalInspectedElement.value ? 
                           parseInt(totalInspectedElement.value) || 0 : 0;
    
    // Calculate defect rate
    const defectRate = totalInspected > 0 ? (totalDefect / totalInspected * 100) : 0;
    
    // Update summary
    const totalDefectElement = document.getElementById('qcTotalDefect');
    const defectRateElement = document.getElementById('qcDefectRate');
    const autoDecisionElement = document.getElementById('qcAutoDecision');
    
    if (totalDefectElement) {
        totalDefectElement.textContent = totalDefect;
    }
    
    if (defectRateElement) {
        defectRateElement.textContent = defectRate.toFixed(2) + '%';
    }
    
    // Auto decision
    let autoDecision = '-';
    let decisionRadio = null;
    
    if (defectRate < 5) {
        autoDecision = 'RELEASE';
        decisionRadio = document.getElementById('decision_release');
    } else if (defectRate >= 5 && defectRate <= 10) {
        autoDecision = 'REWORK';
        decisionRadio = document.getElementById('decision_rework');
    } else {
        autoDecision = 'REJECT';
        decisionRadio = document.getElementById('decision_reject');
    }
    
    if (autoDecisionElement) {
        autoDecisionElement.textContent = autoDecision;
        
        // Update badge color
        autoDecisionElement.className = 'badge';
        if (autoDecision === 'RELEASE') {
            autoDecisionElement.classList.add('badge-success');
        } else if (autoDecision === 'REWORK') {
            autoDecisionElement.classList.add('badge-warning');
        } else if (autoDecision === 'REJECT') {
            autoDecisionElement.classList.add('badge-danger');
        } else {
            autoDecisionElement.classList.add('badge-secondary');
        }
    }
    
    // Auto select decision radio
    if (decisionRadio) {
        decisionRadio.checked = true;
    }
}

// Handle QC Inspection Form Submit
async function handleQCInspectionSubmit(e) {
    e.preventDefault();
    
    // Collect defects
    const defects = [];
    
    // Collect checked defects
    document.querySelectorAll('.defect-checkbox').forEach(checkbox => {
        if (checkbox.checked) {
            const defectId = checkbox.id.replace('defect_', '');
            const qtyInput = document.getElementById(`qty_${defectId}`);
            
            if (qtyInput && qtyInput.value) {
                const qty = parseInt(qtyInput.value) || 0;
                
                if (qty > 0 && defectMapping[defectId]) {
                    defects.push({
                        category: defectMapping[defectId].category,
                        defect_name: defectMapping[defectId].name,
                        quantity: qty
                    });
                }
            }
        }
    });
    
    // Add others if exists
    const othersDetailElement = document.getElementById('qcOthersDetail');
    const othersQtyElement = document.getElementById('qcOthersQty');
    
    const othersDetail = othersDetailElement ? othersDetailElement.value.trim() : '';
    const othersQty = othersQtyElement && othersQtyElement.value ? 
                      parseInt(othersQtyElement.value) || 0 : 0;
    
    if (othersQty > 0 && othersDetail) {
        defects.push({
            category: 'OTHERS',
            defect_name: othersDetail,
            quantity: othersQty
        });
    }
    
    // Validation
    if (defects.length === 0) {
        alert('Please select at least one defect with quantity > 0');
        return;
    }
    
    // Get form data
    const totalInspectedElement = document.getElementById('qcTotalInspected');
    const totalDefectElement = document.getElementById('qcTotalDefect');
    const defectRateElement = document.getElementById('qcDefectRate');
    const decisionElement = document.querySelector('input[name="decision"]:checked');
    const inspectorElement = document.getElementById('qcInspector');
    const supervisorElement = document.getElementById('qcSupervisor');
    const notesElement = document.getElementById('qcNotes');
    const inspectionDateElement = document.getElementById('qcInspectionDate');
    const shiftElement = document.getElementById('qcShift');
    
    if (!totalInspectedElement || !totalInspectedElement.value) {
        alert('Total inspected is required');
        return;
    }
    
    if (!inspectorElement || !inspectorElement.value.trim()) {
        alert('Inspector name is required');
        return;
    }
    
    if (!decisionElement) {
        alert('Please select a decision');
        return;
    }
    
    if (!inspectionDateElement || !inspectionDateElement.value) {
        alert('Inspection date is required');
        return;
    }
    
    if (!shiftElement || !shiftElement.value) {
        alert('Shift is required');
        return;
    }
    
    const totalInspected = parseInt(totalInspectedElement.value);
    const totalDefect = totalDefectElement ? parseInt(totalDefectElement.textContent) : 0;
    const defectRate = defectRateElement ? parseFloat(defectRateElement.textContent) : 0;
    const decision = decisionElement.value;
    const inspector = inspectorElement.value.trim();
    const supervisor = supervisorElement ? supervisorElement.value.trim() : '';
    const notes = notesElement ? notesElement.value.trim() : '';
    const inspectionDate = inspectionDateElement.value;
    const shift = shiftElement.value;
    
    // Create QC inspection object (will be saved later with production tracking)
    const qcInspection = {
        inspection_date: inspectionDate,
        shift: parseInt(shift),
        total_inspected: totalInspected,
        total_defect: totalDefect,
        defect_rate: defectRate,
        decision: decision,
        inspector: inspector,
        supervisor: supervisor,
        notes: notes,
        defects: defects,
        tempId: Date.now() // Temporary ID for display
    };
    
    // Add to qcInspections array
    qcInspections.push(qcInspection);
    
    // Update QC inspections count badge
    updateQCInspectionsList();
    
    // Close modal
    closeQCInspectionModal();
    
    // Show success message
    showNotification('QC Inspection added successfully. Remember to save the Production Tracking!', 'success');
}

// Update QC Inspections List
function updateQCInspectionsList() {
    const count = qcInspections.length;
    const countBadge = document.getElementById('qcInspectionCount');
    const listContainer = document.getElementById('qcInspectionsList');
    const listItems = document.getElementById('qcInspectionsItems');
    
    // Update count
    if (countBadge) {
        countBadge.textContent = count;
    }
    
    // Show/hide list
    if (count > 0) {
        listContainer.style.display = 'block';
        
        // Generate list items
        let html = '';
        qcInspections.forEach((qc, index) => {
            const decisionBadge = qc.decision === 'RELEASE' ? 'success' : 
                                  qc.decision === 'REWORK' ? 'warning' : 'danger';
            
            html += `
                <div class="qc-list-item">
                    <strong>Inspection #${index + 1}</strong> - 
                    Date: ${qc.inspection_date} | 
                    Shift: ${qc.shift} | 
                    Inspected: ${qc.total_inspected} pcs | 
                    Defect: ${qc.total_defect} pcs (${qc.defect_rate.toFixed(2)}%) |
                    <span class="badge badge-${decisionBadge}">${qc.decision}</span> |
                    Inspector: ${qc.inspector}
                </div>
            `;
        });
        
        listItems.innerHTML = html;
    } else {
        listContainer.style.display = 'none';
    }
}

// Show notification helper
function showNotification(message, type = 'info') {
    // Simple alert for now, can be enhanced with toast notifications
    if (type === 'success') {
        alert('✅ ' + message);
    } else if (type === 'error') {
        alert('❌ ' + message);
    } else {
        alert('ℹ️ ' + message);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initQCInspectionModal();
});

// Export functions for use in production.js
window.openQCInspectionModal = openQCInspectionModal;
window.closeQCInspectionModal = closeQCInspectionModal;
window.resetQCForm = resetQCForm;
window.qcInspections = qcInspections; // Make accessible to production.js
window.currentTrackingData = currentTrackingData;
