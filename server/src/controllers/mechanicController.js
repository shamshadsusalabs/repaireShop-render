const mechanicService = require('../services/mechanicService');

/**
 * @desc    Get all mechanics
 * @route   GET /api/mechanics
 * @access  Private
 */
const getAllMechanics = async (req, res, next) => {
    try {
        const mechanics = await mechanicService.getAllMechanics(req.query);
        res.status(200).json({
            success: true,
            count: mechanics.length,
            data: mechanics,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single mechanic
 * @route   GET /api/mechanics/:id
 * @access  Private
 */
const getMechanicById = async (req, res, next) => {
    try {
        const mechanic = await mechanicService.getMechanicById(req.params.id);
        res.status(200).json({ success: true, data: mechanic });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new mechanic
 * @route   POST /api/mechanics
 * @access  Private (Admin)
 */
const createMechanic = async (req, res, next) => {
    try {
        const mechanic = await mechanicService.createMechanic(req.body);
        res.status(201).json({
            success: true,
            message: 'Mechanic added successfully',
            data: mechanic,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a mechanic
 * @route   PUT /api/mechanics/:id
 * @access  Private (Admin)
 */
const updateMechanic = async (req, res, next) => {
    try {
        const mechanic = await mechanicService.updateMechanic(req.params.id, req.body);
        res.status(200).json({
            success: true,
            message: 'Mechanic updated successfully',
            data: mechanic,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a mechanic
 * @route   DELETE /api/mechanics/:id
 * @access  Private (Admin)
 */
const deleteMechanic = async (req, res, next) => {
    try {
        await mechanicService.deleteMechanic(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Mechanic deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllMechanics,
    getMechanicById,
    createMechanic,
    updateMechanic,
    deleteMechanic,
};
