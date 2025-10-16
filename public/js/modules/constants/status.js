/**
 * Status Constants Module
 * Konstanta untuk berbagai status
 */

const OrderStatus = {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected'
};

const OrderStatusLabels = {
    [OrderStatus.DRAFT]: 'Draft',
    [OrderStatus.PENDING]: 'Menunggu',
    [OrderStatus.APPROVED]: 'Disetujui',
    [OrderStatus.IN_PROGRESS]: 'Dalam Proses',
    [OrderStatus.COMPLETED]: 'Selesai',
    [OrderStatus.CANCELLED]: 'Dibatalkan',
    [OrderStatus.REJECTED]: 'Ditolak'
};

const OrderStatusColors = {
    [OrderStatus.DRAFT]: '#9ca3af',
    [OrderStatus.PENDING]: '#f59e0b',
    [OrderStatus.APPROVED]: '#10b981',
    [OrderStatus.IN_PROGRESS]: '#3b82f6',
    [OrderStatus.COMPLETED]: '#059669',
    [OrderStatus.CANCELLED]: '#6b7280',
    [OrderStatus.REJECTED]: '#ef4444'
};

const PaymentStatus = {
    UNPAID: 'unpaid',
    PARTIAL: 'partial',
    PAID: 'paid',
    OVERDUE: 'overdue',
    REFUNDED: 'refunded'
};

const PaymentStatusLabels = {
    [PaymentStatus.UNPAID]: 'Belum Dibayar',
    [PaymentStatus.PARTIAL]: 'Sebagian',
    [PaymentStatus.PAID]: 'Lunas',
    [PaymentStatus.OVERDUE]: 'Terlambat',
    [PaymentStatus.REFUNDED]: 'Dikembalikan'
};

const ShipmentStatus = {
    PENDING: 'pending',
    PACKED: 'packed',
    SHIPPED: 'shipped',
    IN_TRANSIT: 'in_transit',
    DELIVERED: 'delivered',
    RETURNED: 'returned'
};

const ShipmentStatusLabels = {
    [ShipmentStatus.PENDING]: 'Menunggu',
    [ShipmentStatus.PACKED]: 'Dikemas',
    [ShipmentStatus.SHIPPED]: 'Dikirim',
    [ShipmentStatus.IN_TRANSIT]: 'Dalam Perjalanan',
    [ShipmentStatus.DELIVERED]: 'Terkirim',
    [ShipmentStatus.RETURNED]: 'Dikembalikan'
};

// Export
window.OrderStatus = OrderStatus;
window.OrderStatusLabels = OrderStatusLabels;
window.OrderStatusColors = OrderStatusColors;
window.PaymentStatus = PaymentStatus;
window.PaymentStatusLabels = PaymentStatusLabels;
window.ShipmentStatus = ShipmentStatus;
window.ShipmentStatusLabels = ShipmentStatusLabels;
