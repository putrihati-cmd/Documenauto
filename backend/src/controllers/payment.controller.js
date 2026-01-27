const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

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
    // In production, fetch from database:
    // const packages = await TokenPackage.findAll({ where: { is_active: true } });
    
    const packages = [
      {
        id: 1,
        name: 'Starter Pack',
        token_amount: 10,
        bonus_tokens: 0,
        price: 10000,
        discount_percentage: 0,
        valid_days: 90,
        is_popular: false,
        description: 'Perfect for trying out the service'
      },
      {
        id: 2,
        name: 'Student Pack',
        token_amount: 50,
        bonus_tokens: 5,
        price: 40000,
        original_price: 50000,
        discount_percentage: 20,
        valid_days: 180,
        is_popular: true,
        description: 'Most popular! Great for 1 skripsi + revisions'
      },
      {
        id: 3,
        name: 'Pro Pack',
        token_amount: 100,
        bonus_tokens: 15,
        price: 70000,
        original_price: 100000,
        discount_percentage: 30,
        valid_days: 365,
        is_popular: false,
        description: 'Best value for multiple documents'
      },
      {
        id: 4,
        name: 'Mega Pack',
        token_amount: 300,
        bonus_tokens: 50,
        price: 180000,
        original_price: 300000,
        discount_percentage: 40,
        valid_days: null,
        is_popular: false,
        description: 'For power users and resellers'
      }
    ];

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
    // In production, fetch from database:
    // const methods = await PaymentMethod.findAll({ where: { is_active: true } });

    const methods = [
      {
        id: 1,
        method_type: 'bank_transfer',
        bank_name: 'BCA',
        account_number: '1234567890',
        account_name: 'SmartCopy Print',
        instructions: 'Transfer ke rekening BCA, lalu upload bukti transfer'
      },
      {
        id: 2,
        method_type: 'bank_transfer',
        bank_name: 'Mandiri',
        account_number: '0987654321',
        account_name: 'SmartCopy Print',
        instructions: 'Transfer ke rekening Mandiri, lalu upload bukti transfer'
      },
      {
        id: 3,
        method_type: 'qris',
        qris_merchant_name: 'SmartCopy Toko',
        qris_image_url: '/static/qris-smartcopy.png',
        instructions: 'Scan QRIS dan upload bukti pembayaran'
      },
      {
        id: 4,
        method_type: 'cash',
        instructions: 'Datang ke toko SmartCopy di Jl. Contoh No. 123'
      }
    ];

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
    const user_id = req.user?.id || 1; // From auth middleware

    if (!package_id || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Package ID and payment method are required'
      });
    }

    // Get package details
    // In production: const package = await TokenPackage.findByPk(package_id);
    const packages = {
      1: { token_amount: 10, bonus_tokens: 0, price: 10000 },
      2: { token_amount: 50, bonus_tokens: 5, price: 40000 },
      3: { token_amount: 100, bonus_tokens: 15, price: 70000 },
      4: { token_amount: 300, bonus_tokens: 50, price: 180000 }
    };
    
    const selectedPackage = packages[package_id];
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

    // Create payment order
    const paymentOrder = {
      order_number: orderNumber,
      user_id,
      package_id,
      token_amount: selectedPackage.token_amount,
      bonus_tokens: selectedPackage.bonus_tokens,
      total_tokens: selectedPackage.token_amount + selectedPackage.bonus_tokens,
      price: selectedPackage.price,
      payment_method,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    };

    // In production: await PaymentOrder.create(paymentOrder);

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
      status: 'paid',
      updated_at: new Date().toISOString()
    };

    // In production:
    // await PaymentOrder.update(updateData, { where: { id: order_id } });

    console.log(`Payment proof uploaded for order ${order_id}:`, updateData);

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

    // In production:
    // const where = { user_id };
    // if (status) where.status = status;
    // const orders = await PaymentOrder.findAll({ where });

    // Mock data
    const mockOrders = [
      {
        id: 1,
        order_number: 'PAY-20260127-0001',
        token_amount: 50,
        bonus_tokens: 5,
        total_tokens: 55,
        price: 40000,
        payment_method: 'bank_transfer',
        status: 'completed',
        created_at: '2026-01-26T10:00:00Z',
        verified_at: '2026-01-26T11:00:00Z'
      },
      {
        id: 2,
        order_number: 'PAY-20260127-0002',
        token_amount: 10,
        bonus_tokens: 0,
        total_tokens: 10,
        price: 10000,
        payment_method: 'qris',
        status: 'pending',
        created_at: '2026-01-27T09:00:00Z',
        expires_at: '2026-01-28T09:00:00Z'
      }
    ];

    const filteredOrders = status 
      ? mockOrders.filter(o => o.status === status)
      : mockOrders;

    return res.status(200).json({
      success: true,
      data: filteredOrders
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
    // In production:
    // const orders = await PaymentOrder.findAll({ 
    //   where: { status: 'paid' },
    //   include: [{ model: User, attributes: ['email', 'full_name'] }]
    // });

    const mockPendingOrders = [
      {
        id: 3,
        order_number: 'PAY-20260127-0003',
        user: {
          email: 'student@university.ac.id',
          full_name: 'Ahmad Student'
        },
        token_amount: 50,
        price: 40000,
        payment_method: 'bank_transfer',
        payment_proof_url: '/uploads/payment-proofs/proof_123.jpg',
        transfer_amount: 40000,
        transfer_date: '2026-01-27T08:00:00Z',
        status: 'paid',
        created_at: '2026-01-27T07:00:00Z'
      }
    ];

    return res.status(200).json({
      success: true,
      data: mockPendingOrders
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

    // Get payment order
    // In production: const order = await PaymentOrder.findByPk(order_id);

    if (action === 'approve') {
      // Update order status
      const updateData = {
        status: 'completed',
        verified_by: staff_id,
        verified_at: new Date().toISOString(),
        verification_notes: notes
      };

      // Credit tokens to user
      const tokenAmount = 55; // order.total_tokens
      const userId = 1; // order.user_id

      // Create token transaction
      const transaction = {
        user_id: userId,
        amount: tokenAmount,
        balance_before: 10, // current balance
        balance_after: 10 + tokenAmount,
        transaction_type: 'purchase',
        description: `Token purchase approved - Order ${order_id}`,
        payment_order_id: order_id,
        created_at: new Date().toISOString()
      };

      // In production:
      // await PaymentOrder.update(updateData, { where: { id: order_id } });
      // await TokenTransaction.create(transaction);

      console.log('Payment approved:', updateData);
      console.log('Tokens credited:', transaction);

      return res.status(200).json({
        success: true,
        message: 'Payment approved and tokens credited',
        data: { tokens_credited: tokenAmount }
      });

    } else {
      // Reject payment
      const updateData = {
        status: 'rejected',
        verified_by: staff_id,
        verified_at: new Date().toISOString(),
        rejection_reason: notes
      };

      // In production:
      // await PaymentOrder.update(updateData, { where: { id: order_id } });

      console.log('Payment rejected:', updateData);

      return res.status(200).json({
        success: true,
        message: 'Payment rejected',
        data: updateData
      });
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
