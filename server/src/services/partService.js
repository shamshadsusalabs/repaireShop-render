const Part = require('../models/Part');

/**
 * Get all parts with optional filters
 */
const getAllParts = async (query = {}) => {
    const { search, category, lowStock, page = 1, limit = 100 } = query;

    const filter = { isActive: true };

    // Search filter
    if (search) {
        filter.$or = [
            { partName: { $regex: search, $options: 'i' } },
            { partNumber: { $regex: search, $options: 'i' } },
            { vehicleModel: { $regex: search, $options: 'i' } },
            { supplier: { $regex: search, $options: 'i' } },
        ];
    }

    // Category filter
    if (category) {
        filter.category = category;
    }

    // Low stock filter
    if (lowStock === 'true') {
        filter.$expr = { $lte: ['$quantity', '$minStock'] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [parts, total] = await Promise.all([
        Part.find(filter)
            .populate('addedBy', 'name email')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Part.countDocuments(filter),
    ]);

    return { parts, total, page: parseInt(page), limit: parseInt(limit) };
};

/**
 * Get single part by ID
 */
const getPartById = async (id) => {
    const part = await Part.findById(id).populate('addedBy', 'name email');
    if (!part) {
        const error = new Error('Part not found');
        error.statusCode = 404;
        throw error;
    }
    return part;
};

/**
 * Create a new part
 */
const createPart = async (data, userId) => {
    // Check for duplicate part number
    const existing = await Part.findOne({ partNumber: data.partNumber?.toUpperCase() });
    if (existing) {
        const error = new Error(`Part with number "${data.partNumber}" already exists`);
        error.statusCode = 400;
        throw error;
    }

    const part = await Part.create({
        ...data,
        partNumber: data.partNumber?.toUpperCase(),
        addedBy: userId,
    });
    return part;
};

/**
 * Update a part
 */
const updatePart = async (id, data) => {
    // If updating partNumber, check for duplicates
    if (data.partNumber) {
        const existing = await Part.findOne({
            partNumber: data.partNumber.toUpperCase(),
            _id: { $ne: id },
        });
        if (existing) {
            const error = new Error(`Part number "${data.partNumber}" already exists`);
            error.statusCode = 400;
            throw error;
        }
        data.partNumber = data.partNumber.toUpperCase();
    }

    const part = await Part.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
    });

    if (!part) {
        const error = new Error('Part not found');
        error.statusCode = 404;
        throw error;
    }
    return part;
};

/**
 * Delete a part (soft delete)
 */
const deletePart = async (id) => {
    const part = await Part.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!part) {
        const error = new Error('Part not found');
        error.statusCode = 404;
        throw error;
    }
    return part;
};

/**
 * Bulk create parts from Excel upload
 */
const bulkCreateParts = async (partsArray, userId) => {
    const results = {
        success: 0,
        failed: 0,
        errors: [],
        created: [],
    };

    for (let i = 0; i < partsArray.length; i++) {
        const row = partsArray[i];
        try {
            // Validate required fields
            if (!row.partName || !row.partNumber || !row.costPrice || !row.sellPrice) {
                results.failed++;
                results.errors.push({
                    row: i + 2, // +2 for header row and 0-index
                    error: 'Missing required fields (partName, partNumber, costPrice, sellPrice)',
                    data: row,
                });
                continue;
            }

            // Check for duplicate
            const existing = await Part.findOne({ partNumber: row.partNumber.toUpperCase() });
            if (existing) {
                // Update quantity if part exists
                existing.quantity = (existing.quantity || 0) + (parseInt(row.quantity) || 0);
                if (row.costPrice) existing.costPrice = parseFloat(row.costPrice);
                if (row.sellPrice) existing.sellPrice = parseFloat(row.sellPrice);
                if (row.supplier) existing.supplier = row.supplier;
                if (row.vehicleModel) existing.vehicleModel = row.vehicleModel;
                if (row.location) existing.location = row.location;
                await existing.save();
                results.success++;
                results.created.push(existing);
                continue;
            }

            const part = await Part.create({
                partName: row.partName,
                partNumber: row.partNumber.toUpperCase(),
                category: row.category || 'Other',
                quantity: parseInt(row.quantity) || 0,
                minStock: parseInt(row.minStock) || 5,
                costPrice: parseFloat(row.costPrice) || 0,
                sellPrice: parseFloat(row.sellPrice) || 0,
                location: row.location || '',
                supplier: row.supplier || '',
                vehicleModel: row.vehicleModel || '',
                description: row.description || '',
                addedBy: userId,
            });

            results.success++;
            results.created.push(part);
        } catch (err) {
            results.failed++;
            results.errors.push({
                row: i + 2,
                error: err.message,
                data: row,
            });
        }
    }

    return results;
};

/**
 * Get inventory stats
 */
const getInventoryStats = async () => {
    const [
        totalParts,
        totalQuantity,
        lowStockParts,
        outOfStock,
        categoryStats,
        totalValue,
    ] = await Promise.all([
        Part.countDocuments({ isActive: true }),
        Part.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, total: { $sum: '$quantity' } } },
        ]),
        Part.countDocuments({
            isActive: true,
            $expr: { $lte: ['$quantity', '$minStock'] },
            quantity: { $gt: 0 },
        }),
        Part.countDocuments({ isActive: true, quantity: 0 }),
        Part.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalQty: { $sum: '$quantity' },
                },
            },
            { $sort: { count: -1 } },
        ]),
        Part.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    totalCost: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
                    totalSell: { $sum: { $multiply: ['$quantity', '$sellPrice'] } },
                },
            },
        ]),
    ]);

    return {
        totalParts,
        totalQuantity: totalQuantity[0]?.total || 0,
        lowStockParts,
        outOfStock,
        categoryStats,
        totalCostValue: totalValue[0]?.totalCost || 0,
        totalSellValue: totalValue[0]?.totalSell || 0,
    };
};

module.exports = {
    getAllParts,
    getPartById,
    createPart,
    updatePart,
    deletePart,
    bulkCreateParts,
    getInventoryStats,
};
