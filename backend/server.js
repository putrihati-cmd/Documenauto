require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const redis = require('redis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded documents (for development/testing)
app.use('/uploads', express.static(path.join(__dirname, 'storage/uploads')));

// Database Connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
});

// Redis Connection
const redisClient = redis.createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Import routes
const orderRoutes = require('./src/routes/order.routes');

// Base routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'SmartCopy Backend API', 
        status: 'online',
        version: '2.0.0',
        mode: 'web-workflow'
    });
});

app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        await redisClient.ping();
        res.json({
            status: 'healthy',
            db: 'connected',
            redis: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// API routes
app.use('/api', orderRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 50MB.'
        });
    }
    
    if (error.message && error.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// Start Server
const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('✓ Database connected');
        
        await redisClient.connect();
        console.log('✓ Redis connected');

        app.listen(PORT, () => {
            console.log('');
            console.log('═══════════════════════════════════════════');
            console.log('  SmartCopy Backend API v2.0');
            console.log('  Mode: Web-Based Workflow');
            console.log('═══════════════════════════════════════════');
            console.log(`  🚀 Server: http://localhost:${PORT}`);
            console.log(`  📊 Health: http://localhost:${PORT}/health`);
            console.log(`  📁 API: http://localhost:${PORT}/api`);
            console.log('═══════════════════════════════════════════');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Unable to start server:', error);
        process.exit(1);
    }
};

start();
