const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

// Import modular structure
const { config, helpers, middleware } = require('./src');
const { logger } = helpers;
const { ErrorHandler, requestLogger } = middleware;

const app = express();
const PORT = config.server.port;

// ============================================
// MIDDLEWARE
// ============================================

// Request logger (first middleware to catch all requests)
if (config.server.env === 'development') {
    app.use(requestLogger);
}

// Security
if (config.server.enableHelmet) {
    app.use(helmet({
        contentSecurityPolicy: false // Disable for development
    }));
}

// CORS
app.use(cors({
    origin: config.server.corsOrigin
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
if (config.server.enableCompression) {
    app.use(compression());
}

// Rate limiting
if (config.server.enableRateLimit) {
    const limiter = rateLimit({
        windowMs: config.server.rateLimitWindow,
        max: config.server.rateLimitMax,
        message: 'Too many requests from this IP, please try again later.'
    });
    app.use('/api/', limiter);
}

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// ROUTES
// ============================================

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Raw materials routes
app.use('/api/materials', require('./routes/materials'));
app.use('/api/raw-materials', require('./routes/materials')); // Alias for compatibility

// Stock movement routes
app.use('/api/stock', require('./routes/stock'));

// Supplier routes
app.use('/api/suppliers', require('./routes/suppliers'));

// Purchase order routes
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));

// Product routes
app.use('/api/products', require('./routes/products'));

// Bill of Materials routes
app.use('/api/bom', require('./routes/bom'));

// Work order routes
app.use('/api/work-orders', require('./routes/workOrders'));

// Production routes
app.use('/api/production', require('./routes/production'));

// Quality control routes
app.use('/api/qc', require('./routes/qualityControl'));

// Customer routes
app.use('/api/customers', require('./routes/customers'));

// Sales order routes
app.use('/api/sales-orders', require('./routes/salesOrders'));

// Shipment routes
app.use('/api/shipments', require('./routes/shipments'));

// Payment routes
app.use('/api/payments', require('./routes/payments'));

// Auto number generation routes
app.use('/api/auto-number', require('./routes/autoNumber'));

// Report routes
app.use('/api/reports', require('./routes/reports'));

// Dashboard routes
app.use('/api/dashboard', require('./routes/dashboard'));

// Notification routes
app.use('/api/notifications', require('./routes/notifications'));

// RBAC routes
app.use('/api/roles', require('./routes/roles'));
app.use('/api/permissions', require('./routes/permissions'));
app.use('/api/user-roles', require('./routes/userRoles'));
app.use('/api/users', require('./routes/users'));

// User Profile routes
app.use('/api/profile', require('./routes/profile'));

// QC Inspection routes
app.use('/api/qc-inspections', require('./routes/qc-inspections'));
app.use('/api/qc-dashboard', require('./routes/qc-dashboard'));

// ============================================
// SERVE HTML PAGES
// ============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ============================================
// SCHEDULED TASKS
// ============================================

// Daily stock check (Every day at 08:00)
cron.schedule('0 8 * * *', () => {
    console.log('[CRON] Running daily stock check...');
    // checkLowStock();
});

// Auto reorder suggestions (Every day at 09:00)
cron.schedule('0 9 * * *', () => {
    console.log('[CRON] Generating auto reorder suggestions...');
    // generateAutoReorderSuggestions();
});

// Work order reminders (Every day at 07:00)
cron.schedule('0 7 * * *', () => {
    console.log('[CRON] Sending work order reminders...');
    // sendWODueDateReminders();
});

// Database backup (Every day at 02:00)
cron.schedule('0 2 * * *', () => {
    console.log('[CRON] Running database backup...');
    // backupDatabase();
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(ErrorHandler.notFound);

// Global error handler
app.use(ErrorHandler.handle);

// ============================================
// START SERVER
// ============================================

const os = require('os');

function getNetworkAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push({
                    interface: name,
                    address: iface.address
                });
            }
        }
    }

    return addresses;
}

// Override database config untuk Railway MYSQL_URL
if (process.env.MYSQL_URL) {
    logger.info('Using MYSQL_URL from Railway environment');
    config.database.dbConfig = {
        connectionString: process.env.MYSQL_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
}

// Test database connection before starting server
config.database.testConnection().then((connected) => {
    if (!connected) {
        logger.error('Failed to connect to database. Server will not start.');
        process.exit(1);
    }

    // Listen on all network interfaces
    app.listen(PORT, config.server.host, () => {
        const networkAddresses = getNetworkAddresses();
        
        console.log('='.repeat(60));
        console.log('FACTORY INVENTORY SYSTEM - MODULAR VERSION');
        console.log('='.repeat(60));
        logger.success(`Server running on port ${PORT}`);
        logger.info(`Started at: ${new Date().toLocaleString('id-ID')}`);
        logger.info(`Environment: ${config.server.env}`);
        logger.info(`Database: ${config.database.dbConfig.database || 'railway'}`);
        console.log('='.repeat(60));
        
        // Local access
        console.log('\nLOCAL ACCESS:');
        console.log('   http://localhost:' + PORT);
        console.log('   http://127.0.0.1:' + PORT);
        
        // Network access
        if (networkAddresses.length > 0) {
            console.log('\nNETWORK ACCESS (from other devices on same WiFi):');
            networkAddresses.forEach((addr, index) => {
                console.log('\n   ' + (index + 1) + '. ' + addr.interface);
                console.log('      IP Address: ' + addr.address);
                console.log('      URL: http://' + addr.address + ':' + PORT);
            });
            
            console.log('\nQUICK START:');
            console.log('   1. Connect other device to same WiFi');
            console.log('   2. Open browser on that device');
            console.log('   3. Go to: http://' + networkAddresses[0].address + ':' + PORT);
            console.log('   4. Login with your credentials');
        } else {
            logger.warn('No network interfaces found! Make sure you are connected to WiFi or Ethernet.');
        }
        
        console.log('\n' + '='.repeat(60));
        logger.success('Server is ready! Press Ctrl+C to stop.\n');
    });
}).catch((error) => {
    logger.error('Database connection error:', error.message);
    process.exit(1);
});

module.exports = app;
