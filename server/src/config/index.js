// All config values in one place
module.exports = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/repairing_shop',
    jwtSecret: process.env.JWT_SECRET || 'default_secret',
    jwtExpire: process.env.JWT_EXPIRE || '15m',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'refresh_default_secret',
    refreshTokenExpire: process.env.REFRESH_TOKEN_EXPIRE || '7d',
    corsOrigin: process.env.CORS_ORIGIN || 'https://repaireshop.onrender.com',
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
};
