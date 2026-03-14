const Customer = require('../models/Customer');

/**
 * Find or create customer by mobile number
 * Simple: Just add KM to history if exists, create new if not
 */
const findOrCreateCustomer = async (customerData, userId) => {
    const { name, mobile, carModel, carNumber, kmDriven } = customerData;

    // Check if customer exists by mobile
    let customer = await Customer.findOne({ mobile });

    if (customer) {
        // Customer exists - just add new KM reading
        customer.kmHistory.push({
            km: kmDriven,
            date: new Date(),
        });
        
        // Update car details if provided
        if (carModel) customer.carModel = carModel;
        if (carNumber) customer.carNumber = carNumber.toUpperCase();
        
        await customer.save();
    } else {
        // New customer - create with first KM reading
        customer = await Customer.create({
            name,
            mobile,
            carModel: carModel || '',
            carNumber: carNumber ? carNumber.toUpperCase() : '',
            kmHistory: [
                {
                    km: kmDriven,
                    date: new Date(),
                },
            ],
            createdBy: userId,
        });
    }

    return customer;
};

/**
 * Get customer by mobile number
 */
const getCustomerByMobile = async mobile => {
    return await Customer.findOne({ mobile });
};

/**
 * Get customer by ID
 */
const getCustomerById = async customerId => {
    return await Customer.findOne({ customerId });
};

/**
 * Get all customers with pagination
 */
const getAllCustomers = async (page = 1, limit = 20, search = '') => {
    const query = search
        ? {
              $or: [
                  { name: { $regex: search, $options: 'i' } },
                  { mobile: { $regex: search, $options: 'i' } },
                  { customerId: { $regex: search, $options: 'i' } },
              ],
          }
        : {};

    const customers = await Customer.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .select('-__v');

    const total = await Customer.countDocuments(query);

    return {
        customers,
        total,
        page,
        pages: Math.ceil(total / limit),
    };
};

/**
 * Update customer details
 */
const updateCustomer = async (customerId, updateData) => {
    const customer = await Customer.findOne({ customerId });

    if (!customer) {
        const error = new Error('Customer not found');
        error.statusCode = 404;
        throw error;
    }

    // Update allowed fields
    if (updateData.name) customer.name = updateData.name;
    if (updateData.carModel) customer.carModel = updateData.carModel;
    if (updateData.carNumber) customer.carNumber = updateData.carNumber.toUpperCase();

    await customer.save();
    return customer;
};

/**
 * Get customer KM history
 */
const getCustomerKmHistory = async (mobile) => {
    const customer = await Customer.findOne({ mobile });

    if (!customer) {
        return null;
    }

    return {
        customerId: customer.customerId,
        name: customer.name,
        mobile: customer.mobile,
        carModel: customer.carModel,
        carNumber: customer.carNumber,
        kmHistory: customer.kmHistory.sort((a, b) => b.date - a.date), // Latest first
    };
};

/**
 * Update KM reading with job ID
 */
const updateKmWithJobId = async (mobile, jobId) => {
    const customer = await Customer.findOne({ mobile });

    if (customer && customer.kmHistory.length > 0) {
        const lastReading = customer.kmHistory[customer.kmHistory.length - 1];
        if (!lastReading.jobId) {
            lastReading.jobId = jobId;
            await customer.save();
        }
    }
};

module.exports = {
    findOrCreateCustomer,
    getCustomerByMobile,
    getCustomerById,
    getAllCustomers,
    updateCustomer,
    getCustomerKmHistory,
    updateKmWithJobId,
};
