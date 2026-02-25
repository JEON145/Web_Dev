import express from 'express';
import cors from 'cors';
import pool from './dbConfig.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import upload from './middleware/upload.js';
import path from 'path';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// --- JWT Middleware ---
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: "Access denied. No token provided." });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid or expired token." });
    req.user = decoded;
    next();
  });
};

// --- AUTH ROUTES ---

app.post('/api/register', async (req, res) => {
  const { username, password, email, role, shopName } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'admin' ? 'admin' : 'user';
    await pool.query(
      'INSERT INTO users (username, password, email, role, shop_name) VALUES ($1, $2, $3, $4, $5)', 
      [username, hashedPassword, email || null, userRole, shopName || username]
    );
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed. Username or email may already exist." });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: "User not found" });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, shopName: user.shop_name }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error during login" });
  }
});

// --- FORGOT PASSWORD ROUTES ---

// Store reset codes temporarily (in production, use Redis or database)
const resetCodes = new Map();

app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No account found with this email address." });
    }

    // Generate a 6-digit reset code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    
    // Store the code with expiry (15 minutes)
    resetCodes.set(email, {
      code: resetCode,
      expiry: Date.now() + 15 * 60 * 1000, // 15 minutes
      userId: result.rows[0].id
    });

    // In production, you would send this via email using nodemailer
    // For development, we'll log it and return a success message
    console.log(`🔐 Password reset code for ${email}: ${resetCode}`);
    
    res.json({ 
      message: "Reset code sent to your email! (Check server console for development)",
      // Remove this in production - only for testing
      devCode: process.env.NODE_ENV === 'development' ? resetCode : undefined
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to process password reset request." });
  }
});

app.post('/api/reset-password', async (req, res) => {
  const { email, resetCode, newPassword } = req.body;
  
  try {
    const storedData = resetCodes.get(email);
    
    if (!storedData) {
      return res.status(400).json({ error: "No reset code found. Please request a new one." });
    }

    if (Date.now() > storedData.expiry) {
      resetCodes.delete(email);
      return res.status(400).json({ error: "Reset code has expired. Please request a new one." });
    }

    if (storedData.code !== resetCode) {
      return res.status(400).json({ error: "Invalid reset code." });
    }

    // Hash the new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, storedData.userId]);
    
    // Clean up the used code
    resetCodes.delete(email);

    res.json({ message: "Password reset successfully! You can now login with your new password." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password." });
  }
});

// --- INVENTORY ROUTES ---

app.get('/api/items', verifyToken, async (req, res) => {
  const userId = req.user.id; 
  try {
    const result = await pool.query('SELECT * FROM items WHERE user_id = $1 ORDER BY id DESC', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch items" });
  }
});

// Add item with optional image upload
app.post('/api/items', verifyToken, upload.single('itemImage'), async (req, res) => {
  const { name, quantity } = req.body;
  const userId = req.user.id;
  
  // If a file was uploaded, save its path. If not, use null.
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      'INSERT INTO items (item_name, quantity, user_id, item_image) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, parseInt(quantity), userId, imageUrl]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/items/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const result = await pool.query('DELETE FROM items WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Unauthorized or not found" });
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- HELPING HAND / REQUEST ROUTES ---

// 1. Post a request for help
app.post('/api/requests', verifyToken, async (req, res) => {
  const { item_name, quantity } = req.body;
  const senderId = req.user.id;
  try {
    const result = await pool.query(
      'INSERT INTO requests (sender_id, item_name, quantity, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [senderId, item_name, parseInt(quantity), 'open']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to post request" });
  }
});

// 2. Get the Community Board (Requests from others)
app.get('/api/requests/community', verifyToken, async (req, res) => {
  const myId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT r.*, u.username as shop_name 
       FROM requests r 
       JOIN users u ON r.sender_id = u.id 
       WHERE r.status = 'open' AND r.sender_id != $1
       ORDER BY r.created_at DESC`,
      [myId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch community board" });
  }
});

// 3. Fulfill a request (The "I can help" logic)
// --- HELPING HAND / FULFILL ROUTE ---

app.put('/api/requests/:id/fulfill', verifyToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // This updates the status to 'fulfilled' so it disappears from the 'Open' board
    const result = await pool.query(
      "UPDATE requests SET status = 'fulfilled' WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json({ message: "Thank you for helping!" });
  } catch (err) {
    console.error("Fulfill Error:", err.message);
    res.status(500).json({ error: "Server error during fulfillment" });
  }
});

// Serve uploaded images
app.use('/uploads', express.static('uploads')); 

app.listen(5000, () => console.log('🚀 Server running on http://localhost:5000'));