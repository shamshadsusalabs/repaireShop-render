require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

// Initialize Cloudinary (just importing triggers configuration)
require('./config/cloudinary');

// ─── Initialize Express App ─────────────────────────────────
const app = express();

// ─── Connect to MongoDB ─────────────────────────────────────
connectDB();

// ─── Middleware ──────────────────────────────────────────────
// CORS
app.use(
    cors({
        origin: config.corsOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Morgan HTTP logging (dev mode only)
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
}

// ─── API Routes ─────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// ─── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────
const PORT = config.port;

app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════════╗
  ║                                              ║
  ║   🔧  SusaLabs Repairing Shop API           ║
  ║                                              ║
  ║   🌐  Server:  http://localhost:${PORT}        ║
  ║   📦  Mode:    ${config.nodeEnv.padEnd(24)}║
  ║   🗄️   DB:     MongoDB                       ║
  ║   ☁️   Images: Cloudinary                    ║
  ║                                              ║
  ╚══════════════════════════════════════════════╝
  `);
});

module.exports = app;
