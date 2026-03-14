const PurchaseOrder = require('../models/PurchaseOrder');
const Vendor = require('../models/Vendor');

// ─── Store Endpoints for Purchase Orders ────────────────────

/**
 * @desc    Get all vendors (for dropdown when creating PO)
 * @route   GET /api/store/vendors
 * @access  Private (Store, Admin)
 */
exports.getVendorsList = async (req, res, next) => {
    try {
        const vendors = await Vendor.find({ isActive: true })
            .select('name email phone companyName gstNumber')
            .sort({ name: 1 });

        res.status(200).json({ success: true, count: vendors.length, data: vendors });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a purchase order (manual entry — no catalog)
 * @route   POST /api/store/orders
 * @access  Private (Store, Admin)
 */
exports.createOrder = async (req, res, next) => {
    try {
        const { vendorId, partName, partNumber, unitPrice, quantity, discount, gstPercent, notes } = req.body;

        // Verify vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            const error = new Error('Vendor not found');
            error.statusCode = 404;
            throw error;
        }

        // Calculate total cost: (unitPrice * qty) - discount% + GST%
        const subtotal = unitPrice * quantity;
        const discountAmount = subtotal * ((discount || 0) / 100);
        const afterDiscount = subtotal - discountAmount;
        const gstAmount = afterDiscount * ((gstPercent || 18) / 100);
        const totalCost = afterDiscount + gstAmount;

        const order = await PurchaseOrder.create({
            storeId: req.user._id,
            vendorId,
            partName,
            partNumber: partNumber || '',
            quantity,
            unitPrice,
            discount: discount || 0,
            gstPercent: gstPercent != null ? gstPercent : 18,
            totalCost: Math.round(totalCost * 100) / 100,
            notes: notes || '',
        });

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get purchase orders (store sees own, admin sees all)
 * @route   GET /api/store/orders
 * @access  Private (Store, Admin)
 */
exports.getMyOrders = async (req, res, next) => {
    try {
        const filter = {};
        if (req.user.role === 'store') {
            filter.storeId = req.user._id;
        }

        const orders = await PurchaseOrder.find(filter)
            .populate('vendorId', 'name email phone companyName')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single order by ID
 * @route   GET /api/store/orders/:id
 * @access  Private (Store, Admin)
 */
exports.getStoreOrderById = async (req, res, next) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id)
            .populate('vendorId', 'name email phone address companyName gstNumber')
            .populate('storeId', 'name email phone address');

        if (!order) {
            const error = new Error('Order not found');
            error.statusCode = 404;
            throw error;
        }

        // Store can only view their own orders
        if (req.user.role === 'store' && order.storeId._id.toString() !== req.user._id.toString()) {
            const error = new Error('Not authorized to view this order');
            error.statusCode = 403;
            throw error;
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get the latest purchase order by part number for the logged-in store
 * @route   GET /api/store/orders/last-by-part/:partNumber
 * @access  Private (Store)
 */
exports.getLatestOrderByPartNumber = async (req, res, next) => {
    try {
        if (req.user.role !== 'store') {
            const error = new Error('Only stores can fetch their last part order');
            error.statusCode = 403;
            throw error;
        }

        const { partNumber } = req.params;

        const order = await PurchaseOrder.findOne({ 
            storeId: req.user._id, 
            partNumber: { $regex: new RegExp(`^${partNumber}$`, 'i') } 
        })
        .sort({ createdAt: -1 })
        .populate('vendorId', 'name companyName');

        if (!order) {
            return res.status(200).json({ success: true, data: null });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a purchase order
 * @route   PUT /api/store/orders/:id
 * @access  Private (Store, Admin)
 */
exports.updateOrder = async (req, res, next) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id);

        if (!order) {
            const error = new Error('Order not found');
            error.statusCode = 404;
            throw error;
        }

        // Store can only update their own orders
        if (req.user.role === 'store' && order.storeId.toString() !== req.user._id.toString()) {
            const error = new Error('Not authorized to update this order');
            error.statusCode = 403;
            throw error;
        }

        const { vendorId, partName, partNumber, unitPrice, quantity, discount, gstPercent, notes } = req.body;

        // Verify vendor exists if vendorId is being updated
        if (vendorId && vendorId !== order.vendorId.toString()) {
            const vendor = await Vendor.findById(vendorId);
            if (!vendor) {
                const error = new Error('Vendor not found');
                error.statusCode = 404;
                throw error;
            }
        }

        // Recalculate total cost
        const newUnitPrice = unitPrice !== undefined ? unitPrice : order.unitPrice;
        const newQuantity = quantity !== undefined ? quantity : order.quantity;
        const newDiscount = discount !== undefined ? discount : order.discount;
        const newGstPercent = gstPercent !== undefined ? gstPercent : order.gstPercent;

        const subtotal = newUnitPrice * newQuantity;
        const discountAmount = subtotal * (newDiscount / 100);
        const afterDiscount = subtotal - discountAmount;
        const gstAmount = afterDiscount * (newGstPercent / 100);
        const totalCost = afterDiscount + gstAmount;

        // Update fields
        if (vendorId) order.vendorId = vendorId;
        if (partName) order.partName = partName;
        if (partNumber !== undefined) order.partNumber = partNumber;
        if (unitPrice !== undefined) order.unitPrice = unitPrice;
        if (quantity !== undefined) order.quantity = quantity;
        if (discount !== undefined) order.discount = discount;
        if (gstPercent !== undefined) order.gstPercent = gstPercent;
        if (notes !== undefined) order.notes = notes;
        order.totalCost = Math.round(totalCost * 100) / 100;

        await order.save();

        const updatedOrder = await PurchaseOrder.findById(order._id)
            .populate('vendorId', 'name email phone companyName');

        res.status(200).json({ success: true, data: updatedOrder });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a purchase order
 * @route   DELETE /api/store/orders/:id
 * @access  Private (Store, Admin)
 */
exports.deleteOrder = async (req, res, next) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id);

        if (!order) {
            const error = new Error('Order not found');
            error.statusCode = 404;
            throw error;
        }

        // Store can only delete their own orders
        if (req.user.role === 'store' && order.storeId.toString() !== req.user._id.toString()) {
            const error = new Error('Not authorized to delete this order');
            error.statusCode = 403;
            throw error;
        }

        await order.deleteOne();

        res.status(200).json({ success: true, message: 'Purchase order deleted successfully' });
    } catch (error) {
        next(error);
    }
};
