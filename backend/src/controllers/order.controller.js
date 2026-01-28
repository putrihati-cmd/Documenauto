const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../storage/uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, DOC, PPTX, JPG, and PNG are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

const { addToQueue } = require('../utils/queue');
const { getTemplate } = require('./template.controller');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

// Create order controller
const createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    if (!req.file) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { documentType, serviceLevel, copies, bindingType, colorMode, notes, templateId } = req.body;
    const user_id = req.user?.id || 1; // Default to Test User
    const TOKENS_COST = 1; // Fixed cost for now

    // 1. Check User Balance & Lock Row
    const [users] = await sequelize.query(
      'SELECT token_balance FROM users WHERE id = :uid FOR UPDATE',
      { replacements: { uid: user_id }, type: QueryTypes.SELECT, transaction: t }
    );

    if (!users || users.token_balance < TOKENS_COST) {
      await t.rollback();
      // Delete uploaded file to clean up
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(402).json({ 
        success: false, 
        message: 'Insufficient tokens. Please top up.' 
      });
    }

    // 2. Generate Order IDs
    const orderRef = 'ORD-' + Date.now();

    // 3. Create Database Order
    const [result] = await sequelize.query(
      `INSERT INTO orders 
       (user_id, status, original_filename, file_path, document_type, tokens_required, tokens_spent, created_at, updated_at) 
       VALUES (:uid, 'processing', :orig, :path, :type, :cost, :spent, NOW(), NOW()) 
       RETURNING id`,
      {
        replacements: {
          uid: user_id,
          orig: req.file.originalname,
          path: req.file.path,
          type: documentType,
          cost: TOKENS_COST,
          spent: TOKENS_COST
        },
        type: QueryTypes.INSERT,
        transaction: t
      }
    );
    
    // Sequelize INSERT with RETURNING returns [[{id: ...}]] for postgres sometimes, or [result, meta]
    // Let's handle the array destructure safe way
    const dbOrderId = result[0]?.id || result[0]; 

    // 4. Deduct Tokens
    await sequelize.query(
      'UPDATE users SET token_balance = token_balance - :cost, total_tokens_spent = total_tokens_spent + :cost WHERE id = :uid',
      { replacements: { cost: TOKENS_COST, uid: user_id }, transaction: t }
    );

    // 5. Record Token Transaction
    await sequelize.query(
      `INSERT INTO token_transactions 
       (user_id, amount, balance_before, balance_after, transaction_type, description, order_id, created_at)
       VALUES 
       (:uid, :amount, :bal_before, :bal_after, 'spend_format', :desc, :oid, NOW())`,
       {
         replacements: {
           uid: user_id,
           amount: -TOKENS_COST,
           bal_before: users.token_balance,
           bal_after: users.token_balance - TOKENS_COST,
           desc: `Formatting Document ${orderRef}`,
           oid: dbOrderId // Linking to the real integer ID in 'orders' table
         },
         transaction: t
       }
    );

    await t.commit();

    console.log(`Order ${dbOrderId} created. Tokens deducted.`);

    // ---------------------------------------------------------
    // DISPATCH JOB TO PYTHON WORKER
    // ---------------------------------------------------------
    const inputPath = `/app/storage/uploads/${req.file.filename}`;
    const outputPath = `/app/storage/processed/${orderRef}-formatted.docx`;
    
    const jobPayload = {
      id: dbOrderId.toString(), // Use the DB Integer ID for consistency
      orderRef: orderRef,       // Keep the string ref for filenames
      type: 'format',
      input: inputPath,
      ref: templateId ? `TEMPLATE:${templateId}` : `CATEGORY:${documentType}`,
      output: outputPath,
      userId: user_id
    };

    await addToQueue(jobPayload);
    console.log(">> Job Dispatched to Redis:", jobPayload);

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: orderRef,
      dbId: dbOrderId,
      data: {
        orderId: orderRef,
        status: 'processing',
        tokens_remaining: users.token_balance - TOKENS_COST
      }
    });

  } catch (error) {
    await t.rollback();
    console.error('Error creating order:', error);
    // Try to cleanup file
    if (req.file) await fs.unlink(req.file.path).catch(() => {});
    
    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Get order by ID
const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // In production, fetch from database:
    // const order = await Order.findOne({ where: { orderId } });

    // For now, return mock data
    return res.status(200).json({
      success: true,
      data: {
        orderId,
        status: 'PENDING_REVIEW',
        message: 'Order is being reviewed by our team'
      }
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// List all orders (for admin dashboard)
const listOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // In production, fetch from database with pagination:
    // const orders = await Order.findAll({
    //   where: status ? { status } : {},
    //   limit: parseInt(limit),
    //   offset: (parseInt(page) - 1) * parseInt(limit),
    //   order: [['createdAt', 'DESC']]
    // });

    // For now, return empty array
    return res.status(200).json({
      success: true,
      data: {
        orders: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0
        }
      }
    });

  } catch (error) {
    console.error('Error listing orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to list orders',
      error: error.message
    });
  }
};

// Update order status (for staff)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['PENDING_REVIEW', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // In production, update in database:
    // await Order.update({ status, staffNotes: notes }, { where: { orderId } });

    console.log(`Order ${orderId} status updated to ${status}`);

    return res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: {
        orderId,
        status
      }
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus
};
