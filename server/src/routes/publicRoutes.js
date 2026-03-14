const express = require('express');
const jobService = require('../services/jobService');

const router = express.Router();

/**
 * @desc    Get job details for customer approval (Public - no auth)
 * @route   GET /api/public/approval/:jobId
 * @access  Public
 */
router.get('/approval/:jobId', async (req, res, next) => {
    try {
        const job = await jobService.getJobById(req.params.jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        // Return only necessary info for customer approval
        res.status(200).json({
            success: true,
            data: {
                jobId: job.jobId,
                customerName: job.customerName,
                mobile: job.mobile,
                carModel: job.carModel,
                carNumber: job.carNumber,
                kmDriven: job.kmDriven,
                date: job.date,
                status: job.status,
                faultyParts: job.faultyParts,
                approved: job.approved,
                gstPercent: job.gstPercent,
                mechanicName: job.mechanicId ? job.mechanicId.name : null,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @desc    Customer approves or rejects a job (Public - no auth)
 * @route   PUT /api/public/approval/:jobId
 * @access  Public
 */
router.put('/approval/:jobId', async (req, res, next) => {
    try {
        const { approved } = req.body;

        if (typeof approved !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'approved field must be true or false',
            });
        }

        const job = await jobService.customerApproval(req.params.jobId, approved);
        res.status(200).json({
            success: true,
            message: approved ? 'Repair approved by customer' : 'Repair rejected by customer',
            data: job,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
