const customerService = require('../services/customerService');

/**
 * @desc    Get customer by mobile number
 * @route   GET /api/customers/mobile/:mobile
 * @access  Private
 */
const getCustomerByMobile = async (req, res, next) => {
    try {
        const customer = await customerService.getCustomerByMobile(req.params.mobile);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        res.status(200).json({
            success: true,
            data: customer,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get customer by customer ID
 * @route   GET /api/customers/:customerId
 * @access  Private
 */
const getCustomerById = async (req, res, next) => {
    try {
        const customer = await customerService.getCustomerById(req.params.customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        res.status(200).json({
            success: true,
            data: customer,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all customers with pagination
 * @route   GET /api/customers
 * @access  Private
 */
const getAllCustomers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;

        const result = await customerService.getAllCustomers(
            parseInt(page),
            parseInt(limit),
            search
        );

        res.status(200).json({
            success: true,
            data: result.customers,
            pagination: {
                total: result.total,
                page: result.page,
                pages: result.pages,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update customer details
 * @route   PUT /api/customers/:customerId
 * @access  Private
 */
const updateCustomer = async (req, res, next) => {
    try {
        const customer = await customerService.updateCustomer(
            req.params.customerId,
            req.body
        );

        res.status(200).json({
            success: true,
            data: customer,
            message: 'Customer updated successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get customer vehicle history
 * @route   GET /api/customers/vehicle-history/:mobile/:carNumber
 * @access  Private
 */
const getVehicleHistory = async (req, res, next) => {
    try {
        const { mobile, carNumber } = req.params;

        const history = await customerService.getCustomerVehicleHistory(mobile, carNumber);

        if (!history) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle history not found',
            });
        }

        res.status(200).json({
            success: true,
            data: history,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCustomerByMobile,
    getCustomerById,
    getAllCustomers,
    updateCustomer,
    getVehicleHistory,
};
