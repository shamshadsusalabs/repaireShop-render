const Job = require('../models/Job');
const Part = require('../models/Part');
const User = require('../models/User');
const generateJobId = require('../utils/generateJobId');

/**
 * Create a new job
 */
const createJob = async (jobData, userId) => {
    const jobId = await generateJobId();

    const job = await Job.create({
        ...jobData,
        jobId,
        status: 'Pending',
        inspectionResults: [],
        faultyParts: [],
        gstPercent: jobData.gstPercent || 18,
        grandTotal: 0,
        createdBy: userId,
    });

    return job;
};

/**
 * Get all jobs with optional filters
 */
const getAllJobs = async (query = {}) => {
    const { status, search, page = 1, limit = 20, sort = '-createdAt' } = query;

    const filter = {};

    // Filter by status
    if (status && status !== 'all') {
        filter.status = status;
    }

    // Search by customer name, car model, car number, job ID
    if (search) {
        filter.$or = [
            { customerName: { $regex: search, $options: 'i' } },
            { carModel: { $regex: search, $options: 'i' } },
            { carNumber: { $regex: search, $options: 'i' } },
            { jobId: { $regex: search, $options: 'i' } },
            { mobile: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [jobs, total] = await Promise.all([
        Job.find(filter)
            .populate('mechanicId', 'name specialty avatar')
            .populate('driverId', 'name email avatar')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit)),
        Job.countDocuments(filter),
    ]);

    return {
        jobs,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    };
};

/**
 * Get a single job by jobId (e.g. JOB-2026-001)
 */
const getJobById = async (jobId) => {
    const job = await Job.findOne({ jobId })
        .populate('mechanicId', 'name specialty avatar experience available')
        .populate('driverId', 'name email avatar');

    if (!job) {
        const error = new Error(`Job '${jobId}' not found`);
        error.statusCode = 404;
        throw error;
    }

    return job;
};

/**
 * Update job (general fields)
 */
const updateJob = async (jobId, updates) => {
    const job = await Job.findOne({ jobId });

    if (!job) {
        const error = new Error(`Job '${jobId}' not found`);
        error.statusCode = 404;
        throw error;
    }

    // Update allowed fields
    Object.assign(job, updates);
    await job.save();

    return job;
};

/**
 * Assign mechanic to a job
 */
const assignMechanic = async (jobId, mechanicId) => {
    const job = await Job.findOne({ jobId });

    if (!job) {
        const error = new Error(`Job '${jobId}' not found`);
        error.statusCode = 404;
        throw error;
    }

    job.mechanicId = mechanicId;
    job.status = 'Assigned';
    await job.save();

    return await Job.findOne({ jobId }).populate('mechanicId', 'name specialty avatar');
};

/**
 * Save inspection results
 */
const saveInspection = async (jobId, inspectionResults) => {
    const job = await Job.findOne({ jobId });

    if (!job) {
        const error = new Error(`Job '${jobId}' not found`);
        error.statusCode = 404;
        throw error;
    }

    job.inspectionResults = inspectionResults;
    job.status = 'Inspection';
    await job.save();

    return job;
};

/**
 * Save faulty parts list
 */
const saveFaultyParts = async (jobId, faultyParts) => {
    const job = await Job.findOne({ jobId });

    if (!job) {
        const error = new Error(`Job '${jobId}' not found`);
        error.statusCode = 404;
        throw error;
    }

    job.faultyParts = faultyParts;
    job.status = 'Approval';
    await job.save();

    return job;
};

/**
 * Customer approval or rejection
 */
const customerApproval = async (jobId, approved) => {
    const job = await Job.findOne({ jobId });

    if (!job) {
        const error = new Error(`Job '${jobId}' not found`);
        error.statusCode = 404;
        throw error;
    }

    job.approved = approved;
    job.status = approved ? 'Approved' : 'Rejected';
    await job.save();

    return job;
};

/**
 * Save repair costs and mark as repairing
 */
const saveRepairCost = async (jobId, faultyParts) => {
    const job = await Job.findOne({ jobId });

    if (!job) {
        const error = new Error(`Job '${jobId}' not found`);
        error.statusCode = 404;
        throw error;
    }

    job.faultyParts = faultyParts;
    job.status = 'Repairing';
    await job.save(); // grandTotal auto-calculated in pre-save hook

    return job;
};

/**
 * Complete job and generate invoice
 */
const completeJob = async (jobId) => {
    const job = await Job.findOne({ jobId });

    if (!job) {
        const error = new Error(`Job '${jobId}' not found`);
        error.statusCode = 404;
        throw error;
    }

    job.status = 'Completed';
    await job.save();

    return job;
};

/**
 * Delete a job
 */
const deleteJob = async (jobId) => {
    const job = await Job.findOneAndDelete({ jobId });

    if (!job) {
        const error = new Error(`Job '${jobId}' not found`);
        error.statusCode = 404;
        throw error;
    }

    return job;
};

/**
 * Get dashboard stats
 */
const getDashboardStats = async () => {
    const [total, pending, inProgress, completed] = await Promise.all([
        Job.countDocuments(),
        Job.countDocuments({ status: 'Pending' }),
        Job.countDocuments({
            status: { $in: ['Assigned', 'Inspection', 'Approval', 'Approved', 'Parts Requested', 'Repairing'] },
        }),
        Job.countDocuments({ status: 'Completed' }),
    ]);

    // Recent 5 jobs
    const recentJobs = await Job.find()
        .populate('mechanicId', 'name specialty avatar')
        .sort('-createdAt')
        .limit(5);

    return {
        totalCars: total,
        pendingJobs: pending,
        inProgress,
        completed,
        recentJobs,
    };
};

/**
 * Get job history by mobile or car number
 */
const getJobHistory = async (query) => {
    if (!query) return { customer: null, history: [] };

    // Find jobs matching mobile or car number
    const jobs = await Job.find({
        $or: [
            { mobile: query },
            { carNumber: { $regex: query, $options: 'i' } },
        ],
    })
        .sort('-createdAt')
        .limit(10); // Last 10 visits

    if (jobs.length === 0) {
        return { customer: null, history: [] };
    }

    // Extract latest customer details from the most recent job
    const latestJob = jobs[0];
    const customer = {
        customerName: latestJob.customerName,
        mobile: latestJob.mobile,
        carModel: latestJob.carModel,
        carNumber: latestJob.carNumber,
        kmDriven: latestJob.kmDriven,
    };

    return {
        customer,
        history: jobs.map(job => ({
            jobId: job.jobId,
            date: job.date,
            carModel: job.carModel,
            status: job.status,
            grandTotal: job.grandTotal,
        })),
    };
};
/**
 * Get all approved jobs that need parts from store
 */
const getApprovedJobs = async () => {
    const jobs = await Job.find({
        status: { $in: ['Approved', 'Parts Requested'] },
        approved: true,
    })
        .populate('mechanicId', 'name specialty avatar')
        .sort('-updatedAt');

    return jobs;
};

/**
 * Issue parts from store inventory to a job
 * - Validates job is in Approved/Parts Requested status
 * - Deducts quantity from Part inventory
 * - Records issued parts on the job
 * - Updates job status to 'Parts Requested'
 */
const issueParts = async (jobId, partsToIssue, userId) => {
    const job = await Job.findOne({ jobId });

    if (!job) {
        const error = new Error(`Job '${jobId}' not found`);
        error.statusCode = 404;
        throw error;
    }

    if (!['Approved', 'Parts Requested'].includes(job.status)) {
        const error = new Error(`Job must be in Approved or Parts Requested status to issue parts. Current status: ${job.status}`);
        error.statusCode = 400;
        throw error;
    }

    const issuedRecords = [];
    const errors = [];

    for (const item of partsToIssue) {
        const { partId, quantityIssued } = item;

        if (!partId || !quantityIssued || quantityIssued < 1) {
            errors.push({ partId, error: 'Part ID and quantity (>= 1) are required' });
            continue;
        }

        // Find the part in inventory
        const part = await Part.findById(partId);
        if (!part) {
            errors.push({ partId, error: 'Part not found in inventory' });
            continue;
        }

        if (!part.isActive) {
            errors.push({ partId, partName: part.partName, error: 'Part is inactive' });
            continue;
        }

        if (part.quantity < quantityIssued) {
            errors.push({
                partId,
                partName: part.partName,
                error: `Insufficient stock. Available: ${part.quantity}, Requested: ${quantityIssued}`,
            });
            continue;
        }

        // Deduct from inventory
        part.quantity -= quantityIssued;
        await part.save();

        // Record the issuance
        issuedRecords.push({
            partId: part._id,
            partName: part.partName,
            partNumber: part.partNumber,
            quantityIssued,
            unitPrice: part.sellPrice,
            issuedBy: userId,
            issuedAt: new Date(),
        });
    }

    if (issuedRecords.length > 0) {
        // Add issued parts to job
        job.partsIssued = [...(job.partsIssued || []), ...issuedRecords];
        job.status = 'Parts Requested';
        await job.save();
    }

    return {
        job: await Job.findOne({ jobId })
            .populate('mechanicId', 'name specialty avatar')
            .populate('partsIssued.issuedBy', 'name email'),
        issued: issuedRecords.length,
        failed: errors.length,
        errors,
    };
};

/**
 * Mark parts-issued job as ready for repair
 */
const markReadyForRepair = async (jobId) => {
    const job = await Job.findOne({ jobId });

    if (!job) {
        const error = new Error(`Job '${jobId}' not found`);
        error.statusCode = 404;
        throw error;
    }

    if (job.status !== 'Parts Requested') {
        const error = new Error(`Job must be in 'Parts Requested' status. Current: ${job.status}`);
        error.statusCode = 400;
        throw error;
    }

    job.status = 'Repairing';
    await job.save();

    return job;
};

/**
 * Assign a driver to a job for Pickup or Drop
 */
const assignDriver = async (jobId, driverId, driverTask) => {
    const job = await Job.findOne({ jobId });

    if (!job) {
        const error = new Error(`Job '${jobId}' not found`);
        error.statusCode = 404;
        throw error;
    }

    // Verify the driver exists and has role 'driver'
    const driver = await User.findById(driverId);
    if (!driver) {
        const error = new Error('Driver not found');
        error.statusCode = 404;
        throw error;
    }
    if (driver.role !== 'driver') {
        const error = new Error('Selected user is not a driver');
        error.statusCode = 400;
        throw error;
    }

    job.driverId = driverId;
    job.driverTask = driverTask;
    await job.save();

    return await Job.findOne({ jobId })
        .populate('mechanicId', 'name specialty avatar')
        .populate('driverId', 'name email avatar');
};

/**
 * Get all active drivers
 */
const getDrivers = async () => {
    const drivers = await User.find({ role: 'driver', isActive: true }).sort('-createdAt');
    return drivers;
};

module.exports = {
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
    getDashboardStats,
    getJobHistory,
    getApprovedJobs,
    issueParts,
    markReadyForRepair,
    assignDriver,
    getDrivers,
};
