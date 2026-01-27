-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_balance INT DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_tokens_earned INT DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_tokens_spent INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_email BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS institution VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Add constraints if they don't exist (this might fail if data prevents it, but for now we assume consistent data or empty)
-- We wrap in anonymous block to avoid errors if constraint exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_referral_code_key') THEN
        ALTER TABLE users ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);
    END IF;
END $$;

-- Insert sample users if not exist (checking by phone or username since email might be null for existing)
-- We skip this for now to avoid conflicts, assuming existing users are fine.
