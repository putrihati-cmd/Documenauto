require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
});

// Redis Connection
const redisClient = redis.createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'SmartCopy Backend is Running', status: 'online' });
});

app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        await redisClient.ping();
        res.json({
            status: 'healthy',
            db: 'connected',
            redis: 'connected'
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

const { exec } = require('child_process');

// Webhook Router (For WAHA)
app.post('/webhook', async (req, res) => {
    const payload = req.body;
    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    // 1. Basic Validation
    if (!payload || !payload.body) {
        return res.status(200).send('No content');
    }

    const message = payload.body.toLowerCase();
    const sender = payload.from;

    console.log(`[Router] Msg from ${sender}: ${message}`);

    // 2. Router Logic
    try {
        // CASE A: Dokumen Masuk (Ada Attachment)
        if (payload.hasMedia) {
             console.log('>> [SmartCopy] Document detected! Queuing for Python Worker...');
             // Real implementation would download media here via WAHA API
             // For MVP: We simulate triggering the worker if it's a known demo file
             if (message.includes('skripsi')) {
                 console.log('>> Triggering Style Applicator (Category: Skripsi)...');
                 exec('python3 /app/processing-engine/style_applicator.py input.docx templates/skripsi/master.docx output.docx', (error, stdout, stderr) => {
                     if (error) console.error(`Worker Error: ${error}`);
                     else console.log(`Worker Result: ${stdout}`);
                 });
             }
        } 
        
        // CASE B: Cek Member (Keyword)
        else if (message.includes('cek poin') || message.includes('member')) {
            console.log('>> [Router] Routing to MEMBER APP API...');
            // axios.post('http://member-app/api/check', ...)
        }
        
        // CASE C: Kasir (Keyword)
        else if (message.includes('bayar') || message.includes('tagihan')) {
            console.log('>> [Router] Routing to POS APP API...');
        }

        // CASE D: Default Auto-Reply
        else {
             console.log('>> [Bot] Sending default menu...');
        }

    } catch (err) {
        console.error('Router Error:', err);
    }

    res.status(200).send('OK');
});

// Start Server
const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        await redisClient.connect();
        console.log('Redis connected.');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect:', error);
    }
};

start();
