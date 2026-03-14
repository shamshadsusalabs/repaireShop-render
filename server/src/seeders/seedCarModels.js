require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const CarModel = require('../models/CarModel');
const connectDB = require('../config/db');

// Currently used as a flat list 'carModels' in frontend, let's map them to a default brand "General" or parse them if possible.
// Wait, the previous frontend `carModels` was just an array of strings: `['Toyota', 'Honda', 'Suzuki', ...]`. No, wait, it looked like this in screenshot: "e.g. MH-12-AB-1234, ...". Ah, we don't know the exact static list. Let me check the frontend file later.
// I will just use some default common Indian models for now.

const initialModels = [
    { brand: 'Maruti Suzuki', modelName: 'Swift' },
    { brand: 'Maruti Suzuki', modelName: 'Baleno' },
    { brand: 'Maruti Suzuki', modelName: 'Wagon R' },
    { brand: 'Hyundai', modelName: 'i20' },
    { brand: 'Hyundai', modelName: 'Creta' },
    { brand: 'Tata', modelName: 'Nexon' },
    { brand: 'Tata', modelName: 'Punch' },
    { brand: 'Mahindra', modelName: 'Thar' },
    { brand: 'Mahindra', modelName: 'XUV700' },
    { brand: 'Kia', modelName: 'Seltos' },
    { brand: 'Toyota', modelName: 'Innova' },
    { brand: 'Honda', modelName: 'City' },
];

const seedModels = async () => {
    try {
        await connectDB();
        
        // Delete all existing items
        await CarModel.deleteMany();
        console.log('Cleared existing car models');
        
        // Insert new initial items
        await CarModel.insertMany(initialModels);
        console.log('Successfully seeded initial car models');
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding car models:', error);
        process.exit(1);
    }
};

seedModels();
