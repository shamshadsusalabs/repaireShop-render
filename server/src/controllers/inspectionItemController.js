const InspectionItem = require('../models/InspectionItem');

// @desc    Get all inspection items
// @route   GET /api/inspection-items
// @access  Private
const getAllItems = async (req, res, next) => {
    try {
        const items = await InspectionItem.find().sort({ createdAt: 1 });
        res.status(200).json({ success: true, count: items.length, data: items });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new inspection item
// @route   POST /api/inspection-items
// @access  Private/Admin/Manager
const createItem = async (req, res, next) => {
    try {
        const { name, icon } = req.body;
        
        // Check if item details exist
        const itemExists = await InspectionItem.findOne({ name });
        if (itemExists) {
            res.status(400);
            throw new Error(`Inspection item with name '${name}' already exists`);
        }
        
        const item = await InspectionItem.create({ name, icon });
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        next(error);
    }
};

// @desc    Update inspection item
// @route   PUT /api/inspection-items/:id
// @access  Private/Admin/Manager
const updateItem = async (req, res, next) => {
    try {
        const { name, icon } = req.body;
        
        let item = await InspectionItem.findById(req.params.id);
        
        if (!item) {
            res.status(404);
            throw new Error('Inspection item not found');
        }
        
        // Check for duplicates if name is changed
        if (name && name !== item.name) {
            const itemExists = await InspectionItem.findOne({ name });
            if (itemExists) {
                res.status(400);
                throw new Error(`Inspection item with name '${name}' already exists`);
            }
        }
        
        item.name = name || item.name;
        if (icon !== undefined) {
            item.icon = icon;
        }

        const updatedItem = await item.save();
        res.status(200).json({ success: true, data: updatedItem });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete inspection item
// @route   DELETE /api/inspection-items/:id
// @access  Private/Admin/Manager
const deleteItem = async (req, res, next) => {
    try {
        const item = await InspectionItem.findById(req.params.id);
        
        if (!item) {
            res.status(404);
            throw new Error('Inspection item not found');
        }
        
        await item.deleteOne();
        
        res.status(200).json({ success: true, message: 'Inspection item removed' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllItems,
    createItem,
    updateItem,
    deleteItem,
};
