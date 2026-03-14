const CarModel = require('../models/CarModel');

// @desc    Get all car models
// @route   GET /api/car-models
// @access  Private
const getAllModels = async (req, res, next) => {
    try {
        const models = await CarModel.find().sort({ brand: 1, modelName: 1 });
        res.status(200).json({ success: true, count: models.length, data: models });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new car model
// @route   POST /api/car-models
// @access  Private/Admin/Manager
const createModel = async (req, res, next) => {
    try {
        const { brand, modelName } = req.body;
        
        // Check if model already exists for this brand
        const modelExists = await CarModel.findOne({ brand, modelName });
        if (modelExists) {
            res.status(400);
            throw new Error(`Car model '${modelName}' already exists for brand '${brand}'`);
        }
        
        const carModel = await CarModel.create({ brand, modelName });
        res.status(201).json({ success: true, data: carModel });
    } catch (error) {
        next(error);
    }
};

// @desc    Update car model
// @route   PUT /api/car-models/:id
// @access  Private/Admin/Manager
const updateModel = async (req, res, next) => {
    try {
        const { brand, modelName } = req.body;
        
        let carModel = await CarModel.findById(req.params.id);
        
        if (!carModel) {
            res.status(404);
            throw new Error('Car model not found');
        }
        
        // Check for duplicates if brand or modelName is changed
        if ((brand && brand !== carModel.brand) || (modelName && modelName !== carModel.modelName)) {
            const checkBrand = brand || carModel.brand;
            const checkModelName = modelName || carModel.modelName;
            
            const modelExists = await CarModel.findOne({ brand: checkBrand, modelName: checkModelName });
            if (modelExists) {
                res.status(400);
                throw new Error(`Car model '${checkModelName}' already exists for brand '${checkBrand}'`);
            }
        }
        
        carModel.brand = brand || carModel.brand;
        carModel.modelName = modelName || carModel.modelName;

        const updatedModel = await carModel.save();
        res.status(200).json({ success: true, data: updatedModel });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete car model
// @route   DELETE /api/car-models/:id
// @access  Private/Admin/Manager
const deleteModel = async (req, res, next) => {
    try {
        const carModel = await CarModel.findById(req.params.id);
        
        if (!carModel) {
            res.status(404);
            throw new Error('Car model not found');
        }
        
        await carModel.deleteOne();
        
        res.status(200).json({ success: true, message: 'Car model removed' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllModels,
    createModel,
    updateModel,
    deleteModel,
};
