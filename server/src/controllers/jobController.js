const jobService = require('../services/jobService');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/jobs/stats
 * @access  Private
 */
const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await jobService.getDashboardStats();
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Send WhatsApp notification for vehicle Drop/Delivery
 * @route   POST /api/jobs/:jobId/send-drop-whatsapp
 * @access  Private
 */
const sendDropWhatsApp = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { variables } = req.body;
        const result = await jobService.sendDropWhatsApp(jobId, variables);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error sending drop WhatsApp:', error);
        next(error);
    }
};

/**
 * @desc    Get job history for auto-fill
 * @route   GET /api/jobs/history
 * @access  Private
 */
const getJobHistory = async (req, res, next) => {
    try {
        const { query } = req.query; // ?query=9876543210
        const result = await jobService.getJobHistory(query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new job
 * @route   POST /api/jobs
 * @access  Private
 */
const createJob = async (req, res, next) => {
    try {
        // If car image was uploaded via Cloudinary, get the URL
        const jobData = { ...req.body };
        if (req.files && req.files.length > 0) {
            jobData.carImages = req.files.map(file => file.path); // Cloudinary URLs
        }

        const job = await jobService.createJob(jobData, req.user._id);
        res.status(201).json({
            success: true,
            message: `Job ${job.jobId} created successfully`,
            data: job,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all jobs (with filters, search, pagination)
 * @route   GET /api/jobs
 * @access  Private
 */
const getAllJobs = async (req, res, next) => {
    try {
        const result = await jobService.getAllJobs(req.query);
        res.status(200).json({
            success: true,
            data: result.jobs,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single job by jobId
 * @route   GET /api/jobs/:jobId
 * @access  Private
 */
const getJobById = async (req, res, next) => {
    try {
        const job = await jobService.getJobById(req.params.jobId);
        res.status(200).json({ success: true, data: job });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a job
 * @route   PUT /api/jobs/:jobId
 * @access  Private
 */
const updateJob = async (req, res, next) => {
    try {
        const updates = { ...req.body };
        // If car image was uploaded via Cloudinary, get the URL
        if (req.files && req.files.length > 0) {
            updates.carImages = req.files.map(file => file.path); // Cloudinary URLs
        }

        const job = await jobService.updateJob(req.params.jobId, updates);
        res.status(200).json({
            success: true,
            message: `Job ${req.params.jobId} updated successfully`,
            data: job,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Assign mechanic to a job
 * @route   PUT /api/jobs/:jobId/assign
 * @access  Private
 */
const assignMechanic = async (req, res, next) => {
    try {
        const { mechanicId } = req.body;
        const job = await jobService.assignMechanic(req.params.jobId, mechanicId);
        res.status(200).json({
            success: true,
            message: 'Mechanic assigned successfully',
            data: job,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Save inspection results
 * @route   PUT /api/jobs/:jobId/inspection
 * @access  Private
 */
const saveInspection = async (req, res, next) => {
    try {
        const { inspectionResults } = req.body;
        const job = await jobService.saveInspection(req.params.jobId, inspectionResults);
        res.status(200).json({
            success: true,
            message: 'Inspection results saved',
            data: job,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Save faulty parts list
 * @route   PUT /api/jobs/:jobId/faults
 * @access  Private
 */
const saveFaultyParts = async (req, res, next) => {
    try {
        const { faultyParts } = req.body;
        const job = await jobService.saveFaultyParts(req.params.jobId, faultyParts);
        res.status(200).json({
            success: true,
            message: 'Faulty parts saved',
            data: job,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Customer approval / rejection
 * @route   PUT /api/jobs/:jobId/approval
 * @access  Private
 */
const customerApproval = async (req, res, next) => {
    try {
        const { approved } = req.body;
        const job = await jobService.customerApproval(req.params.jobId, approved);
        res.status(200).json({
            success: true,
            message: approved ? 'Job approved by customer' : 'Job rejected by customer',
            data: job,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Save repair costs
 * @route   PUT /api/jobs/:jobId/repair-cost
 * @access  Private
 */
const saveRepairCost = async (req, res, next) => {
    try {
        const { faultyParts } = req.body;
        const job = await jobService.saveRepairCost(req.params.jobId, faultyParts);
        res.status(200).json({
            success: true,
            message: 'Repair costs saved',
            data: job,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Complete job (generate invoice)
 * @route   PUT /api/jobs/:jobId/complete
 * @access  Private
 */
const completeJob = async (req, res, next) => {
    try {
        const job = await jobService.completeJob(req.params.jobId);
        res.status(200).json({
            success: true,
            message: `Job ${req.params.jobId} completed`,
            data: job,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a job
 * @route   DELETE /api/jobs/:jobId
 * @access  Private (Admin only)
 */
const deleteJob = async (req, res, next) => {
    try {
        await jobService.deleteJob(req.params.jobId);
        res.status(200).json({
            success: true,
            message: `Job ${req.params.jobId} deleted`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all approved jobs needing parts (for Store)
 * @route   GET /api/jobs/approved-for-parts
 * @access  Private (Store, Admin)
 */
const getApprovedJobs = async (req, res, next) => {
    try {
        const jobs = await jobService.getApprovedJobs();
        res.status(200).json({ success: true, count: jobs.length, data: jobs });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Issue parts from store inventory to a job
 * @route   PUT /api/jobs/:jobId/issue-parts
 * @access  Private (Store, Admin)
 */
const issueParts = async (req, res, next) => {
    try {
        const { parts } = req.body; // [{ partId, quantityIssued }]
        const result = await jobService.issueParts(req.params.jobId, parts, req.user._id);
        res.status(200).json({
            success: true,
            message: `${result.issued} parts issued successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark job as ready for repair (all parts issued)
 * @route   PUT /api/jobs/:jobId/ready-for-repair
 * @access  Private (Store, Admin)
 */
const markReadyForRepair = async (req, res, next) => {
    try {
        const job = await jobService.markReadyForRepair(req.params.jobId);
        res.status(200).json({
            success: true,
            message: `Job ${req.params.jobId} marked as Repairing`,
            data: job,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Assign driver to a job for Pickup/Drop
 * @route   PUT /api/jobs/:jobId/assign-driver
 * @access  Private (Receptionist, Admin, Manager)
 */
const assignDriver = async (req, res, next) => {
    try {
        const { driverId, driverTask } = req.body;
        const job = await jobService.assignDriver(req.params.jobId, driverId, driverTask);
        res.status(200).json({
            success: true,
            message: `Driver assigned for ${driverTask}`,
            data: job,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all active drivers
 * @route   GET /api/jobs/drivers
 * @access  Private (Receptionist, Admin, Manager)
 */
const getDrivers = async (req, res, next) => {
    try {
        const drivers = await jobService.getDrivers();
        res.status(200).json({
            success: true,
            count: drivers.length,
            data: drivers,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Send Invoice via WhatsApp
 * @route   POST /api/jobs/:jobId/send-invoice-whatsapp
 * @access  Private
 */
const sendInvoiceWhatsApp = async (req, res, next) => {
    try {
        const { grandTotal } = req.body;
        const result = await jobService.sendInvoiceWhatsApp(req.params.jobId, grandTotal);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats,
    createJob,
    getAllJobs,
    getJobById,
    updateJob,
    assignMechanic,
    saveInspection,
    saveFaultyParts,
    customerApproval,
    saveRepairCost,
    completeJob,
    deleteJob,
    getJobHistory,
    getApprovedJobs,
    issueParts,
    markReadyForRepair,
    assignDriver,
    getDrivers,
    sendInvoiceWhatsApp,
    sendDropWhatsApp,
};
