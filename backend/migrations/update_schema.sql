-- Database Migration Script for Shopkeeper Inventory App
-- Run this script to add the new columns to your existing tables

-- Add email and shop_name columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shop_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer VARCHAR(500);

-- Add item_image column to items table (if not exists)
ALTER TABLE items ADD COLUMN IF NOT EXISTS item_image VARCHAR(500);

-- Optional: Update existing users to have shop_name based on username
UPDATE users SET shop_name = username WHERE shop_name IS NULL;

-- Create index for faster email lookups (for forgot password feature)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
