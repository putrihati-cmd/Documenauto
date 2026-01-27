/**
 * SMARTCOPY FREEMIUM LOGIC MODULE
 * Status: DRAFT / INACTIVE
 * 
 * Instructions: 
 * Integration this logic into your Node/Express controllers (e.g., order.controller.js)
 */

const { User, Order, TokenTransaction } = require('../models'); // Assumes Sequelize models exist

// --------------------------------------------------------------------------
// 1. UTILITY: Calculate Token Cost
// --------------------------------------------------------------------------
const calculateTokenCost = (totalPages) => {
  if (!totalPages) return 3; // Default fallback
  if (totalPages <= 20) return 3;
  if (totalPages <= 50) return 5;
  if (totalPages <= 100) return 8;
  return 10; // Cap at 10 tokens for very large docs
};

// --------------------------------------------------------------------------
// 2. CONTROLLER: Generate Preview (Public vs Locked)
// --------------------------------------------------------------------------
const generatePreview = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id; // Assumes Auth Middleware

    const order = await Order.findByPk(orderId);
    if (!order) throw new Error('Order not found');

    // Scenario A: Visitor / Free Tier (Locked)
    if (!order.is_unlocked) {
      return res.json({
        success: true,
        access_level: 'preview',
        preview_pages: 10,
        total_pages: order.total_pages_detected,
        locked_count: Math.max(0, order.total_pages_detected - 10),
        unlock_cost: calculateTokenCost(order.total_pages_detected),
        download_url: null, // No download allowed
        preview_images: [
          // Return only first 10 images
          `/storage/previews/${orderId}/page_1.jpg`,
          // ...
          `/storage/previews/${orderId}/page_10.jpg`
        ]
      });
    }

    // Scenario B: Paid / Unlocked (Full Access)
    return res.json({
      success: true,
      access_level: 'full',
      total_pages: order.total_pages_detected,
      download_url: `/api/orders/${orderId}/download`, // Valid download link
      preview_images: 'all' // Or array of all pages
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --------------------------------------------------------------------------
// 3. CONTROLLER: Unlock Document
// --------------------------------------------------------------------------
const unlockDocument = async (req, res) => {
  const transaction = await sequelize.transaction(); // Start DB Transaction
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const user = await User.findByPk(userId, { transaction });
    const order = await Order.findByPk(orderId, { transaction });

    if (order.is_unlocked) {
      return res.status(200).json({ message: 'Already unlocked' });
    }

    const cost = calculateTokenCost(order.total_pages_detected);

    // Check Balance
    if (user.token_balance < cost) {
      throw new Error(`Insufficient tokens. Cost: ${cost}, Balance: ${user.token_balance}`);
    }

    // Deduct Tokens
    await user.update({ 
      token_balance: user.token_balance - cost 
    }, { transaction });

    // Unlock Order
    await order.update({
      is_unlocked: true,
      user_id: userId, // Claim ownership if not already
      tokens_spent: cost,
      is_downloadable: true
    }, { transaction });

    // Log Transaction
    await TokenTransaction.create({
      user_id: userId,
      amount: -cost,
      transaction_type: 'spend',
      description: `Unlock Document #${orderId} (${order.total_pages_detected} pages)`,
      order_id: orderId
    }, { transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Document unlocked successfully!',
      remaining_balance: user.token_balance - cost,
      download_url: `/api/orders/${orderId}/download`
    });

  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  generatePreview,
  unlockDocument,
  calculateTokenCost
};
