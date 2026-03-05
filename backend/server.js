import express from 'express';
import cors from 'cors';
import pool from './dbConfig.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import upload from './middleware/upload.js';
import path from 'path';
import crypto from 'crypto';
import { z } from 'zod';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());


// --- Zod Schemas ---
const registerSchema = z.object({
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user'),
  shopName: z.string().min(2),
  securityQuestion: z.string().min(5),
  securityAnswer: z.string().min(2),
});

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
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);
    const { username, password, email, role, shopName, securityQuestion, securityAnswer } = validatedData;

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'admin' ? 'admin' : 'user';
    // Hash security answer if provided
    const hashedAnswer = securityAnswer ? await bcrypt.hash(securityAnswer, 10) : null;
    
    // Regular users are auto-approved. Admin accounts require approval via pgAdmin.
    const isApproved = userRole === 'user';

    await pool.query(
      'INSERT INTO users (username, password, email, role, shop_name, security_question, security_answer, is_approved) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [username, hashedPassword, email || null, userRole, shopName || username, securityQuestion || null, hashedAnswer, isApproved]
    );
    
    if (userRole === 'admin') {
      res.status(201).json({ message: "Admin account created. Please wait for approval before logging in." });
    } else {
      res.status(201).json({ message: "User created successfully" });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
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

    if (user.is_banned) {
      return res.status(403).json({ error: "Your account has been banned. Please contact support." });
    }

    // Admin accounts require approval via pgAdmin before they can log in
    if (user.role === 'admin' && !user.is_approved) {
      return res.status(403).json({ error: "Your admin account is pending approval. Please contact the system administrator." });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
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
  // Deprecated in favor of security-question flow. Keep endpoint for compatibility.
  res.status(400).json({ error: 'Password reset via email code is disabled. Use security question flow.' });
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

// New endpoint: return security question for an email (if exists)
app.get('/api/security-question', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const result = await pool.query('SELECT security_question FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No account found with this email' });

    const { security_question } = result.rows[0];
    if (!security_question) return res.status(404).json({ error: 'No security question set for this account' });

    res.json({ securityQuestion: security_question });
  } catch (err) {
    console.error('Security question lookup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Middleware to verify Admin role
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admin privileges required." });
  }
};

// New endpoint: reset password by verifying security answer
app.post('/api/reset-password-security', async (req, res) => {
  const { email, securityAnswer, newPassword } = req.body;
  if (!email || !securityAnswer || !newPassword) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const result = await pool.query('SELECT id, security_answer FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No account found with this email' });

    const user = result.rows[0];
    if (!user.security_answer) return res.status(400).json({ error: 'Security answer not set for this account' });

    const match = await bcrypt.compare(securityAnswer, user.security_answer);
    if (!match) return res.status(401).json({ error: 'Incorrect security answer' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);

    res.json({ message: 'Password reset successfully via security question.' });
  } catch (err) {
    console.error('Reset via security error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- INVENTORY ROUTES ---

app.get('/api/items', verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT i.*, u.shop_name, u.is_verified, 
             (SELECT COUNT(*) FROM requests r WHERE r.receiver_id = u.id AND r.status = 'received') as trade_count,
             c.name as category_name, c.unit 
      FROM items i 
      JOIN users u ON i.user_id = u.id
      LEFT JOIN categories c ON i.category_id = c.id 
      WHERE i.user_id = $1 
      ORDER BY i.id DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch items" });
  }
});

// Add item with strict gallery selection (no file upload)
app.post('/api/items', verifyToken, async (req, res) => {
  const { name, quantity, isPublic, category_id, existingImagePath } = req.body;
  const userId = req.user.id;

  if (!existingImagePath) {
    return res.status(400).json({ error: "Image must be selected from the gallery." });
  }

  try {
    const result = await pool.query(
      'INSERT INTO items (item_name, quantity, user_id, item_image, is_public, category_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, parseInt(quantity), userId, existingImagePath, isPublic === 'true' || isPublic === true, category_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle item marketplace visibility
app.patch('/api/items/:id/toggle-public', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { isPublic } = req.body;
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'UPDATE items SET is_public = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [isPublic, id, userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Item not found or unauthorized" });
    res.json(result.rows[0]);
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

// --- MARKETPLACE ROUTES ---

app.get('/api/marketplace', verifyToken, async (req, res) => {
  const myId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT i.*, u.username as owner_name, u.shop_name, u.is_verified,
             (SELECT COUNT(*) FROM requests r WHERE r.receiver_id = u.id AND r.status = 'received') as trade_count,
             c.name as category_name, c.unit 
       FROM items i 
       JOIN users u ON i.user_id = u.id 
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.is_public = true AND i.user_id != $1
       ORDER BY i.id DESC`,
      [myId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch marketplace" });
  }
});

// --- HELPING HAND / REQUEST ROUTES ---

// 1. Post a request (General broadcast or Targeted)
app.post('/api/requests', verifyToken, async (req, res) => {
  const { item_name, quantity, receiver_id } = req.body;
  const senderId = req.user.id;
  try {
    const result = await pool.query(
      'INSERT INTO requests (sender_id, receiver_id, item_name, quantity, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [senderId, receiver_id || null, item_name, parseInt(quantity), 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Post Request Error:", err);
    res.status(500).json({ error: "Failed to post request" });
  }
});

// 2. Get Outgoing Requests (Requests I sent)
app.get('/api/requests/outgoing', verifyToken, async (req, res) => {
  const myId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT r.*, u.username as receiver_name, u.shop_name as receiver_shop 
       FROM requests r 
       LEFT JOIN users u ON r.receiver_id = u.id 
       WHERE r.sender_id = $1
       ORDER BY r.created_at DESC`,
      [myId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch outgoing requests" });
  }
});

// 3. Get Incoming Requests (Requests sent to me or broadcasted)
app.get('/api/requests/incoming', verifyToken, async (req, res) => {
  const myId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT r.*, u.username as sender_name, u.shop_name as sender_shop 
       FROM requests r 
       JOIN users u ON r.sender_id = u.id 
       WHERE (r.receiver_id = $1 OR (r.receiver_id IS NULL AND r.sender_id != $1))
       AND r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [myId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch incoming requests" });
  }
});

// 4. Update Request Status (Accept, Decline, Ship, Receive)
app.patch('/api/requests/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // e.g., 'accepted', 'declined', 'shipped', 'received'
  const userId = req.user.id;

  try {
    // Basic validation: must be either sender or receiver to update status
    const reqInfo = await pool.query('SELECT * FROM requests WHERE id = $1', [id]);
    if (reqInfo.rowCount === 0) return res.status(404).json({ error: "Request not found" });

    const request = reqInfo.rows[0];
    const isSender = request.sender_id === userId;
    const isReceiver = request.receiver_id === userId || (request.receiver_id === null && status === 'accepted');

    if (!isSender && !isReceiver) {
      return res.status(403).json({ error: "Unauthorized to update this request" });
    }

    // If it was a broadcast request and someone accepted it, assign them as receiver (helper/giver)
    let query = "UPDATE requests SET status = $1 WHERE id = $2 RETURNING *";
    let params = [status, id];

    // The person accepting becomes the receiver (they are the helper/giver)
    let giverId = request.receiver_id || userId; // The helper who will give the item

    if (request.receiver_id === null && status === 'accepted') {
      query = "UPDATE requests SET status = $1, receiver_id = $3 WHERE id = $2 RETURNING *";
      params = [status, id, userId];
      giverId = userId; // The current user is accepting, so they become the giver
    }

    const result = await pool.query(query, params);
    const updatedRequest = result.rows[0];

    // Handle inventory transfer when request is ACCEPTED
    // Giver (receiver_id) gives items to Requester (sender_id)
    if (status === 'accepted') {
      const { item_name, quantity, sender_id } = updatedRequest;
      const actualGiverId = updatedRequest.receiver_id;

      console.log(`Processing transfer: ${quantity} x "${item_name}" from giver ${actualGiverId} to requester ${sender_id}`);

      // 1. Deduct from the giver's inventory
      const giverItem = await pool.query(
        'SELECT * FROM items WHERE user_id = $1 AND item_name ILIKE $2',
        [actualGiverId, item_name]
      );
      
      let itemInfo = {};
      if (giverItem.rows.length > 0) {
        itemInfo = giverItem.rows[0];
        const currentQty = giverItem.rows[0].quantity;
        const newQty = currentQty - quantity;
        
        console.log(`Giver has ${currentQty} units, deducting ${quantity}, new qty: ${newQty}`);
        
        if (newQty <= 0) {
          // Remove item if quantity becomes 0 or less
          await pool.query('DELETE FROM items WHERE id = $1', [giverItem.rows[0].id]);
          console.log('Item removed from giver (qty reached 0)');
        } else {
          // Update the quantity
          await pool.query('UPDATE items SET quantity = $1 WHERE id = $2', [newQty, giverItem.rows[0].id]);
          console.log('Giver inventory updated');
        }
      } else {
        console.log(`Warning: Giver does not have item "${item_name}" in inventory`);
      }

      // 2. Add to the requester's inventory
      const requesterItem = await pool.query(
        'SELECT * FROM items WHERE user_id = $1 AND item_name ILIKE $2',
        [sender_id, item_name]
      );

      if (requesterItem.rows.length > 0) {
        // Item exists, update quantity
        const newQty = requesterItem.rows[0].quantity + quantity;
        await pool.query('UPDATE items SET quantity = $1 WHERE id = $2', [newQty, requesterItem.rows[0].id]);
        console.log(`Requester inventory updated: new qty ${newQty}`);
      } else {
        // Item doesn't exist, create new item for requester
        await pool.query(
          'INSERT INTO items (item_name, quantity, user_id, item_image, is_public, category_id) VALUES ($1, $2, $3, $4, $5, $6)',
          [item_name, quantity, sender_id, itemInfo.item_image || null, false, itemInfo.category_id || null]
        );
        console.log(`New item created for requester`);
      }

      console.log(`✅ Inventory transferred: ${quantity} x ${item_name} from user ${actualGiverId} to user ${sender_id}`);
    }

    res.json(updatedRequest);
  } catch (err) {
    console.error("Status Update Error:", err);
    res.status(500).json({ error: "Failed to update request status" });
  }
});

// Deprecated fulfill route
app.put('/api/requests/:id/fulfill', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE requests SET status = 'accepted', receiver_id = $1 WHERE id = $2 RETURNING *",
      [req.user.id, id]
    );
    res.json({ message: "Updated to accepted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- ADMIN ROUTES ---

// 1. Get All Users (with Verification and Trade Stats)
app.get('/api/admin/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.email, u.role, u.shop_name, u.is_approved, u.is_banned, u.is_verified,
             (SELECT COUNT(*) FROM requests r WHERE r.receiver_id = u.id AND r.status = 'received') as trade_count
      FROM users u
      ORDER BY u.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// 2. Update User Status (Approve, Ban, Verify, Change Role)
app.patch('/api/admin/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_approved, is_banned, is_verified, role } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET is_approved = COALESCE($1, is_approved), is_banned = COALESCE($2, is_banned), is_verified = COALESCE($3, is_verified), role = COALESCE($4, role) WHERE id = $5 RETURNING id, username, is_approved, is_banned, is_verified, role',
      [is_approved, is_banned, is_verified, role, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// 3. Global Inventory Summary (with Verification info)
app.get('/api/admin/inventory/summary', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, u.shop_name, u.username as owner_name, u.is_verified,
             COALESCE(c.name, 'Uncategorized') as category_name, c.unit
      FROM items i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN categories c ON i.category_id = c.id
      ORDER BY c.name, i.item_name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch global inventory" });
  }
});

// 4. Master Audit Logs (All Requests)
app.get('/api/admin/logs/requests', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, s.username as sender_name, s.shop_name as sender_shop, 
             v.username as receiver_name, v.shop_name as receiver_shop
      FROM requests r
      JOIN users s ON r.sender_id = s.id
      LEFT JOIN users v ON r.receiver_id = v.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// --- CATEGORY & UNIT MANAGEMENT ---

app.get('/api/categories', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.post('/api/categories', verifyToken, verifyAdmin, async (req, res) => {
  const { name, unit } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categories (name, unit) VALUES ($1, $2) RETURNING *',
      [name, unit]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create category" });
  }
});

// --- GALLERY ROUTES ---

// List all uploaded images
app.get('/api/uploads', verifyToken, async (req, res) => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const fs = await import('fs/promises');
  try {
    const files = await fs.readdir(uploadsDir);
    // Filter for images only
    const images = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
    res.json(images.map(filename => `/uploads/${filename}`));
  } catch (err) {
    console.error("Gallery Fetch Error:", err);
    res.status(500).json({ error: "Could not fetch gallery images" });
  }
});

// Update item to include category_id
app.patch('/api/items/:id/category', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { category_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE items SET category_id = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [category_id, id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update item category" });
  }
});

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

app.listen(5000, () => console.log('🚀 Server running on http://localhost:5000'));