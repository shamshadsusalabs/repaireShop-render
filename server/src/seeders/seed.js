require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const Job = require('../models/Job');
const config = require('../config');

const seedData = async () => {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Mechanic.deleteMany({});
        await Job.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // ─── Seed Admin User ───────────────────────────────────
        const admin = await User.create({
            name: 'Admin',
            email: 'admin@gmail.com',
            password: '12345678',
            role: 'admin',
            avatar: '👤',
        });
        console.log('👤 Admin user created (admin@gmail.com / 12345678)');

        // ─── Seed Mechanics ────────────────────────────────────
        const mechanicsData = [
            {
                mechanicId: 'MECH-001',
                name: 'Rajesh Kumar',
                experience: '8 Years',
                specialty: 'Engine & Transmission',
                avatar: '🔧',
                available: true,
            },
            {
                mechanicId: 'MECH-002',
                name: 'Sunil Sharma',
                experience: '5 Years',
                specialty: 'Brakes & Suspension',
                avatar: '🛠️',
                available: true,
            },
            {
                mechanicId: 'MECH-003',
                name: 'Amit Patel',
                experience: '10 Years',
                specialty: 'Electrical & Battery',
                avatar: '⚡',
                available: false,
            },
            {
                mechanicId: 'MECH-004',
                name: 'Vikram Singh',
                experience: '6 Years',
                specialty: 'Body & Paint',
                avatar: '🎨',
                available: true,
            },
            {
                mechanicId: 'MECH-005',
                name: 'Deepak Verma',
                experience: '12 Years',
                specialty: 'Full Service Specialist',
                avatar: '🏆',
                available: true,
            },
        ];

        const mechanics = await Mechanic.insertMany(mechanicsData);
        console.log(`🔧 ${mechanics.length} mechanics created`);

        // ─── Seed Sample Jobs ──────────────────────────────────
        const jobsData = [
            {
                jobId: 'JOB-2026-001',
                customerName: 'Rahul Mehta',
                mobile: '9876543210',
                carModel: 'Maruti Suzuki Swift',
                carNumber: 'MH-12-AB-1234',
                kmDriven: 45000,
                date: new Date('2026-02-10T09:30:00'),
                status: 'Completed',
                mechanicId: mechanics[0]._id,
                inspectionResults: [
                    { partName: 'Engine', status: 'OK', comment: 'Running smooth' },
                    { partName: 'Brake', status: 'Not OK', comment: 'Brake pads worn out' },
                    { partName: 'Clutch', status: 'OK', comment: '' },
                    { partName: 'Suspension', status: 'OK', comment: '' },
                    { partName: 'Battery', status: 'Not OK', comment: 'Low voltage' },
                    { partName: 'Tyres', status: 'OK', comment: 'Good condition' },
                    { partName: 'Lights', status: 'OK', comment: '' },
                ],
                faultyParts: [
                    { partName: 'Brake Pads', issueDescription: 'Worn out, needs replacement', estimatedCost: 2500, actualCost: 2500, labourCharge: 500, discount: 0 },
                    { partName: 'Battery', issueDescription: 'Low voltage, replace', estimatedCost: 4500, actualCost: 4500, labourCharge: 300, discount: 200 },
                ],
                approved: true,
                gstPercent: 18,
                createdBy: admin._id,
            },
            {
                jobId: 'JOB-2026-002',
                customerName: 'Priya Sharma',
                mobile: '9988776655',
                carModel: 'Hyundai Creta',
                carNumber: 'DL-05-CK-5678',
                kmDriven: 32000,
                date: new Date('2026-02-10T10:15:00'),
                status: 'Repairing',
                mechanicId: mechanics[1]._id,
                inspectionResults: [
                    { partName: 'Engine', status: 'OK', comment: '' },
                    { partName: 'Brake', status: 'OK', comment: '' },
                    { partName: 'Clutch', status: 'Not OK', comment: 'Slipping issue' },
                    { partName: 'Suspension', status: 'Not OK', comment: 'Noise from front left' },
                    { partName: 'Battery', status: 'OK', comment: '' },
                    { partName: 'Tyres', status: 'Not OK', comment: 'Front tyres need replacement' },
                    { partName: 'Lights', status: 'OK', comment: '' },
                ],
                faultyParts: [
                    { partName: 'Clutch Plate', issueDescription: 'Slipping, needs replacement', estimatedCost: 6000, actualCost: 6000, labourCharge: 1500, discount: 500 },
                    { partName: 'Suspension Bush', issueDescription: 'Worn out bush front left', estimatedCost: 1800, actualCost: 1800, labourCharge: 800, discount: 0 },
                    { partName: 'Front Tyres (2)', issueDescription: 'Worn out, replace pair', estimatedCost: 8000, actualCost: 8000, labourCharge: 400, discount: 0 },
                ],
                approved: true,
                gstPercent: 18,
                createdBy: admin._id,
            },
            {
                jobId: 'JOB-2026-003',
                customerName: 'Amit Verma',
                mobile: '9112233445',
                carModel: 'Tata Nexon',
                carNumber: 'UP-32-FG-9012',
                kmDriven: 18500,
                date: new Date('2026-02-10T11:00:00'),
                status: 'Inspection',
                mechanicId: mechanics[4]._id,
                inspectionResults: [],
                faultyParts: [],
                gstPercent: 18,
                createdBy: admin._id,
            },
            {
                jobId: 'JOB-2026-004',
                customerName: 'Sneha Gupta',
                mobile: '9445566778',
                carModel: 'Kia Seltos',
                carNumber: 'HR-26-DK-3456',
                kmDriven: 55000,
                date: new Date('2026-02-09T14:30:00'),
                status: 'Pending',
                inspectionResults: [],
                faultyParts: [],
                gstPercent: 18,
                createdBy: admin._id,
            },
            {
                jobId: 'JOB-2026-005',
                customerName: 'Vikash Joshi',
                mobile: '9667788990',
                carModel: 'Honda City',
                carNumber: 'RJ-14-HL-7890',
                kmDriven: 72000,
                date: new Date('2026-02-09T16:45:00'),
                status: 'Approval',
                mechanicId: mechanics[3]._id,
                inspectionResults: [
                    { partName: 'Engine', status: 'Not OK', comment: 'Oil leak detected' },
                    { partName: 'Brake', status: 'OK', comment: '' },
                    { partName: 'Clutch', status: 'OK', comment: '' },
                    { partName: 'Suspension', status: 'OK', comment: '' },
                    { partName: 'Battery', status: 'OK', comment: '' },
                    { partName: 'Tyres', status: 'Not OK', comment: 'Rear tyres worn' },
                    { partName: 'Lights', status: 'Not OK', comment: 'Headlight bulb fused' },
                ],
                faultyParts: [
                    { partName: 'Engine Gasket', issueDescription: 'Oil leaking from gasket', estimatedCost: 3500, actualCost: 0, labourCharge: 2000, discount: 0 },
                    { partName: 'Rear Tyres (2)', issueDescription: 'Worn out, replace pair', estimatedCost: 7000, actualCost: 0, labourCharge: 400, discount: 0 },
                    { partName: 'Headlight Bulb', issueDescription: 'Left headlight fused', estimatedCost: 800, actualCost: 0, labourCharge: 200, discount: 0 },
                ],
                gstPercent: 18,
                createdBy: admin._id,
            },
            {
                jobId: 'JOB-2026-006',
                customerName: 'Neha Kapoor',
                mobile: '9334455667',
                carModel: 'Mahindra XUV700',
                carNumber: 'MP-09-AB-2345',
                kmDriven: 28000,
                date: new Date('2026-02-08T09:00:00'),
                status: 'Completed',
                mechanicId: mechanics[0]._id,
                inspectionResults: [
                    { partName: 'Engine', status: 'OK', comment: '' },
                    { partName: 'Brake', status: 'OK', comment: '' },
                    { partName: 'Clutch', status: 'OK', comment: '' },
                    { partName: 'Suspension', status: 'OK', comment: '' },
                    { partName: 'Battery', status: 'Not OK', comment: 'Needs replacement' },
                    { partName: 'Tyres', status: 'OK', comment: '' },
                    { partName: 'Lights', status: 'OK', comment: '' },
                ],
                faultyParts: [
                    { partName: 'Battery', issueDescription: 'Dead cells, replace', estimatedCost: 6000, actualCost: 5800, labourCharge: 300, discount: 300 },
                ],
                approved: true,
                gstPercent: 18,
                createdBy: admin._id,
            },
        ];

        const jobs = await Job.insertMany(jobsData);
        console.log(`🚗 ${jobs.length} sample jobs created`);

        console.log('\n✅ Database seeded successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Admin Login: admin@gmail.com / 12345678');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

seedData();
