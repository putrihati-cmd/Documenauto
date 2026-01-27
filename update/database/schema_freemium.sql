-- ============================================
-- FREEMIUM TOKEN SYSTEM - Database Schema
-- ============================================

-- Users table (extended)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    
    -- Token System
    token_balance INT DEFAULT 3, -- Start with 3 free tokens
    total_tokens_earned INT DEFAULT 3,
    total_tokens_spent INT DEFAULT 0,
    
    -- Subscription
    subscription_tier VARCHAR(20) DEFAULT 'free', -- free, premium, enterprise
    subscription_expires_at TIMESTAMP,
    
    -- Verification
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    student_email BOOLEAN DEFAULT false, -- .ac.id email
    
    -- Profile
    institution VARCHAR(100),
    student_id VARCHAR(50),
    
    -- Referral
    referral_code VARCHAR(20) UNIQUE,
    referred_by INT REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Token Packages
CREATE TABLE IF NOT EXISTS token_packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- "Starter Pack", "Student Pack", etc
    token_amount INT NOT NULL,
    bonus_tokens INT DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    valid_days INT, -- Token validity in days (NULL = unlimited)
    
    -- Discounts
    discount_percentage INT DEFAULT 0,
    original_price DECIMAL(10,2),
    
    -- Metadata
    description TEXT,
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default packages
INSERT INTO token_packages (name, token_amount, bonus_tokens, price, valid_days, discount_percentage, original_price, is_popular, display_order) VALUES
('Starter Pack', 10, 0, 10000, 90, 0, 10000, false, 1),
('Student Pack', 50, 5, 40000, 180, 20, 50000, true, 2),
('Pro Pack', 100, 15, 70000, 365, 30, 100000, false, 3),
('Mega Pack', 300, 50, 180000, NULL, 40, 300000, false, 4);

-- Payment Orders
CREATE TABLE IF NOT EXISTS payment_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(30) UNIQUE NOT NULL, -- PAY-20260127-0001
    user_id INT REFERENCES users(id),
    package_id INT REFERENCES token_packages(id),
    
    -- Order details
    token_amount INT NOT NULL,
    bonus_tokens INT DEFAULT 0,
    total_tokens INT NOT NULL, -- token_amount + bonus_tokens
    price DECIMAL(10,2) NOT NULL,
    
    -- Payment info
    payment_method VARCHAR(20), -- 'bank_transfer', 'qris', 'cash'
    bank_name VARCHAR(50), -- BCA, Mandiri, BRI, etc
    account_number VARCHAR(50),
    account_name VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, verified, completed, rejected, expired
    
    -- Proof of payment
    payment_proof_path VARCHAR(500),
    payment_proof_url VARCHAR(500),
    transfer_amount DECIMAL(10,2),
    transfer_date TIMESTAMP,
    transfer_notes TEXT,
    
    -- Verification
    verified_by INT REFERENCES users(id), -- Staff who verified
    verified_at TIMESTAMP,
    verification_notes TEXT,
    rejection_reason TEXT,
    
    -- Auto-expire
    expires_at TIMESTAMP, -- Order expires in 24 hours if not paid
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Token Transactions (Complete History)
CREATE TABLE IF NOT EXISTS token_transactions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    
    -- Transaction details
    amount INT NOT NULL, -- positive = earn, negative = spend
    balance_before INT NOT NULL,
    balance_after INT NOT NULL,
    
    -- Type & source
    transaction_type VARCHAR(50) NOT NULL,
    -- Types: 'purchase', 'bonus', 'referral', 'daily_login', 'social_share',
    --        'spend_format', 'spend_unlock', 'refund', 'admin_adjust'
    
    description TEXT,
    
    -- Related entities
    payment_order_id INT REFERENCES payment_orders(id),
    order_id INT REFERENCES orders(id), -- Document order
    referral_user_id INT REFERENCES users(id),
    
    -- Metadata
    metadata JSONB, -- Additional data: {"social_platform": "instagram", "post_url": "..."}
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payment Methods (Store's payment info)
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    method_type VARCHAR(20) NOT NULL, -- 'bank_transfer', 'qris'
    
    -- Bank transfer
    bank_name VARCHAR(50),
    account_number VARCHAR(50),
    account_name VARCHAR(100),
    
    -- QRIS
    qris_image_path VARCHAR(500),
    qris_merchant_name VARCHAR(100),
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    instructions TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default payment methods
INSERT INTO payment_methods (method_type, bank_name, account_number, account_name, is_active, display_order, instructions) VALUES
('bank_transfer', 'BCA', '1234567890', 'SmartCopy Print', true, 1, 'Transfer ke rekening BCA, upload bukti transfer'),
('bank_transfer', 'Mandiri', '0987654321', 'SmartCopy Print', true, 2, 'Transfer ke rekening Mandiri, upload bukti transfer'),
('qris', NULL, NULL, 'SmartCopy Toko', true, 3, 'Scan QRIS di toko atau via gambar, upload bukti pembayaran');

-- Update orders table (add token & unlock info)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preview_pages INT DEFAULT 10;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_pages INT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tokens_required INT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tokens_spent INT DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMP;

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_status ON payment_orders(status);
CREATE INDEX idx_token_transactions_user ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_type ON token_transactions(transaction_type);

-- Function to update user token balance
CREATE OR REPLACE FUNCTION update_user_token_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET 
        token_balance = NEW.balance_after,
        total_tokens_earned = total_tokens_earned + GREATEST(NEW.amount, 0),
        total_tokens_spent = total_tokens_spent + GREATEST(-NEW.amount, 0),
        updated_at = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_token_balance
AFTER INSERT ON token_transactions
FOR EACH ROW
EXECUTE FUNCTION update_user_token_balance();

-- Function to auto-expire payment orders
CREATE OR REPLACE FUNCTION check_payment_order_expiry()
RETURNS void AS $$
BEGIN
    UPDATE payment_orders 
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Generate unique order number
CREATE OR REPLACE FUNCTION generate_payment_order_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    date_part VARCHAR;
    sequence_part VARCHAR;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    sequence_part := LPAD((SELECT COUNT(*) + 1 FROM payment_orders WHERE order_number LIKE 'PAY-' || date_part || '%')::TEXT, 4, '0');
    new_number := 'PAY-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing
INSERT INTO users (email, password_hash, full_name, phone, token_balance, email_verified, referral_code) VALUES
('test@student.ac.id', '$2a$10$...hashed...', 'Test Student', '081234567890', 13, true, 'TEST001'),
('admin@smartcopy.id', '$2a$10$...hashed...', 'Admin SmartCopy', '081987654321', 1000, true, 'ADMIN01');
