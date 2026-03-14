const Mechanic = require('../models/Mechanic');

/**
 * Get all mechanics
 */
const getAllMechanics = async (query = {}) => {
    const filter = {};

    // Filter by availability
    if (query.available !== undefined) {
        filter.available = query.available === 'true';
    }

    // Search by name or specialty
    if (query.search) {
        filter.$or = [
            { name: { $regex: query.search, $options: 'i' } },
            { specialty: { $regex: query.search, $options: 'i' } },
        ];
    }

    const mechanics = await Mechanic.find(filter).sort('name');
    return mechanics;
};

/**
 * Get a single mechanic by ID
 */
const getMechanicById = async (id) => {
    const mechanic = await Mechanic.findById(id);

    if (!mechanic) {
        const error = new Error('Mechanic not found');
        error.statusCode = 404;
        throw error;
    }

    return mechanic;
};

/**
 * Create a new mechanic (Admin only — includes email + password for mechanic login)
 */
const createMechanic = async (mechanicData) => {
    // Check if email already exists
    const existingMechanic = await Mechanic.findOne({ email: mechanicData.email });
    if (existingMechanic) {
        const error = new Error('Mechanic with this email already exists');
        error.statusCode = 400;
        throw error;
    }

    // Generate mechanic ID
    const count = await Mechanic.countDocuments();
    const mechanicId = `MECH-${String(count + 1).padStart(3, '0')}`;

    const mechanic = await Mechanic.create({
        ...mechanicData,
        mechanicId,
    });

    // Don't return password in response
    const mechanicObj = mechanic.toObject();
    delete mechanicObj.password;

    return mechanicObj;
};

/**
 * Update a mechanic
 */
const updateMechanic = async (id, updates) => {
    // If updating password, we need to use save() for pre-save hook to hash it
    if (updates.password) {
        const mechanic = await Mechanic.findById(id).select('+password');
        if (!mechanic) {
            const error = new Error('Mechanic not found');
            error.statusCode = 404;
            throw error;
        }
        Object.assign(mechanic, updates);
        await mechanic.save();

        const mechanicObj = mechanic.toObject();
        delete mechanicObj.password;
        return mechanicObj;
    }

    const mechanic = await Mechanic.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
    });

    if (!mechanic) {
        const error = new Error('Mechanic not found');
        error.statusCode = 404;
        throw error;
    }

    return mechanic;
};

/**
 * Delete a mechanic
 */
const deleteMechanic = async (id) => {
    const mechanic = await Mechanic.findByIdAndDelete(id);

    if (!mechanic) {
        const error = new Error('Mechanic not found');
        error.statusCode = 404;
        throw error;
    }

    return mechanic;
};

module.exports = {
    getAllMechanics,
    getMechanicById,
    createMechanic,
    updateMechanic,
    deleteMechanic,
};
