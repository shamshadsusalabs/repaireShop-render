require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const InspectionItem = require('../models/InspectionItem');
const connectDB = require('../config/db');

const initialItems = [
    { name: 'Engine', icon: '🔥' },
    { name: 'Brake', icon: '🛑' },
    { name: 'Clutch', icon: '⚙️' },
    { name: 'Suspension', icon: '🔩' },
    { name: 'Battery', icon: '🔋' },
    { name: 'Tyres', icon: '🛞' },
    { name: 'Lights', icon: '💡' },
    { name: 'AC System', icon: '❄️' },
    { name: 'Steering', icon: '🎯' },
    { name: 'Exhaust', icon: '💨' }
];

const seedItems = async () => {
    try {
        await connectDB();
        
        // Delete all existing items
        await InspectionItem.deleteMany();
        console.log('Cleared existing inspection items');
        
        // Insert new initial items
        await InspectionItem.insertMany(initialItems);
        console.log('Successfully seeded initial inspection items');
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding inspection items:', error);
        process.exit(1);
    }
};

seedItems();
