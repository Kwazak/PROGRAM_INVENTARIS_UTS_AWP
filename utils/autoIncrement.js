// utils/autoIncrement.js - Auto-increment ID Generator
const db = require('../db');

/**
 * Generate auto-increment number based on table and field
 * @param {string} table - Table name
 * @param {string} field - Field name (e.g., 'wo_number', 'sku_code')
 * @param {string} prefix - Prefix for the number (e.g., 'WO-', 'PRD', 'RM')
 * @param {number} length - Total length of numeric part (default: 5)
 * @returns {Promise<string>} Generated number
 */
async function generateAutoNumber(table, field, prefix, length = 5) {
    try {
        // Get the last number from database
        const query = `SELECT ${field} FROM ${table} WHERE ${field} LIKE ? ORDER BY id DESC LIMIT 1`;
        const [rows] = await db.query(query, [`${prefix}%`]);
        
        let nextNumber = 1;
        
        if (rows.length > 0 && rows[0][field]) {
            // Extract number from last record
            const lastNumber = rows[0][field];
            const numericPart = lastNumber.replace(prefix, '').replace(/[^0-9]/g, '');
            nextNumber = parseInt(numericPart || '0') + 1;
        }
        
        // Pad with zeros
        const paddedNumber = nextNumber.toString().padStart(length, '0');
        
        return `${prefix}${paddedNumber}`;
    } catch (error) {
        console.error(`Error generating auto number for ${table}.${field}:`, error);
        // Fallback to timestamp-based number
        const timestamp = Date.now().toString().slice(-length);
        return `${prefix}${timestamp}`;
    }
}

/**
 * Generate Product SKU Code
 * Format: PRD00001, PRD00002, etc.
 */
async function generateProductSKU() {
    return await generateAutoNumber('products', 'sku_code', 'PRD', 5);
}

/**
 * Generate Material SKU Code
 * Format: RM00001, RM00002, etc.
 */
async function generateMaterialSKU() {
    return await generateAutoNumber('raw_materials', 'sku_code', 'RM', 5);
}

/**
 * Generate Work Order Number
 * Format: WO-291001, WO-291002, etc. (WO-DDMMNN)
 */
async function generateWONumber() {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `WO-${day}${month}`;
    
    return await generateAutoNumber('work_orders', 'wo_number', prefix, 3);
}

/**
 * Generate Sales Order Number
 * Format: SO-291001, SO-291002, etc. (SO-DDMMNN)
 */
async function generateSONumber() {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `SO-${day}${month}`;
    
    return await generateAutoNumber('sales_orders', 'so_number', prefix, 3);
}

/**
 * Generate Purchase Order Number
 * Format: PO-291001, PO-291002, etc. (PO-DDMMNN)
 */
async function generatePONumber() {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `PO-${day}${month}`;
    
    return await generateAutoNumber('purchase_orders', 'po_number', prefix, 3);
}

/**
 * Generate Shipment Number
 * Format: SH-291001, SH-291002, etc. (SH-DDMMNN)
 */
async function generateShipmentNumber() {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `SH-${day}${month}`;
    
    return await generateAutoNumber('shipments', 'shipment_number', prefix, 3);
}

/**
 * Generate Payment Number
 * Format: PAY-291001, PAY-291002, etc. (PAY-DDMMNN)
 */
async function generatePaymentNumber() {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `PAY-${day}${month}`;
    
    return await generateAutoNumber('payments', 'payment_number', prefix, 3);
}

/**
 * Generate Customer Code
 * Format: CUST00001, CUST00002, etc.
 */
async function generateCustomerCode() {
    return await generateAutoNumber('customers', 'customer_code', 'CUST', 5);
}

/**
 * Generate Supplier Code
 * Format: SUP00001, SUP00002, etc.
 */
async function generateSupplierCode() {
    return await generateAutoNumber('suppliers', 'supplier_code', 'SUP', 5);
}

/**
 * Generate Batch Number for stock movements
 * Format: BATCH-2910-001, BATCH-2910-002, etc.
 */
async function generateBatchNumber() {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `BATCH-${day}${month}`;
    
    return await generateAutoNumber('stock_movements', 'batch_number', prefix, 3);
}

module.exports = {
    generateAutoNumber,
    generateProductSKU,
    generateMaterialSKU,
    generateWONumber,
    generateSONumber,
    generatePONumber,
    generateShipmentNumber,
    generatePaymentNumber,
    generateCustomerCode,
    generateSupplierCode,
    generateBatchNumber
};
