// routes/autoNumber.js - API endpoints for getting next auto numbers
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
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
} = require('../utils/autoIncrement');

// Get next Product SKU
router.get('/product-sku', authenticateToken, async (req, res) => {
    try {
        const sku = await generateProductSKU();
        res.json({ success: true, number: sku });
    } catch (error) {
        console.error('Error generating product SKU:', error);
        res.status(500).json({ success: false, message: 'Failed to generate SKU' });
    }
});

// Get next Material SKU
router.get('/material-sku', authenticateToken, async (req, res) => {
    try {
        const sku = await generateMaterialSKU();
        res.json({ success: true, number: sku });
    } catch (error) {
        console.error('Error generating material SKU:', error);
        res.status(500).json({ success: false, message: 'Failed to generate SKU' });
    }
});

// Get next Work Order Number
router.get('/wo-number', authenticateToken, async (req, res) => {
    try {
        const woNumber = await generateWONumber();
        res.json({ success: true, number: woNumber });
    } catch (error) {
        console.error('Error generating WO number:', error);
        res.status(500).json({ success: false, message: 'Failed to generate WO number' });
    }
});

// Get next Sales Order Number
router.get('/so-number', authenticateToken, async (req, res) => {
    try {
        const soNumber = await generateSONumber();
        res.json({ success: true, number: soNumber });
    } catch (error) {
        console.error('Error generating SO number:', error);
        res.status(500).json({ success: false, message: 'Failed to generate SO number' });
    }
});

// Get next Purchase Order Number
router.get('/po-number', authenticateToken, async (req, res) => {
    try {
        const poNumber = await generatePONumber();
        res.json({ success: true, number: poNumber });
    } catch (error) {
        console.error('Error generating PO number:', error);
        res.status(500).json({ success: false, message: 'Failed to generate PO number' });
    }
});

// Get next Shipment Number
router.get('/shipment-number', authenticateToken, async (req, res) => {
    try {
        const shipmentNumber = await generateShipmentNumber();
        res.json({ success: true, number: shipmentNumber });
    } catch (error) {
        console.error('Error generating shipment number:', error);
        res.status(500).json({ success: false, message: 'Failed to generate shipment number' });
    }
});

// Get next Payment Number
router.get('/payment-number', authenticateToken, async (req, res) => {
    try {
        const paymentNumber = await generatePaymentNumber();
        res.json({ success: true, number: paymentNumber });
    } catch (error) {
        console.error('Error generating payment number:', error);
        res.status(500).json({ success: false, message: 'Failed to generate payment number' });
    }
});

// Get next Customer Code
router.get('/customer-code', authenticateToken, async (req, res) => {
    try {
        const customerCode = await generateCustomerCode();
        res.json({ success: true, number: customerCode });
    } catch (error) {
        console.error('Error generating customer code:', error);
        res.status(500).json({ success: false, message: 'Failed to generate customer code' });
    }
});

// Get next Supplier Code
router.get('/supplier-code', authenticateToken, async (req, res) => {
    try {
        const supplierCode = await generateSupplierCode();
        res.json({ success: true, number: supplierCode });
    } catch (error) {
        console.error('Error generating supplier code:', error);
        res.status(500).json({ success: false, message: 'Failed to generate supplier code' });
    }
});

// Get next Batch Number
router.get('/batch-number', authenticateToken, async (req, res) => {
    try {
        const batchNumber = await generateBatchNumber();
        res.json({ success: true, number: batchNumber });
    } catch (error) {
        console.error('Error generating batch number:', error);
        res.status(500).json({ success: false, message: 'Failed to generate batch number' });
    }
});

module.exports = router;
