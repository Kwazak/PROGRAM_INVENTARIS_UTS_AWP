const jwt = require('jsonwebtoken');
const db = require('../db');

// Cache untuk user permissions (in-memory cache dengan expiry)
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Middleware untuk verifikasi JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
};

// Middleware untuk cek role (DEPRECATED - gunakan checkPermission)
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }
        next();
    };
};

// Helper function untuk get user permissions dari database
async function getUserPermissions(userId) {
    const cacheKey = `user_${userId}_permissions`;
    const cached = permissionCache.get(cacheKey);
    
    // Check cache
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.permissions;
    }
    
    // Query dari database
    const [permissions] = await db.query(`
        SELECT DISTINCT
            p.module,
            p.action,
            p.resource
        FROM user_roles ur
        INNER JOIN role_permissions rp ON ur.role_id = rp.role_id
        INNER JOIN permissions p ON rp.permission_id = p.id
        INNER JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ? 
            AND ur.is_active = 1
            AND r.is_active = 1
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    `, [userId]);
    
    // Store in cache
    permissionCache.set(cacheKey, {
        permissions,
        timestamp: Date.now()
    });
    
    return permissions;
}

// Helper function untuk check apakah user punya permission
async function hasPermission(userId, module, action, resource = null) {
    try {
        const permissions = await getUserPermissions(userId);
        
        const hasIt = permissions.some(p => 
            p.module === module && 
            p.action === action &&
            (resource === null || p.resource === resource)
        );
        
        // DEBUG LOGGING (remove in production)
        if (!hasIt) {
            console.log(`[PERMISSION DENIED] User ${userId} | ${module}.${action}.${resource}`);
        }
        
        return hasIt;
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}

// Middleware untuk check permission
function checkPermission(module, action, resource = null) {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }
            
            const allowed = await hasPermission(req.user.userId, module, action, resource);
            
            if (!allowed) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions.',
                    required_permission: { module, action, resource }
                });
            }
            
            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking permissions'
            });
        }
    };
}

// Function untuk clear permission cache (dipanggil saat role berubah)
function clearPermissionCache(userId = null) {
    if (userId) {
        permissionCache.delete(`user_${userId}_permissions`);
    } else {
        permissionCache.clear();
    }
}

// Function untuk get user permissions (untuk debugging/admin panel)
async function getUserPermissionList(userId) {
    return await getUserPermissions(userId);
}

// Middleware untuk log activity
const logActivity = async (req, res, next) => {
    try {
        if (req.user) {
            const action = `${req.method} ${req.originalUrl}`;
            const module = req.originalUrl.split('/')[2] || 'general';
            
            await db.query(
                `INSERT INTO activity_logs (user_id, action, module, ip_address, user_agent) 
                 VALUES (?, ?, ?, ?, ?)`,
                [req.user.userId, action, module, req.ip, req.get('user-agent')]
            );
        }
    } catch (error) {
        console.error('Log activity error:', error);
    }
    next();
};

module.exports = {
    authenticateToken,
    authorizeRoles, // DEPRECATED
    checkPermission,
    hasPermission,
    getUserPermissions,
    getUserPermissionList,
    clearPermissionCache,
    logActivity
};
