const Job = require('../models/Job');

/**
 * Generate the next sequential Job ID
 * Format: JOB-{YEAR}-{3-digit-number}
 * Example: JOB-2026-001, JOB-2026-002, ...
 */
const generateJobId = async () => {
    const year = new Date().getFullYear();
    const prefix = `JOB-${year}-`;

    // Find the last job of the current year
    const lastJob = await Job.findOne({
        jobId: { $regex: `^${prefix}` },
    })
        .sort({ jobId: -1 })
        .select('jobId');

    if (!lastJob) {
        return `${prefix}001`;
    }

    const lastNumber = parseInt(lastJob.jobId.split('-')[2], 10);
    const nextNumber = String(lastNumber + 1).padStart(3, '0');

    return `${prefix}${nextNumber}`;
};

module.exports = generateJobId;
