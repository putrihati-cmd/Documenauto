-- =================================================================
-- SMARTCOPY FREEMIUM MODEL - DATABASE SCHEMA
-- =================================================================
-- Status: DRAFT / INACTIVE
-- Instructions: Run this script when ready to activate Freemium features.

-- 1. Create Users Table (Authentication & Token Balance)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone_number VARCHAR(20),
    token_balance INT DEFAULT 3, -- Initial free tokens
    subscription_tier VARCHAR(20) DEFAULT 'free', -- 'free', 'starter', 'pro', 'unlimited'
    subscription_expires_at TIMESTAMP NULL,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create Token Transactions Table (Auditing & History)
CREATE TABLE IF NOT EXISTS token_transactions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    amount INT NOT NULL, -- Positive for credit, Negative for debit
    transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'referral', 'spend', 'daily_bonus', 'refund'
    description TEXT,
    order_id INT NULL, -- Link to specific order if 'spend'
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Update Orders Table (Locking & Ownership)
-- Run these individually if table already exists
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS preview_limited_to_pages INT DEFAULT 10,
    ADD COLUMN IF NOT EXISTS total_pages_detected INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unlock_cost_tokens INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tokens_spent INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_downloadable BOOLEAN DEFAULT false;

-- 4. Create Referral Codes (Growth)
CREATE TABLE IF NOT EXISTS referral_codes (
    id SERIAL PRIMARY KEY,
    owner_user_id INT REFERENCES users(id),
    code VARCHAR(20) UNIQUE NOT NULL,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_transactions_user ON token_transactions(user_id);
