const PurchaseOrder = require('../models/PurchaseOrder');

// ─── Vendor Order APIs (read-only + status update) ──────────

/**
 * @desc    Get all orders received from stores
 * @route   GET /api/vendor/orders
 * @access  Private (Vendor)
 */
exports.getVendorOrders = async (req, res, next) => {
    try {
        const orders = await PurchaseOrder.find({ vendorId: req.user._id })
            .populate('storeId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single order by ID for the vendor
 * @route   GET /api/vendor/orders/:id
 * @access  Private (Vendor)
 */
exports.getVendorOrderById = async (req, res, next) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id)
            .populate('storeId', 'name email phone address')
            .populate('vendorId', 'name email phone address companyName gstNumber');

        if (!order) {
            const error = new Error('Order not found');
            error.statusCode = 404;
            throw error;
        }

        if (order.vendorId._id.toString() !== req.user._id.toString()) {
            const error = new Error('Not authorized to view this order');
            error.statusCode = 403;
            throw error;
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};


