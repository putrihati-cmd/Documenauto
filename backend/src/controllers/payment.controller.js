const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

// Configure multer for payment proof uploads
const paymentProofStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../storage/payment-proofs');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `proof_${uniqueSuffix}${ext}`);
  }
});

const uploadPaymentProof = multer({
  storage: paymentProofStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and PDF files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Get token packages
const getPackages = async (req, res) => {
  try {
    const packages = await sequelize.query(
      'SELECT * FROM token_packages WHERE is_active = true ORDER BY price ASC',
      { type: QueryTypes.SELECT }
    );
    
    return res.status(200).json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Error getting packages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get packages'
    });
  }
};

// Get payment methods
const getPaymentMethods = async (req, res) => {
  try {
    const methods = await sequelize.query(
      'SELECT * FROM payment_methods WHERE is_active = true ORDER BY id ASC',
      { type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      success: true,
      data: methods
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payment methods'
    });
  }
};

// Create payment order
const createPaymentOrder = async (req, res) => {
  try {
    const { package_id, payment_method } = req.body;
    const user_id = req.user?.id || 1; // Default to ID 1 if auth missing

    if (!package_id || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Package ID and payment method are required'
      });
    }

    // Get package details
    const packages = await sequelize.query(
      'SELECT * FROM token_packages WHERE id = :id',
      { 
        replacements: { id: package_id },
        type: QueryTypes.SELECT 
      }
    );
    
    const selectedPackage = packages[0];

    if (!selectedPackage) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    // Generate order number
    const orderNumber = 'PAY-' + Date.now();
    
    // Calculate expiry (24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Prepare data
    const token_amount = selectedPackage.token_amount;
    const bonus_tokens = selectedPackage.bonus_tokens;
    const total_tokens = token_amount + bonus_tokens;
    const price = selectedPackage.price;

    // Insert into payment_orders
    const [result] = await sequelize.query(
      `INSERT INTO payment_orders 
       (order_number, user_id, package_id, token_amount, bonus_tokens, total_tokens, price, payment_method, status, expires_at) 
       VALUES (:order_number, :user_id, :package_id, :token_amount, :bonus_tokens, :total_tokens, :price, :payment_method, 'pending', :expires_at) 
       RETURNING *`,
      {
        replacements: {
          order_number: orderNumber,
          user_id,
          package_id,
          token_amount,
          bonus_tokens,
          total_tokens,
          price,
          payment_method,
          expires_at: expiresAt
        },
        type: QueryTypes.INSERT
      }
    );

    // Note: Sequelize raw insert returns [results, metadata] or just results depending on dialect
    // For Postgres with RETURNING, result[0] is usually the row.
    // Let's assume result[0] is the object.
    
    const paymentOrder = result[0];

    console.log('Payment order created:', paymentOrder);

    return res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: paymentOrder
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// Upload payment proof
const uploadProof = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { transfer_amount, transfer_date, transfer_notes } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment proof file is required'
      });
    }

    // Update payment order with proof
    const updateData = {
      payment_proof_path: req.file.path,
      payment_proof_url: `/uploads/payment-proofs/${req.file.filename}`,
      transfer_amount: parseFloat(transfer_amount),
      transfer_date: transfer_date || new Date().toISOString(),
      transfer_notes,
      status: 'paid', // Changed to 'paid' so admin can verify
      updated_at: new Date().toISOString()
    };
    
    // Update DB
    const [results] = await sequelize.query(
      `UPDATE payment_orders 
       SET payment_proof_path = :path, 
           payment_proof_url = :url, 
           transfer_amount = :amount, 
           transfer_date = :date, 
           transfer_notes = :notes, 
           status = 'paid', 
           updated_at = NOW() 
       WHERE id = :id 
       RETURNING *`,
       { 
         replacements: { 
           path: req.file.path,
           url: `/uploads/payment-proofs/${req.file.filename}`,
           amount: parseFloat(transfer_amount),
           date: transfer_date || new Date().toISOString(),
           notes: transfer_notes || '',
           id: order_id
         }, 
         type: QueryTypes.UPDATE 
       }
    );
     
    if (!results || results.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    const updatedOrder = results[0];

    console.log(`Payment proof uploaded for order ${order_id}:`, updatedOrder);

    return res.status(200).json({
      success: true,
      message: 'Payment proof uploaded successfully. Waiting for verification.',
      data: updateData
    });

  } catch (error) {
    console.error('Error uploading proof:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload payment proof',
      error: error.message
    });
  }
};

// Get user's payment orders
const getUserPaymentOrders = async (req, res) => {
  try {
    const user_id = req.user?.id || 1;
    const { status } = req.query;

    let query = 'SELECT * FROM payment_orders WHERE user_id = :uid';
    const replacements = { uid: user_id };
    
    if (status) {
        query += ' AND status = :status';
        replacements.status = status;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const orders = await sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT
    });

    return res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Error getting payment orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payment orders'
    });
  }
};

// STAFF ONLY: Get pending payment orders
const getPendingPayments = async (req, res) => {
  try {
    const orders = await sequelize.query(
        `SELECT po.*, u.name as user_name, u.email as user_email 
            FROM payment_orders po 
            LEFT JOIN users u ON po.user_id = u.id 
            WHERE po.status = 'paid' 
            ORDER BY po.updated_at ASC`,
        { type: QueryTypes.SELECT }
    );
    
    // Transform to match frontend expectation
    const formatted = orders.map(o => ({
        ...o,
        user: { email: o.user_email, full_name: o.user_name || 'Unknown' }
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });

  } catch (error) {
    console.error('Error getting pending payments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get pending payments'
    });
  }
};

// STAFF ONLY: Verify payment
const verifyPayment = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { action, notes } = req.body; // action: 'approve' or 'reject'
    const staff_id = req.user?.id || 1;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"'
      });
    }

    // Start Transaction
    const t = await sequelize.transaction();

    try {
        // Get payment order
        const orders = await sequelize.query(
            'SELECT * FROM payment_orders WHERE id = :id',
            { 
                replacements: { id: order_id },
                type: QueryTypes.SELECT,
                transaction: t
            }
        );
        
        const order = orders[0];
        if (!order) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (action === 'approve') {
            // 1. Update Order Status
            await sequelize.query(
                "UPDATE payment_orders SET status = 'completed', verified_by = :staff, verified_at = NOW(), verification_notes = :notes WHERE id = :id",
                {
                    replacements: { staff: staff_id, notes: notes || '', id: order_id },
                    transaction: t
                }
            );

            // 2. Credit Tokens to User
            await sequelize.query(
                "UPDATE users SET token_balance = COALESCE(token_balance, 0) + :amount WHERE id = :uid",
                {
                    replacements: { amount: order.total_tokens, uid: order.user_id },
                    transaction: t
                }
            );

            // 3. Create Token Transaction Record
            await sequelize.query(
                `INSERT INTO token_transactions 
                 (user_id, amount, balance_before, balance_after, transaction_type, description, payment_order_id, created_at)
                 VALUES 
                 (:uid, :amount, (SELECT token_balance - :amount FROM users WHERE id = :uid), (SELECT token_balance FROM users WHERE id = :uid), 'purchase', :desc, :oid, NOW())`,
                 {
                    replacements: {
                        uid: order.user_id,
                        amount: order.total_tokens,
                        desc: `Token purchase approved - Order ${order.order_number}`,
                        oid: order_id
                    },
                    transaction: t
                 }
            );

            await t.commit();
            
            return res.status(200).json({
                success: true,
                message: 'Payment approved and tokens credited',
                data: { tokens_credited: order.total_tokens }
            });

        } else { // Reject
            await sequelize.query(
                "UPDATE payment_orders SET status = 'rejected', verified_by = :staff, verified_at = NOW(), rejection_reason = :notes WHERE id = :id",
                {
                    replacements: { staff: staff_id, notes: notes || '', id: order_id },
                    transaction: t
                }
            );
            
            await t.commit();

            return res.status(200).json({
                success: true,
                message: 'Payment rejected',
                data: { status: 'rejected' }
            });
        }

    } catch (err) {
        await t.rollback();
        throw err;
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

module.exports = {
  uploadPaymentProof,
  getPackages,
  getPaymentMethods,
  createPaymentOrder,
  uploadProof,
  getUserPaymentOrders,
  getPendingPayments,
  verifyPayment
};
