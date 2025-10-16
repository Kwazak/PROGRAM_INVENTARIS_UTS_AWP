/**
 * Permission Constants
 */

const PERMISSIONS = {
    // User Management
    USERS_VIEW: 'users:view',
    USERS_CREATE: 'users:create',
    USERS_EDIT: 'users:edit',
    USERS_DELETE: 'users:delete',
    
    // Role Management
    ROLES_VIEW: 'roles:view',
    ROLES_EDIT: 'roles:edit',
    
    // Materials/Inventory
    MATERIALS_VIEW: 'materials:view',
    MATERIALS_CREATE: 'materials:create',
    MATERIALS_EDIT: 'materials:edit',
    MATERIALS_DELETE: 'materials:delete',
    
    // Stock Management
    STOCK_VIEW: 'stock:view',
    STOCK_ADJUST: 'stock:adjust',
    
    // Suppliers
    SUPPLIERS_VIEW: 'suppliers:view',
    SUPPLIERS_CREATE: 'suppliers:create',
    SUPPLIERS_EDIT: 'suppliers:edit',
    SUPPLIERS_DELETE: 'suppliers:delete',
    
    // Purchase Orders
    PURCHASE_VIEW: 'purchase:view',
    PURCHASE_CREATE: 'purchase:create',
    PURCHASE_EDIT: 'purchase:edit',
    PURCHASE_APPROVE: 'purchase:approve',
    PURCHASE_DELETE: 'purchase:delete',
    
    // Products
    PRODUCTS_VIEW: 'products:view',
    PRODUCTS_CREATE: 'products:create',
    PRODUCTS_EDIT: 'products:edit',
    PRODUCTS_DELETE: 'products:delete',
    
    // Production
    PRODUCTION_VIEW: 'production:view',
    PRODUCTION_CREATE: 'production:create',
    PRODUCTION_EDIT: 'production:edit',
    PRODUCTION_COMPLETE: 'production:complete',
    
    // Quality Control
    QC_VIEW: 'qc:view',
    QC_PERFORM: 'qc:perform',
    QC_APPROVE: 'qc:approve',
    
    // Customers
    CUSTOMERS_VIEW: 'customers:view',
    CUSTOMERS_CREATE: 'customers:create',
    CUSTOMERS_EDIT: 'customers:edit',
    CUSTOMERS_DELETE: 'customers:delete',
    
    // Sales Orders
    SALES_VIEW: 'sales:view',
    SALES_CREATE: 'sales:create',
    SALES_EDIT: 'sales:edit',
    SALES_APPROVE: 'sales:approve',
    SALES_DELETE: 'sales:delete',
    
    // Shipments
    SHIPMENTS_VIEW: 'shipments:view',
    SHIPMENTS_CREATE: 'shipments:create',
    SHIPMENTS_EDIT: 'shipments:edit',
    
    // Payments
    PAYMENTS_VIEW: 'payments:view',
    PAYMENTS_CREATE: 'payments:create',
    PAYMENTS_APPROVE: 'payments:approve',
    
    // Reports
    REPORTS_VIEW: 'reports:view',
    REPORTS_EXPORT: 'reports:export',
    
    // Dashboard
    DASHBOARD_VIEW: 'dashboard:view',
    DASHBOARD_ANALYTICS: 'dashboard:analytics',
    
    // Settings
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_EDIT: 'settings:edit'
};

const PERMISSION_GROUPS = {
    USER_MANAGEMENT: [
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.USERS_CREATE,
        PERMISSIONS.USERS_EDIT,
        PERMISSIONS.USERS_DELETE,
        PERMISSIONS.ROLES_VIEW,
        PERMISSIONS.ROLES_EDIT
    ],
    INVENTORY: [
        PERMISSIONS.MATERIALS_VIEW,
        PERMISSIONS.MATERIALS_CREATE,
        PERMISSIONS.MATERIALS_EDIT,
        PERMISSIONS.MATERIALS_DELETE,
        PERMISSIONS.STOCK_VIEW,
        PERMISSIONS.STOCK_ADJUST
    ],
    PROCUREMENT: [
        PERMISSIONS.SUPPLIERS_VIEW,
        PERMISSIONS.SUPPLIERS_CREATE,
        PERMISSIONS.SUPPLIERS_EDIT,
        PERMISSIONS.SUPPLIERS_DELETE,
        PERMISSIONS.PURCHASE_VIEW,
        PERMISSIONS.PURCHASE_CREATE,
        PERMISSIONS.PURCHASE_EDIT,
        PERMISSIONS.PURCHASE_APPROVE,
        PERMISSIONS.PURCHASE_DELETE
    ],
    PRODUCTION: [
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.PRODUCTS_CREATE,
        PERMISSIONS.PRODUCTS_EDIT,
        PERMISSIONS.PRODUCTS_DELETE,
        PERMISSIONS.PRODUCTION_VIEW,
        PERMISSIONS.PRODUCTION_CREATE,
        PERMISSIONS.PRODUCTION_EDIT,
        PERMISSIONS.PRODUCTION_COMPLETE,
        PERMISSIONS.QC_VIEW,
        PERMISSIONS.QC_PERFORM,
        PERMISSIONS.QC_APPROVE
    ],
    SALES: [
        PERMISSIONS.CUSTOMERS_VIEW,
        PERMISSIONS.CUSTOMERS_CREATE,
        PERMISSIONS.CUSTOMERS_EDIT,
        PERMISSIONS.CUSTOMERS_DELETE,
        PERMISSIONS.SALES_VIEW,
        PERMISSIONS.SALES_CREATE,
        PERMISSIONS.SALES_EDIT,
        PERMISSIONS.SALES_APPROVE,
        PERMISSIONS.SALES_DELETE,
        PERMISSIONS.SHIPMENTS_VIEW,
        PERMISSIONS.SHIPMENTS_CREATE,
        PERMISSIONS.SHIPMENTS_EDIT
    ],
    FINANCE: [
        PERMISSIONS.PAYMENTS_VIEW,
        PERMISSIONS.PAYMENTS_CREATE,
        PERMISSIONS.PAYMENTS_APPROVE
    ],
    REPORTING: [
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.REPORTS_EXPORT,
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.DASHBOARD_ANALYTICS
    ]
};

module.exports = {
    PERMISSIONS,
    PERMISSION_GROUPS
};
