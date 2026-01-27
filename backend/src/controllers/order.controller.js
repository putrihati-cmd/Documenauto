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

// Create order controller
const createOrder = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const {
      documentType,
      serviceLevel,
      copies,
      bindingType,
      colorMode,
      notes
    } = req.body;

    // Validate required fields
    if (!documentType || !serviceLevel) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Generate order ID
    const orderId = 'ORD-' + Date.now();

    // Create order object (in production, this would be saved to database)
    const order = {
      orderId,
      status: 'PENDING_REVIEW',
      file: {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype
      },
      documentType,
      serviceLevel,
      copies: parseInt(copies) || 1,
      bindingType,
      colorMode: colorMode === 'true',
      notes,
      createdAt: new Date().toISOString()
    };

    // In production, save to database:
    // const savedOrder = await Order.create(order);

    // For now, log and return
    console.log('New order created:', order);

    // TODO: Add to Redis queue for processing
    // await addToQueue(order);

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: order.orderId,
      data: {
        orderId: order.orderId,
        status: order.status,
        createdAt: order.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
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
