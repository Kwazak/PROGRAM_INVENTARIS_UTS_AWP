/**
 * Example Usage of Modular Structure
 * Contoh penggunaan struktur modular baru
 */

// ============================================
// 1. IMPORT MODULES
// ============================================

const { config, constants, helpers, utils, middleware } = require('./src');

// Destructure untuk kemudahan
const { ResponseHelper, logger } = helpers;
const { ValidationUtil, DateUtil, StringUtil, PaginationUtil } = utils;
const { ROLES, PERMISSIONS, ORDER_STATUS } = constants;
const { ErrorHandler, validate } = middleware;

// ============================================
// 2. CONTOH PENGGUNAAN CONFIG
// ============================================

function exampleConfig() {
    console.log('\n=== CONFIG EXAMPLE ===');
    
    // Server config
    console.log('Server Port:', config.server.port);
    console.log('Environment:', config.server.env);
    console.log('JWT Secret:', config.server.jwtSecret);
    
    // Database config
    console.log('Database Name:', config.database.dbConfig.database);
    console.log('Database Host:', config.database.dbConfig.host);
}

// ============================================
// 3. CONTOH PENGGUNAAN CONSTANTS
// ============================================

function exampleConstants() {
    console.log('\n=== CONSTANTS EXAMPLE ===');
    
    // Roles
    console.log('Admin Role:', ROLES.ADMIN);
    console.log('Manager Role:', ROLES.MANAGER);
    
    // Permissions
    console.log('Users View Permission:', PERMISSIONS.USERS_VIEW);
    console.log('Products Edit Permission:', PERMISSIONS.PRODUCTS_EDIT);
    
    // Status
    console.log('Order Completed:', ORDER_STATUS.COMPLETED);
    console.log('Order Pending:', ORDER_STATUS.PENDING);
}

// ============================================
// 4. CONTOH PENGGUNAAN HELPERS
// ============================================

function exampleHelpers(req, res) {
    console.log('\n=== HELPERS EXAMPLE ===');
    
    // Response Helper
    const users = [{ id: 1, name: 'John' }];
    ResponseHelper.success(res, users, 'Users retrieved successfully');
    
    // Logger
    logger.info('User logged in', { userId: 123 });
    logger.success('Operation completed');
    logger.warn('Low stock detected', { productId: 456 });
    logger.error('Failed to process order', { orderId: 789 });
}

// ============================================
// 5. CONTOH PENGGUNAAN UTILS
// ============================================

function exampleUtils() {
    console.log('\n=== UTILS EXAMPLE ===');
    
    // Validation
    const email = 'test@example.com';
    console.log('Is valid email:', ValidationUtil.isValidEmail(email));
    
    const phone = '081234567890';
    console.log('Is valid phone:', ValidationUtil.isValidPhone(phone));
    
    // Date
    const today = DateUtil.getCurrentDate();
    console.log('Today:', today);
    
    const nextWeek = DateUtil.addDays(new Date(), 7);
    console.log('Next week:', DateUtil.formatDate(nextWeek));
    
    // String
    const slug = StringUtil.toSlug('Hello World 123');
    console.log('Slug:', slug);
    
    const currency = StringUtil.formatCurrency(1000000);
    console.log('Currency:', currency);
    
    const autoNumber = StringUtil.generateAutoNumber('INV', new Date(), 1);
    console.log('Auto Number:', autoNumber);
}

// ============================================
// 6. CONTOH PENGGUNAAN PAGINATION
// ============================================

function examplePagination(req, res) {
    console.log('\n=== PAGINATION EXAMPLE ===');
    
    // Get pagination params dari request
    const paginationParams = PaginationUtil.getParams(req);
    console.log('Pagination Params:', paginationParams);
    
    // Gunakan untuk query
    const query = `SELECT * FROM users ${PaginationUtil.getSqlClause(paginationParams)}`;
    console.log('SQL Query:', query);
    
    // Build meta untuk response
    const meta = PaginationUtil.buildMeta(
        paginationParams.page,
        paginationParams.pageSize,
        100 // total items
    );
    console.log('Pagination Meta:', meta);
}

// ============================================
// 7. CONTOH ROUTE DENGAN ERROR HANDLER
// ============================================

const express = require('express');
const router = express.Router();

// Route dengan async error handling
router.get('/users', ErrorHandler.asyncHandler(async (req, res) => {
    // Get pagination
    const pagination = PaginationUtil.getParams(req);
    
    // Query database (example)
    const users = await getUsersFromDB(pagination);
    const totalUsers = await getTotalUsersCount();
    
    // Build pagination meta
    const meta = PaginationUtil.buildMeta(
        pagination.page,
        pagination.pageSize,
        totalUsers
    );
    
    // Send response
    return ResponseHelper.paginated(res, users, meta, 'Users retrieved successfully');
}));

// Route dengan validation
router.post('/users', 
    // Validation rules (using express-validator)
    [
        body('email').isEmail().withMessage('Invalid email'),
        body('username').isLength({ min: 3 }).withMessage('Username min 3 characters'),
        validate // Apply validation middleware
    ],
    ErrorHandler.asyncHandler(async (req, res) => {
        const { email, username } = req.body;
        
        // Additional validation
        if (!ValidationUtil.isValidEmail(email)) {
            return ResponseHelper.validationError(res, { email: 'Invalid email format' });
        }
        
        // Create user
        const user = await createUser({ email, username });
        
        // Log activity
        logger.success('User created', { userId: user.id, username });
        
        // Send response
        return ResponseHelper.created(res, user, 'User created successfully');
    })
);

// ============================================
// 8. CONTOH SERVICE LAYER (Best Practice)
// ============================================

class UserService {
    /**
     * Get all users with pagination
     */
    static async getAllUsers(paginationParams) {
        const { limit, offset } = paginationParams;
        
        const query = `
            SELECT id, username, email, role, status, created_at
            FROM users
            WHERE status = 'active'
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const [users] = await config.database.promisePool.query(query, [limit, offset]);
        
        logger.info('Users retrieved', { count: users.length });
        
        return users;
    }
    
    /**
     * Create new user
     */
    static async createUser(userData) {
        const { username, email, password, role } = userData;
        
        // Validate
        const validation = ValidationUtil.validateRequired(userData, ['username', 'email', 'password']);
        if (!validation.isValid) {
            throw new Error('Validation failed: ' + JSON.stringify(validation.errors));
        }
        
        // Check email
        if (!ValidationUtil.isValidEmail(email)) {
            throw new Error('Invalid email format');
        }
        
        // Hash password
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, config.server.bcryptRounds);
        
        // Insert to database
        const query = `
            INSERT INTO users (username, email, password, role, created_at)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const [result] = await config.database.promisePool.query(query, [
            username,
            email,
            hashedPassword,
            role || ROLES.STAFF,
            DateUtil.getCurrentDateTime()
        ]);
        
        logger.success('User created', { userId: result.insertId, username });
        
        return {
            id: result.insertId,
            username,
            email,
            role: role || ROLES.STAFF
        };
    }
    
    /**
     * Check if user has permission
     */
    static hasPermission(user, permission) {
        // Check based on role
        if (user.role === ROLES.SUPER_ADMIN) {
            return true; // Super admin has all permissions
        }
        
        if (user.role === ROLES.ADMIN && permission.startsWith('users:')) {
            return true; // Admin can manage users
        }
        
        // Check specific permissions
        return user.permissions && user.permissions.includes(permission);
    }
}

// ============================================
// 9. DUMMY FUNCTIONS
// ============================================

async function getUsersFromDB(pagination) {
    // Dummy function
    return [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];
}

async function getTotalUsersCount() {
    return 100; // Dummy total
}

async function createUser(data) {
    return { id: 1, ...data }; // Dummy created user
}

// ============================================
// 10. EXPORT
// ============================================

module.exports = {
    exampleConfig,
    exampleConstants,
    exampleHelpers,
    exampleUtils,
    examplePagination,
    UserService,
    router
};

// ============================================
// 11. CARA MENJALANKAN
// ============================================

/*
// Di file lain, import dan gunakan:

const examples = require('./examples');

// Run examples
examples.exampleConfig();
examples.exampleConstants();
examples.exampleUtils();

// Use service
const users = await examples.UserService.getAllUsers({ limit: 10, offset: 0 });

// Use router
app.use('/api', examples.router);
*/
