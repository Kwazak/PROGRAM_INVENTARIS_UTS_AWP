/**
 * Status Constants
 */

const ORDER_STATUS = {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected'
};

const PAYMENT_STATUS = {
    UNPAID: 'unpaid',
    PARTIAL: 'partial',
    PAID: 'paid',
    OVERDUE: 'overdue',
    REFUNDED: 'refunded'
};

const SHIPMENT_STATUS = {
    PENDING: 'pending',
    PACKED: 'packed',
    SHIPPED: 'shipped',
    IN_TRANSIT: 'in_transit',
    DELIVERED: 'delivered',
    RETURNED: 'returned'
};

const QC_STATUS = {
    PENDING: 'pending',
    PASS: 'pass',
    FAIL: 'fail',
    RETEST: 'retest'
};

const STOCK_MOVEMENT_TYPE = {
    IN: 'in',
    OUT: 'out',
    ADJUSTMENT: 'adjustment',
    TRANSFER: 'transfer',
    RETURN: 'return'
};

const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING: 'pending'
};

module.exports = {
    ORDER_STATUS,
    PAYMENT_STATUS,
    SHIPMENT_STATUS,
    QC_STATUS,
    STOCK_MOVEMENT_TYPE,
    USER_STATUS
};
